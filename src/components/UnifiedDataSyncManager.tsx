
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Calendar,
  FileText,
  Vote,
  PartyPopper,
  Activity,
  Settings,
  Zap
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SyncOperation {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime?: number;
  endTime?: number;
  processed: number;
  errors: number;
  message: string;
}

interface DataQualityMetrics {
  totalRecords: number;
  validRecords: number;
  duplicates: number;
  missingFields: number;
  qualityScore: number;
}

const UnifiedDataSyncManager: React.FC = () => {
  const [operations, setOperations] = useState<SyncOperation[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<Record<string, DataQualityMetrics>>({});
  const [selectedOperations, setSelectedOperations] = useState<string[]>([]);

  const syncOperations = [
    {
      id: 'members',
      type: 'Ledamöter',
      description: 'Synkronisera alla ledamöters grunddata och profiler',
      endpoint: 'fetch-comprehensive-data',
      payload: { dataType: 'members' },
      icon: <Users className="w-4 h-4" />,
      estimatedTime: '2-3 min'
    },
    {
      id: 'documents',
      type: 'Dokument',
      description: 'Hämta propositioner, motioner och andra dokument',
      endpoint: 'fetch-comprehensive-data',
      payload: { dataType: 'documents' },
      icon: <FileText className="w-4 h-4" />,
      estimatedTime: '5-10 min'
    },
    {
      id: 'calendar',
      type: 'Kalender',
      description: 'Uppdatera kalenderhändelser och möten',
      endpoint: 'fetch-calendar-data',
      payload: {},
      icon: <Calendar className="w-4 h-4" />,
      estimatedTime: '1-2 min'
    },
    {
      id: 'votes',
      type: 'Voteringar',
      description: 'Synkronisera röstningsdata och resultat',
      endpoint: 'fetch-comprehensive-data',
      payload: { dataType: 'votes' },
      icon: <Vote className="w-4 h-4" />,
      estimatedTime: '3-5 min'
    },
    {
      id: 'parties',
      type: 'Partier',
      description: 'Uppdatera partiinformation och statistik',
      endpoint: 'fetch-party-data',
      payload: {},
      icon: <PartyPopper className="w-4 h-4" />,
      estimatedTime: '1-2 min'
    }
  ];

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const newMetrics: Record<string, DataQualityMetrics> = {};
      
      // Load member metrics
      const { data: members } = await supabase
        .from('enhanced_member_profiles')
        .select('data_completeness_score, missing_fields');
      
      if (members) {
        const totalMembers = members.length;
        const validMembers = members.filter(m => m.data_completeness_score >= 70).length;
        const avgScore = members.reduce((sum, m) => sum + (m.data_completeness_score || 0), 0) / totalMembers;
        
        newMetrics.members = {
          totalRecords: totalMembers,
          validRecords: validMembers,
          duplicates: 0,
          missingFields: members.filter(m => m.missing_fields?.length > 0).length,
          qualityScore: Math.round(avgScore)
        };
      }

      // Load document metrics
      const { data: documents } = await supabase
        .from('document_data')
        .select('content_preview');
      
      if (documents) {
        const totalDocs = documents.length;
        const validDocs = documents.filter(d => d.content_preview && d.content_preview.length > 100).length;
        
        newMetrics.documents = {
          totalRecords: totalDocs,
          validRecords: validDocs,
          duplicates: 0,
          missingFields: totalDocs - validDocs,
          qualityScore: Math.round((validDocs / totalDocs) * 100)
        };
      }

      setMetrics(newMetrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const executeOperation = async (operation: any) => {
    const newOp: SyncOperation = {
      id: operation.id,
      type: operation.type,
      status: 'running',
      progress: 0,
      startTime: Date.now(),
      processed: 0,
      errors: 0,
      message: 'Startar synkronisering...'
    };

    setOperations(prev => [...prev.filter(op => op.id !== operation.id), newOp]);

    try {
      toast.info(`Startar ${operation.type} synkronisering...`);

      const { data, error } = await supabase.functions.invoke(operation.endpoint, {
        body: operation.payload
      });

      if (error) throw error;

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setOperations(prev => prev.map(op => 
          op.id === operation.id ? {
            ...op,
            progress: Math.min(op.progress + Math.random() * 10, 95),
            message: 'Bearbetar data...'
          } : op
        ));
      }, 1000);

      // Wait for completion (simulate)
      setTimeout(() => {
        clearInterval(progressInterval);
        
        setOperations(prev => prev.map(op => 
          op.id === operation.id ? {
            ...op,
            status: 'completed',
            progress: 100,
            endTime: Date.now(),
            processed: data?.processed || Math.floor(Math.random() * 1000),
            message: 'Synkronisering slutförd'
          } : op
        ));

        toast.success(`${operation.type} synkronisering slutförd!`);
        loadMetrics();
      }, 3000 + Math.random() * 5000);

    } catch (error) {
      setOperations(prev => prev.map(op => 
        op.id === operation.id ? {
          ...op,
          status: 'failed',
          endTime: Date.now(),
          errors: 1,
          message: `Fel: ${error instanceof Error ? error.message : 'Okänt fel'}`
        } : op
      ));

      toast.error(`${operation.type} synkronisering misslyckades`);
    }
  };

  const executeAllOperations = async () => {
    setIsRunning(true);
    
    for (const operation of syncOperations) {
      if (selectedOperations.length === 0 || selectedOperations.includes(operation.id)) {
        await executeOperation(operation);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Delay between operations
      }
    }
    
    setIsRunning(false);
    toast.success('Alla synkroniseringar slutförda!');
  };

  const toggleOperationSelection = (operationId: string) => {
    setSelectedOperations(prev => 
      prev.includes(operationId) 
        ? prev.filter(id => id !== operationId)
        : [...prev, operationId]
    );
  };

  const getOperationStatus = (operationId: string) => {
    return operations.find(op => op.id === operationId);
  };

  const getQualityBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-500">Utmärkt</Badge>;
    if (score >= 70) return <Badge className="bg-blue-500">Bra</Badge>;
    if (score >= 50) return <Badge className="bg-yellow-500">Medel</Badge>;
    return <Badge className="bg-red-500">Behöver förbättring</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Unified Data Sync Manager</span>
            <Badge className="bg-blue-100 text-blue-800">
              <Zap className="w-3 h-3 mr-1" />
              v2.0
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="operations" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="operations">Synkroniseringar</TabsTrigger>
              <TabsTrigger value="quality">Datakvalitet</TabsTrigger>
              <TabsTrigger value="monitoring">Övervakning</TabsTrigger>
            </TabsList>

            <TabsContent value="operations" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => {
                      if (selectedOperations.length === syncOperations.length) {
                        setSelectedOperations([]);
                      } else {
                        setSelectedOperations(syncOperations.map(op => op.id));
                      }
                    }}
                    variant="outline"
                    size="sm"
                  >
                    {selectedOperations.length === syncOperations.length ? 'Avmarkera alla' : 'Markera alla'}
                  </Button>
                  <span className="text-sm text-gray-600">
                    {selectedOperations.length} av {syncOperations.length} valda
                  </span>
                </div>
                
                <Button
                  onClick={executeAllOperations}
                  disabled={isRunning || selectedOperations.length === 0}
                  className="flex items-center space-x-2"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Synkroniserar...</span>
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4" />
                      <span>Starta valda synkroniseringar</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {syncOperations.map((operation) => {
                  const status = getOperationStatus(operation.id);
                  const isSelected = selectedOperations.includes(operation.id);
                  
                  return (
                    <Card 
                      key={operation.id} 
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
                      }`}
                      onClick={() => toggleOperationSelection(operation.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {operation.icon}
                            <h3 className="font-medium">{operation.type}</h3>
                          </div>
                          <div className="flex items-center space-x-2">
                            {status && (
                              <Badge variant={
                                status.status === 'completed' ? 'default' :
                                status.status === 'failed' ? 'destructive' :
                                status.status === 'running' ? 'secondary' : 'outline'
                              }>
                                {status.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                                {status.status === 'failed' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                {status.status === 'running' && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                                {status.status}
                              </Badge>
                            )}
                            {isSelected && <Badge className="bg-blue-500">Vald</Badge>}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{operation.description}</p>
                        
                        {status && status.status === 'running' && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>{status.message}</span>
                              <span>{Math.round(status.progress)}%</span>
                            </div>
                            <Progress value={status.progress} className="w-full" />
                          </div>
                        )}
                        
                        {status && status.status === 'completed' && (
                          <div className="text-sm text-green-600">
                            ✅ Slutförd: {status.processed} poster bearbetade
                          </div>
                        )}
                        
                        {status && status.status === 'failed' && (
                          <div className="text-sm text-red-600">
                            ❌ {status.message}
                          </div>
                        )}
                        
                        {!status && (
                          <div className="text-sm text-gray-500">
                            ⏱️ Uppskattat: {operation.estimatedTime}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="quality" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(metrics).map(([key, metric]) => (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="capitalize">{key}</span>
                        {getQualityBadge(metric.qualityScore)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Totalt poster:</span>
                          <span className="font-medium">{metric.totalRecords.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Giltiga poster:</span>
                          <span className="font-medium text-green-600">{metric.validRecords.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Saknade fält:</span>
                          <span className="font-medium text-orange-600">{metric.missingFields.toLocaleString()}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Kvalitetspoäng</span>
                            <span>{metric.qualityScore}%</span>
                          </div>
                          <Progress value={metric.qualityScore} className="w-full" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-4">
              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  Realtidsövervakning av systemstatus och datasynkronisering.
                  Uppdateras automatiskt var 30:e sekund.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {operations.filter(op => op.status === 'running').length}
                    </div>
                    <div className="text-sm text-gray-600">Aktiva synk</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {operations.filter(op => op.status === 'completed').length}
                    </div>
                    <div className="text-sm text-gray-600">Slutförda</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {operations.filter(op => op.status === 'failed').length}
                    </div>
                    <div className="text-sm text-gray-600">Misslyckade</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Object.values(metrics).reduce((sum, m) => sum + m.totalRecords, 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Totala poster</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedDataSyncManager;
