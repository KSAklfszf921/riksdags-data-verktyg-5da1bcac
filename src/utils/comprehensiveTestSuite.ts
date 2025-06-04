
import { supabase } from '@/integrations/supabase/client';
import { EnhancedTester, DetailedTestResult } from './enhancedTestUtils';
import { ApiTestSuite } from './apiTestSuite';
import { SearchFilterTestSuite } from './searchFilterTestSuite';
import { FrontendTester } from './frontendTester';

export class ComprehensiveTestSuite extends EnhancedTester {
  private apiTester: ApiTestSuite;
  private searchTester: SearchFilterTestSuite;
  private frontendTester: FrontendTester;

  constructor() {
    super('Comprehensive System Test Suite');
    this.apiTester = new ApiTestSuite();
    this.searchTester = new SearchFilterTestSuite();
    this.frontendTester = new FrontendTester();
  }

  async testDataIntegrity(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Data Integrity Verification',
      async () => {
        // Test referential integrity between tables
        const { data: members, error: memberError } = await supabase
          .from('member_data')
          .select('member_id, party')
          .limit(10);

        if (memberError) throw memberError;

        const { data: parties, error: partyError } = await supabase
          .from('party_data')
          .select('party_code')
          .limit(50);

        if (partyError) throw partyError;

        const partyCodesSet = new Set(parties?.map(p => p.party_code) || []);
        const memberPartiesValid = members?.every(m => 
          !m.party || partyCodesSet.has(m.party)
        ) || false;

        return {
          totalMembers: members?.length || 0,
          totalParties: parties?.length || 0,
          memberPartiesValid,
          integrityScore: memberPartiesValid ? 100 : 0
        };
      }
    );
  }

  async testSystemPerformance(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'System Performance Assessment',
      async () => {
        const startTime = Date.now();
        
        // Test multiple concurrent queries
        const promises = [
          supabase.from('member_data').select('count').limit(1),
          supabase.from('party_data').select('count').limit(1),
          supabase.from('document_data').select('count').limit(1),
          supabase.from('speech_data').select('count').limit(1),
          supabase.from('vote_data').select('count').limit(1),
          supabase.from('calendar_data').select('count').limit(1)
        ];

        const results = await Promise.all(promises);
        const endTime = Date.now();
        const duration = endTime - startTime;

        const errors = results.filter(r => r.error).length;
        
        return {
          queryDuration: duration,
          concurrentQueries: promises.length,
          successfulQueries: promises.length - errors,
          performanceScore: duration < 1000 ? 100 : Math.max(0, 100 - (duration - 1000) / 100),
          errors
        };
      }
    );
  }

  async testDataCompleteness(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Data Completeness Assessment',
      async () => {
        const tables = ['member_data', 'party_data', 'document_data', 'speech_data', 'vote_data', 'calendar_data'];
        const completenessResults = [];

        for (const table of tables) {
          const { count, error } = await supabase
            .from(table as any)
            .select('*', { count: 'exact', head: true });

          if (error) throw error;

          completenessResults.push({
            table,
            recordCount: count || 0,
            hasData: (count || 0) > 0
          });
        }

        const tablesWithData = completenessResults.filter(r => r.hasData).length;
        const completenessPercentage = (tablesWithData / tables.length) * 100;

        return {
          tablesChecked: tables.length,
          tablesWithData,
          completenessPercentage,
          tableBreakdown: completenessResults,
          overallScore: completenessPercentage
        };
      }
    );
  }

  async testSearchFunctionality(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Search Functionality Assessment',
      async () => {
        // Test text search capabilities
        const searchQueries = [
          { table: 'member_data', column: 'first_name', term: 'Maria' },
          { table: 'document_data', column: 'titel', term: 'budget' },
          { table: 'speech_data', column: 'anforandetext', term: 'miljö' }
        ];

        const searchResults = [];

        for (const query of searchQueries) {
          try {
            const { data, error } = await supabase
              .from(query.table as any)
              .select('id')
              .ilike(query.column, `%${query.term}%`)
              .limit(5);

            if (error) throw error;

            searchResults.push({
              table: query.table,
              searchTerm: query.term,
              resultsFound: data?.length || 0,
              searchWorking: true
            });
          } catch (error) {
            searchResults.push({
              table: query.table,
              searchTerm: query.term,
              resultsFound: 0,
              searchWorking: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        const workingSearches = searchResults.filter(r => r.searchWorking).length;
        const searchScore = (workingSearches / searchQueries.length) * 100;

        return {
          searchQueriesRun: searchQueries.length,
          workingSearches,
          searchScore,
          searchDetails: searchResults
        };
      }
    );
  }

  async runComprehensiveTests(): Promise<void> {
    console.log('🚀 Starting comprehensive system testing...');
    
    // Run individual test suites
    await this.apiTester.runAllApiTests();
    await this.searchTester.runAllSearchFilterTests();
    await this.frontendTester.runAllFrontendTests();
    
    // Run comprehensive tests
    await this.testDataIntegrity();
    await this.testSystemPerformance();
    await this.testDataCompleteness();
    await this.testSearchFunctionality();
    
    console.log('✅ Comprehensive testing completed');
    this.printResults();
  }
}
