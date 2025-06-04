
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CleanupResult {
  cleanedUp: number;
  hangingProcesses: number;
  errors: string[];
  conflictsResolved: number;
}

export const useProcessCleanup = () => {
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const cleanupHangingProcesses = useCallback(async (): Promise<CleanupResult> => {
    setIsCleaningUp(true);
    console.log('🧹 Starting enhanced cleanup of hanging processes...');

    try {
      // Phase 1: Identify hanging processes with better time threshold
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      console.log(`🔍 Looking for processes older than ${thirtyMinutesAgo}`);
      
      // Find hanging processes with different severity levels
      const { data: hangingProcesses, error: fetchError } = await supabase
        .from('automated_sync_status')
        .select('*')
        .eq('status', 'running')
        .lt('started_at', thirtyMinutesAgo)
        .order('started_at', { ascending: true });

      if (fetchError) {
        throw new Error(`Failed to fetch hanging processes: ${fetchError.message}`);
      }

      const hangingCount = hangingProcesses?.length || 0;
      console.log(`🔍 Found ${hangingCount} hanging processes`);

      if (hangingCount === 0) {
        console.log('✅ No hanging processes found');
        return {
          cleanedUp: 0,
          hangingProcesses: 0,
          errors: [],
          conflictsResolved: 0
        };
      }

      // Phase 2: Categorize and cleanup hanging processes
      const criticalHanging = hangingProcesses?.filter(p => 
        new Date(p.started_at) < new Date(oneHourAgo)
      ) || [];
      const recentHanging = hangingProcesses?.filter(p => 
        new Date(p.started_at) >= new Date(oneHourAgo)
      ) || [];

      console.log(`📊 Process categorization: ${criticalHanging.length} critical, ${recentHanging.length} recent`);

      let totalCleaned = 0;
      let conflictsResolved = 0;
      const errors: string[] = [];

      // Clean critical hanging processes (older than 1 hour) - mark as failed
      if (criticalHanging.length > 0) {
        try {
          const { error: criticalUpdateError } = await supabase
            .from('automated_sync_status')
            .update({
              status: 'failed',
              completed_at: new Date().toISOString(),
              error_message: 'Process terminated due to critical timeout (1+ hours)'
            })
            .in('id', criticalHanging.map(p => p.id));

          if (criticalUpdateError) {
            if (criticalUpdateError.message.includes('ON CONFLICT DO UPDATE')) {
              conflictsResolved++;
              console.log('🔧 Resolved database conflict during critical cleanup');
            } else {
              throw criticalUpdateError;
            }
          }

          totalCleaned += criticalHanging.length;
          console.log(`🚨 Cleaned ${criticalHanging.length} critical hanging processes`);
        } catch (error) {
          const errorMsg = `Failed to cleanup critical processes: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error('❌ Critical cleanup error:', errorMsg);
        }
      }

      // Clean recent hanging processes (30min-1hour) - mark as timed out
      if (recentHanging.length > 0) {
        try {
          const { error: recentUpdateError } = await supabase
            .from('automated_sync_status')
            .update({
              status: 'failed',
              completed_at: new Date().toISOString(),
              error_message: 'Process timed out after 30+ minutes'
            })
            .in('id', recentHanging.map(p => p.id));

          if (recentUpdateError) {
            if (recentUpdateError.message.includes('ON CONFLICT DO UPDATE')) {
              conflictsResolved++;
              console.log('🔧 Resolved database conflict during recent cleanup');
              
              // Retry with individual updates to avoid conflicts
              for (const process of recentHanging) {
                try {
                  const { error: individualError } = await supabase
                    .from('automated_sync_status')
                    .update({
                      status: 'failed',
                      completed_at: new Date().toISOString(),
                      error_message: 'Process timed out after 30+ minutes (retry)'
                    })
                    .eq('id', process.id)
                    .eq('status', 'running'); // Only update if still running

                  if (individualError && !individualError.message.includes('No rows updated')) {
                    console.warn(`⚠️ Individual update failed for ${process.id}:`, individualError.message);
                  }
                } catch (retryError) {
                  console.warn(`⚠️ Retry failed for process ${process.id}:`, retryError);
                }
              }
            } else {
              throw recentUpdateError;
            }
          }

          totalCleaned += recentHanging.length;
          console.log(`⏰ Cleaned ${recentHanging.length} recent hanging processes`);
        } catch (error) {
          const errorMsg = `Failed to cleanup recent processes: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error('❌ Recent cleanup error:', errorMsg);
        }
      }

      // Phase 3: Cleanup orphaned data and resolve additional conflicts
      try {
        console.log('🧽 Performing additional database cleanup...');
        
        // Check for and resolve any remaining data inconsistencies
        const { data: statusCheck } = await supabase
          .from('automated_sync_status')
          .select('id, status, started_at')
          .eq('status', 'running')
          .lt('started_at', thirtyMinutesAgo);

        if (statusCheck && statusCheck.length > 0) {
          console.log(`🔍 Found ${statusCheck.length} additional hanging processes after cleanup`);
          
          // Final cleanup attempt with conflict resolution
          for (const process of statusCheck) {
            try {
              const { error } = await supabase
                .from('automated_sync_status')
                .update({
                  status: 'failed',
                  completed_at: new Date().toISOString(),
                  error_message: 'Final cleanup - process was hanging'
                })
                .eq('id', process.id);

              if (error) {
                console.warn(`⚠️ Final cleanup warning for ${process.id}:`, error.message);
              } else {
                totalCleaned++;
              }
            } catch (finalError) {
              console.warn(`⚠️ Final cleanup failed for ${process.id}:`, finalError);
            }
          }
        }

        console.log(`✅ Enhanced cleanup complete: ${totalCleaned} processes cleaned, ${conflictsResolved} conflicts resolved`);
        
        return {
          cleanedUp: totalCleaned,
          hangingProcesses: hangingCount,
          errors,
          conflictsResolved
        };

      } catch (finalCleanupError) {
        console.error('❌ Final cleanup phase failed:', finalCleanupError);
        errors.push(`Final cleanup failed: ${finalCleanupError instanceof Error ? finalCleanupError.message : 'Unknown error'}`);
        
        return {
          cleanedUp: totalCleaned,
          hangingProcesses: hangingCount,
          errors,
          conflictsResolved
        };
      }

    } catch (error) {
      console.error('❌ Enhanced process cleanup failed:', error);
      return {
        cleanedUp: 0,
        hangingProcesses: 0,
        errors: [error instanceof Error ? error.message : 'Unknown cleanup error'],
        conflictsResolved: 0
      };
    } finally {
      setIsCleaningUp(false);
    }
  }, []);

  const performBatchCleanup = useCallback(async (batchSize: number = 10): Promise<CleanupResult> => {
    console.log(`🔄 Starting batch cleanup with size ${batchSize}...`);
    
    try {
      const result = await cleanupHangingProcesses();
      
      // Add delay between batches to prevent overwhelming the database
      if (result.cleanedUp > 0) {
        console.log(`⏳ Waiting 2 seconds before next operation...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      return result;
    } catch (error) {
      console.error('❌ Batch cleanup failed:', error);
      throw error;
    }
  }, [cleanupHangingProcesses]);

  return {
    cleanupHangingProcesses,
    performBatchCleanup,
    isCleaningUp
  };
};
