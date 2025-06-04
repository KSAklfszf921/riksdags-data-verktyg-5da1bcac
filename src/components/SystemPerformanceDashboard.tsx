
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Server, 
  Database, 
  Activity, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from "lucide-react";

interface SystemMetrics {
  cpu: number;
  memory: number;
  database: {
    connections: number;
    queryTime: number;
    status: 'healthy' | 'warning' | 'error';
  };
  api: {
    responseTime: number;
    errorRate: number;
    requestsPerMinute: number;
  };
  uptime: string;
}

const SystemPerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 45,
    memory: 67,
    database: {
      connections: 12,
      queryTime: 245,
      status: 'healthy'
    },
    api: {
      responseTime: 156,
      errorRate: 2.1,
      requestsPerMinute: 847
    },
    uptime: '7d 14h 23m'
  });

  const [loading, setLoading] = useState(false);

  const refreshMetrics = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate updated metrics
    setMetrics(prev => ({
      ...prev,
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 100),
      database: {
        ...prev.database,
        queryTime: Math.floor(100 + Math.random() * 300)
      },
      api: {
        ...prev.api,
        responseTime: Math.floor(100 + Math.random() * 200),
        requestsPerMinute: Math.floor(500 + Math.random() * 500)
      }
    }));
    
    setLoading(false);
  };

  const getStatusColor = (value: number, thresholds: { warning: number, danger: number }) => {
    if (value >= thresholds.danger) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5" />
              <span>System Performance</span>
            </div>
            <Button 
              onClick={refreshMetrics} 
              disabled={loading}
              variant="outline" 
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Real-time system performance metrics and health monitoring
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className={`text-2xl font-bold ${getStatusColor(metrics.cpu, { warning: 70, danger: 90 })}`}>
                {metrics.cpu}%
              </div>
              <div className="text-sm text-gray-600">CPU Usage</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className={`text-2xl font-bold ${getStatusColor(metrics.memory, { warning: 80, danger: 95 })}`}>
                {metrics.memory}%
              </div>
              <div className="text-sm text-gray-600">Memory Usage</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{metrics.api.responseTime}ms</div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{metrics.uptime}</div>
              <div className="text-sm text-gray-600">System Uptime</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Database Performance</span>
              {getStatusBadge(metrics.database.status)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Active Connections</span>
              <span className="text-lg font-bold">{metrics.database.connections}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Avg Query Time</span>
              <span className="text-lg font-bold">{metrics.database.queryTime}ms</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${Math.min(metrics.database.connections * 5, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">Connection pool utilization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>API Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Requests/min</span>
              <span className="text-lg font-bold">{metrics.api.requestsPerMinute}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Error Rate</span>
              <span className={`text-lg font-bold ${getStatusColor(metrics.api.errorRate, { warning: 5, danger: 10 })}`}>
                {metrics.api.errorRate}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  metrics.api.errorRate > 10 ? 'bg-red-600' : 
                  metrics.api.errorRate > 5 ? 'bg-yellow-600' : 'bg-green-600'
                }`}
                style={{ width: `${Math.min(metrics.api.errorRate * 10, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">Error rate threshold</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Performance Trends</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Performance trend charts will be displayed here</p>
            <p className="text-sm">Historical data visualization coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemPerformanceDashboard;
