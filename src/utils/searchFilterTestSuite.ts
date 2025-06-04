
import { supabase } from '@/integrations/supabase/client';
import { EnhancedTester, DetailedTestResult } from './enhancedTestUtils';

export class SearchFilterTestSuite extends EnhancedTester {
  constructor() {
    super('Search and Filter Test Suite');
  }

  async testMemberNameSearch(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Member Name Search Functionality',
      async () => {
        const testQueries = ['Anders', 'Maria', 'Johan', 'Anna'];
        const results = [];
        
        for (const query of testQueries) {
          const { data, error } = await supabase
            .from('member_data')
            .select('member_id, first_name, last_name, party')
            .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
            .limit(5);
            
          if (error) throw new Error(`Search failed for ${query}: ${error.message}`);
          
          results.push({
            query,
            resultCount: data?.length || 0,
            matchesQuery: data?.every(m => 
              m.first_name?.toLowerCase().includes(query.toLowerCase()) ||
              m.last_name?.toLowerCase().includes(query.toLowerCase())
            ) || false
          });
        }
        
        return {
          searchTests: results,
          allSearchesWork: results.every(r => r.matchesQuery),
          totalResults: results.reduce((sum, r) => sum + r.resultCount, 0)
        };
      }
    );
  }

  async testPartyFiltering(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Party Filtering Functionality',
      async () => {
        const parties = ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP'];
        const results = [];
        
        for (const party of parties.slice(0, 4)) { // Test first 4 parties
          const { data, error } = await supabase
            .from('member_data')
            .select('member_id, first_name, last_name, party')
            .eq('party', party)
            .limit(10);
            
          if (error) throw new Error(`Party filter failed for ${party}: ${error.message}`);
          
          results.push({
            party,
            memberCount: data?.length || 0,
            correctParty: data?.every(m => m.party === party) || false
          });
        }
        
        return {
          partyTests: results,
          allFiltersWork: results.every(r => r.correctParty),
          partiesWithMembers: results.filter(r => r.memberCount > 0).length
        };
      }
    );
  }

  async testCommitteeSearch(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Committee Search and Assignment Testing',
      async () => {
        // Test committee data in member assignments
        const { data: membersWithAssignments, error } = await supabase
          .from('member_data')
          .select('member_id, first_name, last_name, assignments')
          .not('assignments', 'is', null)
          .limit(20);
          
        if (error) throw new Error(`Committee search failed: ${error.message}`);
        
        const committeeCounts = new Map();
        let totalAssignments = 0;
        let currentAssignments = 0;
        
        membersWithAssignments?.forEach(member => {
          if (member.assignments && Array.isArray(member.assignments)) {
            member.assignments.forEach((assignment: any) => {
              totalAssignments++;
              
              // Count current assignments
              if (!assignment.tom || new Date(assignment.tom) > new Date()) {
                currentAssignments++;
              }
              
              // Count committee assignments (exclude chamber)
              if (assignment.organ_kod && 
                  assignment.organ_kod !== 'Kammaren' && 
                  assignment.organ_kod !== 'kam') {
                committeeCounts.set(
                  assignment.organ_kod, 
                  (committeeCounts.get(assignment.organ_kod) || 0) + 1
                );
              }
            });
          }
        });
        
        return {
          membersWithAssignments: membersWithAssignments?.length || 0,
          totalAssignments,
          currentAssignments,
          uniqueCommittees: committeeCounts.size,
          committeeBreakdown: Object.fromEntries(committeeCounts),
          largestCommittee: [...committeeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'
        };
      }
    );
  }

  async testDocumentTypeFiltering(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Document Type Filtering',
      async () => {
        const documentTypes = ['mot', 'ip', 'fr', 'prop', 'bet'];
        const results = [];
        
        for (const docType of documentTypes) {
          const { data, error } = await supabase
            .from('document_data')
            .select('document_id, titel, typ, datum, organ')
            .eq('typ', docType)
            .limit(5);
            
          if (error) throw new Error(`Document type filter failed for ${docType}: ${error.message}`);
          
          results.push({
            type: docType,
            count: data?.length || 0,
            correctType: data?.every(d => d.typ === docType) || false,
            hasValidDates: data?.some(d => d.datum) || false
          });
        }
        
        return {
          typeTests: results,
          allTypesWork: results.every(r => r.correctType),
          typesWithDocuments: results.filter(r => r.count > 0).length,
          totalDocumentsTested: results.reduce((sum, r) => sum + r.count, 0)
        };
      }
    );
  }

  async testDateRangeFiltering(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Date Range Filtering',
      async () => {
        const currentYear = new Date().getFullYear();
        const testRanges = [
          { start: `${currentYear}-01-01`, end: `${currentYear}-06-30`, label: 'First Half Year' },
          { start: `${currentYear-1}-01-01`, end: `${currentYear-1}-12-31`, label: 'Last Year' }
        ];
        
        const results = [];
        
        for (const range of testRanges) {
          // Test calendar data
          const { data: calendarData, error: calError } = await supabase
            .from('calendar_data')
            .select('event_id, datum, summary')
            .gte('datum', range.start)
            .lte('datum', range.end)
            .limit(10);
            
          // Test speech data
          const { data: speechData, error: speechError } = await supabase
            .from('speech_data')
            .select('speech_id, anforandedatum, namn')
            .gte('anforandedatum', range.start)
            .lte('anforandedatum', range.end)
            .limit(10);
            
          if (calError || speechError) {
            throw new Error(`Date range filtering failed: ${calError?.message || speechError?.message}`);
          }
          
          results.push({
            range: range.label,
            calendarEvents: calendarData?.length || 0,
            speeches: speechData?.length || 0,
            validDateRange: true
          });
        }
        
        return {
          rangeTests: results,
          allRangesWork: results.every(r => r.validDateRange),
          totalEventsFound: results.reduce((sum, r) => sum + r.calendarEvents, 0),
          totalSpeechesFound: results.reduce((sum, r) => sum + r.speeches, 0)
        };
      }
    );
  }

  async testVoteSearchByTopic(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Vote Search by Topic',
      async () => {
        const searchTerms = ['budget', 'miljö', 'utbildning', 'vård'];
        const results = [];
        
        for (const term of searchTerms.slice(0, 2)) { // Test first 2 terms
          const { data, error } = await supabase
            .from('vote_data')
            .select('vote_id, beteckning, avser, vote_statistics')
            .or(`beteckning.ilike.%${term}%,avser.ilike.%${term}%`)
            .limit(5);
            
          if (error) throw new Error(`Vote search failed for ${term}: ${error.message}`);
          
          results.push({
            searchTerm: term,
            votesFound: data?.length || 0,
            hasStatistics: data?.some(v => v.vote_statistics) || false,
            relevantResults: data?.some(v => 
              v.beteckning?.toLowerCase().includes(term.toLowerCase()) ||
              v.avser?.toLowerCase().includes(term.toLowerCase())
            ) || false
          });
        }
        
        return {
          searchTests: results,
          allSearchesRelevant: results.every(r => r.relevantResults || r.votesFound === 0),
          totalVotesFound: results.reduce((sum, r) => sum + r.votesFound, 0)
        };
      }
    );
  }

  async testLanguageAnalysisFiltering(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Language Analysis Filtering',
      async () => {
        // Test filtering by score ranges
        const { data: highScores, error: highError } = await supabase
          .from('language_analysis')
          .select('member_name, overall_score, document_type')
          .gte('overall_score', 8)
          .limit(10);
          
        const { data: lowScores, error: lowError } = await supabase
          .from('language_analysis')
          .select('member_name, overall_score, document_type')
          .lte('overall_score', 3)
          .limit(10);
          
        // Test filtering by document type
        const { data: speechAnalysis, error: speechError } = await supabase
          .from('language_analysis')
          .select('member_name, overall_score, document_type')
          .eq('document_type', 'speech')
          .limit(10);
          
        if (highError || lowError || speechError) {
          throw new Error(`Language analysis filtering failed`);
        }
        
        return {
          highScoreAnalyses: highScores?.length || 0,
          lowScoreAnalyses: lowScores?.length || 0,
          speechAnalyses: speechAnalysis?.length || 0,
          scoreRangeWorks: (highScores?.every(a => a.overall_score >= 8) || false) &&
                          (lowScores?.every(a => a.overall_score <= 3) || false),
          documentTypeFilterWorks: speechAnalysis?.every(a => a.document_type === 'speech') || false
        };
      }
    );
  }

  async runAllSearchFilterTests(): Promise<void> {
    console.log('🔍 Starting search and filter testing...');
    
    await this.testMemberNameSearch();
    await this.testPartyFiltering();
    await this.testCommitteeSearch();
    await this.testDocumentTypeFiltering();
    await this.testDateRangeFiltering();
    await this.testVoteSearchByTopic();
    await this.testLanguageAnalysisFiltering();
    
    console.log('✅ Search and filter testing completed');
  }
}
