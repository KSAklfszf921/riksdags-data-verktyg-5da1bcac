
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSyncMonitor } from '@/hooks/useSyncMonitor';
import { 
  Activity, 
  Database, 
  Server, 
  Wifi, 
  HardDrive,
  Cpu,
  MemoryStick,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown
} from "lucide-react";

interface SystemMetrics {
  cpu: number;
  memory: number;
  storage: number;
  uptime: string;
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  lastHealthCheck: string;
}

const SystemHealthDashboard: React.FC = () => {
  const { activeSyncs, recentSyncs } = useSyncMonitor();
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 45,
    memory: 62,
    storage: 38,
    uptime: '15d 7h 23m',
    requestsPerMinute: 847,
    averageResponseTime: 142,
    errorRate: 0.8,
    lastHealthCheck: new Date().toLocaleTimeString('sv-SE')
  });

  const [healthStatus, setHealthStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy');

  useEffect(() => {
    // Simulera realtidsuppdateringar av systemmetriker
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: Math.max(0, Math.min(100, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(0, Math.min(100, prev.memory + (Math.random() - 0.5) * 5)),
        requestsPerMinute: Math.max(0, prev.requestsPerMinute + Math.floor((Math.random() - 0.5) * 100)),
        averageResponseTime: Math.max(50, prev.averageResponseTime + (Math.random() - 0.5) * 20),
        errorRate: Math.max(0, Math.min(5, prev.errorRate + (Math.random() - 0.5) * 0.5)),
        lastHealthCheck: new Date().toLocaleTimeString('sv-SE')
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Bestäm hälsostatus baserat på metriker
    if (metrics.cpu > 80 || metrics.memory > 85 || metrics.errorRate > 2) {
      setHealthStatus('critical');
    } else if (metrics.cpu > 60 || metrics.memory > 70 || metrics.errorRate > 1) {
      setHealthStatus('warning');
    } else {
      setHealthStatus('healthy');
    }
  }, [metrics]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const recentFailures = recentSyncs.filter(sync => sync.status === 'failed').length;
  const successRate = recentSyncs.length > 0 ? 
    ((recentSyncs.length - recentFailures) / recentSyncs.length) * 100 : 100;

  return (
    <div className="space-y-6">
      {/* Overall Health Status */}
      <Card className={`border-2 ${
        healthStatus === 'healthy' ? 'border-green-200 bg-green-50' :
        healthStatus === 'warning' ? 'border-yellow-200 bg-yellow-50' :
        'border-red-200 bg-red-50'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-6 h-6" />
              <span>Systemhälsa</span>
            </div>
            <Badge className={getStatusColor(healthStatus)}>
              {getStatusIcon(healthStatus)}
              <span className="ml-1 capitalize">{healthStatus}</span>
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{activeSyncs.length}</div>
              <div className="text-sm text-gray-600">Aktiva processer</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.uptime}</div>
              <div className="text-sm text-gray-600">Systemtid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Framgångsgrad</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.requestsPerMinute}</div>
              <div className="text-sm text-gray-600">Förfrågningar/min</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Cpu className="w-5 h-5" />
              <span>CPU-användning</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Aktuell belastning</span>
                <span className="font-medium">{metrics.cpu.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.cpu} className="w-full" />
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                {metrics.cpu > 70 ? (
                  <TrendingUp className="w-3 h-3 text-red-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                )}
                <span>Senaste timmen</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MemoryStick className="w-5 h-5" />
              <span>Minnesanvändning</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Använt minne</span>
                <span className="font-medium">{metrics.memory.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.memory} className="w-full" />
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                {metrics.memory > 80 ? (
                  <TrendingUp className="w-3 h-3 text-red-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                )}
                <span>4.2 GB / 8 GB</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HardDrive className="w-5 h-5" />
              <span>Lagringsutrymme</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Använt utrymme</span>
                <span className="font-medium">{metrics.storage.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.storage} className="w-full" />
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <HardDrive className="w-3 h-3" />
                <span>38 GB / 100 GB</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="w-5 h-5" />
            <span>Prestandametriker</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{metrics.averageResponseTime.toFixed(0)}ms</div>
              <div className="text-sm text-gray-600">Svarstid (snitt)</div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.averageResponseTime > 200 ? '↗️ Hög' : '↘️ Normal'}
              </div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{metrics.errorRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Felfrekvens</div>
              <div className="text-xs text-gray-500 mt-1">
                {metrics.errorRate > 1 ? '↗️ Över gräns' : '↘️ Normal'}
              </div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{recentSyncs.length}</div>
              <div className="text-sm text-gray-600">Senaste operationer</div>
              <div className="text-xs text-gray-500 mt-1">Senaste 24h</div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{metrics.lastHealthCheck}</div>
              <div className="text-sm text-gray-600">Senaste kontroll</div>
              <div className="text-xs text-gray-500 mt-1">Automatisk</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts and Warnings */}
      {(healthStatus === 'warning' || healthStatus === 'critical') && (
        <Alert className={healthStatus === 'critical' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}>
          <AlertTriangle className={`h-4 w-4 ${healthStatus === 'critical' ? 'text-red-600' : 'text-yellow-600'}`} />
          <AlertDescription className={healthStatus === 'critical' ? 'text-red-800' : 'text-yellow-800'}>
            {healthStatus === 'critical' ? 
              'Kritiska systemvarningar upptäckta. Omedelbar åtgärd rekommenderas.' :
              'Systemvarningar upptäckta. Övervakning rekommenderas.'
            }
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SystemHealthDashboard;
