
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Server, 
  Database, 
  Wifi, 
  HardDrive,
  Cpu,
  MemoryStick,
  Activity
} from "lucide-react";

interface SystemMetrics {
  apiStatus: 'healthy' | 'warning' | 'error';
  databaseStatus: 'healthy' | 'warning' | 'error';
  networkStatus: 'healthy' | 'warning' | 'error';
  diskUsage: number;
  cpuUsage: number;
  memoryUsage: number;
  uptime: string;
}

const SystemHealthOverview: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    apiStatus: 'healthy',
    databaseStatus: 'healthy',
    networkStatus: 'healthy',
    diskUsage: 45,
    cpuUsage: 23,
    memoryUsage: 67,
    uptime: '7d 14h 23m'
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return 'bg-red-500';
    if (usage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <span>Systemhälsa</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 border rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Server className="w-5 h-5" />
              <Badge className={getStatusColor(metrics.apiStatus)}>
                {metrics.apiStatus === 'healthy' ? 'Frisk' : 
                 metrics.apiStatus === 'warning' ? 'Varning' : 'Fel'}
              </Badge>
            </div>
            <span className="text-sm text-gray-600">API-tjänster</span>
          </div>

          <div className="text-center p-4 border rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Database className="w-5 h-5" />
              <Badge className={getStatusColor(metrics.databaseStatus)}>
                {metrics.databaseStatus === 'healthy' ? 'Frisk' : 
                 metrics.databaseStatus === 'warning' ? 'Varning' : 'Fel'}
              </Badge>
            </div>
            <span className="text-sm text-gray-600">Databas</span>
          </div>

          <div className="text-center p-4 border rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Wifi className="w-5 h-5" />
              <Badge className={getStatusColor(metrics.networkStatus)}>
                {metrics.networkStatus === 'healthy' ? 'Frisk' : 
                 metrics.networkStatus === 'warning' ? 'Varning' : 'Fel'}
              </Badge>
            </div>
            <span className="text-sm text-gray-600">Nätverk</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4" />
              <span className="text-sm font-medium">CPU-användning</span>
            </div>
            <span className="text-sm">{metrics.cpuUsage}%</span>
          </div>
          <Progress value={metrics.cpuUsage} className="h-2" />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MemoryStick className="w-4 h-4" />
              <span className="text-sm font-medium">Minnesanvändning</span>
            </div>
            <span className="text-sm">{metrics.memoryUsage}%</span>
          </div>
          <Progress value={metrics.memoryUsage} className="h-2" />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-4 h-4" />
              <span className="text-sm font-medium">Diskanvändning</span>
            </div>
            <span className="text-sm">{metrics.diskUsage}%</span>
          </div>
          <Progress value={metrics.diskUsage} className="h-2" />

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Systemdrifttid</span>
              <span className="text-sm text-gray-600">{metrics.uptime}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealthOverview;
