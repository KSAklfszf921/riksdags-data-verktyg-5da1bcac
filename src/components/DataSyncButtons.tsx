
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSyncMonitor } from '@/hooks/useSyncMonitor';
import RealTimeSyncMonitor from './RealTimeSyncMonitor';
import { 
  RefreshCw, 
  Database, 
  Users, 
  Calendar, 
  FileText, 
  Vote, 
  PartyPopper,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SyncButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  functionName: string;
  payload?: any;
  variant?: 'default' | 'outline' | 'destructive';
  estimatedDuration?: string;
}

interface SyncMetrics {
  totalProcessed: number;
  successRate: number;
  avgDuration: number;
  lastSuccessful?: string;
}

const DataSyncButtons: React.FC = () => {
  const { activeSyncs, recentSyncs, refreshStatus } = useSyncMonitor();
  const [syncingStates, setSyncingStates] = useState<Record<string, boolean>>({});
  const [lastSyncResults, setLastSyncResults] = useState<Record<string, any>>({});
  const [syncMetrics, setSyncMetrics] = useState<Record<string, SyncMetrics>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Beräkna metrics från recent syncs
  useEffect(() => {
    const metrics: Record<string, SyncMetrics> = {};
    
    syncButtons.forEach(button => {
      const buttonKey = button.title.replace(/\s+/g, '_').toLowerCase();
      const syncType = button.functionName === 'fetch-comprehensive-data' 
        ? `comprehensive_${button.payload?.dataType}`
        : button.functionName.replace('fetch-', '').replace('-data', '');
      
      const relevantSyncs = recentSyncs.filter(sync => 
        sync.sync_type.includes(syncType) || 
        sync.sync_type.includes(button.payload?.dataType || '')
      );
      
      if (relevantSyncs.length > 0) {
        const completed = relevantSyncs.filter(s => s.status === 'completed');
        const totalProcessed = relevantSyncs.reduce((acc, sync) => {
          const stats = sync.stats as any;
          return acc + (stats?.processed || 0);
        }, 0);
        
        const avgDuration = relevantSyncs
          .filter(s => s.completed_at)
          .reduce((acc, sync) => {
            const duration = new Date(sync.completed_at!).getTime() - new Date(sync.started_at).getTime();
            return acc + duration;
          }, 0) / Math.max(1, completed.length);

        metrics[buttonKey] = {
          totalProcessed,
          successRate: (completed.length / relevantSyncs.length) * 100,
          avgDuration: avgDuration / 1000, // Convert to seconds
          lastSuccessful: completed[0]?.completed_at
        };
      }
    });
    
    setSyncMetrics(metrics);
  }, [recentSyncs]);

  const handleSync = async (functionName: string, payload: any = {}, buttonKey: string) => {
    setSyncingStates(prev => ({ ...prev, [buttonKey]: true }));
    
    try {
      console.log(`🚀 Starting sync: ${functionName}`, payload);
      toast.info(`Startar ${buttonKey}...`);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });

      if (error) {
        throw error;
      }

      console.log(`✅ Sync completed: ${functionName}`, data);
      
      setLastSyncResults(prev => ({ 
        ...prev, 
        [buttonKey]: { 
          success: true, 
          timestamp: new Date().toISOString(),
          data 
        } 
      }));
      
      toast.success(`${buttonKey} slutförd framgångsrikt!`);
      
      // Refresh status efter en kort fördröjning
      setTimeout(refreshStatus, 1000);
    } catch (error) {
      console.error(`❌ Sync failed: ${functionName}`, error);
      
      setLastSyncResults(prev => ({ 
        ...prev, 
        [buttonKey]: { 
          success: false, 
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Okänt fel'
        } 
      }));
      
      toast.error(`${buttonKey} misslyckades: ${error instanceof Error ? error.message : 'Okänt fel'}`);
    } finally {
      setSyncingStates(prev => ({ ...prev, [buttonKey]: false }));
    }
  };

  const syncButtons: SyncButtonProps[] = [
    {
      icon: <Users className="w-4 h-4" />,
      title: "Synkronisera Ledamöter",
      description: "Hämta och uppdatera all ledamotsinformation",
      functionName: "fetch-comprehensive-data",
      payload: { dataType: "members" },
      estimatedDuration: "2-3 min"
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      title: "Synkronisera Kalender",
      description: "Uppdatera kalenderhändelser och möten",
      functionName: "fetch-comprehensive-data",
      payload: { dataType: "calendar" },
      estimatedDuration: "1-2 min"
    },
    {
      icon: <FileText className="w-4 h-4" />,
      title: "Synkronisera Dokument",
      description: "Hämta nya dokument och propositioner",
      functionName: "fetch-comprehensive-data",
      payload: { dataType: "documents" },
      estimatedDuration: "5-10 min"
    },
    {
      icon: <Vote className="w-4 h-4" />,
      title: "Synkronisera Voteringar",
      description: "Uppdatera röstningsdata och resultat",
      functionName: "fetch-comprehensive-data",
      payload: { dataType: "votes" },
      estimatedDuration: "3-5 min"
    },
    {
      icon: <PartyPopper className="w-4 h-4" />,
      title: "Synkronisera Partier",
      description: "Uppdatera partiinformation och medlemmar",
      functionName: "fetch-party-data",
      estimatedDuration: "1-2 min"
    }
  ];

  const runAllSyncs = async () => {
    toast.info("🚀 Startar fullständig datasynkronisering...");
    
    for (const button of syncButtons) {
      const buttonKey = button.title.replace(/\s+/g, '_').toLowerCase();
      
      // Kontrollera om det redan körs
      const isAlreadyRunning = activeSyncs.some(sync => 
        sync.sync_type.includes(button.payload?.dataType || button.functionName)
      );
      
      if (isAlreadyRunning) {
        toast.warning(`${button.title} körs redan, hoppar över...`);
        continue;
      }
      
      await handleSync(button.functionName, button.payload, buttonKey);
      
      // Kort paus mellan syncs
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    toast.success("🎉 Fullständig datasynkronisering påbörjad!");
  };

  const isAnyActive = Object.values(syncingStates).some(Boolean) || activeSyncs.length > 0;

  const getLastSyncStatus = (buttonKey: string) => {
    const result = lastSyncResults[buttonKey];
    const metrics = syncMetrics[buttonKey];
    
    return (
      <div className="mt-2 space-y-1">
        {result && (
          <Badge variant={result.success ? 'default' : 'destructive'} className="text-xs">
            {result.success ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Senast: {new Date(result.timestamp).toLocaleString('sv-SE')}
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3 mr-1" />
                Fel: {new Date(result.timestamp).toLocaleString('sv-SE')}
              </>
            )}
          </Badge>
        )}
        
        {metrics && showAdvanced && (
          <div className="text-xs text-gray-600 space-y-1">
            <div>Processade: {metrics.totalProcessed}</div>
            <div>Framgångsgrad: {metrics.successRate.toFixed(1)}%</div>
            <div>Snitt-tid: {metrics.avgDuration.toFixed(0)}s</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Avancerad Datasynkronisering</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Settings className="w-4 h-4 mr-2" />
                {showAdvanced ? 'Dölj' : 'Visa'} detaljer
              </Button>
              <Button 
                onClick={runAllSyncs}
                disabled={isAnyActive}
                className="flex items-center space-x-2"
              >
                {isAnyActive ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Synkronisering pågår...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Synkronisera Allt</span>
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Förbättrad datasynkronisering med realtidsövervakning och automatisk felhantering. 
              Varje synkronisering kan ta flera minuter att slutföra.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {syncButtons.map((button) => {
              const buttonKey = button.title.replace(/\s+/g, '_').toLowerCase();
              const isLoading = syncingStates[buttonKey];
              const isActiveInSystem = activeSyncs.some(sync => 
                sync.sync_type.includes(button.payload?.dataType || button.functionName)
              );
              
              return (
                <Card key={buttonKey} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {button.icon}
                          <h3 className="font-medium text-sm">{button.title}</h3>
                        </div>
                        <div className="flex items-center space-x-1">
                          {(isLoading || isActiveInSystem) && (
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                          )}
                          {isActiveInSystem && (
                            <Badge className="bg-blue-500 text-xs">Live</Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600">{button.description}</p>
                      
                      {showAdvanced && button.estimatedDuration && (
                        <div className="text-xs text-blue-600">
                          ⏱️ Uppskattat: {button.estimatedDuration}
                        </div>
                      )}
                      
                      <Button
                        onClick={() => handleSync(button.functionName, button.payload, buttonKey)}
                        disabled={isLoading || isActiveInSystem}
                        variant={button.variant || "outline"}
                        size="sm"
                        className="w-full"
                      >
                        {isLoading || isActiveInSystem ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                            {isActiveInSystem ? 'Synkroniserar...' : 'Startar...'}
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3 mr-2" />
                            Synkronisera
                          </>
                        )}
                      </Button>
                      
                      {getLastSyncStatus(buttonKey)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Real-time Monitor */}
      <RealTimeSyncMonitor />
    </div>
  );
};

export default DataSyncButtons;
