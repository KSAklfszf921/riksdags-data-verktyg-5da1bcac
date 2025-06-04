
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useSyncMonitor } from '@/hooks/useSyncMonitor';
import { 
  Settings, 
  Database, 
  Activity, 
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Zap
} from "lucide-react";
import EnhancedAdminDashboard from './EnhancedAdminDashboard';
import EnhancedTestRunner from './EnhancedTestRunner';
import ProcessMonitor from './ProcessMonitor';
import UnifiedDataSyncManager from './UnifiedDataSyncManager';
import DataQualityDashboard from './DataQualityDashboard';
import EnhancedAdminQuickActions from './EnhancedAdminQuickActions';

interface SystemMetrics {
  totalSyncs: number;
  activeSyncs: number;
  successRate: number;
  lastActivity?: string;
  systemHealth: 'healthy' | 'warning' | 'critical';
  dataFreshness: string;
}

const MasterAdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { activeSyncs, recentSyncs, loading, error, refreshStatus } = useSyncMonitor();
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    totalSyncs: 0,
    activeSyncs: 0,
    successRate: 0,
    systemHealth: 'healthy',
    dataFreshness: 'Laddar...'
  });
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Calculate system metrics based on sync data
  useEffect(() => {
    const completedSyncs = recentSyncs.filter(s => s.status === 'completed');
    const failedSyncs = recentSyncs.filter(s => s.status === 'failed');
    const totalRecent = completedSyncs.length + failedSyncs.length;
    
    const successRate = totalRecent > 0 ? (completedSyncs.length / totalRecent) * 100 : 100;
    
    // Determine system health
    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (error || failedSyncs.length > completedSyncs.length) {
      systemHealth = 'critical';
    } else if (activeSyncs.length > 3 || successRate < 80) {
      systemHealth = 'warning';
    }
    
    // Calculate data freshness
    const lastActivity = recentSyncs[0]?.completed_at || recentSyncs[0]?.started_at;
    let dataFreshness = 'Aldrig';
    if (lastActivity) {
      const timeDiff = Date.now() - new Date(lastActivity).getTime();
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours === 0) {
        dataFreshness = `${minutes} min sedan`;
      } else if (hours < 24) {
        dataFreshness = `${hours}h ${minutes}m sedan`;
      } else {
        const days = Math.floor(hours / 24);
        dataFreshness = `${days} dagar sedan`;
      }
    }

    setSystemMetrics({
      totalSyncs: recentSyncs.length,
      activeSyncs: activeSyncs.length,
      successRate,
      lastActivity,
      systemHealth,
      dataFreshness
    });
  }, [activeSyncs, recentSyncs, error]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refreshStatus();
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Frisk</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500"><AlertTriangle className="w-3 h-3 mr-1" />Varning</Badge>;
      case 'critical':
        return <Badge className="bg-red-500"><AlertTriangle className="w-3 h-3 mr-1" />Kritisk</Badge>;
      default:
        return <Badge variant="outline">Okänd</Badge>;
    }
  };

  const getTabBadge = (tabName: string) => {
    switch (tabName) {
      case 'sync':
        return activeSyncs.length > 0 ? (
          <Badge className="bg-blue-500 ml-2">{activeSyncs.length}</Badge>
        ) : null;
      case 'monitor':
        return systemMetrics.systemHealth !== 'healthy' ? (
          <Badge className="bg-red-500 ml-2">!</Badge>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* System Status Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Master Admin Panel</span>
              <span className="text-sm font-normal text-gray-500">v3.0</span>
            </div>
            <div className="flex items-center space-x-4">
              {getStatusBadge(systemMetrics.systemHealth)}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-green-50' : ''}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto-refresh: {autoRefresh ? 'På' : 'Av'}
              </Button>
              <Badge variant="outline">
                <Clock className="w-3 h-3 mr-1" />
                {systemMetrics.dataFreshness}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Unified kontrollpanel med förbättrad datahantering och kvalitetskontroll
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="text-center p-3 border rounded-lg bg-blue-50">
              <div className="text-xl font-bold text-blue-600">{systemMetrics.activeSyncs}</div>
              <div className="text-xs text-gray-600">Aktiva synk</div>
            </div>
            
            <div className="text-center p-3 border rounded-lg bg-green-50">
              <div className="text-xl font-bold text-green-600">{systemMetrics.totalSyncs}</div>
              <div className="text-xs text-gray-600">Totala synk</div>
            </div>
            
            <div className="text-center p-3 border rounded-lg bg-purple-50">
              <div className="text-xl font-bold text-purple-600">{systemMetrics.successRate.toFixed(1)}%</div>
              <div className="text-xs text-gray-600">Framgångsgrad</div>
            </div>
            
            <div className="text-center p-3 border rounded-lg bg-orange-50">
              <div className="text-xl font-bold text-orange-600">
                {recentSyncs.filter(s => s.status === 'completed').length}
              </div>
              <div className="text-xs text-gray-600">Slutförda</div>
            </div>

            <div className="text-center p-3 border rounded-lg bg-red-50">
              <div className="text-xl font-bold text-red-600">
                {recentSyncs.filter(s => s.status === 'failed').length}
              </div>
              <div className="text-xs text-gray-600">Misslyckade</div>
            </div>
          </div>
          
          {/* System Alerts */}
          {error && (
            <Alert className="bg-red-50 border-red-200 mb-4">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Systemfel: {error}
              </AlertDescription>
            </Alert>
          )}
          
          {activeSyncs.length > 5 && (
            <Alert className="bg-yellow-50 border-yellow-200 mb-4">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Många synkroniseringar körs samtidigt ({activeSyncs.length}). Detta kan påverka prestandan.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Main Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center">
            Data Sync
            {getTabBadge('sync')}
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center">
            Datakvalitet
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center">
            Övervakning
            {getTabBadge('monitor')}
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center">
            Testning
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="space-y-6">
            <EnhancedAdminDashboard />
            <EnhancedAdminQuickActions />
          </div>
        </TabsContent>

        <TabsContent value="sync">
          <UnifiedDataSyncManager />
        </TabsContent>

        <TabsContent value="quality">
          <DataQualityDashboard />
        </TabsContent>

        <TabsContent value="monitor">
          <ProcessMonitor />
        </TabsContent>

        <TabsContent value="testing">
          <EnhancedTestRunner />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MasterAdminPanel;
