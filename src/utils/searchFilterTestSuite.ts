
import { supabase } from '@/integrations/supabase/client';

export interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  duration?: number;
  error?: string;
}

export class SearchFilterTestSuite {
  private results: TestResult[] = [];

  async runAllSearchFilterTests(): Promise<TestResult[]> {
    this.results = [];
    
    await this.testMemberNameSearch();
    await this.testPartyFiltering();
    await this.testCommitteeSearch();
    await this.testDocumentTypeFiltering();
    await this.testDateRangeFiltering();
    await this.testVoteSearchByTopic();
    await this.testLanguageAnalysisFiltering();
    
    return this.results;
  }

  private async testMemberNameSearch(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('enhanced_member_profiles')
        .select('member_id, first_name, last_name, party')
        .ilike('first_name', '%Anna%')
        .limit(5);
      
      if (error) {
        this.addResult('Member Name Search', 'fail', `Search failed: ${error.message}`, Date.now() - startTime);
        return;
      }

      const validResults = data?.filter(member => 
        member.first_name && member.last_name
      ) || [];

      if (validResults.length > 0) {
        this.addResult('Member Name Search', 'pass', `Found ${validResults.length} members with name search`, Date.now() - startTime);
      } else {
        this.addResult('Member Name Search', 'skip', 'No members found with test search criteria', Date.now() - startTime);
      }
    } catch (error) {
      this.addResult('Member Name Search', 'fail', `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private async testPartyFiltering(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('enhanced_member_profiles')
        .select('member_id, party')
        .eq('party', 'S')
        .limit(5);
      
      if (error) {
        this.addResult('Party Filtering', 'fail', `Party filter failed: ${error.message}`, Date.now() - startTime);
        return;
      }

      if (data && data.length > 0) {
        const allCorrectParty = data.every(member => member.party === 'S');
        if (allCorrectParty) {
          this.addResult('Party Filtering', 'pass', `Successfully filtered ${data.length} members by party`, Date.now() - startTime);
        } else {
          this.addResult('Party Filtering', 'fail', 'Party filtering returned incorrect results', Date.now() - startTime);
        }
      } else {
        this.addResult('Party Filtering', 'skip', 'No members found for test party', Date.now() - startTime);
      }
    } catch (error) {
      this.addResult('Party Filtering', 'fail', `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private async testCommitteeSearch(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('enhanced_member_profiles')
        .select('member_id, current_committees')
        .not('current_committees', 'is', null)
        .limit(5);
      
      if (error) {
        this.addResult('Committee Search', 'fail', `Committee search failed: ${error.message}`, Date.now() - startTime);
        return;
      }

      if (data && data.length > 0) {
        this.addResult('Committee Search', 'pass', `Found ${data.length} members with committee assignments`, Date.now() - startTime);
      } else {
        this.addResult('Committee Search', 'skip', 'No members found with committee assignments', Date.now() - startTime);
      }
    } catch (error) {
      this.addResult('Committee Search', 'fail', `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private async testDocumentTypeFiltering(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('document_data')
        .select('document_id, typ')
        .eq('typ', 'Motion')
        .limit(5);
      
      if (error) {
        this.addResult('Document Type Filtering', 'fail', `Document filter failed: ${error.message}`, Date.now() - startTime);
        return;
      }

      if (data && data.length > 0) {
        this.addResult('Document Type Filtering', 'pass', `Found ${data.length} documents of specified type`, Date.now() - startTime);
      } else {
        this.addResult('Document Type Filtering', 'skip', 'No documents found for test type', Date.now() - startTime);
      }
    } catch (error) {
      this.addResult('Document Type Filtering', 'fail', `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private async testDateRangeFiltering(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('calendar_data')
        .select('event_id, datum')
        .gte('datum', '2023-01-01')
        .lte('datum', '2023-12-31')
        .limit(5);
      
      if (error) {
        this.addResult('Date Range Filtering', 'fail', `Date filter failed: ${error.message}`, Date.now() - startTime);
        return;
      }

      if (data && data.length > 0) {
        this.addResult('Date Range Filtering', 'pass', `Found ${data.length} events in date range`, Date.now() - startTime);
      } else {
        this.addResult('Date Range Filtering', 'skip', 'No events found in test date range', Date.now() - startTime);
      }
    } catch (error) {
      this.addResult('Date Range Filtering', 'fail', `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private async testVoteSearchByTopic(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('vote_data')
        .select('vote_id, beteckning')
        .ilike('beteckning', '%2023%')
        .limit(5);
      
      if (error) {
        this.addResult('Vote Search by Topic', 'fail', `Vote search failed: ${error.message}`, Date.now() - startTime);
        return;
      }

      if (data && data.length > 0) {
        this.addResult('Vote Search by Topic', 'pass', `Found ${data.length} votes matching search criteria`, Date.now() - startTime);
      } else {
        this.addResult('Vote Search by Topic', 'skip', 'No votes found for test search criteria', Date.now() - startTime);
      }
    } catch (error) {
      this.addResult('Vote Search by Topic', 'fail', `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private async testLanguageAnalysisFiltering(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('language_analysis')
        .select('id, member_id, overall_score')
        .gte('overall_score', 70)
        .limit(5);
      
      if (error) {
        this.addResult('Language Analysis Filtering', 'fail', `Language analysis filter failed: ${error.message}`, Date.now() - startTime);
        return;
      }

      if (data && data.length > 0) {
        const validResults = data.filter(analysis => analysis.overall_score >= 70);
        if (validResults.length === data.length) {
          this.addResult('Language Analysis Filtering', 'pass', `Found ${data.length} analyses with high scores`, Date.now() - startTime);
        } else {
          this.addResult('Language Analysis Filtering', 'fail', 'Filter returned incorrect score ranges', Date.now() - startTime);
        }
      } else {
        this.addResult('Language Analysis Filtering', 'skip', 'No language analyses found with high scores', Date.now() - startTime);
      }
    } catch (error) {
      this.addResult('Language Analysis Filtering', 'fail', `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private addResult(name: string, status: 'pass' | 'fail' | 'skip', message: string, duration?: number): void {
    this.results.push({
      name,
      status,
      message,
      duration
    });
  }

  getResults(): TestResult[] {
    return this.results;
  }

  getSummary(): { total: number; passed: number; failed: number; skipped: number } {
    return {
      total: this.results.length,
      passed: this.results.filter(r => r.status === 'pass').length,
      failed: this.results.filter(r => r.status === 'fail').length,
      skipped: this.results.filter(r => r.status === 'skip').length
    };
  }
}

export default SearchFilterTestSuite;
