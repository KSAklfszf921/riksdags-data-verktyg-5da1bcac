
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CleanupResult {
  hangingProcesses: number;
  cleanedUp: number;
  errors: string[];
}

export const useProcessCleanup = () => {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const { toast } = useToast();

  const cleanupHangingProcesses = useCallback(async (): Promise<CleanupResult> => {
    setIsCleaningUp(true);
    const result: CleanupResult = {
      hangingProcesses: 0,
      cleanedUp: 0,
      errors: []
    };

    try {
      console.log('🧹 Starting cleanup of hanging processes...');

      // Find processes running for more than 30 minutes
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      
      const { data: hangingProcesses, error: fetchError } = await supabase
        .from('automated_sync_status')
        .select('*')
        .eq('status', 'running')
        .lt('started_at', thirtyMinutesAgo);

      if (fetchError) {
        result.errors.push(`Error fetching hanging processes: ${fetchError.message}`);
        return result;
      }

      result.hangingProcesses = hangingProcesses?.length || 0;

      if (result.hangingProcesses === 0) {
        console.log('✅ No hanging processes found');
        return result;
      }

      console.log(`🔍 Found ${result.hangingProcesses} hanging processes`);

      // Mark hanging processes as failed with timeout error
      const { error: updateError } = await supabase
        .from('automated_sync_status')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: 'Process terminated due to timeout (30+ minutes)'
        })
        .in('id', hangingProcesses.map(p => p.id));

      if (updateError) {
        result.errors.push(`Error updating hanging processes: ${updateError.message}`);
        return result;
      }

      result.cleanedUp = result.hangingProcesses;
      console.log(`✅ Cleaned up ${result.cleanedUp} hanging processes`);

      toast({
        title: "Cleanup Complete",
        description: `Cleaned up ${result.cleanedUp} hanging processes`,
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMsg);
      console.error('❌ Cleanup failed:', error);
      
      toast({
        title: "Cleanup Failed",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsCleaningUp(false);
    }

    return result;
  }, [toast]);

  const abortRunningProcess = useCallback(async (processId: string): Promise<boolean> => {
    try {
      console.log(`🛑 Aborting process ${processId}...`);

      const { error } = await supabase
        .from('automated_sync_status')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: 'Process aborted by user'
        })
        .eq('id', processId)
        .eq('status', 'running');

      if (error) {
        console.error('❌ Failed to abort process:', error);
        toast({
          title: "Abort Failed",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      console.log('✅ Process aborted successfully');
      toast({
        title: "Process Aborted",
        description: "Process has been successfully terminated",
      });

      return true;
    } catch (error) {
      console.error('❌ Error aborting process:', error);
      return false;
    }
  }, [toast]);

  return {
    cleanupHangingProcesses,
    abortRunningProcess,
    isCleaningUp
  };
};
