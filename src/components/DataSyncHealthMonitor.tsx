
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { enhancedDataSyncManager } from '../services/enhancedDataSyncManager';
import { 
  Activity, 
  Database, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  BarChart3,
  TrendingUp
} from "lucide-react";

interface HealthStatus {
  cacheStatus: string;
  dbConnection: boolean;
  avgResponseTime: number;
  errorRate: number;
}

const DataSyncHealthMonitor: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [processingStats, setProcessingStats] = useState({
    totalProcessed: 0,
    totalDuplicates: 0,
    totalErrors: 0,
    avgProcessingTime: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const checkHealth = async () => {
    setIsLoading(true);
    try {
      const health = await enhancedDataSyncManager.performHealthCheck();
      const stats = enhancedDataSyncManager.getProcessingStats();
      
      setHealthStatus(health);
      setProcessingStats(stats);
    } catch (error) {
      console.error('Failed to check health:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetStats = () => {
    enhancedDataSyncManager.resetStats();
    setProcessingStats({
      totalProcessed: 0,
      totalDuplicates: 0,
      totalErrors: 0,
      avgProcessingTime: 0
    });
  };

  const clearCache = () => {
    enhancedDataSyncManager.clearCache();
    checkHealth(); // Refresh status
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getConnectionStatus = () => {
    if (!healthStatus) return { color: 'gray', text: 'Okänd' };
    return healthStatus.dbConnection 
      ? { color: 'green', text: 'Ansluten' }
      : { color: 'red', text: 'Frånkopplad' };
  };

  const getErrorRateStatus = () => {
    if (!healthStatus) return { color: 'gray', text: 'Okänd' };
    if (healthStatus.errorRate === 0) return { color: 'green', text: 'Inga fel' };
    if (healthStatus.errorRate < 5) return { color: 'yellow', text: 'Låg' };
    if (healthStatus.errorRate < 15) return { color: 'orange', text: 'Medel' };
    return { color: 'red', text: 'Hög' };
  };

  const getResponseTimeStatus = () => {
    if (!healthStatus) return { color: 'gray', text: 'Okänd' };
    if (healthStatus.avgResponseTime < 100) return { color: 'green', text: 'Snabb' };
    if (healthStatus.avgResponseTime < 500) return { color: 'yellow', text: 'Normal' };
    if (healthStatus.avgResponseTime < 1000) return { color: 'orange', text: 'Långsam' };
    return { color: 'red', text: 'Mycket långsam' };
  };

  const connectionStatus = getConnectionStatus();
  const errorRateStatus = getErrorRateStatus();
  const responseTimeStatus = getResponseTimeStatus();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Datasynkronisering - Hälsomonitor</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={checkHealth}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="ml-2">Uppdatera</span>
              </Button>
              <Button 
                onClick={clearCache}
                variant="outline"
                size="sm"
              >
                Rensa Cache
              </Button>
              <Button 
                onClick={resetStats}
                variant="outline"
                size="sm"
              >
                Nollställ Statistik
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* System Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Database className={`w-5 h-5 text-${connectionStatus.color}-500`} />
                <span className="font-medium">Databasanslutning</span>
              </div>
              <Badge className={`bg-${connectionStatus.color}-500`}>
                {connectionStatus.text}
              </Badge>
              {healthStatus && (
                <div className="text-xs text-gray-500 mt-1">
                  {healthStatus.avgResponseTime}ms svarstid
                </div>
              )}
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Clock className={`w-5 h-5 text-${responseTimeStatus.color}-500`} />
                <span className="font-medium">Prestanda</span>
              </div>
              <Badge className={`bg-${responseTimeStatus.color}-500`}>
                {responseTimeStatus.text}
              </Badge>
              {processingStats.avgProcessingTime > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Ø {Math.round(processingStats.avgProcessingTime)}ms behandling
                </div>
              )}
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                {errorRateStatus.color === 'green' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className={`w-5 h-5 text-${errorRateStatus.color}-500`} />
                )}
                <span className="font-medium">Felfrekvens</span>
              </div>
              <Badge className={`bg-${errorRateStatus.color}-500`}>
                {errorRateStatus.text}
              </Badge>
              {healthStatus && (
                <div className="text-xs text-gray-500 mt-1">
                  {healthStatus.errorRate.toFixed(1)}%
                </div>
              )}
            </div>
          </div>

          {/* Cache Status */}
          {healthStatus && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-sm">Cache Status</span>
              </div>
              <div className="text-sm text-gray-600">
                {healthStatus.cacheStatus}
              </div>
            </div>
          )}

          {/* Processing Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {processingStats.totalProcessed.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Behandlade poster</div>
            </div>
            
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {processingStats.totalDuplicates.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Dubbletter filtrerade</div>
            </div>
            
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {processingStats.totalErrors}
              </div>
              <div className="text-xs text-gray-600">Fel påträffade</div>
            </div>
            
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {processingStats.avgProcessingTime > 0 
                  ? `${Math.round(processingStats.avgProcessingTime)}ms`
                  : '0ms'
                }
              </div>
              <div className="text-xs text-gray-600">Genomsnitt/operation</div>
            </div>
          </div>

          {/* Performance Insights */}
          {processingStats.totalProcessed > 0 && (
            <div className="p-4 border rounded-lg bg-blue-50">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-sm">Prestandainsikter</span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>
                  • Dupliceringseffektivitet: {processingStats.totalDuplicates > 0 
                    ? `${((processingStats.totalDuplicates / (processingStats.totalProcessed + processingStats.totalDuplicates)) * 100).toFixed(1)}% dubbletter förhindrades`
                    : 'Inga dubbletter detekterade'
                  }
                </div>
                <div>
                  • Framgångsfrekvens: {processingStats.totalErrors > 0 
                    ? `${(((processingStats.totalProcessed) / (processingStats.totalProcessed + processingStats.totalErrors)) * 100).toFixed(1)}%`
                    : '100%'
                  }
                </div>
                {processingStats.avgProcessingTime > 0 && (
                  <div>
                    • Genomsnittlig hastighet: {Math.round(1000 / processingStats.avgProcessingTime)} operationer/sekund
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataSyncHealthMonitor;
