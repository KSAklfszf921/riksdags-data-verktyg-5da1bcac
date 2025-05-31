
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, RefreshCw, CheckCircle, XCircle, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CalendarTester, TestResult } from '../utils/testUtils';

class DocumentTester extends CalendarTester {
  
  async testDocumentDataAccess(): Promise<TestResult> {
    return this.runTest('Document Data Access', async () => {
      console.log('Testing document data access...');
      
      const { count, error } = await supabase
        .from('document_data')
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw new Error(`Document data access failed: ${error.message}`);
      }

      return {
        documentCount: count || 0,
        accessible: true
      };
    });
  }

  async testDocumentSearch(): Promise<TestResult> {
    return this.runTest('Document Search Functionality', async () => {
      console.log('Testing document search...');
      
      const { data, error } = await supabase
        .from('document_data')
        .select('*')
        .ilike('titel', '%budget%')
        .limit(10);

      if (error) {
        throw new Error(`Document search failed: ${error.message}`);
      }

      return {
        searchResults: data?.length || 0,
        searchWorking: true
      };
    });
  }

  async testDocumentTypes(): Promise<TestResult> {
    return this.runTest('Document Type Distribution', async () => {
      console.log('Testing document types...');
      
      const { data, error } = await supabase
        .from('document_data')
        .select('typ')
        .not('typ', 'is', null)
        .limit(100);

      if (error) {
        throw new Error(`Document type query failed: ${error.message}`);
      }

      const types = [...new Set(data?.map(d => d.typ))];
      
      return {
        uniqueTypes: types.length,
        typesFound: types.slice(0, 5),
        diversity: types.length > 3
      };
    });
  }

  getSummary() {
    return {
      name: 'Document Analysis Tests',
      results: this.results,
      startTime: this.startTime,
      endTime: Date.now()
    };
  }
}

const DocumentAnalysisTestRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testSuite, setTestSuite] = useState<any>(null);
  const [currentTest, setCurrentTest] = useState<string>('');

  const runTests = async () => {
    setIsRunning(true);
    setTestSuite(null);
    setCurrentTest('');

    try {
      const tester = new DocumentTester();
      
      setCurrentTest('Testing document data access...');
      await tester.testDocumentDataAccess();
      
      setCurrentTest('Testing document search...');
      await tester.testDocumentSearch();
      
      setCurrentTest('Testing document types...');
      await tester.testDocumentTypes();
      
      setTestSuite(tester.getSummary());
    } catch (error) {
      console.error('Document test execution failed:', error);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
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
      <Badge variant={result.success ? 'default' : 'destructive'}>
        {result.duration}ms
      </Badge>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span className="font-medium">Dokumentanalys</span>
        </div>
        <Button 
          onClick={runTests} 
          disabled={isRunning}
          size="sm"
          className="flex items-center space-x-2"
        >
          {isRunning ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span>{isRunning ? 'Kör tester' : 'Starta tester'}</span>
        </Button>
      </div>

      {isRunning && (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">{currentTest}</div>
          <Progress value={undefined} className="w-full" />
        </div>
      )}

      {testSuite && (
        <div className="space-y-3">
          {testSuite.results.map(renderTestResult)}
        </div>
      )}
    </div>
  );
};

export default DocumentAnalysisTestRunner;
