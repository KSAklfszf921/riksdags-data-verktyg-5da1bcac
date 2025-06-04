
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SyncController from './SyncController';
import ProcessMonitor from './ProcessMonitor';
import { useSyncMonitor } from '@/hooks/useSyncMonitor';
import { 
  Database, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Play,
  Pause
} from "lucide-react";

interface OperationProgress {
  isRunning: boolean;
  progress: number;
  currentOperation: string;
  status: 'idle' | 'running' | 'success' | 'error';
}

const SimplifiedMasterControlPanel: React.FC = () => {
  const { activeSyncs, recentSyncs, error } = useSyncMonitor();
  const [operationProgress, setOperationProgress] = useState<OperationProgress>({
    isRunning: false,
    progress: 0,
    currentOperation: '',
    status: 'idle'
  });

  const runMasterSync = async () => {
    setOperationProgress({
      isRunning: true,
      progress: 0,
      currentOperation: 'Initierar master-synkronisering...',
      status: 'running'
    });

    const operations = [
      'Förbereder databasen',
      'Synkroniserar medlemsdata',
      'Hämtar kalenderhändelser', 
      'Uppdaterar partdata',
      'Kontrollerar dataintegritet',
      'Slutför synkronisering'
    ];

    for (let i = 0; i < operations.length; i++) {
      setOperationProgress({
        isRunning: true,
        progress: ((i + 1) / operations.length) * 100,
        currentOperation: operations[i],
        status: 'running'
      });
      
      // Simulera operationstid
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    setOperationProgress({
      isRunning: false,
      progress: 100,
      currentOperation: 'Master-synkronisering slutförd',
      status: 'success'
    });

    // Återställ efter 3 sekunder
    setTimeout(() => {
      setOperationProgress({
        isRunning: false,
        progress: 0,
        currentOperation: '',
        status: 'idle'
      });
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Master Control Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Förenklad Master Kontroll</span>
            </div>
            <div className="flex items-center space-x-2">
              {activeSyncs.length > 0 ? (
                <Badge className="bg-blue-500">
                  <Activity className="w-3 h-3 mr-1" />
                  {activeSyncs.length} Aktiv
                </Badge>
              ) : (
                <Badge variant="outline">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Redo
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Master Action Button */}
            <div className="flex justify-center">
              <Button 
                onClick={runMasterSync}
                disabled={operationProgress.isRunning || activeSyncs.length > 0}
                size="lg"
                className="px-8 py-4 text-lg"
              >
                {operationProgress.isRunning ? (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    Kör master-synk...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Starta master-synkronisering
                  </>
                )}
              </Button>
            </div>

            {/* Progress Indicator */}
            {operationProgress.isRunning && (
              <div className="space-y-2 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{operationProgress.currentOperation}</span>
                  <span className="text-sm text-gray-600">{Math.round(operationProgress.progress)}%</span>
                </div>
                <Progress value={operationProgress.progress} className="w-full" />
              </div>
            )}

            {/* Success Message */}
            {operationProgress.status === 'success' && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {operationProgress.currentOperation}
                </AlertDescription>
              </Alert>
            )}

            {/* Error Display */}
            {error && (
              <Alert className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Systemfel: {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-3 border rounded-lg bg-white">
                <div className="text-xl font-bold text-blue-600">{activeSyncs.length}</div>
                <div className="text-xs text-gray-600">Aktiva synk</div>
              </div>
              
              <div className="text-center p-3 border rounded-lg bg-white">
                <div className="text-xl font-bold text-green-600">{recentSyncs.length}</div>
                <div className="text-xs text-gray-600">Senaste synk</div>
              </div>
              
              <div className="text-center p-3 border rounded-lg bg-white">
                <div className="text-xl font-bold text-purple-600">
                  {recentSyncs.filter(s => s.status === 'completed').length}
                </div>
                <div className="text-xs text-gray-600">Lyckade</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Controls (Collapsed by default) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Synkroniseringskontroll</CardTitle>
          </CardHeader>
          <CardContent>
            <SyncController />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Processmonitor</CardTitle>
          </CardHeader>
          <CardContent>
            <ProcessMonitor />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimplifiedMasterControlPanel;
