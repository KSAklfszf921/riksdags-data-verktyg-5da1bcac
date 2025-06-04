
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { PageHeader } from '../components/PageHeader';
import { useResponsive } from '../hooks/use-responsive';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DocumentAnalysisTestRunner from '../components/DocumentAnalysisTestRunner';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  FileText,
  Activity,
  BarChart3
} from 'lucide-react';

const Databashantering = () => {
  const [loading, setLoading] = useState(false);
  const [syncResults, setSyncResults] = useState<{ [key: string]: any }>({});
  const [documentCount, setDocumentCount] = useState<number | null>(null);
  const { toast } = useToast();
  const { isMobile } = useResponsive();

  const checkDocumentCount = async () => {
    try {
      const { count, error } = await supabase
        .from('document_data')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      setDocumentCount(count || 0);
      
      toast({
        title: "Dokument räknade",
        description: `Totalt ${count || 0} dokument i databasen`,
      });
    } catch (error) {
      console.error('Error counting documents:', error);
      toast({
        title: "Fel vid räkning",
        description: "Kunde inte räkna dokument",
        variant: "destructive"
      });
    }
  };

  const triggerDataSync = async (syncType: string, functionName: string) => {
    setLoading(true);
    console.log(`🚀 Starting ${syncType} sync via function: ${functionName}`);
    
    try {
      // Check initial count
      await checkDocumentCount();
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { 
          manual_trigger: true,
          triggered_by: 'databashantering_panel',
          debug_mode: true
        }
      });

      console.log('Edge function response:', data);
      console.log('Edge function error:', error);

      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }

      setSyncResults(prev => ({
        ...prev,
        [syncType]: {
          success: true,
          timestamp: new Date().toISOString(),
          data: data,
          functionName
        }
      }));

      // Check count after sync
      setTimeout(() => {
        checkDocumentCount();
      }, 2000);

      toast({
        title: `${syncType} sync lyckades`,
        description: `Data har uppdaterats. Dokument bearbetade: ${data?.stats?.documents_stored || 'Okänt'}`,
      });

    } catch (error) {
      console.error(`${syncType} sync error:`, error);
      
      setSyncResults(prev => ({
        ...prev,
        [syncType]: {
          success: false,
          timestamp: new Date().toISOString(),
          error: error.message,
          functionName
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

  const testDatabaseConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('document_data')
        .select('count')
        .limit(1);

      if (error) throw error;
      
      toast({
        title: "Databasanslutning OK",
        description: "Kan ansluta till document_data tabellen",
      });
    } catch (error) {
      toast({
        title: "Databasanslutning misslyckades",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const clearTable = async () => {
    if (!confirm('Är du säker på att du vill rensa document_data tabellen?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('document_data')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;
      
      setDocumentCount(0);
      toast({
        title: "Tabell rensad",
        description: "document_data tabellen har rensats",
      });
    } catch (error) {
      toast({
        title: "Fel vid rensning",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const syncOperations = [
    {
      id: 'comprehensive',
      title: 'Omfattande datasynkronisering',
      description: 'Hämtar dokument från 2022 framåt, medlemmar, anföranden och voteringar',
      functionName: 'fetch-comprehensive-data',
      icon: Database,
      color: 'text-purple-600',
      priority: true
    }
  ];

  React.useEffect(() => {
    checkDocumentCount();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 py-0' : 'px-4 sm:px-6 lg:px-8 py-8'}`}>
        <PageHeader
          title="Databashantering"
          description="Hantera och felsök datapopulering för document_data tabellen"
          icon={<Database className="w-6 h-6 text-white" />}
        />

        <div className="space-y-6">
          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Databasstatus</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold">
                        {documentCount !== null ? documentCount.toLocaleString() : '...'}
                      </div>
                      <div className="text-sm text-gray-600">Dokument i databasen</div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="space-y-2">
                  <Button onClick={checkDocumentCount} variant="outline" className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Uppdatera räkning
                  </Button>
                  <Button onClick={testDatabaseConnection} variant="outline" className="w-full">
                    <Database className="w-4 h-4 mr-2" />
                    Testa anslutning
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Button onClick={clearTable} variant="destructive" className="w-full">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Rensa tabell
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="sync" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sync">Datasynkronisering</TabsTrigger>
              <TabsTrigger value="test">Tester</TabsTrigger>
              <TabsTrigger value="debug">Debug-info</TabsTrigger>
            </TabsList>

            <TabsContent value="sync" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <RefreshCw className="w-5 h-5" />
                    <span>Starta datasynkronisering</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {syncOperations.map((operation) => {
                    const Icon = operation.icon;
                    const result = syncResults[operation.id];
                    
                    return (
                      <Card key={operation.id} className="border-2 border-purple-200 bg-purple-50">
                        <CardHeader className="pb-3">
                          <CardTitle className={`text-lg flex items-center space-x-2 ${operation.color}`}>
                            <Icon className="w-5 h-5" />
                            <span>{operation.title}</span>
                            <Badge className="bg-purple-100 text-purple-800 text-xs">
                              Kritisk
                            </Badge>
                          </CardTitle>
                          <CardDescription>{operation.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Button
                            onClick={() => triggerDataSync(operation.id, operation.functionName)}
                            disabled={loading}
                            className="w-full bg-purple-600 hover:bg-purple-700"
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
                            <div className={`text-xs p-3 rounded ${
                              result.success 
                                ? 'bg-green-50 text-green-700 border border-green-200' 
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              <div className="flex items-center space-x-1 mb-2">
                                {result.success ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : (
                                  <AlertCircle className="w-4 h-4" />
                                )}
                                <span className="font-medium">
                                  {result.success ? 'Lyckades' : 'Misslyckades'}
                                </span>
                              </div>
                              <div className="mb-1 flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(result.timestamp).toLocaleString('sv-SE')}</span>
                              </div>
                              <div className="mb-1">
                                <span className="font-medium">Funktion: </span>
                                {result.functionName}
                              </div>
                              {result.error && (
                                <div className="mt-2 p-2 bg-red-100 rounded text-red-800">
                                  <strong>Fel:</strong> {result.error}
                                </div>
                              )}
                              {result.success && result.data && (
                                <div className="mt-2 p-2 bg-green-100 rounded text-green-800">
                                  {result.data.stats && (
                                    <>
                                      <div><strong>Dokument:</strong> {result.data.stats.documents_stored || 0}</div>
                                      <div><strong>Medlemmar:</strong> {result.data.stats.members_stored || 0}</div>
                                      <div><strong>År bearbetade:</strong> {result.data.stats.years_processed || 0}</div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="test" className="space-y-4">
              <DocumentAnalysisTestRunner />
            </TabsContent>

            <TabsContent value="debug" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Debug-information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <strong>Vanliga problem:</strong>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Edge function timeout (max 300 sekunder)</li>
                            <li>Riksdagen API rate limiting</li>
                            <li>Nätverksfel under datainhämtning</li>
                            <li>Stora datamängder som tar tid att bearbeta</li>
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                    
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <strong>Felsökningssteg:</strong>
                          <ol className="list-decimal list-inside space-y-1 text-sm">
                            <li>Kontrollera att edge function är aktiv</li>
                            <li>Verifiera databasanslutning</li>
                            <li>Kör synkronisering och övervaka loggar</li>
                            <li>Kontrollera dokumenträkning innan/efter</li>
                          </ol>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Databashantering;
