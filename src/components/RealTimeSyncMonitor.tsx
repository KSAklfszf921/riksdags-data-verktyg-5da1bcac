
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSyncMonitor } from '@/hooks/useSyncMonitor';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  RefreshCw,
  TrendingUp
} from "lucide-react";

interface SyncProgress {
  id: string;
  type: string;
  progress: number;
  currentOperation: string;
  estimatedTimeRemaining?: number;
}

const RealTimeSyncMonitor: React.FC = () => {
  const { activeSyncs, recentSyncs, loading, error } = useSyncMonitor();
  const [syncProgress, setSyncProgress] = useState<Record<string, SyncProgress>>({});

  // Simulate progress for active syncs
  useEffect(() => {
    if (activeSyncs.length === 0) {
      setSyncProgress({});
      return;
    }

    const interval = setInterval(() => {
      setSyncProgress(prev => {
        const updated = { ...prev };
        
        activeSyncs.forEach(sync => {
          if (!updated[sync.id]) {
            updated[sync.id] = {
              id: sync.id,
              type: sync.sync_type,
              progress: 0,
              currentOperation: 'Initierar...'
            };
          }
          
          const current = updated[sync.id];
          if (current.progress < 95) {
            current.progress += Math.random() * 5;
            
            if (current.progress < 20) {
              current.currentOperation = 'Förbereder API-anrop...';
            } else if (current.progress < 40) {
              current.currentOperation = 'Hämtar data från API...';
            } else if (current.progress < 60) {
              current.currentOperation = 'Bearbetar data...';
            } else if (current.progress < 80) {
              current.currentOperation = 'Sparar till databas...';
            } else {
              current.currentOperation = 'Slutför synkronisering...';
            }
            
            const elapsed = Date.now() - new Date(sync.started_at).getTime();
            const estimatedTotal = (elapsed / current.progress) * 100;
            current.estimatedTimeRemaining = Math.max(0, estimatedTotal - elapsed);
          }
        });
        
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSyncs]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeRemaining = (ms?: number) => {
    if (!ms) return '';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s kvar`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Laddar synkroniseringsstatus...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Active Syncs */}
      {activeSyncs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <span>Aktiva synkroniseringar ({activeSyncs.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeSyncs.map((sync) => {
                const progress = syncProgress[sync.id];
                return (
                  <div key={sync.id} className="p-4 border rounded-lg bg-blue-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(sync.status)}
                        <span className="font-medium capitalize">{sync.sync_type}</span>
                        <Badge className="bg-blue-500">Pågår</Badge>
                      </div>
                      <span className="text-sm text-gray-600">
                        Startad: {new Date(sync.started_at).toLocaleTimeString('sv-SE')}
                      </span>
                    </div>
                    
                    {progress && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{progress.currentOperation}</span>
                          <span>{Math.round(progress.progress)}%</span>
                        </div>
                        <Progress value={progress.progress} className="w-full" />
                        {progress.estimatedTimeRemaining && (
                          <div className="text-xs text-gray-500">
                            {formatTimeRemaining(progress.estimatedTimeRemaining)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Senaste aktivitet</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentSyncs.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <p>Ingen recent aktivitet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSyncs.slice(0, 5).map((sync) => (
                <div key={sync.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(sync.status)}
                    <div>
                      <span className="font-medium capitalize">{sync.sync_type}</span>
                      <div className="text-sm text-gray-600">
                        {new Date(sync.started_at).toLocaleString('sv-SE')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={sync.status === 'completed' ? 'default' : 'destructive'}>
                      {sync.status === 'completed' ? 'Slutförd' : 'Misslyckad'}
                    </Badge>
                    {sync.completed_at && (
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round((new Date(sync.completed_at).getTime() - new Date(sync.started_at).getTime()) / 1000)}s
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Fel vid hämtning av synkroniseringsstatus: {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default RealTimeSyncMonitor;
