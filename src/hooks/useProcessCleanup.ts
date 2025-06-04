
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CleanupResult {
  cleanedUp: number;
  hangingProcesses: number;
  errors: string[];
}

export const useProcessCleanup = () => {
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const cleanupHangingProcesses = useCallback(async (): Promise<CleanupResult> => {
    setIsCleaningUp(true);
    console.log('🧹 Starting cleanup of hanging processes...');

    try {
      // Define what constitutes a "hanging" process (older than 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      
      // Find hanging processes
      const { data: hangingProcesses, error: fetchError } = await supabase
        .from('automated_sync_status')
        .select('*')
        .eq('status', 'running')
        .lt('started_at', thirtyMinutesAgo);

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
          errors: []
        };
      }

      // Update hanging processes to failed status
      const { error: updateError } = await supabase
        .from('automated_sync_status')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: 'Process marked as hanging and cleaned up'
        })
        .eq('status', 'running')
        .lt('started_at', thirtyMinutesAgo);

      if (updateError) {
        throw new Error(`Failed to cleanup hanging processes: ${updateError.message}`);
      }

      console.log(`✅ Cleaned up ${hangingCount} hanging processes`);
      
      return {
        cleanedUp: hangingCount,
        hangingProcesses: hangingCount,
        errors: []
      };

    } catch (error) {
      console.error('❌ Process cleanup failed:', error);
      return {
        cleanedUp: 0,
        hangingProcesses: 0,
        errors: [error instanceof Error ? error.message : 'Unknown cleanup error']
      };
    } finally {
      setIsCleaningUp(false);
    }
  }, []);

  return {
    cleanupHangingProcesses,
    isCleaningUp
  };
};
