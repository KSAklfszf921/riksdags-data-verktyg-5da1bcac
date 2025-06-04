import { supabase } from '../integrations/supabase/client';
import { enhancedDatabaseManager } from './enhancedDatabaseManager';

interface SyncResult {
  success: boolean;
  processed: number;
  duplicatesFiltered: number;
  errors: string[];
  processingTime: number;
  retryCount: number;
}

interface SyncOptions {
  batchSize?: number;
  maxRetries?: number;
  enableDuplicateFiltering?: boolean;
  onProgress?: (progress: { processed: number; total: number; duplicates: number }) => void;
}

class EnhancedDataSyncManager {
  private static instance: EnhancedDataSyncManager;
  private duplicateCache = new Map<string, Set<string>>();
  private processingStats = {
    totalProcessed: 0,
    totalDuplicates: 0,
    totalErrors: 0,
    avgProcessingTime: 0
  };

  static getInstance(): EnhancedDataSyncManager {
    if (!EnhancedDataSyncManager.instance) {
      EnhancedDataSyncManager.instance = new EnhancedDataSyncManager();
    }
    return EnhancedDataSyncManager.instance;
  }

  async syncEndpointData(
    endpoint: string,
    data: any[],
    options: SyncOptions = {}
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const {
      batchSize = 25,
      maxRetries = 3,
      enableDuplicateFiltering = true,
      onProgress
    } = options;

    console.log(`🚀 Starting enhanced sync for ${endpoint}: ${data.length} records`);

    const result: SyncResult = {
      success: false,
      processed: 0,
      duplicatesFiltered: 0,
      errors: [],
      processingTime: 0,
      retryCount: 0
    };

    try {
      // Step 1: Duplicate filtering
      let filteredData = data;
      if (enableDuplicateFiltering) {
        filteredData = await this.filterDuplicates(endpoint, data);
        result.duplicatesFiltered = data.length - filteredData.length;
        
        console.log(`🔍 Filtered ${result.duplicatesFiltered} duplicates for ${endpoint}`);
      }

      if (filteredData.length === 0) {
        console.log(`ℹ️ No new data to sync for ${endpoint}`);
        result.success = true;
        result.processingTime = Date.now() - startTime;
        return result;
      }

      // Step 2: Enhanced database insertion with conflict resolution
      const dbResult = await enhancedDatabaseManager.safeBatchInsert(
        this.getTableName(endpoint),
        filteredData,
        {
          conflictColumns: this.getConflictColumns(endpoint),
          updateOnConflict: false, // Use ON CONFLICT DO NOTHING strategy
          onProgress: (progress) => {
            onProgress?.({
              processed: progress.processed,
              total: filteredData.length,
              duplicates: result.duplicatesFiltered + progress.conflicts
            });
          }
        }
      );

      result.processed = dbResult.successful;
      result.duplicatesFiltered += dbResult.conflictsResolved;
      result.errors = dbResult.errors;
      result.success = dbResult.failed === 0;

      // Step 3: Update processing statistics
      this.updateProcessingStats(result);

      console.log(`✅ Enhanced sync completed for ${endpoint}: ${result.processed} processed, ${result.duplicatesFiltered} duplicates`);

    } catch (error) {
      console.error(`❌ Enhanced sync failed for ${endpoint}:`, error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      result.success = false;
    } finally {
      result.processingTime = Date.now() - startTime;
    }

    return result;
  }

  private async filterDuplicates(endpoint: string, data: any[]): Promise<any[]> {
    const tableName = this.getTableName(endpoint);
    const uniqueField = this.getUniqueField(endpoint);
    
    if (!uniqueField) {
      console.warn(`No unique field defined for ${endpoint}, skipping duplicate filtering`);
      return data;
    }

    try {
      // Get existing records from database
      const existingIds = await this.getExistingIds(tableName, uniqueField);
      
      // Filter out duplicates using Map for O(1) lookup
      const filteredData = data.filter(item => {
        const id = item[uniqueField];
        return id && !existingIds.has(id);
      });

      // Update local cache
      if (!this.duplicateCache.has(endpoint)) {
        this.duplicateCache.set(endpoint, new Set());
      }
      
      const cache = this.duplicateCache.get(endpoint)!;
      filteredData.forEach(item => {
        const id = item[uniqueField];
        if (id) cache.add(id);
      });

      return filteredData;

    } catch (error) {
      console.error(`Error filtering duplicates for ${endpoint}:`, error);
      return data; // Return original data if filtering fails
    }
  }

  private async getExistingIds(tableName: string, uniqueField: string): Promise<Set<string>> {
    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .select(uniqueField);

      if (error) {
        console.error(`Error fetching existing IDs from ${tableName}:`, error);
        return new Set();
      }

      return new Set(data?.map(item => item[uniqueField]).filter(Boolean) || []);
    } catch (error) {
      console.error(`Exception fetching existing IDs from ${tableName}:`, error);
      return new Set();
    }
  }

  private getTableName(endpoint: string): string {
    const mapping: { [key: string]: string } = {
      'member_data': 'member_data',
      'calendar_data': 'calendar_data',
      'document_data': 'document_data',
      'speech_data': 'speech_data',
      'vote_data': 'vote_data',
      'party_data': 'party_data'
    };
    
    return mapping[endpoint] || endpoint;
  }

  private getUniqueField(endpoint: string): string | null {
    const mapping: { [key: string]: string } = {
      'member_data': 'member_id',
      'calendar_data': 'event_id',
      'document_data': 'document_id',
      'speech_data': 'speech_id',
      'vote_data': 'vote_id',
      'party_data': 'party_code'
    };
    
    return mapping[endpoint] || null;
  }

  private getConflictColumns(endpoint: string): string[] {
    const mapping: { [key: string]: string[] } = {
      'member_data': ['member_id'],
      'calendar_data': ['event_id'],
      'document_data': ['document_id'],
      'speech_data': ['speech_id'],
      'vote_data': ['vote_id'],
      'party_data': ['party_code']
    };
    
    return mapping[endpoint] || [];
  }

  private updateProcessingStats(result: SyncResult) {
    this.processingStats.totalProcessed += result.processed;
    this.processingStats.totalDuplicates += result.duplicatesFiltered;
    this.processingStats.totalErrors += result.errors.length;
    
    // Update average processing time
    const totalOperations = this.processingStats.totalProcessed + this.processingStats.totalErrors;
    if (totalOperations > 0) {
      this.processingStats.avgProcessingTime = 
        ((this.processingStats.avgProcessingTime * (totalOperations - 1)) + result.processingTime) / totalOperations;
    }
  }

  getProcessingStats() {
    return { ...this.processingStats };
  }

  clearCache(endpoint?: string) {
    if (endpoint) {
      this.duplicateCache.delete(endpoint);
    } else {
      this.duplicateCache.clear();
    }
    console.log(`🗑️ Cleared duplicate cache${endpoint ? ` for ${endpoint}` : ''}`);
  }

  resetStats() {
    this.processingStats = {
      totalProcessed: 0,
      totalDuplicates: 0,
      totalErrors: 0,
      avgProcessingTime: 0
    };
    console.log('📊 Reset processing statistics');
  }

  async performHealthCheck(): Promise<{
    cacheStatus: string;
    dbConnection: boolean;
    avgResponseTime: number;
    errorRate: number;
  }> {
    try {
      const startTime = Date.now();
      
      // Test database connection
      const { error } = await supabase.from('member_data' as any).select('id').limit(1);
      const dbConnection = !error;
      const responseTime = Date.now() - startTime;
      
      // Calculate error rate
      const totalOps = this.processingStats.totalProcessed + this.processingStats.totalErrors;
      const errorRate = totalOps > 0 ? (this.processingStats.totalErrors / totalOps) * 100 : 0;
      
      return {
        cacheStatus: `${this.duplicateCache.size} endpoints cached`,
        dbConnection,
        avgResponseTime: responseTime,
        errorRate: Math.round(errorRate * 100) / 100
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        cacheStatus: 'Error',
        dbConnection: false,
        avgResponseTime: -1,
        errorRate: 100
      };
    }
  }
}

export const enhancedDataSyncManager = EnhancedDataSyncManager.getInstance();
export type { SyncResult, SyncOptions };
