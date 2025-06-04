
import { supabase } from '@/integrations/supabase/client';

export interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  duration?: number;
  error?: string;
}

export class DataValidationSuite {
  private results: TestResult[] = [];

  async runAllValidationTests(): Promise<TestResult[]> {
    this.results = [];
    
    await this.testCalendarDataIntegrity();
    await this.testMemberDataConsistency();
    await this.testVoteDataCompleteness();
    
    return this.results;
  }

  private async testCalendarDataIntegrity(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('calendar_data')
        .select('event_id, datum, aktivitet')
        .limit(10);
      
      if (error) {
        this.addResult('Calendar Data Integrity', 'fail', `Query failed: ${error.message}`, Date.now() - startTime);
        return;
      }

      if (!data || data.length === 0) {
        this.addResult('Calendar Data Integrity', 'skip', 'No calendar data available', Date.now() - startTime);
        return;
      }

      let integrityIssues = 0;
      data.forEach(event => {
        if (!event.event_id) integrityIssues++;
        if (!event.datum) integrityIssues++;
      });

      if (integrityIssues > 0) {
        this.addResult('Calendar Data Integrity', 'fail', `Found ${integrityIssues} integrity issues`, Date.now() - startTime);
      } else {
        this.addResult('Calendar Data Integrity', 'pass', `Validated ${data.length} calendar events`, Date.now() - startTime);
      }
    } catch (error) {
      this.addResult('Calendar Data Integrity', 'fail', `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private async testMemberDataConsistency(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('enhanced_member_profiles')
        .select('member_id, first_name, last_name, party')
        .limit(10);
      
      if (error) {
        this.addResult('Member Data Consistency', 'fail', `Query failed: ${error.message}`, Date.now() - startTime);
        return;
      }

      if (!data || data.length === 0) {
        this.addResult('Member Data Consistency', 'skip', 'No member data available', Date.now() - startTime);
        return;
      }

      let consistencyIssues = 0;
      data.forEach(member => {
        if (!member.member_id) consistencyIssues++;
        if (!member.first_name) consistencyIssues++;
        if (!member.last_name) consistencyIssues++;
        if (!member.party) consistencyIssues++;
      });

      if (consistencyIssues > 0) {
        this.addResult('Member Data Consistency', 'fail', `Found ${consistencyIssues} consistency issues`, Date.now() - startTime);
      } else {
        this.addResult('Member Data Consistency', 'pass', `Validated ${data.length} member profiles`, Date.now() - startTime);
      }
    } catch (error) {
      this.addResult('Member Data Consistency', 'fail', `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private async testVoteDataCompleteness(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('vote_data')
        .select('vote_id, beteckning, rm')
        .limit(10);
      
      if (error) {
        this.addResult('Vote Data Completeness', 'fail', `Query failed: ${error.message}`, Date.now() - startTime);
        return;
      }

      if (!data || data.length === 0) {
        this.addResult('Vote Data Completeness', 'skip', 'No vote data available', Date.now() - startTime);
        return;
      }

      let completenessIssues = 0;
      data.forEach(vote => {
        if (!vote.vote_id) completenessIssues++;
        if (!vote.beteckning) completenessIssues++;
      });

      if (completenessIssues > 0) {
        this.addResult('Vote Data Completeness', 'fail', `Found ${completenessIssues} completeness issues`, Date.now() - startTime);
      } else {
        this.addResult('Vote Data Completeness', 'pass', `Validated ${data.length} vote records`, Date.now() - startTime);
      }
    } catch (error) {
      this.addResult('Vote Data Completeness', 'fail', `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
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

export default DataValidationSuite;
