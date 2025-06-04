
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSyncMonitor } from '@/hooks/useSyncMonitor';
import { 
  Shield, 
  Database, 
  Activity, 
  BarChart3, 
  Settings, 
  TestTube,
  Server,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from "lucide-react";

const EnhancedAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { activeSyncs, recentSyncs, loading, error } = useSyncMonitor();
  const [systemStats, setSystemStats] = useState<any>(null);

  useEffect(() => {
    // Load system stats
    const loadSystemStats = async () => {
      // This would be replaced with actual API calls
      setSystemStats({
        totalMembers: 349,
        activeSyncs: activeSyncs.length,
        lastSync: recentSyncs[0]?.started_at || null,
        systemHealth: activeSyncs.length === 0 ? 'healthy' : 'active'
      });
    };
    
    loadSystemStats();
  }, [activeSyncs, recentSyncs]);

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Healthy</Badge>;
      case 'active':
        return <Badge className="bg-blue-500"><Activity className="w-3 h-3 mr-1" />Active</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* System Overview Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Enhanced Admin Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              {systemStats && getHealthBadge(systemStats.systemHealth)}
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Centralized administration and monitoring for all system operations
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{systemStats?.totalMembers || 0}</div>
              <div className="text-sm text-gray-600">Total Members</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{activeSyncs.length}</div>
              <div className="text-sm text-gray-600">Active Syncs</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{recentSyncs.length}</div>
              <div className="text-sm text-gray-600">Recent Operations</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {systemStats?.lastSync ? '< 1h' : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Last Activity</div>
            </div>
          </div>
          
          {error && (
            <Alert className="bg-red-50 border-red-200 mt-4">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                System Error: {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Main Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sync">Data Sync</TabsTrigger>
          <TabsTrigger value="monitor">Monitor</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SystemOverviewTab activeSyncs={activeSyncs} recentSyncs={recentSyncs} />
        </TabsContent>

        <TabsContent value="sync">
          <DataSyncTab />
        </TabsContent>

        <TabsContent value="monitor">
          <MonitoringTab />
        </TabsContent>

        <TabsContent value="testing">
          <TestingTab />
        </TabsContent>

        <TabsContent value="database">
          <DatabaseTab />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const SystemOverviewTab: React.FC<{ activeSyncs: any[], recentSyncs: any[] }> = ({ activeSyncs, recentSyncs }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <span>Active Operations</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeSyncs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <p>No active operations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeSyncs.map((sync) => (
              <div key={sync.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <span className="font-medium capitalize">{sync.sync_type}</span>
                  <p className="text-sm text-gray-600">Started: {new Date(sync.started_at).toLocaleTimeString()}</p>
                </div>
                <Badge className="bg-blue-500">Running</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>Recent Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentSyncs.slice(0, 5).map((sync) => (
            <div key={sync.id} className="flex items-center justify-between text-sm">
              <span className="capitalize">{sync.sync_type}</span>
              <div className="flex items-center space-x-2">
                <Badge variant={sync.status === 'completed' ? 'default' : 'destructive'}>
                  {sync.status}
                </Badge>
                <span className="text-gray-500">
                  {new Date(sync.started_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

const DataSyncTab: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Data Synchronization Tools</CardTitle>
      <CardDescription>Manage all data synchronization operations</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-center py-8 text-gray-500">
        Data sync tools will be integrated here...
      </p>
    </CardContent>
  </Card>
);

const MonitoringTab: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>System Monitoring</CardTitle>
      <CardDescription>Real-time system performance and health monitoring</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-center py-8 text-gray-500">
        Monitoring dashboard will be integrated here...
      </p>
    </CardContent>
  </Card>
);

const TestingTab: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Testing Suite</CardTitle>
      <CardDescription>Comprehensive testing and validation tools</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-center py-8 text-gray-500">
        Testing tools will be integrated here...
      </p>
    </CardContent>
  </Card>
);

const DatabaseTab: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Database Management</CardTitle>
      <CardDescription>Database operations and maintenance tools</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-center py-8 text-gray-500">
        Database tools will be integrated here...
      </p>
    </CardContent>
  </Card>
);

const SettingsTab: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>System Configuration</CardTitle>
      <CardDescription>Manage system settings and configurations</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-center py-8 text-gray-500">
        Configuration tools will be integrated here...
      </p>
    </CardContent>
  </Card>
);

export default EnhancedAdminDashboard;
