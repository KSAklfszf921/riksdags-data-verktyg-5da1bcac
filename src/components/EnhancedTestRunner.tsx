
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Database,
  Zap,
  Shield,
  Activity,
  Search,
  Filter,
  Clock,
  Download,
  FileText
} from 'lucide-react';
import { ApiTestSuite } from '../utils/apiTestSuite';
import { DataValidationSuite } from '../utils/dataValidationSuite';
import { ComprehensiveApiTestSuite } from '../utils/comprehensiveTestSuite';
import { SearchFilterTestSuite } from '../utils/searchFilterTestSuite';
import { EnhancedTestSuite, DetailedTestResult } from '../utils/enhancedTestUtils';
import CalendarTestRunner from './CalendarTestRunner';

interface TestReport {
  timestamp: string;
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    overallSuccessRate: number;
    totalDuration: number;
  };
  suites: EnhancedTestSuite[];
  logs: string[];
  problems: string[];
}

const EnhancedTestRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [apiSuite, setApiSuite] = useState<EnhancedTestSuite | null>(null);
  const [validationSuite, setValidationSuite] = useState<EnhancedTestSuite | null>(null);
  const [comprehensiveSuite, setComprehensiveSuite] = useState<EnhancedTestSuite | null>(null);
  const [searchFilterSuite, setSearchFilterSuite] = useState<EnhancedTestSuite | null>(null);
  const [calendarSuite, setCalendarSuite] = useState<EnhancedTestSuite | null>(null);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [finalReport, setFinalReport] = useState<TestReport | null>(null);
  const [testLogs, setTestLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('sv-SE');
    const logEntry = `[${timestamp}] ${message}`;
    setTestLogs(prev => [...prev, logEntry]);
    console.log(logEntry);
  };

  const runApiTests = async () => {
    setIsRunning(true);
    setApiSuite(null);
    setProgress(0);

    try {
      addLog('Starting API tests...');
      const tester = new ApiTestSuite();
      const tests = [
        'Supabase Connection',
        'Calendar Data API',
        'Speech Data API', 
        'Vote Data API',
        'Document Data API',
        'Member Data API',
        'Party Data API',
        'Language Analysis API'
      ];

      for (let i = 0; i < tests.length; i++) {
        const testName = tests[i];
        setCurrentTest(`Running ${testName}...`);
        addLog(`Executing ${testName}`);
        setProgress((i / tests.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await tester.runAllApiTests();
      const suite = tester.getSummary();
      setApiSuite(suite);
      addLog(`API tests completed: ${suite.summary.passed}/${suite.summary.total} passed`);
    } catch (error) {
      addLog(`API test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('API test execution failed:', error);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
      setProgress(100);
    }
  };

  const runValidationTests = async () => {
    setIsRunning(true);
    setValidationSuite(null);
    setProgress(0);

    try {
      addLog('Starting validation tests...');
      const tester = new DataValidationSuite();
      const tests = [
        'Calendar Data Integrity',
        'Member Data Consistency',
        'Speech Data Quality',
        'Vote Data Completeness'
      ];

      for (let i = 0; i < tests.length; i++) {
        const testName = tests[i];
        setCurrentTest(`Running ${testName}...`);
        addLog(`Executing ${testName}`);
        setProgress((i / tests.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await tester.runAllValidationTests();
      const suite = tester.getSummary();
      setValidationSuite(suite);
      addLog(`Validation tests completed: ${suite.summary.passed}/${suite.summary.total} passed`);
    } catch (error) {
      addLog(`Validation test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Validation test execution failed:', error);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
      setProgress(100);
    }
  };

  const runComprehensiveTests = async () => {
    setIsRunning(true);
    setComprehensiveSuite(null);
    setProgress(0);

    try {
      addLog('Starting comprehensive tests...');
      const tester = new ComprehensiveApiTestSuite();
      const tests = [
        'Member Basic Fetching',
        'Member Details with Assignments',
        'Committee Filtering',
        'Member Search',
        'Member Documents',
        'Member Speeches',
        'Calendar Data Formatting',
        'Speech Data Quality',
        'Vote Data Structure',
        'Document Search',
        'Party Data Accuracy',
        'Language Analysis Data',
        'Data Sync Log Integrity'
      ];

      for (let i = 0; i < tests.length; i++) {
        const testName = tests[i];
        setCurrentTest(`Running ${testName}...`);
        addLog(`Executing ${testName}`);
        setProgress((i / tests.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await tester.runAllComprehensiveTests();
      const suite = tester.getSummary();
      setComprehensiveSuite(suite);
      addLog(`Comprehensive tests completed: ${suite.summary.passed}/${suite.summary.total} passed`);
    } catch (error) {
      addLog(`Comprehensive test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Comprehensive test execution failed:', error);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
      setProgress(100);
    }
  };

  const runSearchFilterTests = async () => {
    setIsRunning(true);
    setSearchFilterSuite(null);
    setProgress(0);

    try {
      addLog('Starting search & filter tests...');
      const tester = new SearchFilterTestSuite();
      const tests = [
        'Member Name Search',
        'Party Filtering',
        'Committee Search',
        'Document Type Filtering',
        'Date Range Filtering',
        'Vote Search by Topic',
        'Language Analysis Filtering'
      ];

      for (let i = 0; i < tests.length; i++) {
        const testName = tests[i];
        setCurrentTest(`Running ${testName}...`);
        addLog(`Executing ${testName}`);
        setProgress((i / tests.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await tester.runAllSearchFilterTests();
      const suite = tester.getSummary();
      setSearchFilterSuite(suite);
      addLog(`Search & filter tests completed: ${suite.summary.passed}/${suite.summary.total} passed`);
    } catch (error) {
      addLog(`Search & filter test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Search/Filter test execution failed:', error);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
      setProgress(100);
    }
  };

  const runAllTests = async () => {
    setTestLogs([]);
    setFinalReport(null);
    addLog('Starting complete test suite execution...');
    
    await runApiTests();
    setTimeout(async () => {
      await runValidationTests();
      setTimeout(async () => {
        await runComprehensiveTests();
        setTimeout(async () => {
          await runSearchFilterTests();
          setTimeout(() => {
            generateFinalReport();
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const generateFinalReport = () => {
    const suites = [apiSuite, validationSuite, comprehensiveSuite, searchFilterSuite, calendarSuite].filter(Boolean) as EnhancedTestSuite[];
    
    const totalTests = suites.reduce((sum, suite) => sum + suite.summary.total, 0);
    const passedTests = suites.reduce((sum, suite) => sum + suite.summary.passed, 0);
    const failedTests = totalTests - passedTests;
    const totalDuration = suites.reduce((sum, suite) => sum + suite.summary.totalDuration, 0);
    const overallSuccessRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    // Collect problems from failed tests
    const problems: string[] = [];
    suites.forEach(suite => {
      suite.results.forEach(result => {
        if (!result.success) {
          problems.push(`${suite.name} - ${result.name}: ${result.message}`);
        }
      });
    });

    const report: TestReport = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        passedTests,
        failedTests,
        overallSuccessRate,
        totalDuration
      },
      suites,
      logs: testLogs,
      problems
    };

    setFinalReport(report);
    addLog(`Final report generated: ${passedTests}/${totalTests} tests passed (${overallSuccessRate.toFixed(1)}%)`);
  };

  const downloadReport = () => {
    if (!finalReport) return;

    const reportData = JSON.stringify(finalReport, null, 2);
    const blob = new Blob([reportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getErrorTypeIcon = (errorType?: string) => {
    switch (errorType) {
      case 'API_ERROR': return <Database className="w-4 h-4 text-red-500" />;
      case 'DATA_ERROR': return <Shield className="w-4 h-4 text-orange-500" />;
      case 'VALIDATION_ERROR': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const renderDetailedTestResult = (result: DetailedTestResult) => (
    <Card key={result.name} className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0 mt-1">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                getErrorTypeIcon(result.errorType)
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium">{result.name}</div>
              <div className="text-sm text-gray-600 mt-1">{result.message}</div>
              
              {!result.success && result.errorDetails && (
                <div className="mt-2 p-2 bg-red-50 rounded text-xs">
                  <div className="font-medium text-red-800">Error Details:</div>
                  {result.errorDetails.errorMessage && (
                    <div className="text-red-700">Message: {result.errorDetails.errorMessage}</div>
                  )}
                  {result.errorDetails.apiEndpoint && (
                    <div className="text-red-700">Endpoint: {result.errorDetails.apiEndpoint}</div>
                  )}
                  {result.errorDetails.statusCode && (
                    <div className="text-red-700">Status: {result.errorDetails.statusCode}</div>
                  )}
                </div>
              )}
              
              {result.success && result.data && (
                <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                  <div className="font-medium text-green-800">Success Data:</div>
                  <pre className="text-green-700 whitespace-pre-wrap">
                    {JSON.stringify(result.data, null, 2).substring(0, 200)}
                    {JSON.stringify(result.data, null, 2).length > 200 && '...'}
                  </pre>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Badge variant={result.success ? 'default' : 'destructive'}>
              {result.duration}ms
            </Badge>
            {result.errorType && (
              <Badge variant="outline">{result.errorType}</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTestSuite = (suite: EnhancedTestSuite) => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {suite.name}
            <div className="flex items-center space-x-2">
              <Badge variant={suite.summary.successRate === 100 ? 'default' : 'destructive'}>
                {suite.summary.successRate.toFixed(1)}% Success
              </Badge>
              <Activity className="w-5 h-5" />
            </div>
          </CardTitle>
          <CardDescription>
            {suite.summary.passed}/{suite.summary.total} tests passed • 
            {suite.summary.totalDuration}ms total • 
            {suite.summary.averageDuration.toFixed(0)}ms average
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{suite.summary.passed}</div>
              <div className="text-sm text-gray-500">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{suite.summary.failed}</div>
              <div className="text-sm text-gray-500">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{suite.summary.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{suite.summary.totalDuration}ms</div>
              <div className="text-sm text-gray-500">Duration</div>
            </div>
          </div>
          <Progress value={suite.summary.successRate} className="mb-4" />
        </CardContent>
      </Card>

      <div className="space-y-2">
        {suite.results.map(renderDetailedTestResult)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Enhanced Test Control Panel
            <div className="flex space-x-2">
              <Button onClick={runApiTests} disabled={isRunning} size="sm">
                {isRunning ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
                API Tests
              </Button>
              <Button onClick={runValidationTests} disabled={isRunning} size="sm" variant="outline">
                {isRunning ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                Validation Tests
              </Button>
              <Button onClick={runComprehensiveTests} disabled={isRunning} size="sm" variant="outline">
                {isRunning ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Activity className="w-4 h-4 mr-2" />}
                Comprehensive Tests
              </Button>
              <Button onClick={runSearchFilterTests} disabled={isRunning} size="sm" variant="outline">
                {isRunning ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                Search & Filter Tests
              </Button>
              <Button onClick={runAllTests} disabled={isRunning}>
                {isRunning ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                Run All Tests
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Comprehensive testing of all analysis tools with detailed error reporting and final report generation
          </CardDescription>
        </CardHeader>
        {isRunning && (
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">{currentTest}</div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        )}
      </Card>

      {finalReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Final Test Report</span>
              </div>
              <Button onClick={downloadReport} size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{finalReport.summary.totalTests}</div>
                <div className="text-sm text-gray-500">Total Tests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{finalReport.summary.passedTests}</div>
                <div className="text-sm text-gray-500">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{finalReport.summary.failedTests}</div>
                <div className="text-sm text-gray-500">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{finalReport.summary.overallSuccessRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-500">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{finalReport.summary.totalDuration}ms</div>
                <div className="text-sm text-gray-500">Total Duration</div>
              </div>
            </div>
            
            {finalReport.problems.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-red-600 mb-2">Problems Found ({finalReport.problems.length})</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {finalReport.problems.slice(0, 10).map((problem, index) => (
                    <div key={index} className="text-sm bg-red-50 p-2 rounded border border-red-200">
                      {problem}
                    </div>
                  ))}
                  {finalReport.problems.length > 10 && (
                    <div className="text-xs text-gray-500 text-center">
                      ... and {finalReport.problems.length - 10} more problems
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {(apiSuite || validationSuite || comprehensiveSuite || searchFilterSuite) && (
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            Tests completed! Review the detailed results below to identify any issues that need attention.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="api" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="api">API Tests</TabsTrigger>
          <TabsTrigger value="validation">Data Validation</TabsTrigger>
          <TabsTrigger value="comprehensive">Comprehensive</TabsTrigger>
          <TabsTrigger value="search">Search & Filter</TabsTrigger>
          <TabsTrigger value="calendar">Calendar Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-4">
          {apiSuite ? renderTestSuite(apiSuite) : (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                Run API tests to see results here
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          {validationSuite ? renderTestSuite(validationSuite) : (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                Run validation tests to see results here
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="comprehensive" className="space-y-4">
          {comprehensiveSuite ? renderTestSuite(comprehensiveSuite) : (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                Run comprehensive tests to see results here
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          {searchFilterSuite ? renderTestSuite(searchFilterSuite) : (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                Run search & filter tests to see results here
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <CalendarTestRunner />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedTestRunner;
