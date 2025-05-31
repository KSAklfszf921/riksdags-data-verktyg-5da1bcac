
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
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Poll for progress updates
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isPolling && progress.status === 'running') {
      intervalId = setInterval(async () => {
        try {
          const { data, error } = await supabase.functions.invoke('fetch-all-members-news', {
            body: { action: 'status', sessionId }
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
  }, [isPolling, progress.status, sessionId]);

  // Auto-continue processing chunks
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const continueProcessing = async () => {
      try {
        console.log('🔄 Fortsätter med nästa chunk...');
        const { data, error } = await supabase.functions.invoke('fetch-all-members-news', {
          body: { action: 'continue', sessionId }
        });

        if (error) {
          throw error;
        }

        if (data?.progress) {
          setProgress(data.progress);
          setLastUpdate(new Date());
          
          // If there are more chunks to process, schedule the next one
          if (data.hasMore && data.progress.status === 'running') {
            timeoutId = setTimeout(continueProcessing, 2000);
          } else {
            setIsPolling(false);
          }
        }
      } catch (error) {
        console.error('Error continuing batch process:', error);
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

    // Auto-continue if we're running and polling is active
    if (isPolling && progress.status === 'running' && progress.processedMembers > 0) {
      // Check if we need to continue to the next chunk after a delay
      timeoutId = setTimeout(() => {
        // Only continue if we're still in running state
        if (progress.status === 'running') {
          continueProcessing();
        }
      }, 3000); // Wait 3 seconds before next chunk
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isPolling, progress.status, progress.processedMembers, sessionId]);

  const startBatchProcess = async () => {
    try {
      setIsPolling(true);
      
      const { data, error } = await supabase.functions.invoke('fetch-all-members-news', {
        body: { action: 'start', sessionId }
      });

      if (error) {
        throw error;
      }

      if (data?.progress) {
        setProgress(data.progress);
        setLastUpdate(new Date());
        
        // If there are more chunks to process, the auto-continue will handle it
        if (!data.isCompleted && data.hasMore) {
          console.log('📋 Första chunk slutförd, fortsätter automatiskt...');
        }
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
        body: { action: 'stop', sessionId }
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
        body: { action: 'status', sessionId }
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
