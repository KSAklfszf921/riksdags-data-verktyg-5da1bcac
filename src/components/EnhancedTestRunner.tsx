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
  Filter
} from 'lucide-react';
import { ApiTestSuite } from '../utils/apiTestSuite';
import { DataValidationSuite } from '../utils/dataValidationSuite';
import { ComprehensiveApiTestSuite } from '../utils/comprehensiveTestSuite';
import { SearchFilterTestSuite } from '../utils/searchFilterTestSuite';
import { EnhancedTestSuite, DetailedTestResult } from '../utils/enhancedTestUtils';

const EnhancedTestRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [apiSuite, setApiSuite] = useState<EnhancedTestSuite | null>(null);
  const [validationSuite, setValidationSuite] = useState<EnhancedTestSuite | null>(null);
  const [comprehensiveSuite, setComprehensiveSuite] = useState<EnhancedTestSuite | null>(null);
  const [searchFilterSuite, setSearchFilterSuite] = useState<EnhancedTestSuite | null>(null);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [progress, setProgress] = useState(0);

  const runApiTests = async () => {
    setIsRunning(true);
    setApiSuite(null);
    setProgress(0);

    try {
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
        setCurrentTest(`Running ${tests[i]}...`);
        setProgress((i / tests.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for UI
      }

      await tester.runAllApiTests();
      setApiSuite(tester.getSummary());
    } catch (error) {
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
      const tester = new DataValidationSuite();
      const tests = [
        'Calendar Data Integrity',
        'Member Data Consistency',
        'Speech Data Quality',
        'Vote Data Completeness'
      ];

      for (let i = 0; i < tests.length; i++) {
        setCurrentTest(`Running ${tests[i]}...`);
        setProgress((i / tests.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await tester.runAllValidationTests();
      setValidationSuite(tester.getSummary());
    } catch (error) {
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
        setCurrentTest(`Running ${tests[i]}...`);
        setProgress((i / tests.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await tester.runAllComprehensiveTests();
      setComprehensiveSuite(tester.getSummary());
    } catch (error) {
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
        setCurrentTest(`Running ${tests[i]}...`);
        setProgress((i / tests.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await tester.runAllSearchFilterTests();
      setSearchFilterSuite(tester.getSummary());
    } catch (error) {
      console.error('Search/Filter test execution failed:', error);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
      setProgress(100);
    }
  };

  const runAllTests = async () => {
    await runApiTests();
    setTimeout(async () => {
      await runValidationTests();
      setTimeout(async () => {
        await runComprehensiveTests();
        setTimeout(async () => {
          await runSearchFilterTests();
        }, 1000);
      }, 1000);
    }, 1000);
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
            Comprehensive testing of all analysis tools with detailed error reporting, search functionality, and filtering
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

      {(apiSuite || validationSuite || comprehensiveSuite || searchFilterSuite) && (
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            Tests completed! Review the detailed results below to identify any issues that need attention.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="api" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api">API Tests</TabsTrigger>
          <TabsTrigger value="validation">Data Validation</TabsTrigger>
          <TabsTrigger value="comprehensive">Comprehensive</TabsTrigger>
          <TabsTrigger value="search">Search & Filter</TabsTrigger>
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
      </Tabs>
    </div>
  );
};

export default EnhancedTestRunner;
