
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Database,
  Users,
  Calendar,
  FileText,
  Vote,
  Settings,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  Square,
  Activity,
  TrendingUp,
  Clock,
  BarChart3
} from "lucide-react";

interface SyncProgress {
  isRunning: boolean;
  currentTable: string;
  tablesCompleted: number;
  totalTables: number;
  currentOperation: string;
  progress: number;
  logs: string[];
  errors: string[];
  startTime?: Date;
  estimatedTimeRemaining?: number;
}

const VALID_TABLES = [
  'enhanced_member_profiles',
  'calendar_data',
  'document_data',
  'language_analysis',
  'member_news',
  'party_data',
  'vote_data'
] as const;

const MasterSyncTool: React.FC = () => {
  const { toast } = useToast();
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    isRunning: false,
    currentTable: '',
    tablesCompleted: 0,
    totalTables: VALID_TABLES.length,
    currentOperation: '',
    progress: 0,
    logs: [],
    errors: []
  });

  const [systemStats, setSystemStats] = useState<any>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    loadSystemStats();
    loadLastSyncTime();
  }, []);

  const loadSystemStats = async () => {
    try {
      const stats = await Promise.all(VALID_TABLES.map(async (table) => {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        return {
          table,
          count: count || 0,
          error: error?.message
        };
      }));

      setSystemStats(stats);
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  const loadLastSyncTime = async () => {
    try {
      const { data, error } = await supabase
        .from('data_sync_log')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setLastSyncTime(data.created_at);
      }
    } catch (error) {
      console.error('Error loading last sync time:', error);
    }
  };

  const addLog = (message: string, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    
    setSyncProgress(prev => ({
      ...prev,
      logs: [...prev.logs.slice(-49), logMessage],
      errors: isError ? [...prev.errors, logMessage] : prev.errors
    }));
  };

  const updateProgress = (
    currentTable: string,
    tablesCompleted: number,
    currentOperation: string,
    progress: number
  ) => {
    setSyncProgress(prev => {
      const startTime = prev.startTime || new Date();
      const elapsed = Date.now() - startTime.getTime();
      const totalProgress = (tablesCompleted / VALID_TABLES.length) * 100 + (progress / VALID_TABLES.length);
      const estimatedTotal = totalProgress > 0 ? (elapsed / totalProgress) * 100 : 0;
      const estimatedTimeRemaining = Math.max(0, estimatedTotal - elapsed);

      return {
        ...prev,
        currentTable,
        tablesCompleted,
        currentOperation,
        progress: totalProgress,
        estimatedTimeRemaining: Math.round(estimatedTimeRemaining / 1000)
      };
    });
  };

  const runComprehensiveSync = async () => {
    if (syncProgress.isRunning) return;

    setSyncProgress(prev => ({
      ...prev,
      isRunning: true,
      currentTable: '',
      tablesCompleted: 0,
      currentOperation: 'Förbereder synkronisering...',
      progress: 0,
      logs: [],
      errors: [],
      startTime: new Date()
    }));

    addLog('🚀 Startar omfattande datasynkronisering');

    try {
      // Start with member profiles
      updateProgress('enhanced_member_profiles', 0, 'Synkroniserar medlemsprofiler...', 0);
      addLog('👥 Synkroniserar medlemsprofiler...');
      
      const { error: memberError } = await supabase.functions.invoke('fetch-comprehensive-data', {
        body: { dataType: 'members', batchSize: 50 }
      });

      if (memberError) {
        throw new Error(`Medlemssynkronisering misslyckades: ${memberError.message}`);
      }

      addLog('✅ Medlemsprofiler synkroniserade');
      updateProgress('enhanced_member_profiles', 1, 'Medlemsprofiler klara', 100);

      // Calendar data
      updateProgress('calendar_data', 1, 'Synkroniserar kalenderdata...', 0);
      addLog('📅 Synkroniserar kalenderdata...');
      
      const { error: calendarError } = await supabase.functions.invoke('fetch-comprehensive-data', {
        body: { dataType: 'calendar', batchSize: 100 }
      });

      if (calendarError) {
        addLog(`⚠️ Kalendersynkronisering varning: ${calendarError.message}`, true);
      } else {
        addLog('✅ Kalenderdata synkroniserad');
      }
      
      updateProgress('calendar_data', 2, 'Kalenderdata klar', 100);

      // Document data
      updateProgress('document_data', 2, 'Synkroniserar dokumentdata...', 0);
      addLog('📄 Synkroniserar dokumentdata...');
      
      const { error: documentError } = await supabase.functions.invoke('fetch-comprehensive-data', {
        body: { dataType: 'documents', batchSize: 100 }
      });

      if (documentError) {
        addLog(`⚠️ Dokumentsynkronisering varning: ${documentError.message}`, true);
      } else {
        addLog('✅ Dokumentdata synkroniserad');
      }
      
      updateProgress('document_data', 3, 'Dokumentdata klar', 100);

      // Party data
      updateProgress('party_data', 3, 'Synkroniserar partidata...', 0);
      addLog('🏛️ Synkroniserar partidata...');
      
      const { error: partyError } = await supabase.functions.invoke('fetch-party-data');

      if (partyError) {
        addLog(`⚠️ Partisynkronisering varning: ${partyError.message}`, true);
      } else {
        addLog('✅ Partidata synkroniserad');
      }
      
      updateProgress('party_data', 4, 'Partidata klar', 100);

      // Vote data
      updateProgress('vote_data', 4, 'Synkroniserar röstningsdata...', 0);
      addLog('🗳️ Synkroniserar röstningsdata...');
      
      const { error: voteError } = await supabase.functions.invoke('fetch-comprehensive-data', {
        body: { dataType: 'votes', batchSize: 50 }
      });

      if (voteError) {
        addLog(`⚠️ Röstningssynkronisering varning: ${voteError.message}`, true);
      } else {
        addLog('✅ Röstningsdata synkroniserad');
      }
      
      updateProgress('vote_data', 5, 'Röstningsdata klar', 100);

      // Final steps
      updateProgress('', 6, 'Uppdaterar systemstatistik...', 0);
      addLog('📊 Uppdaterar systemstatistik...');

      await loadSystemStats();
      await loadLastSyncTime();

      updateProgress('', 7, 'Synkronisering slutförd!', 100);
      addLog('🎉 Omfattande datasynkronisering slutförd framgångsrikt!');

      toast({
        title: "Synkronisering slutförd",
        description: `Alla databaser har synkroniserats framgångsrikt. ${syncProgress.errors.length > 0 ? `${syncProgress.errors.length} varningar rapporterade.` : ''}`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Okänt fel';
      addLog(`❌ Synkroniseringsfel: ${errorMessage}`, true);
      
      toast({
        title: "Synkroniseringsfel",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSyncProgress(prev => ({
        ...prev,
        isRunning: false,
        currentOperation: prev.errors.length > 0 ? 'Slutförd med varningar' : 'Slutförd framgångsrikt',
        progress: 100
      }));
    }
  };

  const stopSync = () => {
    setSyncProgress(prev => ({
      ...prev,
      isRunning: false,
      currentOperation: 'Synkronisering avbruten av användare',
    }));
    addLog('⏹️ Synkronisering avbruten av användare');
  };

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Control Panel Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Master Synkroniseringsverktyg</span>
            </div>
            <div className="flex items-center space-x-2">
              {syncProgress.isRunning ? (
                <Badge className="bg-blue-500">
                  <Activity className="w-3 h-3 mr-1 animate-pulse" />
                  Kör
                </Badge>
              ) : (
                <Badge variant="outline">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Redo
                </Badge>
              )}
              {lastSyncTime && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  Senast: {new Date(lastSyncTime).toLocaleString('sv-SE')}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="flex justify-center space-x-4 mb-6">
            <Button 
              onClick={runComprehensiveSync}
              disabled={syncProgress.isRunning}
              size="lg"
              className="px-8"
            >
              {syncProgress.isRunning ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Synkroniserar...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Starta fullständig synkronisering
                </>
              )}
            </Button>
            
            {syncProgress.isRunning && (
              <Button 
                onClick={stopSync}
                variant="destructive"
                size="lg"
              >
                <Square className="w-5 h-5 mr-2" />
                Stoppa
              </Button>
            )}
          </div>

          {/* Progress Section */}
          {syncProgress.isRunning && (
            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">{syncProgress.currentOperation}</span>
                <span className="text-sm text-gray-600">
                  {Math.round(syncProgress.progress)}%
                </span>
              </div>
              <Progress value={syncProgress.progress} className="w-full" />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Aktuell tabell:</span>
                  <span className="ml-2 font-medium">{syncProgress.currentTable || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Framsteg:</span>
                  <span className="ml-2 font-medium">
                    {syncProgress.tablesCompleted}/{syncProgress.totalTables} tabeller
                  </span>
                </div>
                {syncProgress.estimatedTimeRemaining && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Uppskattad tid kvar:</span>
                    <span className="ml-2 font-medium">
                      {formatTimeRemaining(syncProgress.estimatedTimeRemaining)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Summary */}
          {syncProgress.errors.length > 0 && (
            <Alert className="bg-yellow-50 border-yellow-200 mt-4">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                {syncProgress.errors.length} varningar under synkronisering. Se loggar för detaljer.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Tabs for detailed information */}
      <Tabs defaultValue="stats" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stats" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Systemstatistik</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Loggar</span>
            {syncProgress.logs.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {syncProgress.logs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Inställningar</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Databasstatistik</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {systemStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {systemStats.map((stat: any) => (
                    <div key={stat.table} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">
                          {stat.table.replace(/_/g, ' ')}
                        </span>
                        {stat.error ? (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {stat.error ? 'N/A' : stat.count.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {stat.error ? stat.error : 'poster'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Laddar systemstatistik...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Synkroniseringsloggar</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSyncProgress(prev => ({ ...prev, logs: [], errors: [] }))}
                  disabled={syncProgress.logs.length === 0}
                >
                  Rensa loggar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full rounded-md border p-4">
                {syncProgress.logs.length > 0 ? (
                  <div className="space-y-2">
                    {syncProgress.logs.map((log, index) => (
                      <div 
                        key={index} 
                        className={`text-sm font-mono p-2 rounded ${
                          syncProgress.errors.includes(log) 
                            ? 'bg-red-50 text-red-800 border border-red-200' 
                            : 'bg-gray-50 text-gray-800'
                        }`}
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Inga loggar att visa än. Starta en synkronisering för att se framsteg.
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Synkroniseringsinställningar</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Batchstorlekar</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Medlemsdata</span>
                        <input type="number" defaultValue="50" className="w-20 px-2 py-1 border rounded text-sm" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Dokument</span>
                        <input type="number" defaultValue="100" className="w-20 px-2 py-1 border rounded text-sm" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Kalenderdata</span>
                        <input type="number" defaultValue="100" className="w-20 px-2 py-1 border rounded text-sm" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium">Timeout-inställningar</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">API Timeout (s)</span>
                        <input type="number" defaultValue="30" className="w-20 px-2 py-1 border rounded text-sm" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Batch Delay (ms)</span>
                        <input type="number" defaultValue="1000" className="w-20 px-2 py-1 border rounded text-sm" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Max Retries</span>
                        <input type="number" defaultValue="3" className="w-20 px-2 py-1 border rounded text-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Automatisk synkronisering</h3>
                      <p className="text-sm text-gray-500">Aktivera schemalagd synkronisering</p>
                    </div>
                    <input type="checkbox" className="rounded" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MasterSyncTool;
