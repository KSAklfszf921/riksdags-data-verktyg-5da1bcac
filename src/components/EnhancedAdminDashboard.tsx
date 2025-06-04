
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSyncMonitor } from '@/hooks/useSyncMonitor';
import AdminQuickActions from './AdminQuickActions';
import SystemHealthOverview from './SystemHealthOverview';
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
  RefreshCw,
  TrendingUp
} from "lucide-react";

const EnhancedAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { activeSyncs, recentSyncs, loading, error } = useSyncMonitor();
  const [systemStats, setSystemStats] = useState<any>(null);

  useEffect(() => {
    const loadSystemStats = async () => {
      setSystemStats({
        totalMembers: 349,
        totalDocuments: 15420,
        totalVotes: 2847,
        activeSyncs: activeSyncs.length,
        lastSync: recentSyncs[0]?.started_at || null,
        systemHealth: activeSyncs.length === 0 ? 'healthy' : 'active',
        dataFreshness: '2 timmar sedan'
      });
    };
    
    loadSystemStats();
  }, [activeSyncs, recentSyncs]);

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Frisk</Badge>;
      case 'active':
        return <Badge className="bg-blue-500"><Activity className="w-3 h-3 mr-1" />Aktiv</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500"><AlertTriangle className="w-3 h-3 mr-1" />Varning</Badge>;
      default:
        return <Badge variant="outline">Okänd</Badge>;
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
              <span>Systemöversikt</span>
            </div>
            <div className="flex items-center space-x-4">
              {systemStats && getHealthBadge(systemStats.systemHealth)}
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Uppdatera
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Centraliserad administration och övervakning för alla systemoperationer
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{systemStats?.totalMembers || 0}</div>
              <div className="text-sm text-gray-600">Ledamöter</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{systemStats?.totalDocuments || 0}</div>
              <div className="text-sm text-gray-600">Dokument</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{systemStats?.totalVotes || 0}</div>
              <div className="text-sm text-gray-600">Voteringar</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{activeSyncs.length}</div>
              <div className="text-sm text-gray-600">Aktiva synk</div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {systemStats?.dataFreshness || 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Senaste uppdatering</div>
            </div>
          </div>
          
          {error && (
            <Alert className="bg-red-50 border-red-200 mt-4">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Systemfel: {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Main Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="actions">Snabbåtgärder</TabsTrigger>
          <TabsTrigger value="health">Systemhälsa</TabsTrigger>
          <TabsTrigger value="analytics">Analys</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SystemOverviewTab activeSyncs={activeSyncs} recentSyncs={recentSyncs} />
        </TabsContent>

        <TabsContent value="actions">
          <AdminQuickActions />
        </TabsContent>

        <TabsContent value="health">
          <SystemHealthOverview />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab />
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
          <span>Aktiva operationer</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeSyncs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <p>Inga aktiva operationer</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeSyncs.map((sync) => (
              <div key={sync.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <span className="font-medium capitalize">{sync.sync_type}</span>
                  <p className="text-sm text-gray-600">Startad: {new Date(sync.started_at).toLocaleTimeString('sv-SE')}</p>
                </div>
                <Badge className="bg-blue-500">Kör</Badge>
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
          <span>Senaste aktivitet</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentSyncs.slice(0, 5).map((sync) => (
            <div key={sync.id} className="flex items-center justify-between text-sm">
              <span className="capitalize">{sync.sync_type}</span>
              <div className="flex items-center space-x-2">
                <Badge variant={sync.status === 'completed' ? 'default' : 'destructive'}>
                  {sync.status === 'completed' ? 'Klar' : 'Misslyckad'}
                </Badge>
                <span className="text-gray-500">
                  {new Date(sync.started_at).toLocaleTimeString('sv-SE')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

const AnalyticsTab: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          <span>Systemtrender</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm">Synkroniseringar/dag</span>
            <span className="font-medium">12 ↗️</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Genomsnittlig svarstid</span>
            <span className="font-medium">145ms ↗️</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Felfrekvens</span>
            <span className="font-medium">0.8% ↘️</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Datavolym/dag</span>
            <span className="font-medium">2.3GB ↗️</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Resursanvändning</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>API-användning</span>
              <span>67%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '67%' }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Databaslast</span>
              <span>23%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '23%' }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Lagringsutrymme</span>
              <span>45%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default EnhancedAdminDashboard;
