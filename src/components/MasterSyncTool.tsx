
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Database,
  Calendar,
  Users,
  FileText,
  Megaphone,
  Vote,
  Timer,
  BarChart3,
  Play,
  Pause,
  Loader2,
  ArrowDownCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EdgeFunctionTester } from '@/utils/edgeFunctionTester';

interface SyncStatus {
  endpoint: string;
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'error';
  message: string;
  startTime?: Date;
  endTime?: Date;
  recordsProcessed?: number;
  totalRecords?: number;
  error?: string;
}

interface SyncLogEntry {
  id: string;
  timestamp: Date;
  syncType: string;
  message: string;
  status: 'info' | 'success' | 'warning' | 'error';
  details?: any;
}

const SYNC_ENDPOINTS = [
  {
    id: 'comprehensive',
    name: 'Comprehensive Data',
    description: 'Fetch documents, members, speeches and votes',
    functionName: 'fetch-comprehensive-data',
    icon: Database,
    color: 'text-purple-600 bg-purple-100',
    priority: true
  },
  {
    id: 'calendar',
    name: 'Calendar Data',
    description: 'Fetch latest calendar events',
    functionName: 'fetch-calendar-data',
    icon: Calendar,
    color: 'text-blue-600 bg-blue-100'
  },
  {
    id: 'party',
    name: 'Party Data',
    description: 'Update party information and members',
    functionName: 'daily-party-data-sync',
    icon: Users,
    color: 'text-green-600 bg-green-100'
  },
  {
    id: 'toplists',
    name: 'Toplists',
    description: 'Generate cached toplists',
    functionName: 'fetch-toplists-data',
    icon: BarChart3,
    color: 'text-orange-600 bg-orange-100'
  }
];

const MasterSyncTool: React.FC = () => {
  const [syncStatuses, setSyncStatuses] = useState<Record<string, SyncStatus>>({});
  const [syncLog, setSyncLog] = useState<SyncLogEntry[]>([]);
  const [isFullSync, setIsFullSync] = useState(false);
  const [activeSyncs, setActiveSyncs] = useState<string[]>([]);
  const [masterProgress, setMasterProgress] = useState(0);
  const [lastSyncStats, setLastSyncStats] = useState<Record<string, any>>({});
  const { toast } = useToast();
  
  // Initialize sync statuses
  useEffect(() => {
    const initialStatuses: Record<string, SyncStatus> = {};
    SYNC_ENDPOINTS.forEach(endpoint => {
      initialStatuses[endpoint.id] = {
        endpoint: endpoint.id,
        progress: 0,
        status: 'pending',
        message: 'Not started'
      };
    });
    setSyncStatuses(initialStatuses);
    
    // Get last sync stats from database
    fetchLastSyncStats();
  }, []);
  
  // Update master progress when individual sync statuses change
  useEffect(() => {
    if (isFullSync && activeSyncs.length > 0) {
      const totalEndpoints = activeSyncs.length;
      const completedEndpoints = activeSyncs.filter(
        id => syncStatuses[id]?.status === 'completed'
      ).length;
      const progressSum = activeSyncs.reduce(
        (sum, id) => sum + (syncStatuses[id]?.progress || 0), 
        0
      );
      setMasterProgress(totalEndpoints > 0 ? Math.round(progressSum / totalEndpoints) : 0);
    }
  }, [syncStatuses, activeSyncs, isFullSync]);

  const fetchLastSyncStats = async () => {
    try {
      const { data, error } = await supabase
        .from('automated_sync_status')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data && data.length > 0) {
        const stats: Record<string, any> = {};
        data.forEach(entry => {
          if (!stats[entry.sync_type]) {
            stats[entry.sync_type] = {
              lastSync: entry.started_at,
              lastStatus: entry.status,
              stats: entry.stats
            };
          }
        });
        setLastSyncStats(stats);
        
        // Add log entries for previous syncs
        const logEntries: SyncLogEntry[] = data.map(entry => ({
          id: entry.id,
          timestamp: new Date(entry.started_at),
          syncType: entry.sync_type,
          message: `${entry.sync_type} sync ${entry.status}`,
          status: entry.status === 'completed' ? 'success' : entry.status === 'failed' ? 'error' : 'info',
          details: entry.stats
        }));
        setSyncLog(prev => [...logEntries, ...prev]);
      }
    } catch (error) {
      console.error('Error fetching sync stats:', error);
      addLogEntry('system', 'Failed to fetch previous sync statistics', 'error');
    }
  };
  
  const startSync = async (endpointId: string) => {
    // Reset the status for this endpoint
    setSyncStatuses(prev => ({
      ...prev,
      [endpointId]: {
        ...prev[endpointId],
        status: 'running',
        progress: 0,
        message: 'Starting...',
        startTime: new Date(),
        error: undefined
      }
    }));
    
    setActiveSyncs(prev => [...prev, endpointId]);
    
    const endpoint = SYNC_ENDPOINTS.find(e => e.id === endpointId);
    if (!endpoint) return;
    
    addLogEntry(endpointId, `Starting ${endpoint.name} synchronization`, 'info');
    
    try {
      // Setup polling for sync status
      const pollingInterval = setInterval(async () => {
        try {
          const { data, error } = await supabase
            .from('automated_sync_status')
            .select('*')
            .eq('sync_type', endpointId)
            .order('started_at', { ascending: false })
            .limit(1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            const status = data[0];
            
            // Calculate progress based on status
            let progress = 0;
            if (status.status === 'completed') {
              progress = 100;
              clearInterval(pollingInterval);
              
              setSyncStatuses(prev => ({
                ...prev,
                [endpointId]: {
                  ...prev[endpointId],
                  status: 'completed',
                  progress: 100,
                  message: 'Completed successfully',
                  endTime: new Date(status.completed_at || new Date()),
                  recordsProcessed: status.stats?.documents_stored || 
                                  status.stats?.members_processed || 
                                  status.stats?.calendar_events_stored || 0
                }
              }));
              
              addLogEntry(endpointId, `${endpoint.name} sync completed successfully`, 'success', status.stats);
              setActiveSyncs(prev => prev.filter(id => id !== endpointId));
              
              toast({
                title: `${endpoint.name} sync completed`,
                description: "Data has been updated successfully",
              });
            } else if (status.status === 'failed') {
              progress = 0;
              clearInterval(pollingInterval);
              
              setSyncStatuses(prev => ({
                ...prev,
                [endpointId]: {
                  ...prev[endpointId],
                  status: 'error',
                  progress: 0,
                  message: 'Sync failed',
                  endTime: new Date(status.completed_at || new Date()),
                  error: status.error_message || 'Unknown error'
                }
              }));
              
              addLogEntry(endpointId, `${endpoint.name} sync failed: ${status.error_message || 'Unknown error'}`, 'error');
              setActiveSyncs(prev => prev.filter(id => id !== endpointId));
              
              toast({
                title: `${endpoint.name} sync failed`,
                description: status.error_message || 'Unknown error',
                variant: "destructive"
              });
            } else if (status.status === 'running') {
              // Estimate progress based on time elapsed (simple estimate)
              const startTime = new Date(status.started_at).getTime();
              const currentTime = new Date().getTime();
              const elapsedMinutes = (currentTime - startTime) / (1000 * 60);
              
              // Assume most syncs take about 5-10 minutes to complete
              const estimatedProgress = Math.min(90, Math.round(elapsedMinutes / 10 * 100));
              
              setSyncStatuses(prev => ({
                ...prev,
                [endpointId]: {
                  ...prev[endpointId],
                  progress: estimatedProgress,
                  message: `Syncing... (${estimatedProgress}% estimated)`
                }
              }));
            }
          }
        } catch (error) {
          console.error(`Error polling status for ${endpointId}:`, error);
        }
      }, 3000); // Poll every 3 seconds
      
      // Start the actual sync
      const { data, error } = await supabase.functions.invoke(endpoint.functionName, {
        body: { 
          manual_trigger: true,
          triggered_by: 'master_sync_tool',
          debug: true
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Initial progress update
      setSyncStatuses(prev => ({
        ...prev,
        [endpointId]: {
          ...prev[endpointId],
          progress: 10,
          message: 'Processing data...'
        }
      }));
      
      addLogEntry(endpointId, `${endpoint.name} sync started successfully`, 'info');
      
    } catch (error) {
      console.error(`Error starting ${endpointId} sync:`, error);
      
      setSyncStatuses(prev => ({
        ...prev,
        [endpointId]: {
          ...prev[endpointId],
          status: 'error',
          progress: 0,
          message: 'Failed to start sync',
          error: error instanceof Error ? error.message : 'Unknown error',
          endTime: new Date()
        }
      }));
      
      addLogEntry(
        endpointId, 
        `Failed to start ${endpoint.name} sync: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        'error'
      );
      
      setActiveSyncs(prev => prev.filter(id => id !== endpointId));
      
      toast({
        title: `${endpoint.name} sync failed to start`,
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    }
  };
  
  const startFullSync = async () => {
    setIsFullSync(true);
    setMasterProgress(0);
    
    // Define the sequence of syncs (comprehensive first, then others)
    const syncSequence = [
      'comprehensive',
      'calendar',
      'party',
      'toplists'
    ];
    
    addLogEntry('system', 'Starting full system synchronization', 'info');
    
    toast({
      title: "Full synchronization started",
      description: "All data will be updated. This may take several minutes.",
    });
    
    // Reset all statuses
    const initialStatuses: Record<string, SyncStatus> = {};
    SYNC_ENDPOINTS.forEach(endpoint => {
      initialStatuses[endpoint.id] = {
        endpoint: endpoint.id,
        progress: 0,
        status: 'pending',
        message: 'Queued'
      };
    });
    setSyncStatuses(initialStatuses);
    
    // Start all syncs in sequence
    for (const endpointId of syncSequence) {
      await startSync(endpointId);
      
      // Wait for sync to complete or fail before starting the next one
      await new Promise<void>(resolve => {
        const checkInterval = setInterval(() => {
          const status = syncStatuses[endpointId]?.status;
          if (status === 'completed' || status === 'error') {
            clearInterval(checkInterval);
            resolve();
          }
        }, 3000);
      });
    }
    
    setIsFullSync(false);
    
    addLogEntry('system', 'Full system synchronization completed', 'success');
    
    toast({
      title: "Full synchronization completed",
      description: "All data has been updated successfully.",
    });
  };

  const addLogEntry = (syncType: string, message: string, status: 'info' | 'success' | 'warning' | 'error', details?: any) => {
    const newEntry: SyncLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(),
      syncType,
      message,
      status,
      details
    };
    
    setSyncLog(prev => [newEntry, ...prev]);
  };
  
  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString('sv-SE');
  };
  
  const formatDuration = (startTime?: Date, endTime?: Date) => {
    if (!startTime || !endTime) return 'N/A';
    
    const durationMs = endTime.getTime() - startTime.getTime();
    const seconds = Math.floor(durationMs / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  const getLastSyncInfo = (endpointId: string) => {
    const info = lastSyncStats[endpointId];
    if (!info) return 'Never';
    
    return `${new Date(info.lastSync).toLocaleString('sv-SE')} (${info.lastStatus})`;
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-200';
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-200';
    }
  };
  
  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'running': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-primary" />
            <span>Riksdagen Master Sync Tool</span>
            {isFullSync && (
              <Badge className="ml-2 bg-blue-500">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Full Sync Running
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            One tool to synchronize all data from Riksdagen API to your Supabase database
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isFullSync && (
            <div className="mb-6 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Master Progress</span>
                <span>{masterProgress}%</span>
              </div>
              <Progress 
                value={masterProgress} 
                indicatorColor="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                showPercentage
                labelPosition="inside"
                size="lg"
                aria-label="Master Sync Progress"
              />
            </div>
          )}
          
          <div className="mb-6">
            <div className="flex space-x-3 mb-4">
              <Button 
                onClick={startFullSync} 
                disabled={isFullSync || activeSyncs.length > 0}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isFullSync ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing All Data...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Full Sync
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline"
                onClick={fetchLastSyncStats}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Status
              </Button>
            </div>
            
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Important information</AlertTitle>
              <AlertDescription className="text-blue-700">
                Full sync process will fetch all data in sequence: Comprehensive data first (documents, members, speeches, votes), 
                then Calendar events, Party data, and finally generate Toplists. This operation may take several minutes to complete.
              </AlertDescription>
            </Alert>
          </div>
          
          <Tabs defaultValue="endpoints">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="endpoints">Sync Endpoints</TabsTrigger>
              <TabsTrigger value="log">Sync Log</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="endpoints" className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SYNC_ENDPOINTS.map((endpoint) => {
                  const status = syncStatuses[endpoint.id];
                  const Icon = endpoint.icon;
                  return (
                    <Card key={endpoint.id} className={`${endpoint.priority ? 'border-purple-200 bg-purple-50' : ''}`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`p-1.5 rounded-md ${endpoint.color}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <span>{endpoint.name}</span>
                          </div>
                          <Badge className={`${getStatusColor(status?.status || 'pending')} text-white`}>
                            {getStatusIndicator(status?.status || 'pending')}
                            <span className="ml-1">
                              {status?.status === 'running' ? 'Running' : 
                               status?.status === 'completed' ? 'Completed' : 
                               status?.status === 'error' ? 'Failed' : 'Ready'}
                            </span>
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {endpoint.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="space-y-3">
                          <Progress 
                            value={status?.progress || 0} 
                            indicatorColor={status?.status === 'error' ? 'bg-red-500' : undefined}
                            showPercentage
                            aria-label={`${endpoint.name} Progress`}
                          />
                          
                          <div className="text-xs text-muted-foreground">
                            {status?.message && (
                              <div className="mb-1">{status.message}</div>
                            )}
                            
                            {status?.error && (
                              <div className="text-red-500 mt-1">{status.error}</div>
                            )}
                            
                            {status?.startTime && status?.endTime && (
                              <div className="mt-1">
                                Duration: {formatDuration(status.startTime, status.endTime)}
                              </div>
                            )}
                            
                            <div className="mt-1">
                              Last sync: {getLastSyncInfo(endpoint.id)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button
                          onClick={() => startSync(endpoint.id)}
                          disabled={status?.status === 'running' || isFullSync}
                          size="sm"
                          className="w-full"
                          variant={endpoint.priority ? "default" : "outline"}
                        >
                          {status?.status === 'running' ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 h-3 w-3" />
                              Sync Now
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="log" className="pt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Synchronization Log</CardTitle>
                  <CardDescription>
                    Recent operations and their outcomes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {syncLog.length > 0 ? (
                        syncLog.map((entry) => {
                          const statusColors = {
                            info: 'bg-blue-100 text-blue-800 border-blue-200',
                            success: 'bg-green-100 text-green-800 border-green-200',
                            warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                            error: 'bg-red-100 text-red-800 border-red-200',
                          };
                          
                          const statusIcons = {
                            info: <Clock className="h-4 w-4" />,
                            success: <CheckCircle className="h-4 w-4" />,
                            warning: <AlertCircle className="h-4 w-4" />,
                            error: <AlertCircle className="h-4 w-4" />,
                          };
                          
                          return (
                            <div 
                              key={entry.id} 
                              className={`border rounded-md p-3 ${statusColors[entry.status]}`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex items-start space-x-2">
                                  <div className="mt-0.5">
                                    {statusIcons[entry.status]}
                                  </div>
                                  <div>
                                    <div className="font-medium">{entry.message}</div>
                                    <div className="text-xs opacity-90 mt-1">
                                      {formatTimestamp(entry.timestamp)} • {entry.syncType}
                                    </div>
                                  </div>
                                </div>
                                {entry.details && (
                                  <Badge variant="outline" className="text-xs">
                                    {entry.details.documents_stored || 
                                     entry.details.members_processed || 
                                     entry.details.speeches_processed ||
                                     entry.details.votes_processed ||
                                     entry.details.calendar_events_stored || 0} records
                                  </Badge>
                                )}
                              </div>
                              
                              {entry.details && Object.keys(entry.details).length > 0 && (
                                <div className="mt-2 text-xs grid grid-cols-2 gap-x-4 gap-y-1">
                                  {Object.entries(entry.details).map(([key, value]) => (
                                    key !== 'errors_count' && value !== 0 && (
                                      <div key={key} className="flex justify-between">
                                        <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                                        <span className="font-medium">{value as any}</span>
                                      </div>
                                    )
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No log entries available
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="stats" className="pt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">System Statistics</CardTitle>
                  <CardDescription>
                    Current data volumes in your database
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <SyncSystemStats />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const SyncSystemStats: React.FC = () => {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    setLoading(true);
    try {
      const tables = [
        'document_data',
        'member_data',
        'speech_data',
        'vote_data',
        'calendar_data',
        'party_data',
        'language_analysis',
        'member_news'
      ];
      
      const results = await Promise.all(
        tables.map(async (table) => {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
            
          return { table, count: count || 0, error };
        })
      );
      
      const statsData: Record<string, number> = {};
      for (const result of results) {
        statsData[result.table] = result.count;
      }
      
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statDisplayData = [
    { name: 'Documents', key: 'document_data', icon: FileText, color: 'bg-blue-100 text-blue-600' },
    { name: 'Members', key: 'member_data', icon: Users, color: 'bg-green-100 text-green-600' },
    { name: 'Speeches', key: 'speech_data', icon: Megaphone, color: 'bg-yellow-100 text-yellow-600' },
    { name: 'Votes', key: 'vote_data', icon: Vote, color: 'bg-purple-100 text-purple-600' },
    { name: 'Calendar Events', key: 'calendar_data', icon: Calendar, color: 'bg-red-100 text-red-600' },
    { name: 'Parties', key: 'party_data', icon: Users, color: 'bg-orange-100 text-orange-600' },
    { name: 'Language Analyses', key: 'language_analysis', icon: FileText, color: 'bg-cyan-100 text-cyan-600' },
    { name: 'Member News', key: 'member_news', icon: Megaphone, color: 'bg-lime-100 text-lime-600' }
  ];

  return (
    <div>
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statDisplayData.map(({ name, key, icon: Icon, color }) => (
            <div key={key} className="border rounded-lg p-4 text-center">
              <div className={`w-10 h-10 rounded-full ${color} mx-auto flex items-center justify-center`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-2 text-2xl font-bold">
                {stats[key]?.toLocaleString() || 0}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{name}</div>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-center mt-4">
        <Button variant="outline" size="sm" onClick={fetchSystemStats} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </Button>
      </div>
    </div>
  );
};

export default MasterSyncTool;
