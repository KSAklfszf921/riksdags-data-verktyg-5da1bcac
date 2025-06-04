
import { supabase } from '@/integrations/supabase/client';

type ValidTableName = 
  | 'enhanced_member_profiles'
  | 'calendar_data'
  | 'document_data'
  | 'language_analysis'
  | 'member_news'
  | 'party_data'
  | 'vote_data';

interface RefreshOptions {
  maxAge?: number; // in hours
  forceRefresh?: boolean;
  batchSize?: number;
}

interface TableStats {
  tableName: string;
  recordCount: number;
  lastUpdated: string | null;
  isStale: boolean;
  avgResponseTime?: number;
}

interface RefreshResult {
  success: boolean;
  message: string;
  duration?: number;
  recordsProcessed?: number;
  errors?: string[];
}

class OptimizedDataRefreshService {
  private readonly validTables: ValidTableName[] = [
    'enhanced_member_profiles',
    'calendar_data',
    'document_data',
    'language_analysis',
    'member_news',
    'party_data',
    'vote_data'
  ];

  private readonly functionMapping: Record<ValidTableName, { function: string; payload?: any }> = {
    enhanced_member_profiles: { function: 'fetch-comprehensive-data', payload: { dataType: 'members' } },
    party_data: { function: 'fetch-party-data' },
    calendar_data: { function: 'fetch-comprehensive-data', payload: { dataType: 'calendar' } },
    document_data: { function: 'fetch-comprehensive-data', payload: { dataType: 'documents' } },
    vote_data: { function: 'fetch-comprehensive-data', payload: { dataType: 'votes' } },
    language_analysis: { function: 'fetch-comprehensive-data', payload: { dataType: 'language' } },
    member_news: { function: 'fetch-member-news' }
  };

  async getTableStats(tableName: ValidTableName): Promise<TableStats> {
    const startTime = Date.now();
    
    try {
      // Get record count efficiently
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error(`Error counting records for ${tableName}:`, countError);
        return this.createEmptyStats(tableName);
      }

      // Get last updated timestamp
      const { data: lastRecord, error: lastError } = await supabase
        .from(tableName)
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      const lastUpdated = lastRecord?.updated_at || null;
      const isStale = this.isDataStale(lastUpdated, 24);
      const avgResponseTime = Date.now() - startTime;

      return {
        tableName,
        recordCount: count || 0,
        lastUpdated,
        isStale,
        avgResponseTime
      };
    } catch (error) {
      console.error(`Error getting stats for ${tableName}:`, error);
      return this.createEmptyStats(tableName);
    }
  }

  async getAllTableStats(): Promise<TableStats[]> {
    const startTime = Date.now();
    console.log('Fetching stats for all tables...');
    
    const statsPromises = this.validTables.map(async (table) => {
      try {
        return await this.getTableStats(table);
      } catch (error) {
        console.error(`Failed to get stats for ${table}:`, error);
        return this.createEmptyStats(table);
      }
    });

    const results = await Promise.all(statsPromises);
    console.log(`Stats collection completed in ${Date.now() - startTime}ms`);
    
    return results;
  }

  async refreshTable(tableName: ValidTableName, options: RefreshOptions = {}): Promise<RefreshResult> {
    const { maxAge = 24, forceRefresh = false, batchSize = 100 } = options;
    const startTime = Date.now();

    try {
      // Check if refresh is needed
      if (!forceRefresh) {
        const stats = await this.getTableStats(tableName);
        if (!stats.isStale) {
          return {
            success: true,
            message: `Table ${tableName} is up to date, skipping refresh`,
            duration: Date.now() - startTime
          };
        }
      }

      console.log(`Starting refresh for table: ${tableName}`);

      const mapping = this.functionMapping[tableName];
      if (!mapping) {
        return {
          success: false,
          message: `No refresh function available for table: ${tableName}`,
          duration: Date.now() - startTime
        };
      }

      // Call the appropriate edge function
      const { data, error } = await supabase.functions.invoke(mapping.function, {
        body: mapping.payload || {}
      });

      if (error) {
        console.error(`Error refreshing ${tableName}:`, error);
        return {
          success: false,
          message: `Failed to refresh ${tableName}: ${error.message}`,
          duration: Date.now() - startTime,
          errors: [error.message]
        };
      }

      console.log(`Successfully refreshed ${tableName}`);
      return {
        success: true,
        message: `Successfully refreshed ${tableName}`,
        duration: Date.now() - startTime,
        recordsProcessed: data?.recordsProcessed || 0
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to refresh ${tableName}:`, error);
      
      return {
        success: false,
        message: `Refresh failed for ${tableName}: ${errorMessage}`,
        duration: Date.now() - startTime,
        errors: [errorMessage]
      };
    }
  }

  async refreshMultipleTables(
    tableNames: ValidTableName[], 
    options: RefreshOptions = {}
  ): Promise<{ results: RefreshResult[]; summary: { successful: number; failed: number } }> {
    const results: RefreshResult[] = [];
    let successful = 0;
    let failed = 0;

    console.log(`Starting batch refresh for ${tableNames.length} tables...`);

    for (const tableName of tableNames) {
      try {
        const result = await this.refreshTable(tableName, options);
        results.push(result);
        
        if (result.success) {
          successful++;
        } else {
          failed++;
        }

        // Add delay between table refreshes to avoid overwhelming the system
        if (tableNames.length > 1) {
          await this.delay(1000);
        }
      } catch (error) {
        const errorResult: RefreshResult = {
          success: false,
          message: `Failed to refresh ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        };
        results.push(errorResult);
        failed++;
      }
    }

    console.log(`Batch refresh completed. Successful: ${successful}, Failed: ${failed}`);

    return {
      results,
      summary: { successful, failed }
    };
  }

  async getSystemHealth(): Promise<{
    overallHealth: 'good' | 'warning' | 'critical';
    staleTables: number;
    emptyTables: number;
    avgResponseTime: number;
    recommendations: string[];
  }> {
    const stats = await this.getAllTableStats();
    
    const staleTables = stats.filter(s => s.isStale).length;
    const emptyTables = stats.filter(s => s.recordCount === 0).length;
    const avgResponseTime = stats.reduce((sum, s) => sum + (s.avgResponseTime || 0), 0) / stats.length;

    let overallHealth: 'good' | 'warning' | 'critical';
    const recommendations: string[] = [];

    if (staleTables === 0 && emptyTables === 0) {
      overallHealth = 'good';
    } else if (staleTables <= 2 || emptyTables <= 1) {
      overallHealth = 'warning';
      recommendations.push(`${staleTables} tables need refresh`);
      if (emptyTables > 0) {
        recommendations.push(`${emptyTables} tables are empty`);
      }
    } else {
      overallHealth = 'critical';
      recommendations.push(`${staleTables} tables are stale - immediate refresh needed`);
      recommendations.push(`${emptyTables} tables are empty - check data sources`);
    }

    if (avgResponseTime > 1000) {
      recommendations.push('Database response time is slow - consider optimization');
    }

    return {
      overallHealth,
      staleTables,
      emptyTables,
      avgResponseTime,
      recommendations
    };
  }

  private isDataStale(lastUpdated: string | null, maxAgeHours: number): boolean {
    if (!lastUpdated) return true;
    
    const lastUpdateTime = new Date(lastUpdated);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceUpdate > maxAgeHours;
  }

  private createEmptyStats(tableName: string): TableStats {
    return {
      tableName,
      recordCount: 0,
      lastUpdated: null,
      isStale: true,
      avgResponseTime: 0
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const optimizedDataRefreshService = new OptimizedDataRefreshService();

// Legacy compatibility functions
export async function refreshAllData(): Promise<RefreshResult> {
  try {
    const tableNames: ValidTableName[] = [
      'enhanced_member_profiles',
      'party_data',
      'calendar_data',
      'document_data',
      'vote_data'
    ];
    
    const { results, summary } = await optimizedDataRefreshService.refreshMultipleTables(tableNames);
    
    return {
      success: summary.failed === 0,
      message: `Refresh complete. Successful: ${summary.successful}, Failed: ${summary.failed}`,
      recordsProcessed: results.reduce((sum, r) => sum + (r.recordsProcessed || 0), 0)
    };
  } catch (error) {
    return {
      success: false,
      message: `Refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

export async function refreshSpecificDataType(dataType: string): Promise<RefreshResult> {
  const tableMapping: Record<string, ValidTableName> = {
    'Party': 'party_data',
    'Member': 'enhanced_member_profiles',
    'Vote': 'vote_data',
    'Document': 'document_data',
    'Calendar': 'calendar_data'
  };
  
  const tableName = tableMapping[dataType];
  if (!tableName) {
    return {
      success: false,
      message: `Unknown data type: ${dataType}`
    };
  }
  
  return optimizedDataRefreshService.refreshTable(tableName, { forceRefresh: true });
}

export type { ValidTableName, RefreshOptions, TableStats, RefreshResult };
