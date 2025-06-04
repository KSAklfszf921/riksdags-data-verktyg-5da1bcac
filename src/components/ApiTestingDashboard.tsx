
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TestTube, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  RefreshCw,
  Database,
  Server,
  Zap
} from "lucide-react";

interface TestResult {
  endpoint: string;
  status: 'success' | 'error' | 'running' | 'pending';
  duration?: number;
  message?: string;
  timestamp?: string;
}

const ApiTestingDashboard: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('endpoints');

  const endpoints = [
    { name: 'Member Data API', url: '/api/members', category: 'members' },
    { name: 'Document API', url: '/api/documents', category: 'documents' },
    { name: 'Speech API', url: '/api/speeches', category: 'speeches' },
    { name: 'Vote API', url: '/api/votes', category: 'votes' },
    { name: 'Calendar API', url: '/api/calendar', category: 'calendar' },
    { name: 'Party API', url: '/api/parties', category: 'parties' },
  ];

  const runSingleTest = async (endpoint: any) => {
    setTestResults(prev => [
      ...prev.filter(r => r.endpoint !== endpoint.name),
      { endpoint: endpoint.name, status: 'running', timestamp: new Date().toISOString() }
    ]);

    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const success = Math.random() > 0.2; // 80% success rate
    setTestResults(prev => [
      ...prev.filter(r => r.endpoint !== endpoint.name),
      {
        endpoint: endpoint.name,
        status: success ? 'success' : 'error',
        duration: Math.floor(100 + Math.random() * 500),
        message: success ? 'API responding correctly' : 'Connection timeout',
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    for (const endpoint of endpoints) {
      await runSingleTest(endpoint);
    }
    
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge className="bg-blue-500">Running</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TestTube className="w-5 h-5" />
              <span>API Testing Dashboard</span>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={runAllTests} 
                disabled={isRunning}
                className="flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>{isRunning ? 'Running Tests...' : 'Run All Tests'}</span>
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Test all API endpoints and monitor system connectivity
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {endpoints.map((endpoint) => {
              const result = testResults.find(r => r.endpoint === endpoint.name);
              return (
                <Card key={endpoint.name}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(result?.status || 'pending')}
                        <div>
                          <h3 className="font-medium">{endpoint.name}</h3>
                          <p className="text-sm text-gray-600">{endpoint.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {result && getStatusBadge(result.status)}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => runSingleTest(endpoint)}
                          disabled={result?.status === 'running'}
                        >
                          Test
                        </Button>
                      </div>
                    </div>
                    {result && result.duration && (
                      <p className="text-xs text-gray-500 mt-2">
                        Response time: {result.duration}ms
                      </p>
                    )}
                    {result && result.message && (
                      <p className="text-xs mt-1">
                        {result.message}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Results Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <TestTube className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No test results yet. Run some tests to see results here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <span className="font-medium">{result.endpoint}</span>
                          {result.duration && (
                            <span className="text-sm text-gray-600 ml-2">
                              ({result.duration}ms)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(result.status)}
                        {result.timestamp && (
                          <span className="text-sm text-gray-500">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {testResults.filter(r => r.status === 'success').length}
                  </div>
                  <div className="text-sm text-gray-600">Successful Tests</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {testResults.filter(r => r.status === 'error').length}
                  </div>
                  <div className="text-sm text-gray-600">Failed Tests</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {testResults.length > 0 
                      ? Math.round(testResults.reduce((acc, r) => acc + (r.duration || 0), 0) / testResults.length)
                      : 0}ms
                  </div>
                  <div className="text-sm text-gray-600">Avg Response Time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiTestingDashboard;
