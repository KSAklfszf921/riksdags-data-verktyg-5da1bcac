
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, RefreshCw, CheckCircle, XCircle, Clock, Database, Cloud, Globe } from 'lucide-react';
import { RiksdagApiTester } from '../utils/apiTester';
import { EdgeFunctionTester } from '../utils/edgeFunctionTester';
import { DatabaseTester } from '../utils/databaseTester';
import { TestSuite, TestResult } from '../utils/testUtils';

const CalendarTestRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');

  const runAllTests = async () => {
    setIsRunning(true);
    setTestSuites([]);
    setCurrentTest('');

    try {
      // API Tests
      setCurrentTest('Running API tests...');
      const apiTester = new RiksdagApiTester();
      await apiTester.testDirectApiAccess();
      await apiTester.testMultipleEndpoints();
      await apiTester.testApiResponseTime();
      setTestSuites(prev => [...prev, apiTester.getSummary()]);

      // Database Tests
      setCurrentTest('Running database tests...');
      const dbTester = new DatabaseTester();
      await dbTester.testDatabaseConnection();
      await dbTester.testCalendarDataTable();
      await dbTester.testDataIntegrity();
      await dbTester.testQueryPerformance();
      setTestSuites(prev => [...prev, dbTester.getSummary()]);

      // Edge Function Tests
      setCurrentTest('Running edge function tests...');
      const edgeTester = new EdgeFunctionTester();
      await edgeTester.testCalendarDataSync();
      await edgeTester.testEdgeFunctionError();
      await edgeTester.testEdgeFunctionTimeout();
      setTestSuites(prev => [...prev, edgeTester.getSummary()]);

    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const getTestIcon = (testType: string) => {
    if (testType.includes('API')) return Globe;
    if (testType.includes('Database')) return Database;
    if (testType.includes('Edge')) return Cloud;
    return Clock;
  };

  const getTotalStats = () => {
    const allResults = testSuites.flatMap(suite => suite.results);
    const passed = allResults.filter(r => r.success).length;
    const total = allResults.length;
    const successRate = total > 0 ? (passed / total) * 100 : 0;
    
    return { passed, total, successRate };
  };

  const renderTestResult = (result: TestResult) => (
    <div key={result.name} className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center space-x-3">
        {result.success ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
        <div>
          <div className="font-medium">{result.name}</div>
          <div className="text-sm text-gray-500">
            {result.success ? result.message : result.message}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Badge variant={result.success ? 'default' : 'destructive'}>
          {result.duration}ms
        </Badge>
      </div>
    </div>
  );

  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Test Control Panel
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex items-center space-x-2"
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{isRunning ? 'Running Tests' : 'Run All Tests'}</span>
            </Button>
          </CardTitle>
          <CardDescription>
            Comprehensive test suite for calendar functionality
          </CardDescription>
        </CardHeader>
        {isRunning && (
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">{currentTest}</div>
              <Progress value={undefined} className="w-full" />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Test Results Summary */}
      {testSuites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results Summary</CardTitle>
            <CardDescription>
              Overall test execution results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
                <div className="text-sm text-gray-500">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.total - stats.passed}</div>
                <div className="text-sm text-gray-500">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.successRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-500">Success Rate</div>
              </div>
            </div>
            <Progress value={stats.successRate} className="w-full" />
          </CardContent>
        </Card>
      )}

      {/* Test Suite Results */}
      {testSuites.map((suite, index) => {
        const Icon = getTestIcon(suite.name);
        const successRate = suite.results.length > 0 ? 
          (suite.results.filter(r => r.success).length / suite.results.length) * 100 : 0;

        return (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Icon className="w-5 h-5" />
                <span>{suite.name}</span>
                <Badge variant={successRate === 100 ? 'default' : successRate > 50 ? 'secondary' : 'destructive'}>
                  {successRate.toFixed(1)}% passed
                </Badge>
              </CardTitle>
              <CardDescription>
                {suite.results.length} tests completed in {((suite.endTime || Date.now()) - suite.startTime)}ms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suite.results.map(renderTestResult)}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CalendarTestRunner;
