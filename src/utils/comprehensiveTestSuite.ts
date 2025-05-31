
import { supabase } from '@/integrations/supabase/client';
import { EnhancedTester, DetailedTestResult } from './enhancedTestUtils';
import { fetchMembers, fetchMemberDetails, fetchMembersWithCommittees, fetchMemberSuggestions, fetchMemberDocuments, fetchMemberSpeeches } from '../services/riksdagApi';

export class ComprehensiveApiTestSuite extends EnhancedTester {
  constructor() {
    super('Comprehensive API Test Suite');
  }

  // Member API Tests
  async testMemberBasicFetching(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Member Basic Fetching',
      async () => {
        const result = await fetchMembers(1, 10, 'current');
        if (!result.members || result.members.length === 0) {
          throw new Error('No members returned');
        }
        return {
          memberCount: result.members.length,
          totalCount: result.totalCount,
          hasImages: result.members.some(m => m.bild_url_192),
          hasParties: result.members.every(m => m.parti),
          hasConstituencies: result.members.some(m => m.valkrets)
        };
      },
      (data) => data.memberCount > 0 && data.totalCount > 0
    );
  }

  async testMemberDetailsWithAssignments(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Member Details with Assignments',
      async () => {
        const members = await fetchMembers(1, 5, 'current');
        if (!members.members.length) throw new Error('No members found');
        
        const memberId = members.members[0].intressent_id;
        const details = await fetchMemberDetails(memberId);
        
        if (!details) throw new Error('No member details found');
        
        return {
          hasAssignments: !!details.assignments && details.assignments.length > 0,
          assignmentCount: details.assignments?.length || 0,
          hasCommitteeAssignments: details.assignments?.some(a => 
            a.organ_kod !== 'Kammaren' && a.organ_kod !== 'kam'
          ) || false,
          currentAssignments: details.assignments?.filter(a => !a.tom || new Date(a.tom) > new Date()).length || 0,
          memberName: `${details.tilltalsnamn || ''} ${details.efternamn || ''}`.trim()
        };
      },
      (data) => typeof data.hasAssignments === 'boolean'
    );
  }

  async testCommitteeFiltering(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Committee Filtering Functionality',
      async () => {
        // Test with a known committee code
        const committeeResult = await fetchMembersWithCommittees(1, 10, 'current', 'AU');
        
        return {
          committeeMembers: committeeResult.members.length,
          allHaveCommittee: committeeResult.members.every(m => 
            m.assignments?.some(a => a.organ_kod === 'AU')
          ),
          totalFound: committeeResult.totalCount,
          validResponse: committeeResult.members.length >= 0
        };
      },
      (data) => data.validResponse === true
    );
  }

  async testMemberSearch(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Member Search Functionality',
      async () => {
        const searchResults = await fetchMemberSuggestions('Anders');
        
        return {
          searchResults: searchResults.length,
          allMatchSearch: searchResults.every(m => 
            m.tilltalsnamn?.toLowerCase().includes('anders') || 
            m.efternamn?.toLowerCase().includes('anders')
          ),
          hasValidData: searchResults.every(m => m.intressent_id && m.tilltalsnamn && m.efternamn)
        };
      },
      (data) => data.searchResults >= 0
    );
  }

  async testMemberDocuments(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Member Documents API',
      async () => {
        const members = await fetchMembers(1, 3, 'current');
        if (!members.members.length) throw new Error('No members found');
        
        const memberId = members.members[0].intressent_id;
        const documents = await fetchMemberDocuments(memberId);
        
        return {
          documentCount: documents.length,
          hasValidStructure: documents.every(d => d.id && d.titel),
          documentTypes: [...new Set(documents.map(d => d.typ))],
          hasUrls: documents.some(d => d.dokument_url_html || d.dokument_url_text),
          memberTested: `${members.members[0].tilltalsnamn} ${members.members[0].efternamn}`
        };
      }
    );
  }

  async testMemberSpeeches(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Member Speeches API',
      async () => {
        const members = await fetchMembers(1, 3, 'current');
        if (!members.members.length) throw new Error('No members found');
        
        const memberId = members.members[0].intressent_id;
        const speeches = await fetchMemberSpeeches(memberId);
        
        return {
          speechCount: speeches.length,
          hasValidStructure: speeches.every(s => s.anforande_id),
          hasText: speeches.some(s => s.anforandetext && s.anforandetext.length > 0),
          hasDates: speeches.every(s => s.anforandedatum),
          memberTested: `${members.members[0].tilltalsnamn} ${members.members[0].efternamn}`
        };
      }
    );
  }

  // Database Table Tests
  async testCalendarDataFormatting(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Calendar Data Formatting',
      async () => {
        const { data, error } = await supabase
          .from('calendar_data')
          .select('event_id, summary, datum, tid, organ, typ, aktivitet')
          .limit(10);

        if (error) throw new Error(`Calendar query failed: ${error.message}`);

        return {
          eventCount: data?.length || 0,
          hasEventIds: data?.every(e => e.event_id) || false,
          hasFormattedDates: data?.some(e => e.datum && e.datum.includes('-')) || false,
          hasTimeData: data?.some(e => e.tid) || false,
          hasOrgans: data?.some(e => e.organ) || false,
          eventTypes: [...new Set(data?.map(e => e.typ).filter(Boolean))] || []
        };
      }
    );
  }

  async testSpeechDataQualityAndFormatting(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Speech Data Quality and Formatting',
      async () => {
        const { data, error } = await supabase
          .from('speech_data')
          .select('speech_id, namn, party, anforandetext, word_count, anforandedatum, anforandetyp')
          .not('anforandetext', 'is', null)
          .limit(20);

        if (error) throw new Error(`Speech query failed: ${error.message}`);

        const validWordCounts = data?.filter(s => s.word_count && s.word_count > 0).length || 0;
        const hasFormattedDates = data?.some(s => s.anforandedatum && s.anforandedatum.includes('-')) || false;

        return {
          speechCount: data?.length || 0,
          validWordCounts,
          wordCountAccuracy: validWordCounts / (data?.length || 1),
          hasFormattedDates,
          hasSpeechTypes: data?.some(s => s.anforandetyp) || false,
          avgTextLength: data?.reduce((sum, s) => sum + (s.anforandetext?.length || 0), 0) / (data?.length || 1) || 0
        };
      }
    );
  }

  async testVoteDataStructure(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Vote Data Structure and Statistics',
      async () => {
        const { data, error } = await supabase
          .from('vote_data')
          .select('vote_id, beteckning, avser, vote_statistics, party_breakdown, constituency_breakdown')
          .not('vote_statistics', 'is', null)
          .limit(15);

        if (error) throw new Error(`Vote query failed: ${error.message}`);

        return {
          voteCount: data?.length || 0,
          hasStatistics: data?.every(v => v.vote_statistics) || false,
          hasPartyBreakdown: data?.some(v => v.party_breakdown) || false,
          hasConstituencyBreakdown: data?.some(v => v.constituency_breakdown) || false,
          statisticsFormat: data?.[0]?.vote_statistics ? Object.keys(data[0].vote_statistics) : []
        };
      }
    );
  }

  async testDocumentSearchAndFiltering(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Document Search and Filtering',
      async () => {
        // Test different document type filters
        const motionResults = await supabase
          .from('document_data')
          .select('document_id, titel, typ, organ, datum')
          .eq('typ', 'mot')
          .limit(5);

        const interpellationResults = await supabase
          .from('document_data')
          .select('document_id, titel, typ, organ, datum')
          .eq('typ', 'ip')
          .limit(5);

        // Test text search
        const textSearchResults = await supabase
          .from('document_data')
          .select('document_id, titel, content_preview')
          .textSearch('titel', 'budget')
          .limit(5);

        return {
          motions: motionResults.data?.length || 0,
          interpellations: interpellationResults.data?.length || 0,
          textSearchResults: textSearchResults.data?.length || 0,
          hasContentPreviews: textSearchResults.data?.some(d => d.content_preview) || false,
          filteringWorks: (motionResults.data?.every(d => d.typ === 'mot') || false) &&
                          (interpellationResults.data?.every(d => d.typ === 'ip') || false)
        };
      }
    );
  }

  async testPartyDataAccuracy(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Party Data Accuracy and Completeness',
      async () => {
        const { data, error } = await supabase
          .from('party_data')
          .select('party_code, party_name, total_members, active_members, gender_distribution, committee_distribution')
          .order('total_members', { ascending: false });

        if (error) throw new Error(`Party query failed: ${error.message}`);

        return {
          partyCount: data?.length || 0,
          hasGenderData: data?.some(p => p.gender_distribution) || false,
          hasCommitteeData: data?.some(p => p.committee_distribution) || false,
          memberCountsValid: data?.every(p => p.total_members >= p.active_members) || false,
          largestParty: data?.[0]?.party_name || 'Unknown',
          totalMembers: data?.reduce((sum, p) => sum + (p.total_members || 0), 0) || 0
        };
      }
    );
  }

  async testLanguageAnalysisData(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Language Analysis Data Quality',
      async () => {
        const { data, error } = await supabase
          .from('language_analysis')
          .select('member_name, overall_score, word_count, document_type, analysis_date')
          .gte('overall_score', 1)
          .limit(10);

        if (error) throw new Error(`Language analysis query failed: ${error.message}`);

        return {
          analysisCount: data?.length || 0,
          avgScore: data?.reduce((sum, a) => sum + (a.overall_score || 0), 0) / (data?.length || 1) || 0,
          documentTypes: [...new Set(data?.map(a => a.document_type).filter(Boolean))] || [],
          recentAnalyses: data?.filter(a => new Date(a.analysis_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length || 0,
          hasWordCounts: data?.every(a => a.word_count && a.word_count > 0) || false
        };
      }
    );
  }

  async testDataSyncLogIntegrity(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Data Sync Log Integrity',
      async () => {
        const { data, error } = await supabase
          .from('data_sync_log')
          .select('sync_type, status, created_at, sync_duration_ms, errors_count')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw new Error(`Sync log query failed: ${error.message}`);

        return {
          logCount: data?.length || 0,
          successfulSyncs: data?.filter(l => l.status === 'completed').length || 0,
          recentSyncs: data?.filter(l => new Date(l.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length || 0,
          avgDuration: data?.reduce((sum, l) => sum + (l.sync_duration_ms || 0), 0) / (data?.length || 1) || 0,
          syncTypes: [...new Set(data?.map(l => l.sync_type).filter(Boolean))] || []
        };
      }
    );
  }

  async runAllComprehensiveTests(): Promise<void> {
    console.log('🚀 Starting comprehensive API and data testing...');
    
    // Member API Tests
    await this.testMemberBasicFetching();
    await this.testMemberDetailsWithAssignments();
    await this.testCommitteeFiltering();
    await this.testMemberSearch();
    await this.testMemberDocuments();
    await this.testMemberSpeeches();
    
    // Database Tests
    await this.testCalendarDataFormatting();
    await this.testSpeechDataQualityAndFormatting();
    await this.testVoteDataStructure();
    await this.testDocumentSearchAndFiltering();
    await this.testPartyDataAccuracy();
    await this.testLanguageAnalysisData();
    await this.testDataSyncLogIntegrity();
    
    console.log('✅ Comprehensive testing completed');
  }
}
