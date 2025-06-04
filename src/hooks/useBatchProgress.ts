
import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { BatchProgress } from '../types/batch';

export const useBatchProgress = () => {
  const [progress, setProgress] = useState<BatchProgress>({
    totalMembers: 0,
    processedMembers: 0,
    successfulFetches: 0,
    failedFetches: 0,
    currentMember: '',
    status: 'idle',
    startTime: '',
    errors: [],
    totalRssItems: 0,
    currentBatchRssItems: 0
  });
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Poll for progress updates
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isPolling && progress.status === 'running') {
      intervalId = setInterval(async () => {
        try {
          const { data, error } = await supabase.functions.invoke('fetch-all-members-news', {
            body: { action: 'status' }
          });

          if (error) {
            console.error('Error polling progress:', error);
            return;
          }

          if (data?.progress) {
            setProgress(data.progress);
            setLastUpdate(new Date());

            if (data.progress.status === 'completed' || data.progress.status === 'error') {
              setIsPolling(false);
            }
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPolling, progress.status]);

  const startBatchProcess = async () => {
    try {
      setIsPolling(true);
      
      const { data, error } = await supabase.functions.invoke('fetch-all-members-news', {
        body: { action: 'start' }
      });

      if (error) {
        throw error;
      }

      if (data?.progress) {
        setProgress(data.progress);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error starting batch process:', error);
      setIsPolling(false);
      setProgress(prev => ({
        ...prev,
        status: 'error',
        errors: [...prev.errors, { 
          memberName: 'System', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }]
      }));
    }
  };

  const stopBatchProcess = async () => {
    try {
      const { error } = await supabase.functions.invoke('fetch-all-members-news', {
        body: { action: 'stop' }
      });

      if (error) {
        throw error;
      }

      setIsPolling(false);
      setProgress(prev => ({ ...prev, status: 'paused' }));
    } catch (error) {
      console.error('Error stopping batch process:', error);
    }
  };

  const refreshStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-all-members-news', {
        body: { action: 'status' }
      });

      if (error) {
        throw error;
      }

      if (data?.progress) {
        setProgress(data.progress);
        setLastUpdate(new Date());
        
        if (data.progress.status === 'running') {
          setIsPolling(true);
        }
      }
    } catch (error) {
      console.error('Error refreshing status:', error);
    }
  };

  return {
    progress,
    isPolling,
    lastUpdate,
    startBatchProcess,
    stopBatchProcess,
    refreshStatus
  };
};
