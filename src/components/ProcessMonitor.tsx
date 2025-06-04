
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSyncMonitor } from '@/hooks/useSyncMonitor';
import { toast } from "sonner";
import { 
  RefreshCw, 
  AlertTriangle, 
  Clock, 
  Square, 
  Trash2,
  CheckCircle 
} from "lucide-react";

const ProcessMonitor: React.FC = () => {
  const { 
    activeSyncs, 
    recentSyncs, 
    loading, 
    error,
    refreshStatus,
    cleanupHangingSyncs,
    abortSync
  } = useSyncMonitor();

  const handleCleanup = async () => {
    try {
      const cleanedCount = await cleanupHangingSyncs();
      if (cleanedCount > 0) {
        toast.success(`Cleaned up ${cleanedCount} hanging processes`);
      } else {
        toast.info('No hanging processes found');
      }
    } catch (error) {
      toast.error('Failed to cleanup hanging processes');
    }
  };

  const handleAbort = async (syncId: string, syncType: string) => {
    try {
      await abortSync(syncId);
      toast.success(`Aborted ${syncType} sync`);
    } catch (error) {
      toast.error('Failed to abort sync');
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = end.getTime() - start.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-blue-500">Running</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading process status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Process Monitor</span>
            <div className="flex space-x-2">
              <Button 
                onClick={refreshStatus} 
                variant="outline" 
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button 
                onClick={handleCleanup} 
                variant="outline" 
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Cleanup
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Active Syncs */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Active Processes ({activeSyncs.length})
            </h3>
            
            {activeSyncs.length === 0 ? (
              <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-md">
                <CheckCircle className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm">No active processes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSyncs.map((sync) => (
                  <div 
                    key={sync.id} 
                    className="border rounded-md p-3 bg-blue-50 border-blue-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium capitalize">
                            {sync.sync_type}
                          </span>
                          {getStatusBadge(sync.status)}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Started: {new Date(sync.started_at).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">
                          Duration: {formatDuration(sync.started_at)}
                        </p>
                        {sync.stats && (
                          <p className="text-xs text-blue-600 mt-1">
                            Progress: {sync.stats.processed_records || 0} / {sync.stats.total_records || 0}
                          </p>
                        )}
                      </div>
                      
                      <Button
                        onClick={() => handleAbort(sync.id, sync.sync_type)}
                        variant="destructive"
                        size="sm"
                      >
                        <Square className="w-3 h-3 mr-1" />
                        Abort
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Syncs */}
          <div>
            <h3 className="text-sm font-medium mb-3">
              Recent Processes (Last 10)
            </h3>
            
            <div className="space-y-2">
              {recentSyncs.map((sync) => (
                <div 
                  key={sync.id} 
                  className="border rounded-md p-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium capitalize">
                        {sync.sync_type}
                      </span>
                      {getStatusBadge(sync.status)}
                    </div>
                    <span className="text-gray-500">
                      {formatDuration(sync.started_at, sync.completed_at)}
                    </span>
                  </div>
                  
                  {sync.error_message && (
                    <p className="text-red-600 mt-1 text-xs">
                      Error: {sync.error_message}
                    </p>
                  )}
                  
                  {sync.stats && (
                    <p className="text-gray-600 mt-1">
                      Processed: {sync.stats.members_processed || sync.stats.documents_processed || 0} items
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcessMonitor;
