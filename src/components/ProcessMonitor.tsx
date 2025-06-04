
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSyncMonitor } from '@/hooks/useSyncMonitor';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  RefreshCw,
  StopCircle,
  Trash2
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
  
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [abortingSync, setAbortingSync] = useState<string | null>(null);

  const handleCleanupHangingSyncs = async () => {
    setCleanupLoading(true);
    try {
      const cleanedCount = await cleanupHangingSyncs();
      console.log(`Cleaned up ${cleanedCount} hanging syncs`);
    } catch (error) {
      console.error('Error cleaning hanging syncs:', error);
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleAbortSync = async (syncId: string) => {
    setAbortingSync(syncId);
    try {
      await abortSync(syncId);
      console.log(`Aborted sync: ${syncId}`);
    } catch (error) {
      console.error('Error aborting sync:', error);
    } finally {
      setAbortingSync(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-blue-500"><Activity className="w-3 h-3 mr-1" />Kör</Badge>;
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Klar</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Misslyckad</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Väntar</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  };

  // Helper function to safely extract stats
  const extractStats = (stats: any) => {
    if (!stats || typeof stats !== 'object') return null;
    
    return {
      processed_records: typeof stats.processed_records === 'number' ? stats.processed_records : 0,
      total_records: typeof stats.total_records === 'number' ? stats.total_records : 0,
      members_processed: typeof stats.members_processed === 'number' ? stats.members_processed : 0,
      documents_processed: typeof stats.documents_processed === 'number' ? stats.documents_processed : 0,
      speeches_processed: typeof stats.speeches_processed === 'number' ? stats.speeches_processed : 0,
      votes_processed: typeof stats.votes_processed === 'number' ? stats.votes_processed : 0
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Laddar processövervakning...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Processövervakning</span>
            <div className="flex items-center space-x-2">
              <Button onClick={refreshStatus} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Uppdatera
              </Button>
              <Button 
                onClick={handleCleanupHangingSyncs} 
                variant="outline" 
                size="sm"
                disabled={cleanupLoading}
              >
                {cleanupLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Rensa hängande
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert className="bg-red-50 border-red-200 mb-4">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Övervakningsfel: {error}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{activeSyncs.length}</div>
              <div className="text-sm text-gray-600">Aktiva processer</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{recentSyncs.filter(s => s.status === 'completed').length}</div>
              <div className="text-sm text-gray-600">Klara idag</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{recentSyncs.filter(s => s.status === 'failed').length}</div>
              <div className="text-sm text-gray-600">Misslyckade</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{recentSyncs.length}</div>
              <div className="text-sm text-gray-600">Totalt senaste</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Processes */}
      {activeSyncs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Aktiva processer ({activeSyncs.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeSyncs.map((sync) => {
                const stats = extractStats(sync.stats);
                const progress = stats && stats.total_records > 0 
                  ? Math.round((stats.processed_records / stats.total_records) * 100) 
                  : 0;

                return (
                  <div key={sync.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium capitalize">{sync.sync_type}</h4>
                        <p className="text-sm text-gray-600">
                          Startad: {new Date(sync.started_at).toLocaleString('sv-SE')}
                        </p>
                        <p className="text-sm text-gray-600">
                          Körtid: {formatDuration(sync.started_at)}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(sync.status)}
                        <Button
                          onClick={() => handleAbortSync(sync.id)}
                          disabled={abortingSync === sync.id}
                          variant="outline"
                          size="sm"
                        >
                          {abortingSync === sync.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <StopCircle className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {stats && (
                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-gray-600">
                          Progress: {stats.processed_records} / {stats.total_records} ({progress}%)
                        </div>
                        
                        {(stats.members_processed > 0 || stats.documents_processed > 0) && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <span>Ledamöter: {stats.members_processed}</span>
                            <span>Dokument: {stats.documents_processed}</span>
                            <span>Anföranden: {stats.speeches_processed}</span>
                            <span>Voteringar: {stats.votes_processed}</span>
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
            <Clock className="w-5 h-5" />
            <span>Senaste aktivitet</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentSyncs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ingen nylig aktivitet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSyncs.map((sync) => (
                <div key={sync.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="font-medium capitalize">{sync.sync_type}</span>
                      {getStatusBadge(sync.status)}
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <span>Startad: {new Date(sync.started_at).toLocaleString('sv-SE')}</span>
                      {sync.completed_at && (
                        <span className="ml-4">
                          Klar: {new Date(sync.completed_at).toLocaleString('sv-SE')}
                        </span>
                      )}
                    </div>
                    
                    {sync.error_message && (
                      <div className="text-sm text-red-600 mt-1">
                        Fel: {sync.error_message}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {sync.completed_at && formatDuration(sync.started_at, sync.completed_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcessMonitor;
