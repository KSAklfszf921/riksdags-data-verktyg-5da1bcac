
import { createClient } from '@supabase/supabase-js';
import { CalendarTester, TestResult, generateTestId } from './testUtils';

export class DatabaseTester extends CalendarTester {
  private supabaseServiceRole: any;

  constructor() {
    super();
    // Create a service role client for testing operations that need to bypass RLS
    const supabaseUrl = 'https://zqhpbclqvhjcyrgvgaon.supabase.co';
    const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaHBiY2xxdmhqY3lyZ3ZnYW9uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODY0MDU0MSwiZXhwIjoyMDY0MjE2NTQxfQ.YFXBbH5aA9cGdw-i1Lyt46O9fOOr_KdDBTDfK1RQHW8';
    
    this.supabaseServiceRole = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async testDatabaseConnection(): Promise<TestResult> {
    return this.runTest('Database Connection', async () => {
      console.log('Testing database connection...');
      
      const { data, error } = await this.supabaseServiceRole.from('calendar_data').select('count').limit(1);
      
      if (error) {
        throw new Error(`Database connection failed: ${error.message}`);
      }
      
      return {
        connected: true,
        timestamp: new Date().toISOString()
      };
    });
  }

  async testCalendarDataTable(): Promise<TestResult> {
    return this.runTest('Calendar Data Table Structure', async () => {
      console.log('Testing calendar_data table structure...');
      
      // Test table access and get count
      const { count, error: countError } = await this.supabaseServiceRole
        .from('calendar_data')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw new Error(`Table access failed: ${countError.message}`);
      }

      // Test inserting a test record using service role
      const testEvent = {
        event_id: generateTestId(),
        datum: new Date().toISOString().split('T')[0],
        summary: 'Test Event',
        organ: 'test',
        typ: 'test',
        metadata: {
          test: true,
          created_at: new Date().toISOString()
        }
      };

      console.log('Attempting to insert test event:', testEvent.event_id);

      const { data: insertData, error: insertError } = await this.supabaseServiceRole
        .from('calendar_data')
        .insert(testEvent)
        .select();

      if (insertError) {
        throw new Error(`Insert failed: ${insertError.message}`);
      }

      console.log('Successfully inserted test event, cleaning up...');

      // Clean up test data
      if (insertData && insertData.length > 0) {
        const { error: deleteError } = await this.supabaseServiceRole
          .from('calendar_data')
          .delete()
          .eq('id', insertData[0].id);
        
        if (deleteError) {
          console.warn('Failed to clean up test data:', deleteError.message);
        } else {
          console.log('Successfully cleaned up test data');
        }
      }

      return {
        recordCount: count || 0,
        insertTest: 'success',
        testEventId: testEvent.event_id
      };
    });
  }

  async testDataIntegrity(): Promise<TestResult> {
    return this.runTest('Data Integrity Check', async () => {
      console.log('Testing data integrity...');
      
      // Check for records with missing required fields
      const { data: incomplete, error: incError } = await this.supabaseServiceRole
        .from('calendar_data')
        .select('id, event_id, datum')
        .or('event_id.is.null,datum.is.null')
        .limit(10);

      if (incError) {
        throw new Error(`Integrity check failed: ${incError.message}`);
      }

      // Check data freshness
      const { data: recent, error: recentError } = await this.supabaseServiceRole
        .from('calendar_data')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (recentError) {
        throw new Error(`Freshness check failed: ${recentError.message}`);
      }

      const lastUpdate = recent?.[0]?.updated_at;
      const hoursOld = lastUpdate ? 
        (Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60) : null;

      return {
        incompleteRecords: incomplete?.length || 0,
        lastUpdate,
        hoursOld,
        isStale: hoursOld ? hoursOld > 24 : true
      };
    });
  }

  async testQueryPerformance(): Promise<TestResult> {
    return this.runTest('Query Performance', async () => {
      console.log('Testing query performance...');
      
      const queries = [
        {
          name: 'Simple select',
          query: () => this.supabaseServiceRole.from('calendar_data').select('id, event_id, datum').limit(10)
        },
        {
          name: 'Date range query',
          query: () => {
            const today = new Date().toISOString().split('T')[0];
            const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            return this.supabaseServiceRole
              .from('calendar_data')
              .select('*')
              .gte('datum', today)
              .lte('datum', nextWeek);
          }
        },
        {
          name: 'Organ filter',
          query: () => this.supabaseServiceRole.from('calendar_data').select('*').eq('organ', 'kamm').limit(5)
        },
        {
          name: 'Text search',
          query: () => this.supabaseServiceRole.from('calendar_data').select('*').ilike('summary', '%debatt%').limit(5)
        }
      ];

      const results = [];

      for (const { name, query } of queries) {
        const start = Date.now();
        try {
          const { data, error } = await query();
          const duration = Date.now() - start;
          
          if (error) {
            throw error;
          }
          
          results.push({
            query: name,
            duration,
            recordCount: data?.length || 0,
            success: true
          });
          
          console.log(`${name}: ${duration}ms (${data?.length || 0} records)`);
        } catch (error) {
          const duration = Date.now() - start;
          results.push({
            query: name,
            duration,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      
      return {
        queries: results,
        averageDuration: avgDuration,
        successRate: results.filter(r => r.success).length / results.length * 100
      };
    });
  }
}
