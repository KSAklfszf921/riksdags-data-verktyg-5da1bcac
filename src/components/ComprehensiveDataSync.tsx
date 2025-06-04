
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { 
  Database, 
  Download, 
  Users, 
  Calendar, 
  FileText, 
  MessageSquare, 
  Vote,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Play,
  Pause
} from "lucide-react";

interface SyncProgress {
  endpoint: string;
  icon: React.ReactNode;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  recordsProcessed: number;
  totalRecords: number;
  errors: string[];
  startTime?: Date;
  endTime?: Date;
}

const ComprehensiveDataSync: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress[]>([
    {
      endpoint: 'member_data',
      icon: <Users className="w-4 h-4" />,
      status: 'pending',
      progress: 0,
      recordsProcessed: 0,
      totalRecords: 0,
      errors: []
    },
    {
      endpoint: 'calendar_data',
      icon: <Calendar className="w-4 h-4" />,
      status: 'pending',
      progress: 0,
      recordsProcessed: 0,
      totalRecords: 0,
      errors: []
    },
    {
      endpoint: 'document_data',
      icon: <FileText className="w-4 h-4" />,
      status: 'pending',
      progress: 0,
      recordsProcessed: 0,
      totalRecords: 0,
      errors: []
    },
    {
      endpoint: 'speech_data',
      icon: <MessageSquare className="w-4 h-4" />,
      status: 'pending',
      progress: 0,
      recordsProcessed: 0,
      totalRecords: 0,
      errors: []
    },
    {
      endpoint: 'vote_data',
      icon: <Vote className="w-4 h-4" />,
      status: 'pending',
      progress: 0,
      recordsProcessed: 0,
      totalRecords: 0,
      errors: []
    },
    {
      endpoint: 'party_data',
      icon: <Database className="w-4 h-4" />,
      status: 'pending',
      progress: 0,
      recordsProcessed: 0,
      totalRecords: 0,
      errors: []
    }
  ]);

  const [overallProgress, setOverallProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    let prefix = '';
    
    switch (type) {
      case 'success':
        prefix = '✅ ';
        break;
      case 'error':
        prefix = '❌ ';
        break;
      case 'warning':
        prefix = '⚠️ ';
        break;
      default:
        prefix = '📝 ';
        break;
    }
    
    const logMessage = `[${timestamp}] ${prefix}${message}`;
    setLogs(prev => [...prev.slice(-50), logMessage]);
    console.log(logMessage);
  };

  const updateSyncProgress = (endpointIndex: number, updates: Partial<SyncProgress>) => {
    setSyncProgress(prev => prev.map((item, index) => 
      index === endpointIndex ? { ...item, ...updates } : item
    ));
  };

  const syncEndpoint = async (endpointIndex: number) => {
    const endpoint = syncProgress[endpointIndex];
    
    try {
      updateSyncProgress(endpointIndex, { 
        status: 'running', 
        startTime: new Date(),
        progress: 0 
      });

      addLog(`Startar synkronisering av ${endpoint.endpoint}...`, 'info');

      // Anropa Supabase Edge Function för att synkronisera data
      const { data, error } = await supabase.functions.invoke('fetch-comprehensive-data', {
        body: { 
          endpoint: endpoint.endpoint,
          manual_trigger: true,
          full_sync: true
        }
      });

      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }

      // Simulera progress uppdateringar
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        updateSyncProgress(endpointIndex, { 
          progress: i,
          recordsProcessed: Math.floor((data?.estimated_records || 1000) * (i / 100))
        });
      }

      updateSyncProgress(endpointIndex, { 
        status: 'completed',
        endTime: new Date(),
        progress: 100,
        totalRecords: data?.total_processed || 0,
        recordsProcessed: data?.total_processed || 0
      });

      addLog(`✅ ${endpoint.endpoint} synkroniserad: ${data?.total_processed || 0} poster`, 'success');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Okänt fel';
      
      updateSyncProgress(endpointIndex, { 
        status: 'error',
        endTime: new Date(),
        errors: [errorMessage]
      });

      addLog(`❌ Fel vid synkronisering av ${endpoint.endpoint}: ${errorMessage}`, 'error');
    }
  };

  const startComprehensiveSync = async () => {
    setIsRunning(true);
    setLogs([]);
    
    // Återställ alla progress-indikatorer
    setSyncProgress(prev => prev.map(item => ({
      ...item,
      status: 'pending' as const,
      progress: 0,
      recordsProcessed: 0,
      totalRecords: 0,
      errors: [],
      startTime: undefined,
      endTime: undefined
    })));

    addLog('🚀 Startar omfattande datasynkronisering från data.riksdagen.se', 'info');

    try {
      // Synkronisera alla endpoints parallellt (men begränsat)
      const batchSize = 2; // Synkronisera 2 endpoints åt gången
      
      for (let i = 0; i < syncProgress.length; i += batchSize) {
        const batch = syncProgress.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map((_, batchIndex) => syncEndpoint(i + batchIndex))
        );
        
        // Uppdatera övergripande progress
        const completedCount = Math.min(i + batchSize, syncProgress.length);
        setOverallProgress((completedCount / syncProgress.length) * 100);
        
        // Kort paus mellan batches
        if (i + batchSize < syncProgress.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      addLog('🎉 Omfattande datasynkronisering slutförd!', 'success');
      toast.success('All data har synkroniserats framgångsrikt!');

    } catch (error) {
      addLog(`💥 Kritiskt fel under synkronisering: ${error}`, 'error');
      toast.error('Synkronisering misslyckades');
    } finally {
      setIsRunning(false);
      setOverallProgress(100);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusBadge = (item: SyncProgress) => {
    switch (item.status) {
      case 'running':
        return <Badge className="bg-blue-500">Kör</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Klar</Badge>;
      case 'error':
        return <Badge className="bg-red-500">Fel</Badge>;
      default:
        return <Badge variant="outline">Väntar</Badge>;
    }
  };

  const completedCount = syncProgress.filter(item => item.status === 'completed').length;
  const errorCount = syncProgress.filter(item => item.status === 'error').length;
  const totalRecordsProcessed = syncProgress.reduce((sum, item) => sum + item.recordsProcessed, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Omfattande Data Synkronisering</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={startComprehensiveSync}
                disabled={isRunning}
                size="lg"
                className="px-6"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Synkroniserar...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Starta Full Synkronisering
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Övergripande Progress */}
          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Övergripande Progress</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="w-full" />
            </div>
          )}

          {/* Sammanfattning */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg bg-white">
              <div className="text-2xl font-bold text-blue-600">{syncProgress.length}</div>
              <div className="text-xs text-gray-600">Endpoints</div>
            </div>
            
            <div className="text-center p-3 border rounded-lg bg-white">
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
              <div className="text-xs text-gray-600">Slutförda</div>
            </div>
            
            <div className="text-center p-3 border rounded-lg bg-white">
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <div className="text-xs text-gray-600">Fel</div>
            </div>
            
            <div className="text-center p-3 border rounded-lg bg-white">
              <div className="text-2xl font-bold text-purple-600">{totalRecordsProcessed.toLocaleString()}</div>
              <div className="text-xs text-gray-600">Poster</div>
            </div>
          </div>

          {/* Endpoint Progress */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Endpoint Status</h3>
            {syncProgress.map((item, index) => (
              <Card key={index} className="border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {item.icon}
                      <span className="font-medium">{item.endpoint}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(item.status)}
                      {getStatusBadge(item)}
                    </div>
                  </div>
                  
                  {item.status === 'running' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{item.recordsProcessed.toLocaleString()} poster</span>
                      </div>
                      <Progress value={item.progress} className="w-full h-2" />
                    </div>
                  )}
                  
                  {item.status === 'completed' && (
                    <div className="text-sm text-green-600">
                      ✅ {item.recordsProcessed.toLocaleString()} poster synkroniserade
                    </div>
                  )}
                  
                  {item.status === 'error' && item.errors.length > 0 && (
                    <div className="text-sm text-red-600">
                      ❌ {item.errors[0]}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Slutresultat */}
          {!isRunning && completedCount > 0 && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Synkronisering slutförd! {completedCount}/{syncProgress.length} endpoints lyckades. 
                Totalt {totalRecordsProcessed.toLocaleString()} poster behandlade.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Loggar */}
      {logs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2">
              <span>Synkroniseringslogg</span>
              <Badge variant="outline">{logs.length} händelser</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md max-h-60 overflow-y-auto">
              {logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`text-xs font-mono mb-1 ${
                    log.includes('❌') ? 'text-red-600' : 
                    log.includes('✅') ? 'text-green-600' : 
                    log.includes('⚠️') ? 'text-amber-600' : 
                    'text-gray-700'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ComprehensiveDataSync;
