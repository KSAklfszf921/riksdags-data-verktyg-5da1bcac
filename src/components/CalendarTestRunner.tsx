
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, RefreshCw, CheckCircle, XCircle, Clock, Database, Cloud, Globe } from 'lucide-react';
import { RiksdagApiTester } from '../utils/apiTester';
import { EdgeFunctionTester } from '../utils/edgeFunctionTester';
import { DatabaseTester } from '../utils/databaseTester';
import { EnhancedTester, DetailedTestResult } from '../utils/enhancedTestUtils';

class EnhancedCalendarTester extends EnhancedTester {
  constructor() {
    super('Enhanced Calendar Test Suite');
  }

  async runAllCalendarTests(): Promise<void> {
    // API Tests
    const apiTester = new RiksdagApiTester();
    await this.runTest('Riksdag API Direct Access', () => apiTester.testDirectApiAccess());
    await this.runTest('Multiple API Endpoints', () => apiTester.testMultipleEndpoints());
    await this.runTest('API Response Time', () => apiTester.testApiResponseTime());

    // Database Tests  
    const dbTester = new DatabaseTester();
    await this.runTest('Database Connection', () => dbTester.testDatabaseConnection());
    await this.runTest('Calendar Data Table', () => dbTester.testCalendarDataTable());
    await this.runTest('Data Integrity', () => dbTester.testDataIntegrity());
    await this.runTest('Query Performance', () => dbTester.testQueryPerformance());

    // Edge Function Tests
    const edgeTester = new EdgeFunctionTester();
    await this.runTest('Calendar Data Sync', () => edgeTester.testCalendarDataSync());
    await this.runTest('Edge Function Error Handling', () => edgeTester.testEdgeFunctionError());
    await this.runTest('Edge Function Timeout', () => edgeTester.testEdgeFunctionTimeout());
  }
}

const CalendarTestRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testSuite, setTestSuite] = useState<any>(null);
  const [currentTest, setCurrentTest] = useState<string>('');

  const runAllTests = async () => {
    setIsRunning(true);
    setTestSuite(null);
    setCurrentTest('');

    try {
      const tester = new EnhancedCalendarTester();
      
      setCurrentTest('Running comprehensive calendar tests...');
      await tester.runAllCalendarTests();
      
      setTestSuite(tester.getSummary());
    } catch (error) {
      console.error('Calendar test execution failed:', error);
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
    if (!testSuite) return { passed: 0, total: 0, successRate: 0 };
    
    const passed = testSuite.results.filter((r: any) => r.success).length;
    const total = testSuite.results.length;
    const successRate = total > 0 ? (passed / total) * 100 : 0;
    
    return { passed, total, successRate };
  };

  const renderTestResult = (result: DetailedTestResult) => (
    <div key={result.name} className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center space-x-3">
        {result.success ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
        <div>
          <div className="font-medium">{result.name}</div>
          <div className="text-sm text-gray-500">{result.message}</div>
          {!result.success && result.errorDetails && (
            <div className="text-xs text-red-600 mt-1">
              {result.errorType}: {result.errorDetails.errorMessage}
            </div>
          )}
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
            Enhanced Calendar Test Suite
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
            Comprehensive testing for calendar functionality with detailed error reporting
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

      {/* Test Results */}
      {testSuite && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Test Results Summary</CardTitle>
              <CardDescription>
                Overall test execution results with enhanced diagnostics
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Detailed Test Results</span>
                <Badge variant={stats.successRate === 100 ? 'default' : 'destructive'}>
                  {stats.successRate.toFixed(1)}% passed
                </Badge>
              </CardTitle>
              <CardDescription>
                {testSuite.results.length} tests completed in {testSuite.summary?.totalDuration || 0}ms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testSuite.results.map(renderTestResult)}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default CalendarTestRunner;
