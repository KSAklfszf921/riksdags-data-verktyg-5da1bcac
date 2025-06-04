
import { supabase } from '@/integrations/supabase/client';

export interface SyncProgressTest {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message: string;
  duration?: number;
  error?: string;
}

export class SyncProgressTester {
  private tests: SyncProgressTest[] = [];

  async runAllTests(): Promise<SyncProgressTest[]> {
    this.tests = [];
    
    await this.testDatabaseConnection();
    await this.testEnhancedMemberProfiles();
    await this.testCalendarData();
    await this.testDocumentData();
    await this.testVoteData();
    await this.testPartyData();
    await this.testSyncStatus();
    
    return this.tests;
  }

  private async testDatabaseConnection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { error } = await supabase
        .from('enhanced_member_profiles')
        .select('id')
        .limit(1);
      
      if (error) {
        this.addTest('Database Connection', 'failed', `Connection failed: ${error.message}`, Date.now() - startTime);
      } else {
        this.addTest('Database Connection', 'passed', 'Database connection successful', Date.now() - startTime);
      }
    } catch (error) {
      this.addTest('Database Connection', 'failed', `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private async testEnhancedMemberProfiles(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error, count } = await supabase
        .from('enhanced_member_profiles')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        this.addTest('Enhanced Member Profiles', 'failed', `Query failed: ${error.message}`, Date.now() - startTime);
      } else if (count === 0) {
        this.addTest('Enhanced Member Profiles', 'failed', 'No member data found - sync may be needed', Date.now() - startTime);
      } else {
        this.addTest('Enhanced Member Profiles', 'passed', `Found ${count} member profiles`, Date.now() - startTime);
      }
    } catch (error) {
      this.addTest('Enhanced Member Profiles', 'failed', `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private async testCalendarData(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error, count } = await supabase
        .from('calendar_data')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        this.addTest('Calendar Data', 'failed', `Query failed: ${error.message}`, Date.now() - startTime);
      } else if (count === 0) {
        this.addTest('Calendar Data', 'failed', 'No calendar data found - sync may be needed', Date.now() - startTime);
      } else {
        this.addTest('Calendar Data', 'passed', `Found ${count} calendar events`, Date.now() - startTime);
      }
    } catch (error) {
      this.addTest('Calendar Data', 'failed', `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private async testDocumentData(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error, count } = await supabase
        .from('document_data')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        this.addTest('Document Data', 'failed', `Query failed: ${error.message}`, Date.now() - startTime);
      } else if (count === 0) {
        this.addTest('Document Data', 'failed', 'No document data found - sync may be needed', Date.now() - startTime);
      } else {
        this.addTest('Document Data', 'passed', `Found ${count} documents`, Date.now() - startTime);
      }
    } catch (error) {
      this.addTest('Document Data', 'failed', `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private async testVoteData(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error, count } = await supabase
        .from('vote_data')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        this.addTest('Vote Data', 'failed', `Query failed: ${error.message}`, Date.now() - startTime);
      } else if (count === 0) {
        this.addTest('Vote Data', 'failed', 'No vote data found - sync may be needed', Date.now() - startTime);
      } else {
        this.addTest('Vote Data', 'passed', `Found ${count} votes`, Date.now() - startTime);
      }
    } catch (error) {
      this.addTest('Vote Data', 'failed', `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private async testPartyData(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error, count } = await supabase
        .from('party_data')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        this.addTest('Party Data', 'failed', `Query failed: ${error.message}`, Date.now() - startTime);
      } else if (count === 0) {
        this.addTest('Party Data', 'failed', 'No party data found - sync may be needed', Date.now() - startTime);
      } else {
        this.addTest('Party Data', 'passed', `Found ${count} parties`, Date.now() - startTime);
      }
    } catch (error) {
      this.addTest('Party Data', 'failed', `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private async testSyncStatus(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('automated_sync_status')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(5);
      
      if (error) {
        this.addTest('Sync Status', 'failed', `Query failed: ${error.message}`, Date.now() - startTime);
      } else {
        const activeSyncs = data?.filter(sync => sync.status === 'running') || [];
        const recentSyncs = data?.filter(sync => sync.status === 'completed') || [];
        
        if (activeSyncs.length > 0) {
          this.addTest('Sync Status', 'passed', `${activeSyncs.length} active syncs, ${recentSyncs.length} recent completions`, Date.now() - startTime);
        } else if (recentSyncs.length > 0) {
          this.addTest('Sync Status', 'passed', `No active syncs, ${recentSyncs.length} recent completions`, Date.now() - startTime);
        } else {
          this.addTest('Sync Status', 'failed', 'No sync activity found - sync system may need initialization', Date.now() - startTime);
        }
      }
    } catch (error) {
      this.addTest('Sync Status', 'failed', `Test error: ${error instanceof Error ? error.message : 'Unknown error'}`, Date.now() - startTime);
    }
  }

  private addTest(name: string, status: 'passed' | 'failed', message: string, duration: number): void {
    this.tests.push({
      name,
      status,
      message,
      duration,
      error: status === 'failed' ? message : undefined
    });
  }

  getResults(): SyncProgressTest[] {
    return this.tests;
  }

  getSummary(): { total: number; passed: number; failed: number; successRate: number } {
    const total = this.tests.length;
    const passed = this.tests.filter(t => t.status === 'passed').length;
    const failed = total - passed;
    
    return {
      total,
      passed,
      failed,
      successRate: total > 0 ? (passed / total) * 100 : 0
    };
  }
}

export default SyncProgressTester;
