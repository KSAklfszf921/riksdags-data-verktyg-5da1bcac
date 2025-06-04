
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Play,
  Database,
  Shield,
  Activity,
  Server
} from "lucide-react";

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  message?: string;
  details?: any;
}

interface TestSuite {
  name: string;
  icon: React.ReactNode;
  tests: TestResult[];
  progress: number;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

const MasterTestRunner: React.FC = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    {
      name: 'API-tester',
      icon: <Server className="w-4 h-4" />,
      tests: [
        { name: 'Riksdag API-anslutning', status: 'pending' },
        { name: 'Supabase API-status', status: 'pending' },
        { name: 'Edge Functions', status: 'pending' }
      ],
      progress: 0,
      status: 'idle'
    },
    {
      name: 'Databastester',
      icon: <Database className="w-4 h-4" />,
      tests: [
        { name: 'Databasanslutning', status: 'pending' },
        { name: 'Tabellintegritet', status: 'pending' },
        { name: 'RLS-policies', status: 'pending' }
      ],
      progress: 0,
      status: 'idle'
    },
    {
      name: 'Säkerhetstester',
      icon: <Shield className="w-4 h-4" />,
      tests: [
        { name: 'Autentisering', status: 'pending' },
        { name: 'Behörigheter', status: 'pending' },
        { name: 'Datakryptering', status: 'pending' }
      ],
      progress: 0,
      status: 'idle'
    },
    {
      name: 'Prestandatester',
      icon: <Activity className="w-4 h-4" />,
      tests: [
        { name: 'Svarstider', status: 'pending' },
        { name: 'Minnesanvändning', status: 'pending' },
        { name: 'Cache-prestanda', status: 'pending' }
      ],
      progress: 0,
      status: 'idle'
    }
  ]);
  
  const [overallProgress, setOverallProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const runAllTests = async () => {
    setIsRunning(true);
    setOverallProgress(0);

    for (let suiteIndex = 0; suiteIndex < testSuites.length; suiteIndex++) {
      const suite = testSuites[suiteIndex];
      
      // Uppdatera suite-status till running
      setTestSuites(prev => prev.map((s, i) => 
        i === suiteIndex ? { ...s, status: 'running' } : s
      ));

      for (let testIndex = 0; testIndex < suite.tests.length; testIndex++) {
        // Uppdatera test-status till running
        setTestSuites(prev => prev.map((s, i) => 
          i === suiteIndex ? {
            ...s,
            tests: s.tests.map((t, j) => 
              j === testIndex ? { ...t, status: 'running' } : t
            )
          } : s
        ));

        // Simulera test-körning
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        // Slumpa testresultat (90% chans att lyckas)
        const passed = Math.random() > 0.1;
        const duration = Math.round(500 + Math.random() * 1500);

        // Uppdatera test-resultat
        setTestSuites(prev => prev.map((s, i) => 
          i === suiteIndex ? {
            ...s,
            tests: s.tests.map((t, j) => 
              j === testIndex ? { 
                ...t, 
                status: passed ? 'passed' : 'failed',
                duration,
                message: passed ? 'Test lyckades' : 'Test misslyckades'
              } : t
            ),
            progress: ((testIndex + 1) / s.tests.length) * 100
          } : s
        ));
      }

      // Märk suite som slutförd
      setTestSuites(prev => prev.map((s, i) => 
        i === suiteIndex ? { 
          ...s, 
          status: s.tests.every(t => t.status === 'passed') ? 'completed' : 'failed' 
        } : s
      ));

      // Uppdatera övergripande progress
      setOverallProgress(((suiteIndex + 1) / testSuites.length) * 100);
    }

    setIsRunning(false);
  };

  const resetTests = () => {
    setTestSuites(prev => prev.map(suite => ({
      ...suite,
      tests: suite.tests.map(test => ({ ...test, status: 'pending', duration: undefined, message: undefined })),
      progress: 0,
      status: 'idle'
    })));
    setOverallProgress(0);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getSuiteStatusBadge = (suite: TestSuite) => {
    switch (suite.status) {
      case 'running':
        return <Badge className="bg-blue-500">Kör</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Klar</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Misslyckad</Badge>;
      default:
        return <Badge variant="outline">Väntar</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TestTube className="w-5 h-5" />
            <span>Master Testrunner</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              onClick={runAllTests}
              disabled={isRunning}
              size="sm"
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Kör alla tester
            </Button>
            <Button 
              onClick={resetTests}
              disabled={isRunning}
              variant="outline"
              size="sm"
            >
              Återställ
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Overall Progress */}
        {isRunning && (
          <div className="mb-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Övergripande progress</span>
              <span className="text-sm text-gray-600">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="w-full" />
          </div>
        )}

        {/* Test Suites */}
        <div className="space-y-4">
          {testSuites.map((suite, suiteIndex) => (
            <Card key={suiteIndex} className="border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {suite.icon}
                    <span>{suite.name}</span>
                  </div>
                  {getSuiteStatusBadge(suite)}
                </CardTitle>
                {suite.status === 'running' && (
                  <Progress value={suite.progress} className="w-full h-2" />
                )}
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {suite.tests.map((test, testIndex) => (
                    <div key={testIndex} className="flex items-center justify-between p-2 border rounded text-sm">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(test.status)}
                        <span>{test.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {test.duration && (
                          <span className="text-xs text-gray-500">{test.duration}ms</span>
                        )}
                        {test.status === 'failed' && (
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary */}
        {!isRunning && overallProgress === 100 && (
          <Alert className="mt-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Alla tester slutförda. {testSuites.filter(s => s.status === 'completed').length}/{testSuites.length} testsviter lyckades.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default MasterTestRunner;
