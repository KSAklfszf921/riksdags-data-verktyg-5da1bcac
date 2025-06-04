
import { supabase } from '@/integrations/supabase/client';

export interface TestResult {
  category: string;
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  duration?: number;
  error?: string;
}

export class ComprehensiveTestSuite {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    this.results = [];
    
    console.log('Starting comprehensive test suite...');
    
    await this.testDatabaseConnectivity();
    await this.testDataIntegrity();
    await this.testMemberDataConsistency();
    await this.testPartyDataIntegrity();
    await this.testVoteDataStructure();
    await this.testLanguageAnalysisData();
    
    console.log('Comprehensive test suite completed');
    return this.results;
  }

  private async testDatabaseConnectivity(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('enhanced_member_profiles')
        .select('member_id, first_name, last_name, party')
        .limit(1);
      
      if (error) {
        this.addResult('Database', 'Connectivity Test', 'fail', `Database connection failed: ${error.message}`, Date.now() - startTime);
        return;
      }

      if (!data || data.length === 0) {
        this.addResult('Database', 'Connectivity Test', 'skip', 'Database connected but no member data found', Date.now() - startTime);
        return;
      }

      const member = data[0];
      if (!member.member_id || !member.first_name || !member.last_name || !member.party) {
        this.addResult('Database', 'Connectivity Test', 'fail', 'Member data structure incomplete', Date.now() - startTime);
        return;
      }

      this.addResult('Database', 'Connectivity Test', 'pass', 'Database connection and basic data structure verified', Date.now() - startTime);
    } catch (error) {
      this.addResult('Database', 'Connectivity Test', 'fail', `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private async testDataIntegrity(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('enhanced_member_profiles')
        .select('member_id, assignments')
        .limit(10);
      
      if (memberError) {
        this.addResult('Data', 'Integrity Test', 'fail', `Member data query failed: ${memberError.message}`, Date.now() - startTime);
        return;
      }

      if (!memberData || memberData.length === 0) {
        this.addResult('Data', 'Integrity Test', 'skip', 'No member data available for integrity testing', Date.now() - startTime);
        return;
      }

      let integrityIssues = 0;
      memberData.forEach(member => {
        if (!member.member_id) {
          integrityIssues++;
        }
        if (member.assignments && !Array.isArray(member.assignments)) {
          integrityIssues++;
        }
      });

      if (integrityIssues > 0) {
        this.addResult('Data', 'Integrity Test', 'fail', `Found ${integrityIssues} data integrity issues`, Date.now() - startTime);
      } else {
        this.addResult('Data', 'Integrity Test', 'pass', `Tested ${memberData.length} records, no integrity issues found`, Date.now() - startTime);
      }
    } catch (error) {
      this.addResult('Data', 'Integrity Test', 'fail', `Integrity test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private async testMemberDataConsistency(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('enhanced_member_profiles')
        .select('member_id, first_name, last_name, party, is_active')
        .limit(20);
      
      if (error) {
        this.addResult('Members', 'Data Consistency', 'fail', `Member query failed: ${error.message}`, Date.now() - startTime);
        return;
      }

      if (!data || data.length === 0) {
        this.addResult('Members', 'Data Consistency', 'skip', 'No member data available', Date.now() - startTime);
        return;
      }

      let consistencyIssues = 0;
      const uniqueMembers = new Set();
      
      data.forEach(member => {
        // Check for duplicate member IDs
        if (uniqueMembers.has(member.member_id)) {
          consistencyIssues++;
        } else {
          uniqueMembers.add(member.member_id);
        }
        
        // Check for required fields
        if (!member.first_name || !member.last_name || !member.party) {
          consistencyIssues++;
        }
      });

      if (consistencyIssues > 0) {
        this.addResult('Members', 'Data Consistency', 'fail', `Found ${consistencyIssues} consistency issues in member data`, Date.now() - startTime);
      } else {
        this.addResult('Members', 'Data Consistency', 'pass', `Tested ${data.length} members, all data consistent`, Date.now() - startTime);
      }
    } catch (error) {
      this.addResult('Members', 'Data Consistency', 'fail', `Consistency test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private async testPartyDataIntegrity(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('party_data')
        .select('party_code, party_name, total_members, active_members');
      
      if (error) {
        this.addResult('Party', 'Data Integrity', 'fail', `Party query failed: ${error.message}`, Date.now() - startTime);
        return;
      }

      if (!data || data.length === 0) {
        this.addResult('Party', 'Data Integrity', 'skip', 'No party data available', Date.now() - startTime);
        return;
      }

      let integrityIssues = 0;
      data.forEach(party => {
        if (!party.party_code || !party.party_name) {
          integrityIssues++;
        }
        if (party.active_members > party.total_members) {
          integrityIssues++;
        }
      });

      if (integrityIssues > 0) {
        this.addResult('Party', 'Data Integrity', 'fail', `Found ${integrityIssues} party data integrity issues`, Date.now() - startTime);
      } else {
        this.addResult('Party', 'Data Integrity', 'pass', `Tested ${data.length} parties, all data valid`, Date.now() - startTime);
      }
    } catch (error) {
      this.addResult('Party', 'Data Integrity', 'fail', `Party integrity test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private async testVoteDataStructure(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('vote_data')
        .select('vote_id, beteckning, vote_results')
        .limit(10);
      
      if (error) {
        this.addResult('Votes', 'Data Structure', 'fail', `Vote query failed: ${error.message}`, Date.now() - startTime);
        return;
      }

      if (!data || data.length === 0) {
        this.addResult('Votes', 'Data Structure', 'skip', 'No vote data available', Date.now() - startTime);
        return;
      }

      let structureIssues = 0;
      data.forEach(vote => {
        if (!vote.vote_id) {
          structureIssues++;
        }
        if (vote.vote_results && typeof vote.vote_results !== 'object') {
          structureIssues++;
        }
      });

      if (structureIssues > 0) {
        this.addResult('Votes', 'Data Structure', 'fail', `Found ${structureIssues} vote data structure issues`, Date.now() - startTime);
      } else {
        this.addResult('Votes', 'Data Structure', 'pass', `Tested ${data.length} votes, structure valid`, Date.now() - startTime);
      }
    } catch (error) {
      this.addResult('Votes', 'Data Structure', 'fail', `Vote structure test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private async testLanguageAnalysisData(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('language_analysis')
        .select('member_id, overall_score, document_type')
        .limit(10);
      
      if (error) {
        this.addResult('Language', 'Analysis Data', 'fail', `Language analysis query failed: ${error.message}`, Date.now() - startTime);
        return;
      }

      if (!data || data.length === 0) {
        this.addResult('Language', 'Analysis Data', 'skip', 'No language analysis data available', Date.now() - startTime);
        return;
      }

      let validAnalyses = 0;
      data.forEach(analysis => {
        if (analysis.member_id && 
            analysis.overall_score >= 0 && 
            analysis.overall_score <= 100 &&
            ['speech', 'document'].includes(analysis.document_type)) {
          validAnalyses++;
        }
      });

      const validationRate = (validAnalyses / data.length) * 100;
      
      if (validationRate < 90) {
        this.addResult('Language', 'Analysis Data', 'fail', `Only ${validationRate.toFixed(1)}% of analyses are valid`, Date.now() - startTime);
      } else {
        this.addResult('Language', 'Analysis Data', 'pass', `${validationRate.toFixed(1)}% of ${data.length} analyses are valid`, Date.now() - startTime);
      }
    } catch (error) {
      this.addResult('Language', 'Analysis Data', 'fail', `Language analysis test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private addResult(category: string, name: string, status: 'pass' | 'fail' | 'skip', message: string, duration?: number): void {
    this.results.push({
      category,
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

export default ComprehensiveTestSuite;
