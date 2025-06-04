
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useProcessCleanup } from '@/hooks/useProcessCleanup';
import { useDataInitializer } from '@/hooks/useDataInitializer';
import { 
  Heart, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Trash2,
  Database,
  Download,
  Play
} from "lucide-react";

const SystemHealthMonitor: React.FC = () => {
  const { healthData, performHealthCheck, isChecking } = useHealthCheck();
  const { cleanupHangingProcesses, isCleaningUp } = useProcessCleanup();
  const { initializeAllData, initializeMemberData, initializeVoteData, isInitializing, progress } = useDataInitializer();

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'critical': return <AlertTriangle className="w-5 h-5" />;
      default: return <Heart className="w-5 h-5" />;
    }
  };

  const getLoadColor = (load: string) => {
    switch (load) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDataAge = (timestamp: string | null) => {
    if (!timestamp) return 'Ingen data';
    
    const now = new Date();
    const dataTime = new Date(timestamp);
    const diffHours = Math.round((now.getTime() - dataTime.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Nyligen uppdaterad';
    if (diffHours < 24) return `${diffHours}h sedan`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d sedan`;
  };

  const hasDataIssues = healthData?.issues.some(issue => 
    issue.includes('No') && issue.includes('data found')
  );

  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5" />
              <span>Systemhälsa</span>
            </div>
            <div className="flex items-center space-x-2">
              {healthData && (
                <Badge className={getHealthColor(healthData.status)}>
                  {getHealthIcon(healthData.status)}
                  <span className="ml-1 capitalize">{healthData.status}</span>
                </Badge>
              )}
              <Button 
                onClick={performHealthCheck} 
                disabled={isChecking}
                variant="outline" 
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                Uppdatera
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {healthData && (
            <div className="space-y-4">
              {/* Health Score */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Hälsopoäng</span>
                  <span className="font-medium">{healthData.score}/100</span>
                </div>
                <Progress value={healthData.score} className="h-2" />
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {healthData.metrics.activeProcesses}
                  </div>
                  <div className="text-sm text-gray-600">Aktiva processer</div>
                </div>
                
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {healthData.metrics.recentFailures}
                  </div>
                  <div className="text-sm text-gray-600">Fel (24h)</div>
                </div>
                
                <div className="text-center p-3 border rounded-lg">
                  <div className={`text-2xl font-bold`}>
                    <div className={`inline-block w-4 h-4 rounded-full ${getLoadColor(healthData.metrics.systemLoad)} mr-2`}></div>
                    {healthData.metrics.systemLoad}
                  </div>
                  <div className="text-sm text-gray-600">Systembelastning</div>
                </div>

                <div className="text-center p-3 border rounded-lg">
                  <Button 
                    onClick={cleanupHangingProcesses}
                    disabled={isCleaningUp}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Trash2 className={`w-4 h-4 mr-1 ${isCleaningUp ? 'animate-spin' : ''}`} />
                    Städa
                  </Button>
                </div>
              </div>

              {/* Data Freshness */}
              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <Database className="w-4 h-4 mr-2" />
                  Dataaktualitet
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(healthData.metrics.dataFreshness).map(([key, timestamp]) => (
                    <div key={key} className="text-center p-2 border rounded">
                      <div className="font-medium capitalize">{key}</div>
                      <div className="text-xs text-gray-600">{formatDataAge(timestamp)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Issues and Recommendations */}
              {healthData.issues.length > 0 && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-medium">Identifierade problem:</div>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {healthData.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                      {healthData.recommendations.length > 0 && (
                        <div className="mt-3">
                          <div className="font-medium">Rekommendationer:</div>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {healthData.recommendations.map((rec, index) => (
                              <li key={index}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Initialization Panel */}
      {hasDataIssues && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <Download className="w-5 h-5" />
              <span>Datainitialisering krävs</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-orange-700 mb-4">
              Systemet har identifierat saknad data. Använd knapparna nedan för att initiera datasynkronisering.
            </div>

            {isInitializing && (
              <div className="space-y-3">
                <div className="text-sm font-medium">{progress.currentStep}</div>
                <Progress value={(progress.completed / progress.total) * 100} className="h-2" />
                <div className="text-xs text-gray-600">
                  {progress.completed} av {progress.total} steg slutförda
                </div>
                {progress.errors.length > 0 && (
                  <div className="text-xs text-red-600">
                    {progress.errors.length} fel uppstod under initialiseringen
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button 
                onClick={initializeAllData}
                disabled={isInitializing}
                className="flex items-center space-x-2"
              >
                <Play className={`w-4 h-4 ${isInitializing ? 'animate-spin' : ''}`} />
                <span>Initiera all data</span>
              </Button>

              <Button 
                onClick={initializeMemberData}
                disabled={isInitializing}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Database className="w-4 h-4" />
                <span>Medlemsdata</span>
              </Button>

              <Button 
                onClick={initializeVoteData}
                disabled={isInitializing}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Database className="w-4 h-4" />
                <span>Röstningsdata</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SystemHealthMonitor;
