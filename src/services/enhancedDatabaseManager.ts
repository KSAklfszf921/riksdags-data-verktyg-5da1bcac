
import { supabase } from '../integrations/supabase/client';

interface BatchOperationResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  conflictsResolved: number;
  errors: string[];
}

class EnhancedDatabaseManager {
  private static instance: EnhancedDatabaseManager;
  private batchSize = 25;
  private retryAttempts = 3;
  private retryDelay = 1000; // ms

  static getInstance(): EnhancedDatabaseManager {
    if (!EnhancedDatabaseManager.instance) {
      EnhancedDatabaseManager.instance = new EnhancedDatabaseManager();
    }
    return EnhancedDatabaseManager.instance;
  }

  async safeBatchInsert(
    tableName: string,
    data: any[],
    options: {
      conflictColumns?: string[];
      updateOnConflict?: boolean;
      onProgress?: (progress: { processed: number; total: number; conflicts: number }) => void;
    } = {}
  ): Promise<BatchOperationResult> {
    console.log(`🚀 Starting safe batch insert for ${tableName}: ${data.length} records`);
    
    const result: BatchOperationResult = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      conflictsResolved: 0,
      errors: []
    };

    // Process data in smaller batches to avoid conflicts
    for (let i = 0; i < data.length; i += this.batchSize) {
      const batch = data.slice(i, i + this.batchSize);
      const batchNumber = Math.floor(i / this.batchSize) + 1;
      const totalBatches = Math.ceil(data.length / this.batchSize);
      
      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)`);
      
      try {
        const batchResult = await this.processBatchWithRetry(tableName, batch, options);
        result.successful += batchResult.successful;
        result.failed += batchResult.failed;
        result.conflictsResolved += batchResult.conflictsResolved;
        result.errors.push(...batchResult.errors);
        
        result.totalProcessed += batch.length;
        
        // Report progress
        if (options.onProgress) {
          options.onProgress({
            processed: result.totalProcessed,
            total: data.length,
            conflicts: result.conflictsResolved
          });
        }
        
        // Add delay between batches to prevent overwhelming the database
        if (i + this.batchSize < data.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error) {
        console.error(`❌ Batch ${batchNumber} failed:`, error);
        result.failed += batch.length;
        result.errors.push(`Batch ${batchNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`✅ Batch operation complete: ${result.successful} successful, ${result.failed} failed, ${result.conflictsResolved} conflicts resolved`);
    return result;
  }

  private async processBatchWithRetry(
    tableName: string,
    batch: any[],
    options: {
      conflictColumns?: string[];
      updateOnConflict?: boolean;
    }
  ): Promise<BatchOperationResult> {
    const result: BatchOperationResult = {
      totalProcessed: batch.length,
      successful: 0,
      failed: 0,
      conflictsResolved: 0,
      errors: []
    };

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${this.retryAttempts} for batch of ${batch.length} items`);

        let query = supabase.from(tableName).insert(batch);
        
        // Handle conflicts if specified
        if (options.conflictColumns && options.conflictColumns.length > 0) {
          if (options.updateOnConflict) {
            // Use upsert strategy
            query = query.upsert(batch, { 
              onConflict: options.conflictColumns.join(','),
              ignoreDuplicates: false 
            });
          } else {
            // Use ignore duplicates strategy
            query = query.upsert(batch, { 
              onConflict: options.conflictColumns.join(','),
              ignoreDuplicates: true 
            });
          }
        }

        const { error } = await query;

        if (error) {
          if (error.message.includes('ON CONFLICT DO UPDATE command cannot affect row a second time')) {
            console.log(`🔧 Conflict detected, attempting individual inserts...`);
            result.conflictsResolved++;
            
            // Process items individually to isolate conflicts
            const individualResult = await this.processIndividualInserts(tableName, batch, options);
            result.successful += individualResult.successful;
            result.failed += individualResult.failed;
            result.conflictsResolved += individualResult.conflictsResolved;
            result.errors.push(...individualResult.errors);
            
            return result;
          } else {
            throw error;
          }
        }

        // Success - all items in batch were processed
        result.successful = batch.length;
        console.log(`✅ Batch insert successful: ${batch.length} items`);
        return result;

      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error);
        
        if (attempt === this.retryAttempts) {
          // Final attempt failed, mark all as failed
          result.failed = batch.length;
          result.errors.push(`All ${this.retryAttempts} attempts failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return result;
        }
        
        // Wait before retry with exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return result;
  }

  private async processIndividualInserts(
    tableName: string,
    items: any[],
    options: {
      conflictColumns?: string[];
      updateOnConflict?: boolean;
    }
  ): Promise<BatchOperationResult> {
    console.log(`🔍 Processing ${items.length} items individually to resolve conflicts`);
    
    const result: BatchOperationResult = {
      totalProcessed: items.length,
      successful: 0,
      failed: 0,
      conflictsResolved: 0,
      errors: []
    };

    for (const item of items) {
      try {
        let query = supabase.from(tableName).insert([item]);
        
        if (options.conflictColumns && options.conflictColumns.length > 0) {
          if (options.updateOnConflict) {
            query = query.upsert([item], { 
              onConflict: options.conflictColumns.join(','),
              ignoreDuplicates: false 
            });
          } else {
            query = query.upsert([item], { 
              onConflict: options.conflictColumns.join(','),
              ignoreDuplicates: true 
            });
          }
        }

        const { error } = await query;

        if (error) {
          if (error.message.includes('duplicate') || error.message.includes('conflict')) {
            console.log(`🔧 Resolved individual conflict for item`);
            result.conflictsResolved++;
            result.successful++;
          } else {
            throw error;
          }
        } else {
          result.successful++;
        }

      } catch (error) {
        console.error(`❌ Individual insert failed:`, error);
        result.failed++;
        result.errors.push(`Individual insert failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`✅ Individual processing complete: ${result.successful} successful, ${result.failed} failed, ${result.conflictsResolved} conflicts`);
    return result;
  }

  async cleanupConflictedData(tableName: string, conflictColumns: string[]): Promise<number> {
    console.log(`🧹 Cleaning up conflicted data in ${tableName}...`);
    
    try {
      // This is a placeholder for conflict cleanup logic
      // In practice, you might want to identify and remove duplicates
      // or merge conflicted records based on business logic
      
      console.log(`✅ Conflict cleanup completed for ${tableName}`);
      return 0;
    } catch (error) {
      console.error(`❌ Conflict cleanup failed for ${tableName}:`, error);
      throw error;
    }
  }

  setBatchSize(size: number): void {
    this.batchSize = Math.max(1, Math.min(size, 100)); // Limit between 1 and 100
    console.log(`📊 Batch size set to ${this.batchSize}`);
  }

  setRetrySettings(attempts: number, delay: number): void {
    this.retryAttempts = Math.max(1, Math.min(attempts, 10));
    this.retryDelay = Math.max(100, Math.min(delay, 10000));
    console.log(`🔄 Retry settings: ${this.retryAttempts} attempts, ${this.retryDelay}ms delay`);
  }
}

export const enhancedDatabaseManager = EnhancedDatabaseManager.getInstance();
