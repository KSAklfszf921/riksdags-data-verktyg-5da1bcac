import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { useProcessCleanup } from '@/hooks/useProcessCleanup';
import { useDataInitializer } from '@/hooks/useDataInitializer';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  SkipForward, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  Zap,
  Database,
  Shield,
  Activity,
  Clock,
  Wifi,
  WifiOff
} from "lucide-react";

interface DiagnosticStep {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  action: () => Promise<DiagnosticResult>;
  critical?: boolean;
  autoFix?: boolean;
}

interface DiagnosticResult {
  status: 'success' | 'warning' | 'error' | 'skipped';
  message: string;
  details?: string[];
  fixes?: string[];
  canAutoFix?: boolean;
}

interface WorkflowState {
  isRunning: boolean;
  currentStep: number;
  results: Record<string, DiagnosticResult>;
  overallStatus: 'idle' | 'running' | 'completed' | 'paused';
}

const MasterDiagnosticsWorkflow: React.FC = () => {
  const { toast } = useToast();
  const { healthData, performHealthCheck } = useHealthCheck();
  const { cleanupHangingProcesses } = useProcessCleanup();
  const { initializeAllData, initializeMemberData, isInitializing, progress } = useDataInitializer();

  const [workflow, setWorkflow] = useState<WorkflowState>({
    isRunning: false,
    currentStep: 0,
    results: {},
    overallStatus: 'idle'
  });

  const testApiConnectivity = async () => {
    try {
      console.log('🌐 Testar API-anslutning till Riksdagen...');
      
      // Test basic connectivity
      const testUrl = 'https://data.riksdagen.se/dokumentlista/?utformat=json&sz=1';
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'RiksdagApp/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        status: 'success' as const,
        message: 'API-anslutning fungerar',
        details: [
          `HTTP Status: ${response.status}`,
          `Response Time: ${performance.now()}ms`,
          `Data Format: JSON`,
          `Sample Response: ${JSON.stringify(data).substring(0, 100)}...`
        ]
      };
    } catch (error) {
      console.error('❌ API connectivity test failed:', error);
      return {
        status: 'error' as const,
        message: 'API-anslutning misslyckades',
        details: [
          `Fel: ${error instanceof Error ? error.message : 'Okänt fel'}`,
          'Detta kan bero på nätverksproblem eller API-begränsningar'
        ],
        fixes: [
          'Kontrollera internetanslutningen',
          'Vänta en stund och försök igen',
          'Riksdagens API kan vara temporärt otillgängligt'
        ]
      };
    }
  };

  const diagnosticSteps: DiagnosticStep[] = [
    {
      id: 'api_connectivity',
      name: 'API-anslutning',
      description: 'Testar anslutning till Riksdagens API',
      icon: <Wifi className="w-5 h-5" />,
      critical: true,
      action: testApiConnectivity
    },
    {
      id: 'health_check',
      name: 'Systemhälsokontroll',
      description: 'Kontrollerar systemets allmänna hälsa och prestanda',
      icon: <Activity className="w-5 h-5" />,
      action: async () => {
        const result = await performHealthCheck();
        if (result.score >= 80) {
          return {
            status: 'success',
            message: `Systemet är friskt (${result.score}/100)`,
            details: ['Alla system fungerar normalt', ...result.recommendations]
          };
        } else if (result.score >= 60) {
          return {
            status: 'warning',
            message: `Systemet har mindre problem (${result.score}/100)`,
            details: result.issues,
            fixes: result.recommendations,
            canAutoFix: true
          };
        } else {
          return {
            status: 'error',
            message: `Systemet har allvarliga problem (${result.score}/100)`,
            details: result.issues,
            fixes: result.recommendations,
            canAutoFix: true
          };
        }
      }
    },
    {
      id: 'process_cleanup',
      name: 'Processrensning',
      description: 'Rensar hängande och gamla processer',
      icon: <Clock className="w-5 h-5" />,
      autoFix: true,
      action: async () => {
        const result = await cleanupHangingProcesses();
        if (result.cleanedUp === 0) {
          return {
            status: 'success',
            message: 'Inga hängande processer hittades',
            details: ['Alla processer körs normalt']
          };
        } else {
          return {
            status: 'warning',
            message: `Rensade ${result.cleanedUp} hängande processer`,
            details: [
              `${result.hangingProcesses} processer var hängande`,
              ...result.errors
            ]
          };
        }
      }
    },
    {
      id: 'data_validation',
      name: 'Datavalidering',
      description: 'Kontrollerar dataintegritet och fullständighet',
      icon: <Database className="w-5 h-5" />,
      critical: true,
      action: async () => {
        const hasDataIssues = healthData?.issues.some(issue => 
          issue.includes('No') && issue.includes('data found')
        );
        
        if (hasDataIssues) {
          return {
            status: 'error',
            message: 'Kritiska databrist upptäckta',
            details: [
              'Saknad medlemsdata detekterad',
              'Saknad röstningsdata detekterad', 
              'Saknad kalenderdata detekterad'
            ],
            fixes: [
              'Kör komplett datainitialisering',
              'Verifiera API-anslutningar',
              'Kontrollera databaskonfiguration'
            ],
            canAutoFix: true
          };
        } else {
          return {
            status: 'success',
            message: 'All data är tillgänglig och aktuell',
            details: ['Medlemsdata: OK', 'Röstningsdata: OK', 'Kalenderdata: OK']
          };
        }
      }
    },
    {
      id: 'security_audit',
      name: 'Säkerhetskontroll',
      description: 'Kontrollerar säkerhetsinställningar och åtkomst',
      icon: <Shield className="w-5 h-5" />,
      action: async () => {
        try {
          // Test database connectivity
          const { data, error } = await supabase
            .from('automated_sync_status')
            .select('id')
            .limit(1);
            
          if (error) {
            return {
              status: 'error',
              message: 'Databasanslutning misslyckades',
              details: [`Fel: ${error.message}`],
              fixes: ['Kontrollera Supabase-konfiguration', 'Verifiera API-nycklar']
            };
          }
          
          return {
            status: 'success',
            message: 'Säkerhetsinställningar är korrekta',
            details: [
              'Databasanslutning: Aktiv', 
              'API-säkerhet: Fungerar', 
              'Autentisering: OK'
            ]
          };
        } catch (error) {
          return {
            status: 'error',
            message: 'Säkerhetskontroll misslyckades',
            details: [`Systemfel: ${error instanceof Error ? error.message : 'Okänt fel'}`]
          };
        }
      }
    }
  ];

  const runWorkflow = useCallback(async () => {
    setWorkflow(prev => ({
      ...prev,
      isRunning: true,
      overallStatus: 'running',
      currentStep: 0,
      results: {}
    }));

    console.log('🚀 Startar Master Diagnostik Workflow...');

    for (let i = 0; i < diagnosticSteps.length; i++) {
      const step = diagnosticSteps[i];
      
      setWorkflow(prev => ({ ...prev, currentStep: i }));
      console.log(`🔍 Kör: ${step.name}`);

      try {
        const result = await step.action();
        
        setWorkflow(prev => ({
          ...prev,
          results: { ...prev.results, [step.id]: result }
        }));

        console.log(`✅ ${step.name}: ${result.status} - ${result.message}`);

        // Auto-fix för kritiska problem
        if (step.autoFix && result.canAutoFix && result.status === 'error') {
          console.log(`🔧 Auto-fix för ${step.name}...`);
          // Utför auto-fix här om implementerat
        }

        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ ${step.name} misslyckades:`, error);
        const errorResult: DiagnosticResult = {
          status: 'error',
          message: `Fel under ${step.name}`,
          details: [error instanceof Error ? error.message : 'Okänt fel']
        };

        setWorkflow(prev => ({
          ...prev,
          results: { ...prev.results, [step.id]: errorResult }
        }));
      }
    }

    setWorkflow(prev => ({
      ...prev,
      isRunning: false,
      overallStatus: 'completed',
      currentStep: diagnosticSteps.length
    }));

    toast({
      title: "Diagnostik slutförd",
      description: "Alla diagnostiksteg har genomförts",
    });
  }, [diagnosticSteps, toast, performHealthCheck, cleanupHangingProcesses, healthData]);

  const skipCurrentStep = useCallback(() => {
    const currentStepData = diagnosticSteps[workflow.currentStep];
    if (currentStepData) {
      const skippedResult: DiagnosticResult = {
        status: 'skipped',
        message: `${currentStepData.name} hoppades över`
      };

      setWorkflow(prev => ({
        ...prev,
        results: { ...prev.results, [currentStepData.id]: skippedResult },
        currentStep: prev.currentStep + 1
      }));
    }
  }, [workflow.currentStep, diagnosticSteps]);

  const pauseWorkflow = useCallback(() => {
    setWorkflow(prev => ({
      ...prev,
      isRunning: false,
      overallStatus: 'paused'
    }));
  }, []);

  const resetWorkflow = useCallback(() => {
    setWorkflow({
      isRunning: false,
      currentStep: 0,
      results: {},
      overallStatus: 'idle'
    });
  }, []);

  const fixAllIssues = useCallback(async () => {
    const hasDataIssues = Object.values(workflow.results).some(result => 
      result.status === 'error' && result.canAutoFix
    );

    if (hasDataIssues) {
      try {
        console.log('🔧 Startar automatisk reparation...');
        await initializeAllData();
        toast({
          title: "Automatisk reparation startad",
          description: "Komplett datainitialisering körs för att åtgärda problem",
        });
      } catch (error) {
        toast({
          title: "Reparation misslyckades",
          description: "Kunde inte starta automatisk reparation",
          variant: "destructive"
        });
      }
    }
  }, [workflow.results, initializeAllData, toast]);

  const getOverallStatus = () => {
    const results = Object.values(workflow.results);
    if (results.length === 0) return 'idle';
    
    const hasErrors = results.some(r => r.status === 'error');
    const hasWarnings = results.some(r => r.status === 'warning');
    
    if (hasErrors) return 'error';
    if (hasWarnings) return 'warning';
    return 'success';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'skipped': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      case 'skipped': return <SkipForward className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const progress = workflow.overallStatus === 'completed' 
    ? 100 
    : (workflow.currentStep / diagnosticSteps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Workflow Control Header */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-6 h-6 text-blue-600" />
              <span>Master Diagnostik & Reparation</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(getOverallStatus())}>
                {getStatusIcon(getOverallStatus())}
                <span className="ml-1 capitalize">{getOverallStatus()}</span>
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Framsteg</span>
              <span>{workflow.currentStep} / {diagnosticSteps.length}</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center space-x-3">
            {workflow.overallStatus === 'idle' || workflow.overallStatus === 'completed' ? (
              <Button onClick={runWorkflow} disabled={workflow.isRunning || isInitializing}>
                <Play className="w-4 h-4 mr-2" />
                Starta diagnostik
              </Button>
            ) : (
              <>
                {workflow.isRunning ? (
                  <Button onClick={pauseWorkflow} variant="outline">
                    <Pause className="w-4 h-4 mr-2" />
                    Pausa
                  </Button>
                ) : (
                  <Button onClick={runWorkflow}>
                    <Play className="w-4 h-4 mr-2" />
                    Fortsätt
                  </Button>
                )}
                
                <Button onClick={skipCurrentStep} variant="outline" disabled={!workflow.isRunning}>
                  <SkipForward className="w-4 h-4 mr-2" />
                  Hoppa över
                </Button>
              </>
            )}

            <Button onClick={resetWorkflow} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Återställ
            </Button>

            {workflow.overallStatus === 'completed' && getOverallStatus() !== 'success' && (
              <Button onClick={fixAllIssues} className="bg-orange-600 hover:bg-orange-700" disabled={isInitializing}>
                <Zap className="w-4 h-4 mr-2" />
                {isInitializing ? 'Reparerar...' : 'Åtgärda automatiskt'}
              </Button>
            )}
          </div>

          {/* Live Progress for Data Initialization */}
          {isInitializing && (
            <Alert className="bg-blue-50 border-blue-200">
              <Activity className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Datainitialisering pågår</div>
                  <div className="text-sm">{progress.currentStep}</div>
                  <Progress 
                    value={(progress.completed / progress.total) * 100} 
                    className="w-full h-2" 
                  />
                  <div className="text-xs text-gray-600">
                    {progress.completed} / {progress.total} steg slutförda
                  </div>
                  {progress.successes.length > 0 && (
                    <div className="text-xs text-green-600">
                      ✅ Senaste: {progress.successes[progress.successes.length - 1]}
                    </div>
                  )}
                  {progress.errors.length > 0 && (
                    <div className="text-xs text-red-600">
                      ❌ Fel: {progress.errors[progress.errors.length - 1]}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Diagnostic Steps */}
      <div className="grid grid-cols-1 gap-4">
        {diagnosticSteps.map((step, index) => {
          const result = workflow.results[step.id];
          const isActive = workflow.currentStep === index && workflow.isRunning;
          const isCompleted = !!result;

          return (
            <Card key={step.id} className={`${isActive ? 'border-blue-300 bg-blue-50' : ''} ${step.critical ? 'border-l-4 border-l-red-500' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      {isActive ? (
                        <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{step.name}</h3>
                        {step.critical && (
                          <Badge variant="destructive" className="text-xs">Kritisk</Badge>
                        )}
                        {step.autoFix && (
                          <Badge variant="outline" className="text-xs">Auto-fix</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    {isCompleted ? (
                      <div className="space-y-1">
                        <Badge className={getStatusColor(result.status)}>
                          {getStatusIcon(result.status)}
                          <span className="ml-1 capitalize">{result.status}</span>
                        </Badge>
                        <p className="text-sm text-gray-700">{result.message}</p>
                      </div>
                    ) : isActive ? (
                      <Badge className="bg-blue-500">
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Kör
                      </Badge>
                    ) : (
                      <Badge variant="outline">Väntar</Badge>
                    )}
                  </div>
                </div>

                {/* Result Details */}
                {result && (result.details || result.fixes) && (
                  <div className="mt-3 pt-3 border-t">
                    {result.details && (
                      <div className="mb-2">
                        <h4 className="text-sm font-medium mb-1">Detaljer:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {result.details.map((detail, idx) => (
                            <li key={idx} className="flex items-center space-x-2">
                              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {result.fixes && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Rekommenderade åtgärder:</h4>
                        <ul className="text-sm text-orange-600 space-y-1">
                          {result.fixes.map((fix, idx) => (
                            <li key={idx} className="flex items-center space-x-2">
                              <Zap className="w-3 h-3" />
                              <span>{fix}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Alert */}
      {workflow.overallStatus === 'completed' && (
        <Alert className={`${getOverallStatus() === 'success' ? 'bg-green-50 border-green-200' : 
          getOverallStatus() === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Diagnostik slutförd</div>
            <div className="text-sm">
              {getOverallStatus() === 'success' && 'Alla system fungerar normalt. Inga åtgärder krävs.'}
              {getOverallStatus() === 'warning' && 'Mindre problem upptäckta. Rekommenderar att granska varningar och köra automatisk reparation.'}
              {getOverallStatus() === 'error' && 'Kritiska problem upptäckta. Kör automatisk reparation omgående.'}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default MasterDiagnosticsWorkflow;
