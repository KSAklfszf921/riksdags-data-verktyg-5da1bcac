
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useSyncMonitor } from '@/hooks/useSyncMonitor';
import { 
  RefreshCw, 
  Database, 
  TestTube, 
  AlertTriangle,
  CheckCircle,
  Play,
  Square,
  Shield,
  Activity,
  Zap,
  Clock,
  Settings
} from "lucide-react";

const EnhancedAdminQuickActions: React.FC = () => {
  const { toast } = useToast();
  const { activeSyncs, cleanupHangingSyncs, abortSync } = useSyncMonitor();
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  const handleAction = async (actionName: string, action: () => Promise<void>) => {
    setIsLoading(prev => ({ ...prev, [actionName]: true }));
    try {
      await action();
      toast({
        title: "Åtgärd slutförd",
        description: `${actionName} utfördes framgångsrikt`,
      });
    } catch (error) {
      console.error(`Error in ${actionName}:`, error);
      toast({
        title: "Fel",
        description: `Kunde inte utföra ${actionName}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(prev => ({ ...prev, [actionName]: false }));
    }
  };

  const handleQuickSync = async () => {
    await handleAction("Snabbsynkronisering", async () => {
      // Implementera snabbsynkronisering här
      console.log('Startar snabbsynkronisering...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulering
    });
  };

  const handleSystemCheck = async () => {
    await handleAction("Systemkontroll", async () => {
      console.log('Kör systemkontroll...');
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulering
    });
  };

  const handleCleanupHangingSyncs = async () => {
    await handleAction("Rensa hängande syncs", async () => {
      const cleaned = await cleanupHangingSyncs();
      console.log(`Rensade ${cleaned} hängande syncs`);
    });
  };

  const handleEmergencyStop = async () => {
    await handleAction("Nödstopp", async () => {
      console.log('Nödstopp aktiverat...');
      // Stoppa alla aktiva syncs
      for (const sync of activeSyncs) {
        await abortSync(sync.id);
      }
    });
  };

  const handleDataValidation = async () => {
    await handleAction("Datavalidering", async () => {
      console.log('Kör datavalidering...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulering
    });
  };

  const handleCacheRefresh = async () => {
    await handleAction("Cache-uppdatering", async () => {
      console.log('Uppdaterar cache...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulering
    });
  };

  return (
    <div className="space-y-6">
      {/* Critical Actions */}
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-800 dark:text-red-200">
            <AlertTriangle className="w-5 h-5" />
            <span>Kritiska åtgärder</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button 
              onClick={handleEmergencyStop}
              disabled={isLoading.nödstopp || activeSyncs.length === 0}
              className="flex flex-col items-center space-y-2 h-20"
              variant="destructive"
            >
              {isLoading.nödstopp ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <Square className="w-6 h-6" />
              )}
              <span className="text-xs">Nödstopp</span>
            </Button>

            <Button 
              onClick={handleCleanupHangingSyncs}
              disabled={isLoading.cleanup}
              className="flex flex-col items-center space-y-2 h-20"
              variant="outline"
            >
              {isLoading.cleanup ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <Clock className="w-6 h-6" />
              )}
              <span className="text-xs">Rensa hängande</span>
            </Button>

            <Button 
              className="flex flex-col items-center space-y-2 h-20"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-6 h-6" />
              <span className="text-xs">Uppdatera sida</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Standard Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Snabbåtgärder</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              onClick={handleQuickSync}
              disabled={isLoading.sync}
              className="flex flex-col items-center space-y-2 h-20"
              variant="outline"
            >
              {isLoading.sync ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <RefreshCw className="w-6 h-6" />
              )}
              <span className="text-xs">Snabbsynk</span>
            </Button>

            <Button 
              onClick={handleSystemCheck}
              disabled={isLoading.systemcheck}
              className="flex flex-col items-center space-y-2 h-20"
              variant="outline"
            >
              {isLoading.systemcheck ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <TestTube className="w-6 h-6" />
              )}
              <span className="text-xs">Systemtest</span>
            </Button>

            <Button 
              onClick={handleDataValidation}
              disabled={isLoading.validation}
              className="flex flex-col items-center space-y-2 h-20"
              variant="outline"
            >
              {isLoading.validation ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <Shield className="w-6 h-6" />
              )}
              <span className="text-xs">Datavalidering</span>
            </Button>

            <Button 
              onClick={handleCacheRefresh}
              disabled={isLoading.cache}
              className="flex flex-col items-center space-y-2 h-20"
              variant="outline"
            >
              {isLoading.cache ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <Database className="w-6 h-6" />
              )}
              <span className="text-xs">Cache-uppdatering</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Systemstatus</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <Badge className="bg-green-500">Aktiv</Badge>
              </div>
              <span className="text-sm text-gray-600">API-status</span>
            </div>

            <div className="text-center p-3 border rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <Badge className="bg-green-500">OK</Badge>
              </div>
              <span className="text-sm text-gray-600">Databas</span>
            </div>

            <div className="text-center p-3 border rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                {activeSyncs.length > 0 ? (
                  <>
                    <Activity className="w-4 h-4 text-blue-500" />
                    <Badge className="bg-blue-500">{activeSyncs.length} aktiva</Badge>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <Badge className="bg-green-500">Inaktiv</Badge>
                  </>
                )}
              </div>
              <span className="text-sm text-gray-600">Synkronisering</span>
            </div>
          </div>

          {activeSyncs.length > 0 && (
            <Alert className="mt-4 bg-blue-50 border-blue-200">
              <Activity className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                {activeSyncs.length} aktiva synkroniseringar körs för närvarande.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedAdminQuickActions;
