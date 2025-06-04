
import { EnhancedTester, DetailedTestResult } from './enhancedTestUtils';
import { supabase } from '../integrations/supabase/client';

export class ComprehensiveApiTestSuite extends EnhancedTester {
  constructor() {
    super('Comprehensive API Test Suite');
  }

  async runAllComprehensiveTests(): Promise<void> {
    // Member tests
    await this.runTest('Member Basic Fetching', () => this.testMemberBasicFetching());
    await this.runTest('Member Details with Activity Data', () => this.testMemberDetailsWithActivityData());
    await this.runTest('Party Filtering', () => this.testPartyFiltering());
    await this.runTest('Member Search', () => this.testMemberSearch());
    await this.runTest('Member Documents', () => this.testMemberDocuments());
    await this.runTest('Member Speeches', () => this.testMemberSpeeches());

    // Data quality tests
    await this.runTest('Calendar Data Formatting', () => this.testCalendarDataFormatting());
    await this.runTest('Speech Data Quality', () => this.testSpeechDataQuality());
    await this.runTest('Vote Data Structure', () => this.testVoteDataStructure());
    await this.runTest('Document Search', () => this.testDocumentSearch());
    await this.runTest('Party Data Accuracy', () => this.testPartyDataAccuracy());
    await this.runTest('Language Analysis Data', () => this.testLanguageAnalysisData());
    await this.runTest('Data Sync Log Integrity', () => this.testDataSyncLogIntegrity());
  }

  private async testMemberBasicFetching(): Promise<any> {
    const { data, error } = await supabase
      .from('member_data')
      .select('member_id, first_name, last_name, party')
      .eq('is_active', true)
      .limit(10);

    if (error) throw new Error(`Member fetching failed: ${error.message}`);
    if (!data || data.length === 0) throw new Error('No active members found');

    // Validate structure
    data.forEach(member => {
      if (!member.member_id) throw new Error('Member missing ID');
      if (!member.first_name || !member.last_name) throw new Error('Member missing name');
      if (!member.party) throw new Error('Member missing party');
    });

    return { memberCount: data.length, sampleMember: data[0] };
  }

  private async testMemberDetailsWithActivityData(): Promise<any> {
    const { data: members, error: memberError } = await supabase
      .from('member_data')
      .select('member_id, activity_data, assignments')
      .eq('is_active', true)
      .limit(5);

    if (memberError) throw new Error(`Member fetching failed: ${memberError.message}`);
    if (!members || members.length === 0) throw new Error('No members found for activity test');

    const memberId = members[0].member_id;
    const hasActivityData = members.some(m => m.activity_data !== null);
    const hasAssignments = members.some(m => m.assignments !== null);

    return { 
      memberId, 
      memberCount: members.length,
      hasActivityData,
      hasAssignments
    };
  }

  private async testPartyFiltering(): Promise<any> {
    const { data, error } = await supabase
      .from('member_data')
      .select('party, constituency')
      .eq('is_active', true)
      .limit(20);

    if (error) throw new Error(`Party filtering failed: ${error.message}`);

    const uniqueParties = new Set(data?.map(m => m.party) || []);
    const uniqueConstituencies = new Set(data?.map(m => m.constituency).filter(Boolean) || []);
    
    return { 
      totalMembers: data?.length || 0,
      uniqueParties: uniqueParties.size,
      uniqueConstituencies: uniqueConstituencies.size,
      sampleParties: Array.from(uniqueParties).slice(0, 5)
    };
  }

  private async testMemberSearch(): Promise<any> {
    const searchTerm = 'andersson';
    
    const { data, error } = await supabase
      .from('member_data')
      .select('member_id, first_name, last_name')
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
      .eq('is_active', true)
      .limit(10);

    if (error) throw new Error(`Member search failed: ${error.message}`);

    return { 
      searchTerm,
      resultCount: data?.length || 0,
      results: data?.map(m => `${m.first_name} ${m.last_name}`) || []
    };
  }

  private async testMemberDocuments(): Promise<any> {
    const { data: members, error: memberError } = await supabase
      .from('member_data')
      .select('member_id')
      .eq('is_active', true)
      .limit(3);

    if (memberError) throw new Error(`Member fetching failed: ${memberError.message}`);
    if (!members || members.length === 0) throw new Error('No members found');

    const memberIds = members.map(m => m.member_id);

    const { data: documents, error: docError } = await supabase
      .from('document_data')
      .select('document_id, titel, typ')
      .in('intressent_id', memberIds)
      .limit(20);

    if (docError) throw new Error(`Document fetching failed: ${docError.message}`);

    return { 
      memberCount: memberIds.length,
      documentCount: documents?.length || 0,
      documentTypes: [...new Set(documents?.map(d => d.typ) || [])]
    };
  }

  private async testMemberSpeeches(): Promise<any> {
    const { data: members, error: memberError } = await supabase
      .from('member_data')
      .select('member_id')
      .eq('is_active', true)
      .limit(3);

    if (memberError) throw new Error(`Member fetching failed: ${memberError.message}`);
    if (!members || members.length === 0) throw new Error('No members found');

    const memberIds = members.map(m => m.member_id);

    const { data: speeches, error: speechError } = await supabase
      .from('speech_data')
      .select('speech_id, intressent_id, rel_dok_titel')
      .in('intressent_id', memberIds)
      .limit(20);

    if (speechError) throw new Error(`Speech fetching failed: ${speechError.message}`);

    return { 
      memberCount: memberIds.length,
      speechCount: speeches?.length || 0,
      hasSpeeches: speeches && speeches.length > 0
    };
  }

  private async testCalendarDataFormatting(): Promise<any> {
    const { data, error } = await supabase
      .from('calendar_data')
      .select('*')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(10);

    if (error) throw new Error(`Calendar data fetching failed: ${error.message}`);

    if (data && data.length > 0) {
      const sampleEvent = data[0];
      
      // Validate date format
      if (sampleEvent.datum && !Date.parse(sampleEvent.datum)) {
        throw new Error('Invalid date format in calendar data');
      }

      // Check required fields
      if (!sampleEvent.summary) {
        throw new Error('Calendar event missing summary');
      }
    }

    return { 
      eventCount: data?.length || 0,
      hasEvents: data && data.length > 0,
      sampleEvent: data?.[0] || null
    };
  }

  private async testSpeechDataQuality(): Promise<any> {
    const { data, error } = await supabase
      .from('speech_data')
      .select('speech_id, intressent_id, anforandetext, rel_dok_titel')
      .not('anforandetext', 'is', null)
      .limit(10);

    if (error) throw new Error(`Speech data fetching failed: ${error.message}`);

    let qualityIssues = 0;
    let avgLength = 0;

    if (data && data.length > 0) {
      data.forEach(speech => {
        if (!speech.anforandetext || speech.anforandetext.trim().length < 10) {
          qualityIssues++;
        }
        avgLength += speech.anforandetext?.length || 0;
      });
      avgLength = avgLength / data.length;
    }

    return { 
      speechCount: data?.length || 0,
      qualityIssues,
      averageLength: Math.round(avgLength),
      qualityRate: data && data.length > 0 ? ((data.length - qualityIssues) / data.length) * 100 : 0
    };
  }

  private async testVoteDataStructure(): Promise<any> {
    const { data, error } = await supabase
      .from('vote_data')
      .select('vote_id, hangar_id, beteckning, vote_results')
      .limit(10);

    if (error) throw new Error(`Vote data fetching failed: ${error.message}`);

    let structureIssues = 0;

    if (data && data.length > 0) {
      data.forEach(vote => {
        if (!vote.vote_id || !vote.hangar_id) {
          structureIssues++;
        }
      });
    }

    return { 
      voteCount: data?.length || 0,
      structureIssues,
      structureIntegrity: data && data.length > 0 ? ((data.length - structureIssues) / data.length) * 100 : 0,
      hasVoteResults: data?.some(v => v.vote_results !== null) || false
    };
  }

  private async testDocumentSearch(): Promise<any> {
    const searchTerm = 'motion';
    
    const { data, error } = await supabase
      .from('document_data')
      .select('document_id, titel, typ')
      .ilike('titel', `%${searchTerm}%`)
      .limit(10);

    if (error) throw new Error(`Document search failed: ${error.message}`);

    return { 
      searchTerm,
      resultCount: data?.length || 0,
      documentTypes: [...new Set(data?.map(d => d.typ) || [])],
      hasResults: data && data.length > 0
    };
  }

  private async testPartyDataAccuracy(): Promise<any> {
    const { data: members, error: memberError } = await supabase
      .from('member_data')
      .select('party')
      .eq('is_active', true);

    if (memberError) throw new Error(`Member data fetching failed: ${memberError.message}`);

    const { data: parties, error: partyError } = await supabase
      .from('party_data')
      .select('party_code, party_name');

    if (partyError) throw new Error(`Party data fetching failed: ${partyError.message}`);

    const memberParties = new Set(members?.map(m => m.party) || []);
    const registeredParties = new Set(parties?.map(p => p.party_code) || []);
    
    const unmatchedParties = Array.from(memberParties).filter(party => 
      party && !registeredParties.has(party)
    );

    return { 
      memberPartyCount: memberParties.size,
      registeredPartyCount: registeredParties.size,
      unmatchedParties,
      dataConsistency: unmatchedParties.length === 0
    };
  }

  private async testLanguageAnalysisData(): Promise<any> {
    const { data, error } = await supabase
      .from('language_analysis')
      .select('*')
      .limit(10);

    if (error) throw new Error(`Language analysis data fetching failed: ${error.message}`);

    let analysisQuality = 0;
    if (data && data.length > 0) {
      data.forEach(analysis => {
        if (analysis.overall_score !== null && 
            analysis.language_complexity_score !== null &&
            analysis.word_count && analysis.word_count > 0) {
          analysisQuality++;
        }
      });
    }

    return { 
      analysisCount: data?.length || 0,
      qualityAnalyses: analysisQuality,
      qualityRate: data && data.length > 0 ? (analysisQuality / data.length) * 100 : 0,
      hasAnalysisData: data && data.length > 0
    };
  }

  private async testDataSyncLogIntegrity(): Promise<any> {
    const { data, error } = await supabase
      .from('data_sync_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw new Error(`Sync log fetching failed: ${error.message}`);

    let recentSyncs = 0;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (data && data.length > 0) {
      recentSyncs = data.filter(log => 
        log.created_at && new Date(log.created_at) > oneDayAgo
      ).length;
    }

    return { 
      totalLogs: data?.length || 0,
      recentSyncs,
      hasRecentActivity: recentSyncs > 0,
      latestSync: data?.[0]?.created_at || null
    };
  }
}
