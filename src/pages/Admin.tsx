
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { PageHeader } from '../components/PageHeader';
import { useResponsive } from '../hooks/use-responsive';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MasterSyncTool from '@/components/MasterSyncTool';
import { 
  Settings, 
  Database, 
  RefreshCw, 
  Calendar, 
  Users, 
  FileText, 
  BarChart3,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Zap
} from 'lucide-react';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('master');
  const [loading, setLoading] = useState(false);
  const [syncResults, setSyncResults] = useState<{ [key: string]: any }>({});
  const { toast } = useToast();
  const { isMobile } = useResponsive();

  const triggerDataSync = async (syncType: string, functionName: string) => {
    setLoading(true);
    try {
      console.log(`Triggering ${syncType} sync...`);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { 
          manual_trigger: true,
          triggered_by: 'admin_panel'
        }
      });

      if (error) throw error;

      setSyncResults(prev => ({
        ...prev,
        [syncType]: {
          success: true,
          timestamp: new Date().toISOString(),
          data: data
        }
      }));

      toast({
        title: `${syncType} sync lyckades`,
        description: "Data har uppdaterats framgångsrikt",
      });

    } catch (error) {
      console.error(`${syncType} sync error:`, error);
      
      setSyncResults(prev => ({
        ...prev,
        [syncType]: {
          success: false,
          timestamp: new Date().toISOString(),
          error: error.message
        }
      }));

      toast({
        title: `${syncType} sync misslyckades`,
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const syncOperations = [
    {
      id: 'calendar',
      title: 'Kalenderdata',
      description: 'Hämtar senaste kalenderhändelser',
      functionName: 'fetch-calendar-data',
      icon: Calendar,
      color: 'text-blue-600'
    },
    {
      id: 'party',
      title: 'Partidata',
      description: 'Uppdaterar partiinformation och medlemmar',
      functionName: 'daily-party-data-sync',
      icon: Users,
      color: 'text-green-600'
    },
    {
      id: 'comprehensive',
      title: 'Omfattande data (dokument, anföranden, voteringar)',
      description: 'Hämtar dokument från 2022 framåt, medlemmar, anföranden och voteringar - detta fyller document_data tabellen',
      functionName: 'fetch-comprehensive-data',
      icon: Database,
      color: 'text-purple-600',
      priority: true
    },
    {
      id: 'toplists',
      title: 'Topplistor',
      description: 'Genererar cachade topplistor',
      functionName: 'fetch-toplists-data',
      icon: BarChart3,
      color: 'text-orange-600'
    }
  ];

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('sv-SE');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 py-0' : 'px-4 sm:px-6 lg:px-8 py-8'}`}>
        <PageHeader
          title="Administratörspanel"
          description="Hantera datasynkronisering och systemövervakning"
          icon={<Settings className="w-6 h-6 text-white" />}
        />

        <Tabs defaultValue="master" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="master">Master Sync Tool</TabsTrigger>
            <TabsTrigger value="legacy">Legacy Tools</TabsTrigger>
          </TabsList>
          
          <TabsContent value="master">
            <MasterSyncTool />
          </TabsContent>
          
          <TabsContent value="legacy" className="space-y-6">
            {/* Priority Alert for Document Data */}
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-purple-800">
                  <Database className="w-5 h-5" />
                  <span>Populera document_data tabellen</span>
                  <Badge className="bg-purple-100 text-purple-800">
                    <Zap className="w-3 h-3 mr-1" />
                    Rekommenderat först
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="border-purple-200 bg-white">
                  <AlertCircle className="h-4 w-4 text-purple-600" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <span className="font-medium text-purple-900">
                        Starta med "Omfattande data" för att fylla document_data tabellen:
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-sm text-purple-800">
                        <li>Hämtar dokument från Riksdagen API (2022 framåt)</li>
                        <li>Lagrar i document_data tabellen</li>
                        <li>Inkluderar även medlemmar, anföranden och voteringar</li>
                        <li>Kan ta flera minuter att slutföra</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* System Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Systemstatus</span>
                  <Badge className="bg-green-100 text-green-800">
                    <Zap className="w-3 h-3 mr-1" />
                    Optimerad
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="border-blue-200">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <span className="font-medium">Automatiska datauppdateringar aktiverade:</span>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Topplistor: Schemaläggs dagligen för optimal prestanda</li>
                        <li>Partianalys: Cachad data uppdateras automatiskt</li>
                        <li>Kalenderdata: Hämtas regelbundet för aktuell information</li>
                        <li>Medlemsdata: Kontinuerlig synkronisering med riksdagen</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Tabs defaultValue="sync" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sync">Datasynkronisering</TabsTrigger>
                <TabsTrigger value="status">Synkroniseringsstatus</TabsTrigger>
              </TabsList>

              <TabsContent value="sync" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <RefreshCw className="w-5 h-5" />
                      <span>Manuell datasynkronisering</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {syncOperations.map((operation) => {
                        const Icon = operation.icon;
                        const result = syncResults[operation.id];
                        
                        return (
                          <Card key={operation.id} className={`relative ${operation.priority ? 'ring-2 ring-purple-200 bg-purple-50' : ''}`}>
                            <CardHeader className="pb-3">
                              <CardTitle className={`text-lg flex items-center space-x-2 ${operation.color}`}>
                                <Icon className="w-5 h-5" />
                                <span>{operation.title}</span>
                                {operation.priority && (
                                  <Badge className="bg-purple-100 text-purple-800 text-xs">
                                    Prioritet
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription>{operation.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <Button
                                onClick={() => triggerDataSync(operation.id, operation.functionName)}
                                disabled={loading}
                                className={`w-full ${operation.priority ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                                variant={operation.priority ? "default" : "outline"}
                              >
                                {loading ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                    Synkroniserar...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Starta synkronisering
                                  </>
                                )}
                              </Button>
                              
                              {result && (
                                <div className={`text-xs p-2 rounded ${
                                  result.success 
                                    ? 'bg-green-50 text-green-700 border border-green-200' 
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                  <div className="flex items-center space-x-1">
                                    {result.success ? (
                                      <CheckCircle className="w-3 h-3" />
                                    ) : (
                                      <AlertCircle className="w-3 h-3" />
                                    )}
                                    <span className="font-medium">
                                      {result.success ? 'Lyckades' : 'Misslyckades'}
                                    </span>
                                  </div>
                                  <div className="mt-1 flex items-center space-x-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatTimestamp(result.timestamp)}</span>
                                  </div>
                                  {result.error && (
                                    <div className="mt-1 text-xs">{result.error}</div>
                                  )}
                                  {result.success && result.data?.stats && (
                                    <div className="mt-1 text-xs">
                                      Dokument: {result.data.stats.documents_stored || 0}, 
                                      Medlemmar: {result.data.stats.members_stored || 0}
                                    </div>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="status" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5" />
                      <span>Senaste synkroniseringar</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Automatisk övervakning
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Systemet övervakar automatiskt alla schemalagda synkroniseringar.
                      </p>
                      <div className="text-sm text-gray-500">
                        <p>Kontrollera loggar i Supabase Dashboard för detaljerad information</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
