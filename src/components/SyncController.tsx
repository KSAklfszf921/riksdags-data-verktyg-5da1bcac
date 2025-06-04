
import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { RefreshCw, Square, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface SyncState {
  isRunning: boolean;
  progress: number;
  currentStep: string;
  processedCount: number;
  totalCount: number;
  errors: string[];
  startTime?: Date;
  abortController?: AbortController;
}

interface SyncControllerProps {
  onSyncComplete?: () => void;
  onSyncStart?: () => void;
}

const SyncController: React.FC<SyncControllerProps> = ({ 
  onSyncComplete,
  onSyncStart 
}) => {
  const [syncState, setSyncState] = useState<SyncState>({
    isRunning: false,
    progress: 0,
    currentStep: '',
    processedCount: 0,
    totalCount: 0,
    errors: []
  });

  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatRef = useRef<NodeJS.Timeout>();

  const addError = useCallback((error: string) => {
    setSyncState(prev => ({
      ...prev,
      errors: [...prev.errors.slice(-4), error] // Keep only last 5 errors
    }));
  }, []);

  const updateProgress = useCallback((
    processed: number, 
    total: number, 
    step: string
  ) => {
    setSyncState(prev => ({
      ...prev,
      processedCount: processed,
      totalCount: total,
      progress: total > 0 ? Math.round((processed / total) * 100) : 0,
      currentStep: step
    }));
  }, []);

  const cleanupHangingProcesses = async (): Promise<void> => {
    try {
      // Check for processes running longer than 15 minutes
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      
      const { data: hangingProcesses, error } = await supabase
        .from('automated_sync_status')
        .select('*')
        .eq('status', 'running')
        .lt('started_at', fifteenMinutesAgo);

      if (error) throw error;

      if (hangingProcesses && hangingProcesses.length > 0) {
        console.log(`Found ${hangingProcesses.length} hanging processes, cleaning up...`);
        
        // Mark hanging processes as failed
        const { error: updateError } = await supabase
          .from('automated_sync_status')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: 'Process terminated due to timeout (15+ minutes)'
          })
          .in('id', hangingProcesses.map(p => p.id));

        if (updateError) throw updateError;
        
        toast.success(`Cleaned up ${hangingProcesses.length} hanging processes`);
      }
    } catch (error) {
      console.error('Error cleaning hanging processes:', error);
      addError(`Failed to clean hanging processes: ${error}`);
    }
  };

  const startHeartbeat = useCallback(() => {
    heartbeatRef.current = setInterval(async () => {
      try {
        // Send heartbeat to prevent process from being marked as hanging
        const { error } = await supabase
          .from('automated_sync_status')
          .update({ 
            stats: { 
              last_heartbeat: new Date().toISOString(),
              processed_count: syncState.processedCount
            } 
          })
          .eq('sync_type', 'comprehensive')
          .eq('status', 'running');

        if (error) {
          console.warn('Heartbeat failed:', error);
        }
      } catch (error) {
        console.warn('Heartbeat error:', error);
      }
    }, 30000); // Every 30 seconds
  }, [syncState.processedCount]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = undefined;
    }
  }, []);

  const abortSync = useCallback(async () => {
    try {
      console.log('Aborting sync process...');
      
      // Abort the fetch request if possible
      if (syncState.abortController) {
        syncState.abortController.abort();
      }

      // Clear timeouts
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      stopHeartbeat();

      // Update database status
      const { error } = await supabase
        .from('automated_sync_status')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: 'Sync aborted by user'
        })
        .eq('sync_type', 'comprehensive')
        .eq('status', 'running');

      if (error) {
        console.error('Error updating abort status:', error);
      }

      setSyncState(prev => ({
        ...prev,
        isRunning: false,
        currentStep: 'Aborted by user',
        abortController: undefined
      }));

      toast.info('Sync process aborted');
    } catch (error) {
      console.error('Error aborting sync:', error);
      addError(`Failed to abort sync: ${error}`);
    }
  }, [syncState.abortController, stopHeartbeat]);

  const startSync = useCallback(async () => {
    if (syncState.isRunning) {
      toast.warning('Sync is already running');
      return;
    }

    try {
      // Clean up any hanging processes first
      await cleanupHangingProcesses();

      // Create abort controller
      const abortController = new AbortController();

      setSyncState({
        isRunning: true,
        progress: 0,
        currentStep: 'Initializing...',
        processedCount: 0,
        totalCount: 0,
        errors: [],
        startTime: new Date(),
        abortController
      });

      onSyncStart?.();
      startHeartbeat();

      // Set overall timeout (20 minutes)
      syncTimeoutRef.current = setTimeout(() => {
        console.log('Sync timeout reached, aborting...');
        abortSync();
      }, 20 * 60 * 1000);

      updateProgress(0, 100, 'Starting comprehensive sync...');

      // Call the edge function with abort signal
      const { data, error } = await supabase.functions.invoke('fetch-comprehensive-data', {
        body: { 
          manual_trigger: true,
          triggered_by: 'sync_controller',
          timeout: 18 * 60 * 1000 // 18 minutes timeout
        }
      });

      if (error) {
        throw error;
      }

      // Monitor sync progress
      const monitorProgress = async () => {
        let attempts = 0;
        const maxAttempts = 60; // 10 minutes of monitoring

        const checkProgress = async () => {
          try {
            const { data: statusData, error: statusError } = await supabase
              .from('automated_sync_status')
              .select('*')
              .eq('sync_type', 'comprehensive')
              .order('started_at', { ascending: false })
              .limit(1);

            if (statusError) throw statusError;

            if (statusData && statusData.length > 0) {
              const status = statusData[0];
              
              if (status.status === 'completed') {
                const stats = status.stats as any;
                updateProgress(100, 100, 'Sync completed successfully');
                
                setSyncState(prev => ({
                  ...prev,
                  isRunning: false
                }));

                stopHeartbeat();
                if (syncTimeoutRef.current) {
                  clearTimeout(syncTimeoutRef.current);
                }

                toast.success(`Sync completed! Processed ${stats?.members_processed || 0} members`);
                onSyncComplete?.();
                return;
              }
              
              if (status.status === 'failed') {
                throw new Error(status.error_message || 'Sync failed');
              }

              if (status.status === 'running') {
                const stats = status.stats as any;
                const processed = stats?.processed_records || 0;
                const total = stats?.total_records || 100;
                
                updateProgress(processed, total, 'Processing members...');
              }
            }

            attempts++;
            if (attempts < maxAttempts && syncState.isRunning) {
              setTimeout(checkProgress, 10000); // Check every 10 seconds
            } else if (attempts >= maxAttempts) {
              throw new Error('Sync monitoring timeout');
            }
          } catch (error) {
            console.error('Progress monitoring error:', error);
            addError(`Monitoring error: ${error}`);
            
            if (attempts < maxAttempts && syncState.isRunning) {
              setTimeout(checkProgress, 10000);
            }
          }
        };

        // Start monitoring
        setTimeout(checkProgress, 5000); // First check after 5 seconds
      };

      monitorProgress();

    } catch (error) {
      console.error('Sync error:', error);
      addError(`Sync failed: ${error}`);
      
      setSyncState(prev => ({
        ...prev,
        isRunning: false,
        currentStep: 'Failed'
      }));

      stopHeartbeat();
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      toast.error('Sync failed to start');
    }
  }, [syncState.isRunning, onSyncStart, onSyncComplete, startHeartbeat, stopHeartbeat, abortSync, addError, updateProgress]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopHeartbeat();
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [stopHeartbeat]);

  const formatDuration = (startTime?: Date) => {
    if (!startTime) return 'N/A';
    
    const now = new Date();
    const diff = now.getTime() - startTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Sync Controller</span>
          <div className="flex items-center space-x-2">
            {syncState.isRunning ? (
              <Badge className="bg-blue-500">
                <Clock className="w-3 h-3 mr-1" />
                Running
              </Badge>
            ) : (
              <Badge variant="outline">Ready</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{syncState.processedCount} / {syncState.totalCount}</span>
          </div>
          <Progress 
            value={syncState.progress} 
            className="w-full"
            indicatorColor={syncState.isRunning ? "bg-blue-500" : "bg-green-500"}
          />
          {syncState.currentStep && (
            <p className="text-xs text-gray-600">{syncState.currentStep}</p>
          )}
        </div>

        {/* Status Info */}
        {syncState.startTime && (
          <div className="text-xs text-gray-500">
            Duration: {formatDuration(syncState.startTime)}
          </div>
        )}

        {/* Error Display */}
        {syncState.errors.length > 0 && (
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-1">
                <p className="font-medium">Recent errors:</p>
                {syncState.errors.slice(-3).map((error, index) => (
                  <p key={index} className="text-xs">{error}</p>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Controls */}
        <div className="flex space-x-3">
          <Button 
            onClick={startSync}
            disabled={syncState.isRunning}
            className="flex-1"
          >
            {syncState.isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Start Sync
              </>
            )}
          </Button>
          
          {syncState.isRunning && (
            <Button 
              onClick={abortSync}
              variant="destructive"
            >
              <Square className="w-4 h-4 mr-2" />
              Abort
            </Button>
          )}
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-xs">
            This controller includes timeout protection, process cleanup, and abort functionality. 
            Sync will automatically timeout after 20 minutes to prevent hanging processes.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default SyncController;
