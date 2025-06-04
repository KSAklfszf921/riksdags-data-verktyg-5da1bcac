
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, RefreshCw, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CalendarTester, TestResult } from '../utils/testUtils';

class SpeechTester extends CalendarTester {
  
  async testSpeechDataAccess(): Promise<TestResult> {
    return this.runTest('Speech Data Access', async () => {
      console.log('Testing speech data access via document_data...');
      
      const { count, error } = await supabase
        .from('document_data')
        .select('*', { count: 'exact', head: true })
        .not('content_preview', 'is', null);

      if (error) {
        throw new Error(`Speech data access failed: ${error.message}`);
      }

      return {
        speechCount: count || 0,
        accessible: true
      };
    });
  }

  async testSpeechSearch(): Promise<TestResult> {
    return this.runTest('Speech Search Functionality', async () => {
      console.log('Testing speech search via document_data...');
      
      const { data, error } = await supabase
        .from('document_data')
        .select('*')
        .ilike('content_preview', '%debatt%')
        .limit(10);

      if (error) {
        throw new Error(`Speech search failed: ${error.message}`);
      }

      return {
        searchResults: data?.length || 0,
        searchWorking: true
      };
    });
  }

  async testLanguageAnalysis(): Promise<TestResult> {
    return this.runTest('Language Analysis Data', async () => {
      console.log('Testing language analysis data...');
      
      const { count, error } = await supabase
        .from('language_analysis')
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw new Error(`Language analysis access failed: ${error.message}`);
      }

      return {
        analysisCount: count || 0,
        dataAvailable: (count || 0) > 0
      };
    });
  }

  getSummary() {
    return {
      name: 'Speech Analysis Tests',
      results: this.results,
      startTime: this.startTime,
      endTime: Date.now()
    };
  }
}

const SpeechAnalysisTestRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testSuite, setTestSuite] = useState<any>(null);
  const [currentTest, setCurrentTest] = useState<string>('');

  const runTests = async () => {
    setIsRunning(true);
    setTestSuite(null);
    setCurrentTest('');

    try {
      const tester = new SpeechTester();
      
      setCurrentTest('Testing speech data access...');
      await tester.testSpeechDataAccess();
      
      setCurrentTest('Testing speech search...');
      await tester.testSpeechSearch();
      
      setCurrentTest('Testing language analysis...');
      await tester.testLanguageAnalysis();
      
      setTestSuite(tester.getSummary());
    } catch (error) {
      console.error('Speech test execution failed:', error);
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
          <MessageSquare className="w-5 h-5" />
          <span className="font-medium">Anförandeanalys</span>
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

export default SpeechAnalysisTestRunner;
