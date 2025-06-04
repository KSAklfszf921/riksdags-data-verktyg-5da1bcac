
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, RefreshCw, CheckCircle, XCircle, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CalendarTester, TestResult } from '../utils/testUtils';

class MemberTester extends CalendarTester {
  
  async testMemberDataAccess(): Promise<TestResult> {
    return this.runTest('Member Data Access', async () => {
      console.log('Testing member data access...');
      
      const { count, error } = await supabase
        .from('member_data')
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw new Error(`Member data access failed: ${error.message}`);
      }

      return {
        memberCount: count || 0,
        accessible: true
      };
    });
  }

  async testPartyDistribution(): Promise<TestResult> {
    return this.runTest('Party Distribution Analysis', async () => {
      console.log('Testing party distribution...');
      
      const { data, error } = await supabase
        .from('party_data')
        .select('party_code, total_members, active_members')
        .order('total_members', { ascending: false })
        .limit(10);

      if (error) {
        throw new Error(`Party data access failed: ${error.message}`);
      }

      return {
        partiesFound: data?.length || 0,
        totalMembers: data?.reduce((sum, p) => sum + (p.total_members || 0), 0) || 0,
        dataAvailable: (data?.length || 0) > 0
      };
    });
  }

  async testMemberSearch(): Promise<TestResult> {
    return this.runTest('Member Search Functionality', async () => {
      console.log('Testing member search...');
      
      const { data, error } = await supabase
        .from('member_data')
        .select('*')
        .ilike('first_name', '%Anders%')
        .limit(10);

      if (error) {
        throw new Error(`Member search failed: ${error.message}`);
      }

      return {
        searchResults: data?.length || 0,
        searchWorking: true
      };
    });
  }

  getSummary() {
    return {
      name: 'Member Analysis Tests',
      results: this.results,
      startTime: this.startTime,
      endTime: Date.now()
    };
  }
}

const MemberAnalysisTestRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testSuite, setTestSuite] = useState<any>(null);
  const [currentTest, setCurrentTest] = useState<string>('');

  const runTests = async () => {
    setIsRunning(true);
    setTestSuite(null);
    setCurrentTest('');

    try {
      const tester = new MemberTester();
      
      setCurrentTest('Testing member data access...');
      await tester.testMemberDataAccess();
      
      setCurrentTest('Testing party distribution...');
      await tester.testPartyDistribution();
      
      setCurrentTest('Testing member search...');
      await tester.testMemberSearch();
      
      setTestSuite(tester.getSummary());
    } catch (error) {
      console.error('Member test execution failed:', error);
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
          <User className="w-5 h-5" />
          <span className="font-medium">Ledamotanalys</span>
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

export default MemberAnalysisTestRunner;
