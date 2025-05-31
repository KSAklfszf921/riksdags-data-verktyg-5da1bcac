
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Database, 
  Globe, 
  Monitor, 
  Settings,
  Loader2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiksdagApiTester } from '../utils/apiTester';
import { EdgeFunctionTester } from '../utils/edgeFunctionTester';
import { DatabaseTester } from '../utils/databaseTester';
import { FrontendTester } from '../utils/frontendTester';
import { TestResult, TestSuite } from '../utils/testUtils';

const CalendarTestRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<{
    api?: TestSuite;
    edge?: TestSuite;
    database?: TestSuite;
    frontend?: TestSuite;
  }>({});
  const [currentTest, setCurrentTest] = useState<string>('');
  const [progress, setProgress] = useState(0);

  const runAllTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setTestResults({});
    
    try {
      // API Tests
      setCurrentTest('Testing Riksdag API...');
      setProgress(10);
      const apiTester = new RiksdagApiTester();
      await apiTester.testDirectApiAccess();
      await apiTester.testMultipleEndpoints();
      await apiTester.testApiResponseTime();
      setTestResults(prev => ({ ...prev, api: apiTester.getSummary() }));

      // Edge Function Tests
      setCurrentTest('Testing Edge Functions...');
      setProgress(35);
      const edgeTester = new EdgeFunctionTester();
      await edgeTester.testCalendarDataSync();
      await edgeTester.testEdgeFunctionError();
      await edgeTester.testEdgeFunctionTimeout();
      setTestResults(prev => ({ ...prev, edge: edgeTester.getSummary() }));

      // Database Tests
      setCurrentTest('Testing Database...');
      setProgress(60);
      const dbTester = new DatabaseTester();
      await dbTester.testDatabaseConnection();
      await dbTester.testCalendarDataTable();
      await dbTester.testDataIntegrity();
      await dbTester.testQueryPerformance();
      setTestResults(prev => ({ ...prev, database: dbTester.getSummary() }));

      // Frontend Tests
      setCurrentTest('Testing Frontend...');
      setProgress(85);
      const frontendTester = new FrontendTester();
      await frontendTester.testComponentRendering();
      await frontendTester.testDataBinding();
      await frontendTester.testUserInteractions();
      await frontendTester.testErrorHandling();
      setTestResults(prev => ({ ...prev, frontend: frontendTester.getSummary() }));

      setProgress(100);
      setCurrentTest('Tests completed!');
    } catch (error) {
      console.error('Test execution failed:', error);
      setCurrentTest('Tests failed');
    } finally {
      setIsRunning(false);
    }
  };

  const runSingleTestSuite = async (suite: 'api' | 'edge' | 'database' | 'frontend') => {
    setIsRunning(true);
    setCurrentTest(`Running ${suite} tests...`);
    
    try {
      let tester;
      switch (suite) {
        case 'api':
          tester = new RiksdagApiTester();
          await tester.testDirectApiAccess();
          await tester.testMultipleEndpoints();
          await tester.testApiResponseTime();
          break;
        case 'edge':
          tester = new EdgeFunctionTester();
          await tester.testCalendarDataSync();
          await tester.testEdgeFunctionError();
          await tester.testEdgeFunctionTimeout();
          break;
        case 'database':
          tester = new DatabaseTester();
          await tester.testDatabaseConnection();
          await tester.testCalendarDataTable();
          await tester.testDataIntegrity();
          await tester.testQueryPerformance();
          break;
        case 'frontend':
          tester = new FrontendTester();
          await tester.testComponentRendering();
          await tester.testDataBinding();
          await tester.testUserInteractions();
          await tester.testErrorHandling();
          break;
      }
      
      if (tester) {
        setTestResults(prev => ({ ...prev, [suite]: tester.getSummary() }));
      }
    } catch (error) {
      console.error(`${suite} tests failed:`, error);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const getTestIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  };

  const getSuccessRate = (results: TestResult[]) => {
    const passed = results.filter(r => r.success).length;
    return results.length > 0 ? (passed / results.length) * 100 : 0;
  };

  const TestSuiteCard = ({ 
    title, 
    icon, 
    suite, 
    results,
    onRun 
  }: { 
    title: string; 
    icon: React.ReactNode; 
    suite: string;
    results?: TestSuite;
    onRun: () => void;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {icon}
          <span>{title}</span>
          {results && (
            <Badge variant={getSuccessRate(results.results) === 100 ? "default" : "destructive"}>
              {getSuccessRate(results.results).toFixed(0)}%
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {results ? `${results.results.length} tests completed` : 'Not run yet'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Button 
            onClick={onRun} 
            disabled={isRunning}
            size="sm"
            variant="outline"
            className="w-full"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            Run Tests
          </Button>
          
          {results && (
            <div className="space-y-1">
              {results.results.map((result, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    {getTestIcon(result.success)}
                    <span className={result.success ? "text-green-700" : "text-red-700"}>
                      {result.name}
                    </span>
                  </div>
                  <span className="text-gray-500">{result.duration}ms</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Calendar Test Runner</span>
          </CardTitle>
          <CardDescription>
            Comprehensive testing suite for the calendar functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex-1"
            >
              {isRunning ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Run All Tests
            </Button>
          </div>
          
          {isRunning && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-600">{currentTest}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="edge">Edge Functions</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="frontend">Frontend</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TestSuiteCard
              title="API Tests"
              icon={<Globe className="w-5 h-5" />}
              suite="api"
              results={testResults.api}
              onRun={() => runSingleTestSuite('api')}
            />
            <TestSuiteCard
              title="Edge Function Tests"
              icon={<Settings className="w-5 h-5" />}
              suite="edge"
              results={testResults.edge}
              onRun={() => runSingleTestSuite('edge')}
            />
            <TestSuiteCard
              title="Database Tests"
              icon={<Database className="w-5 h-5" />}
              suite="database"
              results={testResults.database}
              onRun={() => runSingleTestSuite('database')}
            />
            <TestSuiteCard
              title="Frontend Tests"
              icon={<Monitor className="w-5 h-5" />}
              suite="frontend"
              results={testResults.frontend}
              onRun={() => runSingleTestSuite('frontend')}
            />
          </div>
        </TabsContent>

        {Object.entries(testResults).map(([key, suite]) => (
          <TabsContent key={key} value={key} className="space-y-4">
            {suite && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold capitalize">{key} Test Results</h3>
                  <Badge variant={getSuccessRate(suite.results) === 100 ? "default" : "destructive"}>
                    {suite.results.filter(r => r.success).length}/{suite.results.length} passed
                  </Badge>
                </div>
                
                {suite.results.map((result, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getTestIcon(result.success)}
                          <span>{result.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm text-gray-500">{result.duration}ms</span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Alert variant={result.success ? "default" : "destructive"}>
                        <AlertDescription>
                          {result.message}
                        </AlertDescription>
                      </Alert>
                      
                      {result.data && (
                        <div className="mt-4">
                          <details className="text-sm">
                            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                              View test data
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default CalendarTestRunner;
