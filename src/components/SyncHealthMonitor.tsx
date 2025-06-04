
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Activity, Database, Clock } from "lucide-react";

interface HealthMetrics {
  cpuUsage: number;
  memoryUsage: number;
  dbConnections: number;
  responseTime: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface SyncHealthMonitorProps {
  isActive: boolean;
}

const SyncHealthMonitor: React.FC<SyncHealthMonitorProps> = ({ isActive }) => {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    dbConnections: 0,
    responseTime: 0,
    status: 'healthy'
  });

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      // Simulate health metrics
      const cpu = Math.random() * 100;
      const memory = Math.random() * 100;
      const connections = Math.floor(Math.random() * 20);
      const responseTime = Math.random() * 1000;

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (cpu > 80 || memory > 85 || responseTime > 800) {
        status = 'critical';
      } else if (cpu > 60 || memory > 70 || responseTime > 500) {
        status = 'warning';
      }

      setHealthMetrics({
        cpuUsage: cpu,
        memoryUsage: memory,
        dbConnections: connections,
        responseTime,
        status
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive]);

  const getStatusColor = () => {
    switch (healthMetrics.status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="border-green-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Heart className="w-4 h-4 text-green-500" />
          Health Monitor
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <Badge variant={
            healthMetrics.status === 'healthy' ? 'default' :
            healthMetrics.status === 'warning' ? 'secondary' : 'destructive'
          } className="text-xs">
            {healthMetrics.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              CPU Usage
            </span>
            <span>{healthMetrics.cpuUsage.toFixed(1)}%</span>
          </div>
          <Progress value={healthMetrics.cpuUsage} className="h-1" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              Memory Usage
            </span>
            <span>{healthMetrics.memoryUsage.toFixed(1)}%</span>
          </div>
          <Progress value={healthMetrics.memoryUsage} className="h-1" />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1">
            <Database className="w-3 h-3" />
            DB Connections
          </span>
          <span>{healthMetrics.dbConnections}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Response Time
          </span>
          <span>{healthMetrics.responseTime.toFixed(0)}ms</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncHealthMonitor;
