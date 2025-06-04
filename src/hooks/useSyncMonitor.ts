
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SyncStatus {
  id: string;
  sync_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  error_message?: string;
  stats?: Record<string, any>;
}

interface SyncMonitorState {
  activeSyncs: SyncStatus[];
  recentSyncs: SyncStatus[];
  loading: boolean;
  error: string | null;
}

export const useSyncMonitor = () => {
  const [state, setState] = useState<SyncMonitorState>({
    activeSyncs: [],
    recentSyncs: [],
    loading: true,
    error: null
  });

  const fetchSyncStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Get all sync statuses from the last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('automated_sync_status')
        .select('*')
        .gte('started_at', twentyFourHoursAgo)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Type assertion to ensure proper typing
      const typedData = (data || []).map(item => ({
        ...item,
        status: item.status as 'pending' | 'running' | 'completed' | 'failed'
      }));

      const activeSyncs = typedData.filter(sync => sync.status === 'running');
      const recentSyncs = typedData.slice(0, 10);

      setState({
        activeSyncs,
        recentSyncs,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Error fetching sync status:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, []);

  const cleanupHangingSyncs = useCallback(async () => {
    try {
      // Find syncs that have been running for more than 30 minutes
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

      const { data: hangingSyncs, error: fetchError } = await supabase
        .from('automated_sync_status')
        .select('*')
        .eq('status', 'running')
        .lt('started_at', thirtyMinutesAgo);

      if (fetchError) throw fetchError;

      if (hangingSyncs && hangingSyncs.length > 0) {
        console.log(`Found ${hangingSyncs.length} hanging syncs, cleaning up...`);

        const { error: updateError } = await supabase
          .from('automated_sync_status')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: 'Sync terminated due to timeout (30+ minutes)'
          })
          .in('id', hangingSyncs.map(sync => sync.id));

        if (updateError) throw updateError;

        // Refresh status after cleanup
        await fetchSyncStatus();

        return hangingSyncs.length;
      }

      return 0;
    } catch (error) {
      console.error('Error cleaning hanging syncs:', error);
      throw error;
    }
  }, [fetchSyncStatus]);

  const abortSync = useCallback(async (syncId: string) => {
    try {
      const { error } = await supabase
        .from('automated_sync_status')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: 'Sync aborted by user'
        })
        .eq('id', syncId)
        .eq('status', 'running');

      if (error) throw error;

      // Refresh status after abort
      await fetchSyncStatus();
    } catch (error) {
      console.error('Error aborting sync:', error);
      throw error;
    }
  }, [fetchSyncStatus]);

  // Set up real-time subscription
  useEffect(() => {
    // Initial fetch
    fetchSyncStatus();

    // Set up real-time subscription
    const channel = supabase
      .channel('sync-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'automated_sync_status'
        },
        () => {
          // Refresh data when sync status changes
          fetchSyncStatus();
        }
      )
      .subscribe();

    // Set up periodic refresh (every 30 seconds)
    const interval = setInterval(fetchSyncStatus, 30000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchSyncStatus]);

  return {
    ...state,
    refreshStatus: fetchSyncStatus,
    cleanupHangingSyncs,
    abortSync
  };
};
