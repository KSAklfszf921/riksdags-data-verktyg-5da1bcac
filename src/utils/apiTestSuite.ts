
import { supabase } from '@/integrations/supabase/client';

export interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  duration?: number;
  error?: string;
}

export class ApiTestSuite {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    this.results = [];
    
    await this.testDatabaseConnection();
    await this.testEnhancedMemberProfiles();
    await this.testPartyData();
    await this.testVoteData();
    await this.testDocumentData();
    await this.testCalendarData();
    await this.testLanguageAnalysis();
    
    return this.results;
  }

  private async testDatabaseConnection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { error } = await supabase.from('enhanced_member_profiles').select('id').limit(1);
      
      if (error) {
        this.addResult('Database Connection', 'fail', `Connection failed: ${error.message}`, Date.now() - startTime);
      } else {
        this.addResult('Database Connection', 'pass', 'Successfully connected to database', Date.now() - startTime);
      }
    } catch (error) {
      this.addResult('Database Connection', 'fail', `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private async testEnhancedMemberProfiles(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('enhanced_member_profiles')
        .select('id, member_id, first_name, last_name, party')
        .limit(5);
      
      if (error) {
        this.addResult('Enhanced Member Profiles', 'fail', `Query failed: ${error.message}`, Date.now() - startTime);
        return;
      }

      if (!data || data.length === 0) {
        this.addResult('Enhanced Member Profiles', 'skip', 'No data available', Date.now() - startTime);
        return;
      }

      // Test data structure
      const firstMember = data[0];
      const requiredFields = ['id', 'member_id', 'first_name', 'last_name', 'party'];
      const missingFields = requiredFields.filter(field => !(field in firstMember));
      
      if (missingFields.length > 0) {
        this.addResult('Enhanced Member Profiles', 'fail', `Missing fields: ${missingFields.join(', ')}`, Date.now() - startTime);
      } else {
        this.addResult('Enhanced Member Profiles', 'pass', `Retrieved ${data.length} member profiles`, Date.now() - startTime);
      }
    } catch (error) {
      this.addResult('Enhanced Member Profiles', 'fail', `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private async testPartyData(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('party_data')
        .select('id, party_code, party_name, total_members')
        .limit(10);
      
      if (error) {
        this.addResult('Party Data', 'fail', `Query failed: ${error.message}`, Date.now() - startTime);
        return;
      }

      if (!data || data.length === 0) {
        this.addResult('Party Data', 'skip', 'No party data available', Date.now() - startTime);
        return;
      }

      this.addResult('Party Data', 'pass', `Retrieved ${data.length} parties`, Date.now() - startTime);
    } catch (error) {
      this.addResult('Party Data', 'fail', `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private async testVoteData(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('vote_data')
        .select('id, vote_id, beteckning, rm')
        .limit(5);
      
      if (error) {
        this.addResult('Vote Data', 'fail', `Query failed: ${error.message}`, Date.now() - startTime);
        return;
      }

      if (!data || data.length === 0) {
        this.addResult('Vote Data', 'skip', 'No vote data available', Date.now() - startTime);
        return;
      }

      this.addResult('Vote Data', 'pass', `Retrieved ${data.length} votes`, Date.now() - startTime);
    } catch (error) {
      this.addResult('Vote Data', 'fail', `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private async testDocumentData(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('document_data')
        .select('id, document_id, titel, typ')
        .limit(5);
      
      if (error) {
        this.addResult('Document Data', 'fail', `Query failed: ${error.message}`, Date.now() - startTime);
        return;
      }

      if (!data || data.length === 0) {
        this.addResult('Document Data', 'skip', 'No document data available', Date.now() - startTime);
        return;
      }

      this.addResult('Document Data', 'pass', `Retrieved ${data.length} documents`, Date.now() - startTime);
    } catch (error) {
      this.addResult('Document Data', 'fail', `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private async testCalendarData(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('calendar_data')
        .select('id, event_id, datum, aktivitet')
        .limit(5);
      
      if (error) {
        this.addResult('Calendar Data', 'fail', `Query failed: ${error.message}`, Date.now() - startTime);
        return;
      }

      if (!data || data.length === 0) {
        this.addResult('Calendar Data', 'skip', 'No calendar data available', Date.now() - startTime);
        return;
      }

      this.addResult('Calendar Data', 'pass', `Retrieved ${data.length} calendar events`, Date.now() - startTime);
    } catch (error) {
      this.addResult('Calendar Data', 'fail', `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private async testLanguageAnalysis(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('language_analysis')
        .select('id, member_id, overall_score, document_type')
        .limit(5);
      
      if (error) {
        this.addResult('Language Analysis', 'fail', `Query failed: ${error.message}`, Date.now() - startTime);
        return;
      }

      if (!data || data.length === 0) {
        this.addResult('Language Analysis', 'skip', 'No language analysis data available', Date.now() - startTime);
        return;
      }

      this.addResult('Language Analysis', 'pass', `Retrieved ${data.length} language analyses`, Date.now() - startTime);
    } catch (error) {
      this.addResult('Language Analysis', 'fail', `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
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

export default ApiTestSuite;
