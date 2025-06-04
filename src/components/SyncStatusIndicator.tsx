
import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RefreshCw, CheckCircle, AlertCircle, Clock, Database } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface SyncStatus {
  sync_type: string;
  status: string;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

const SyncStatusIndicator: React.FC = () => {
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSyncStatus();
    const interval = setInterval(fetchSyncStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSyncStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('automated_sync_status')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(4);

      if (error) throw error;

      // Group by sync_type and get the latest for each
      const latestSyncs: Record<string, SyncStatus> = {};
      data?.forEach(sync => {
        if (!latestSyncs[sync.sync_type] || 
            new Date(sync.started_at) > new Date(latestSyncs[sync.sync_type].started_at)) {
          latestSyncs[sync.sync_type] = sync;
        }
      });

      setSyncStatuses(Object.values(latestSyncs));
    } catch (error) {
      console.error('Error fetching sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'running':
        return <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Nyss';
    if (minutes < 60) return `${minutes}m sedan`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h sedan`;
    
    const days = Math.floor(hours / 24);
    return `${days}d sedan`;
  };

  if (loading || syncStatuses.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="fixed bottom-4 right-4 z-50">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 space-y-1">
              <div className="flex items-center space-x-1 text-xs font-medium text-gray-600 mb-1">
                <Database className="w-3 h-3" />
                <span>Synkstatus</span>
              </div>
              {syncStatuses.map((sync, index) => (
                <div key={sync.sync_type} className="flex items-center justify-between space-x-2">
                  <Badge 
                    variant={getStatusVariant(sync.status)}
                    className="text-xs py-0 px-2 h-5"
                  >
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(sync.status)}
                      <span className="capitalize">
                        {sync.sync_type === 'comprehensive' ? 'Data' : sync.sync_type}
                      </span>
                    </div>
                  </Badge>
                </div>
              ))}
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-medium">Automatisk datasynkronisering</p>
              {syncStatuses.map((sync) => (
                <div key={sync.sync_type} className="text-xs">
                  <p className="font-medium capitalize">
                    {sync.sync_type === 'comprehensive' ? 'Omfattande data' : sync.sync_type}
                  </p>
                  <p className="text-gray-600">
                    Status: {sync.status === 'completed' ? 'Klar' : sync.status === 'running' ? 'Pågår' : 'Fel'}
                  </p>
                  <p className="text-gray-600">
                    {formatTimestamp(sync.started_at)}
                  </p>
                  {sync.error_message && (
                    <p className="text-red-600 text-xs">{sync.error_message}</p>
                  )}
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default SyncStatusIndicator;
