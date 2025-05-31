
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, RefreshCw, CheckCircle, XCircle, Vote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CalendarTester, TestResult } from '../utils/testUtils';

class VoteTester extends CalendarTester {
  
  async testVoteDataAccess(): Promise<TestResult> {
    return this.runTest('Vote Data Access', async () => {
      console.log('Testing vote data access...');
      
      const { count, error } = await supabase
        .from('vote_data')
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw new Error(`Vote data access failed: ${error.message}`);
      }

      return {
        voteCount: count || 0,
        accessible: true
      };
    });
  }

  async testVoteStatistics(): Promise<TestResult> {
    return this.runTest('Vote Statistics Processing', async () => {
      console.log('Testing vote statistics...');
      
      const { data, error } = await supabase
        .from('vote_data')
        .select('vote_statistics, party_breakdown')
        .not('vote_statistics', 'is', null)
        .limit(5);

      if (error) {
        throw new Error(`Vote statistics access failed: ${error.message}`);
      }

      return {
        statisticsAvailable: data?.length || 0,
        hasBreakdowns: data?.some(v => v.party_breakdown) || false
      };
    });
  }

  async testVoteSearch(): Promise<TestResult> {
    return this.runTest('Vote Search Functionality', async () => {
      console.log('Testing vote search...');
      
      const { data, error } = await supabase
        .from('vote_data')
        .select('*')
        .ilike('beteckning', '%2023/24%')
        .limit(10);

      if (error) {
        throw new Error(`Vote search failed: ${error.message}`);
      }

      return {
        searchResults: data?.length || 0,
        searchWorking: true
      };
    });
  }

  getSummary() {
    return {
      name: 'Vote Analysis Tests',
      results: this.results,
      startTime: this.startTime,
      endTime: Date.now()
    };
  }
}

const VoteAnalysisTestRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testSuite, setTestSuite] = useState<any>(null);
  const [currentTest, setCurrentTest] = useState<string>('');

  const runTests = async () => {
    setIsRunning(true);
    setTestSuite(null);
    setCurrentTest('');

    try {
      const tester = new VoteTester();
      
      setCurrentTest('Testing vote data access...');
      await tester.testVoteDataAccess();
      
      setCurrentTest('Testing vote statistics...');
      await tester.testVoteStatistics();
      
      setCurrentTest('Testing vote search...');
      await tester.testVoteSearch();
      
      setTestSuite(tester.getSummary());
    } catch (error) {
      console.error('Vote test execution failed:', error);
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
          <Vote className="w-5 h-5" />
          <span className="font-medium">Voteringsanalys</span>
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

export default VoteAnalysisTestRunner;
