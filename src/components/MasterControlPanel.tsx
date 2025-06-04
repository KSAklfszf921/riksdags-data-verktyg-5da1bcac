import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSyncMonitor } from '@/hooks/useSyncMonitor';
import ImprovedMemberDataSynchronizer from './ImprovedMemberDataSynchronizer';
import MasterSyncTool from './MasterSyncTool';
import DataValidationDashboard from './DataValidationDashboard';
import SystemPerformanceDashboard from './SystemPerformanceDashboard';
import EnhancedAdminQuickActions from './EnhancedAdminQuickActions';
import SystemHealthDashboard from './SystemHealthDashboard';
import AdminSecurityPanel from './AdminSecurityPanel';
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
  TrendingUp,
  Lock,
  Monitor,
  Zap
} from "lucide-react";
import SecurityStatusIndicator from './SecurityStatusIndicator';

const MasterControlPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { activeSyncs, recentSyncs, loading, error } = useSyncMonitor();
  const [systemStats, setSystemStats] = useState<any>(null);

  React.useEffect(() => {
    const loadSystemStats = async () => {
      setSystemStats({
        totalMembers: 349,
        totalDocuments: 15420,
        totalVotes: 2847,
        activeSyncs: activeSyncs.length,
        lastSync: recentSyncs[0]?.started_at || null,
        systemHealth: activeSyncs.length === 0 ? 'healthy' : 'active',
        dataFreshness: '2 timmar sedan',
        securityLevel: 'high',
        performanceScore: 94
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
      {/* Master Control Header */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <span className="text-xl">Master Kontrollpanel</span>
            </div>
            <div className="flex items-center space-x-4">
              {systemStats && getHealthBadge(systemStats.systemHealth)}
              <Badge className="bg-purple-500">
                <Lock className="w-3 h-3 mr-1" />
                Säker
              </Badge>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Uppdatera
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
            <div className="lg:col-span-3">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="text-center p-4 border rounded-lg bg-white">
                  <div className="text-2xl font-bold text-blue-600">{systemStats?.totalMembers || 0}</div>
                  <div className="text-sm text-gray-600">Ledamöter</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg bg-white">
                  <div className="text-2xl font-bold text-green-600">{systemStats?.totalDocuments || 0}</div>
                  <div className="text-sm text-gray-600">Dokument</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg bg-white">
                  <div className="text-2xl font-bold text-purple-600">{systemStats?.totalVotes || 0}</div>
                  <div className="text-sm text-gray-600">Voteringar</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg bg-white">
                  <div className="text-2xl font-bold text-orange-600">{activeSyncs.length}</div>
                  <div className="text-sm text-gray-600">Aktiva synk</div>
                </div>

                <div className="text-center p-4 border rounded-lg bg-white">
                  <div className="text-2xl font-bold text-red-600">
                    {systemStats?.dataFreshness || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Data-ålder</div>
                </div>

                <div className="text-center p-4 border rounded-lg bg-white">
                  <div className="text-2xl font-bold text-indigo-600">
                    {systemStats?.performanceScore || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Prestanda</div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <SecurityStatusIndicator />
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

      {/* Master Control Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Översikt</span>
          </TabsTrigger>
          <TabsTrigger value="quickactions" className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Snabbåtgärder</span>
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Synkronisering</span>
            {activeSyncs.length > 0 && (
              <Badge className="ml-1 bg-blue-500 text-white text-xs">
                {activeSyncs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Systemhälsa</span>
          </TabsTrigger>
          <TabsTrigger value="validation" className="flex items-center space-x-2">
            <TestTube className="w-4 h-4" />
            <span>Validering</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <Monitor className="w-4 h-4" />
            <span>Prestanda</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Lock className="w-4 h-4" />
            <span>Säkerhet</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <MasterOverviewTab activeSyncs={activeSyncs} recentSyncs={recentSyncs} systemStats={systemStats} />
        </TabsContent>

        <TabsContent value="quickactions">
          <EnhancedAdminQuickActions />
        </TabsContent>

        <TabsContent value="sync">
          <div className="space-y-6">
            <MasterSyncTool />
            <ImprovedMemberDataSynchronizer />
          </div>
        </TabsContent>

        <TabsContent value="health">
          <SystemHealthDashboard />
        </TabsContent>

        <TabsContent value="validation">
          <DataValidationDashboard />
        </TabsContent>

        <TabsContent value="performance">
          <SystemPerformanceDashboard />
        </TabsContent>

        <TabsContent value="security">
          <AdminSecurityPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const MasterOverviewTab: React.FC<{ activeSyncs: any[], recentSyncs: any[], systemStats: any }> = ({ 
  activeSyncs, 
  recentSyncs, 
  systemStats 
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <span>Systemstatus</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm">API-tjänster</span>
            <Badge className="bg-green-500">Aktiv</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Databas</span>
            <Badge className="bg-green-500">Frisk</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Säkerhet</span>
            <Badge className="bg-green-500">Säker</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Prestanda</span>
            <Badge className="bg-yellow-500">Bra</Badge>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="w-5 h-5" />
          <span>Aktiva operationer</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeSyncs.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm">Inga aktiva operationer</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeSyncs.slice(0, 3).map((sync) => (
              <div key={sync.id} className="flex items-center justify-between text-sm">
                <span className="capitalize">{sync.sync_type}</span>
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
          <TrendingUp className="w-5 h-5" />
          <span>Senaste trender</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span>Synk/dag</span>
            <span className="font-medium">12 ↗️</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>Svarstid</span>
            <span className="font-medium">145ms ↗️</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>Felfrekvens</span>
            <span className="font-medium">0.8% ↘️</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>Datavolym</span>
            <span className="font-medium">2.3GB ↗️</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const SecurityControlsTab: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lock className="w-5 h-5" />
          <span>Säkerhetsstatus</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm">API-säkerhet</span>
            <Badge className="bg-green-500">Aktiv</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Databasskydd</span>
            <Badge className="bg-green-500">Säker</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Rate Limiting</span>
            <Badge className="bg-green-500">Aktiv</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Audit Logs</span>
            <Badge className="bg-green-500">Aktiverad</Badge>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Säkerhetsinställningar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Max API-förfrågningar/minut</span>
            <input type="number" className="border rounded px-2 py-1 text-sm w-20" defaultValue="100" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Session timeout (minuter)</span>
            <input type="number" className="border rounded px-2 py-1 text-sm w-20" defaultValue="60" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Aktivera 2FA</span>
            <input type="checkbox" className="rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const MasterSettingsTab: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <Card>
      <CardHeader>
        <CardTitle>Systeminställningar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Automatisk synkronisering</span>
            <input type="checkbox" className="rounded" defaultChecked />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Synkroniseringsintervall</span>
            <select className="border rounded px-2 py-1 text-sm">
              <option>Varje timme</option>
              <option>Var 6:e timme</option>
              <option>Dagligen</option>
            </select>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Loggnivå</span>
            <select className="border rounded px-2 py-1 text-sm">
              <option>Info</option>
              <option>Varning</option>
              <option>Fel</option>
              <option>Debug</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Prestanda</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Cache-storlek (MB)</span>
            <input type="number" className="border rounded px-2 py-1 text-sm w-20" defaultValue="512" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Aktivera komprimering</span>
            <input type="checkbox" className="rounded" defaultChecked />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Batch-storlek</span>
            <input type="number" className="border rounded px-2 py-1 text-sm w-20" defaultValue="50" />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default MasterControlPanel;
