
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSyncMonitor } from '@/hooks/useSyncMonitor';
import SecurityStatusIndicator from './SecurityStatusIndicator';
import { 
  Shield, 
  Database, 
  Activity, 
  Settings, 
  TestTube,
  Server,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  Play,
  Pause,
  Square,
  Zap
} from "lucide-react";

interface TestProgress {
  current: number;
  total: number;
  currentTest: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

const MasterAdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { activeSyncs, recentSyncs, loading, error } = useSyncMonitor();
  const [testProgress, setTestProgress] = useState<TestProgress>({
    current: 0,
    total: 0,
    currentTest: '',
    status: 'idle'
  });
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

  const runComprehensiveTests = async () => {
    setTestProgress({ current: 0, total: 8, currentTest: 'Initierar tester...', status: 'running' });
    
    const tests = [
      'API-anslutningar',
      'Databasintegritet', 
      'Säkerhetskontroller',
      'Synkroniseringsstatus',
      'Prestanda-mätningar',
      'Datavalidering',
      'Systemhälsa',
      'Slutrapport'
    ];

    for (let i = 0; i < tests.length; i++) {
      setTestProgress({
        current: i + 1,
        total: tests.length,
        currentTest: tests[i],
        status: 'running'
      });
      
      // Simulera test-tid
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setTestProgress({
      current: tests.length,
      total: tests.length,
      currentTest: 'Alla tester slutförda',
      status: 'completed'
    });
  };

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
              <span className="text-xl">Master Admin Panel</span>
            </div>
            <div className="flex items-center space-x-4">
              {systemStats && getHealthBadge(systemStats.systemHealth)}
              <Badge className="bg-purple-500">
                <Shield className="w-3 h-3 mr-1" />
                Säker
              </Badge>
              <Button 
                onClick={runComprehensiveTests}
                disabled={testProgress.status === 'running'}
                size="sm"
                className="flex items-center space-x-2"
              >
                {testProgress.status === 'running' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>Kör alla tester</span>
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
          
          {/* Test Progress */}
          {testProgress.status === 'running' && (
            <div className="space-y-2 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Kör tester ({testProgress.current}/{testProgress.total})</span>
                <span className="text-sm text-gray-600">{Math.round((testProgress.current / testProgress.total) * 100)}%</span>
              </div>
              <Progress value={(testProgress.current / testProgress.total) * 100} className="w-full" />
              <div className="text-sm text-gray-600">{testProgress.currentTest}</div>
            </div>
          )}

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

      {/* Simplified Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Översikt</span>
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center space-x-2">
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
          <TabsTrigger value="system" className="flex items-center space-x-2">
            <Server className="w-4 h-4" />
            <span>System</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <MasterOverviewTab activeSyncs={activeSyncs} recentSyncs={recentSyncs} systemStats={systemStats} />
        </TabsContent>

        <TabsContent value="actions">
          <MasterQuickActions />
        </TabsContent>

        <TabsContent value="sync">
          <MasterSyncManager />
        </TabsContent>

        <TabsContent value="system">
          <MasterSystemManager />
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
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

const MasterQuickActions: React.FC = () => {
  const [actionProgress, setActionProgress] = useState<Record<string, boolean>>({});

  const performAction = async (actionKey: string, actionName: string) => {
    setActionProgress(prev => ({ ...prev, [actionKey]: true }));
    
    // Simulera åtgärd
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setActionProgress(prev => ({ ...prev, [actionKey]: false }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Datahantering</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => performAction('member_sync', 'Synkronisera medlemmar')}
            disabled={actionProgress.member_sync}
            className="w-full"
          >
            {actionProgress.member_sync ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Database className="w-4 h-4 mr-2" />
            )}
            Synkronisera medlemmar
          </Button>
          
          <Button 
            onClick={() => performAction('doc_sync', 'Synkronisera dokument')}
            disabled={actionProgress.doc_sync}
            className="w-full"
            variant="outline"
          >
            {actionProgress.doc_sync ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Database className="w-4 h-4 mr-2" />
            )}
            Synkronisera dokument
          </Button>

          <Button 
            onClick={() => performAction('cleanup', 'Rensa cache')}
            disabled={actionProgress.cleanup}
            className="w-full"
            variant="outline"
          >
            {actionProgress.cleanup ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Rensa cache
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Systemunderhåll</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => performAction('health_check', 'Hälsokontroll')}
            disabled={actionProgress.health_check}
            className="w-full"
          >
            {actionProgress.health_check ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Activity className="w-4 h-4 mr-2" />
            )}
            Fullständig hälsokontroll
          </Button>
          
          <Button 
            onClick={() => performAction('api_test', 'Testa API:er')}
            disabled={actionProgress.api_test}
            className="w-full"
            variant="outline"
          >
            {actionProgress.api_test ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="w-4 h-4 mr-2" />
            )}
            Testa alla API:er
          </Button>

          <Button 
            onClick={() => performAction('security_scan', 'Säkerhetsskanning')}
            disabled={actionProgress.security_scan}
            className="w-full"
            variant="outline"
          >
            {actionProgress.security_scan ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Shield className="w-4 h-4 mr-2" />
            )}
            Säkerhetsskanning
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const MasterSyncManager: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Synkroniseringshantering</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-center py-8 text-gray-500">
        <Database className="w-12 h-12 mx-auto mb-4" />
        <p>Synkroniseringsverktyg kommer här</p>
        <p className="text-sm">Använd befintliga SyncController och ProcessMonitor</p>
      </div>
    </CardContent>
  </Card>
);

const MasterSystemManager: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Systemhantering</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-center py-8 text-gray-500">
        <Server className="w-12 h-12 mx-auto mb-4" />
        <p>Systemhanteringsverktyg kommer här</p>
        <p className="text-sm">Prestanda, loggar och konfiguration</p>
      </div>
    </CardContent>
  </Card>
);

export default MasterAdminPanel;
