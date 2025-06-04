
import { supabase } from '@/integrations/supabase/client';
import { EnhancedTester, DetailedTestResult } from './enhancedTestUtils';

export class ApiTestSuite extends EnhancedTester {
  constructor() {
    super('API Integration Tests');
  }

  async testSupabaseConnection(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Supabase Connection Test',
      async () => {
        const { data, error } = await supabase.from('calendar_data').select('count').limit(1);
        if (error) throw new Error(`Supabase connection failed: ${error.message}`);
        return { connected: true, timestamp: new Date().toISOString() };
      }
    );
  }

  async testCalendarDataApi(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Calendar Data API',
      async () => {
        const { data, error } = await supabase
          .from('calendar_data')
          .select('id, summary, datum, organ')
          .limit(5);
        
        if (error) throw new Error(`Calendar API failed: ${error.message}`);
        return data;
      },
      (data) => Array.isArray(data) && data.length >= 0,
      [{ id: 'string', summary: 'string', datum: 'string', organ: 'string' }]
    );
  }

  async testSpeechDataApi(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Speech Data API',
      async () => {
        const { data, error } = await supabase
          .from('speech_data')
          .select('id, anforandetext, namn, party')
          .limit(5);
        
        if (error) throw new Error(`Speech API failed: ${error.message}`);
        return data;
      },
      (data) => Array.isArray(data) && data.length >= 0
    );
  }

  async testVoteDataApi(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Vote Data API',
      async () => {
        const { data, error } = await supabase
          .from('vote_data')
          .select('id, beteckning, avser, metadata')
          .limit(5);
        
        if (error) throw new Error(`Vote API failed: ${error.message}`);
        return data;
      },
      (data) => Array.isArray(data) && data.length >= 0
    );
  }

  async testDocumentDataApi(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Document Data API',
      async () => {
        const { data, error } = await supabase
          .from('document_data')
          .select('id, titel, organ, datum')
          .limit(5);
        
        if (error) throw new Error(`Document API failed: ${error.message}`);
        return data;
      },
      (data) => Array.isArray(data) && data.length >= 0
    );
  }

  async testMemberDataApi(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Member Data API',
      async () => {
        const { data, error } = await supabase
          .from('member_data')
          .select('id, first_name, last_name, party')
          .limit(5);
        
        if (error) throw new Error(`Member API failed: ${error.message}`);
        return data;
      },
      (data) => Array.isArray(data) && data.length >= 0
    );
  }

  async testPartyDataApi(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Party Data API',
      async () => {
        const { data, error } = await supabase
          .from('party_data')
          .select('id, party_code, party_name, total_members')
          .limit(5);
        
        if (error) throw new Error(`Party API failed: ${error.message}`);
        return data;
      },
      (data) => Array.isArray(data) && data.length >= 0
    );
  }

  async runAllApiTests(): Promise<void> {
    await this.testSupabaseConnection();
    await this.testCalendarDataApi();
    await this.testSpeechDataApi();
    await this.testVoteDataApi();
    await this.testDocumentDataApi();
    await this.testMemberDataApi();
    await this.testPartyDataApi();
  }
}
