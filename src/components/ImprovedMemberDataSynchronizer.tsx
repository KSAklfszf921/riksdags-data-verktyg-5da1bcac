
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import SyncController from './SyncController';
import ProcessMonitor from './ProcessMonitor';
import { useSyncMonitor } from '@/hooks/useSyncMonitor';
import { 
  Database, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw 
} from "lucide-react";

const ImprovedMemberDataSynchronizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sync' | 'monitor' | 'status'>('sync');
  const { activeSyncs, error } = useSyncMonitor();

  const handleSyncComplete = () => {
    setActiveTab('status');
  };

  const handleSyncStart = () => {
    setActiveTab('monitor');
  };

  return (
    <div className="space-y-6">
      {/* Header with status overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Improved Member Data Synchronizer</span>
            </div>
            <div className="flex items-center space-x-2">
              {activeSyncs.length > 0 ? (
                <Badge className="bg-blue-500">
                  <Activity className="w-3 h-3 mr-1" />
                  {activeSyncs.length} Active
                </Badge>
              ) : (
                <Badge variant="outline">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Idle
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Improved Features:</strong>
              <ul className="mt-2 text-sm space-y-1">
                <li>• Automatic cleanup of hanging processes (30+ minutes)</li>
                <li>• Manual abort functionality for running syncs</li>
                <li>• Real-time process monitoring and status updates</li>
                <li>• Robust error handling with timeout protection</li>
                <li>• Progress tracking with heartbeat system</li>
              </ul>
            </AlertDescription>
          </Alert>

          {error && (
            <Alert className="bg-red-50 border-red-200 mt-4">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Monitor Error: {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Main interface */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sync" className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Sync Control</span>
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Process Monitor</span>
            {activeSyncs.length > 0 && (
              <Badge className="ml-1 bg-blue-500 text-white text-xs">
                {activeSyncs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>System Status</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sync" className="mt-6">
          <SyncController 
            onSyncComplete={handleSyncComplete}
            onSyncStart={handleSyncStart}
          />
        </TabsContent>

        <TabsContent value="monitor" className="mt-6">
          <ProcessMonitor />
        </TabsContent>

        <TabsContent value="status" className="mt-6">
          <SystemStatusCard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const SystemStatusCard: React.FC = () => {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // This would fetch actual system stats
      // For now, showing placeholder
      setStats({
        total_members: 349,
        active_members: 340,
        complete_profiles: 280,
        incomplete_profiles: 69,
        last_sync_hours_ago: 2
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStats();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>System Status</span>
          <Button onClick={fetchStats} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.total_members || 0}</div>
            <div className="text-sm text-gray-600">Total Members</div>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.active_members || 0}</div>
            <div className="text-sm text-gray-600">Active Members</div>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.complete_profiles || 0}</div>
            <div className="text-sm text-gray-600">Complete Profiles</div>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.incomplete_profiles || 0}</div>
            <div className="text-sm text-gray-600">Incomplete Profiles</div>
          </div>
          
          <div className="text-center p-4 border rounded-lg col-span-2 md:col-span-2">
            <div className="text-2xl font-bold text-gray-600">{stats.last_sync_hours_ago || 0}h</div>
            <div className="text-sm text-gray-600">Since Last Sync</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImprovedMemberDataSynchronizer;
