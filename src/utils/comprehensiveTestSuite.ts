
import { EnhancedTester, DetailedTestResult } from './enhancedTestUtils';
import { supabase } from '../integrations/supabase/client';

export class ComprehensiveApiTestSuite extends EnhancedTester {
  constructor() {
    super('Comprehensive API Test Suite');
  }

  async runAllComprehensiveTests(): Promise<void> {
    // Member tests
    await this.runTest('Member Basic Fetching', () => this.testMemberBasicFetching());
    await this.runTest('Member Details with Assignments', () => this.testMemberDetailsWithAssignments());
    await this.runTest('Committee Filtering', () => this.testCommitteeFiltering());
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

  private async testMemberDetailsWithAssignments(): Promise<any> {
    const { data: members, error: memberError } = await supabase
      .from('member_data')
      .select('member_id')
      .eq('is_active', true)
      .limit(5);

    if (memberError) throw new Error(`Member fetching failed: ${memberError.message}`);
    if (!members || members.length === 0) throw new Error('No members found for assignment test');

    const memberId = members[0].member_id;

    const { data: assignments, error: assignmentError } = await supabase
      .from('member_assignments')
      .select('*')
      .eq('member_id', memberId);

    if (assignmentError) throw new Error(`Assignment fetching failed: ${assignmentError.message}`);

    return { 
      memberId, 
      assignmentCount: assignments?.length || 0,
      hasAssignments: assignments && assignments.length > 0
    };
  }

  private async testCommitteeFiltering(): Promise<any> {
    const { data, error } = await supabase
      .from('member_assignments')
      .select('committee_code, committee_name, role')
      .not('committee_code', 'is', null)
      .limit(20);

    if (error) throw new Error(`Committee filtering failed: ${error.message}`);

    const uniqueCommittees = new Set(data?.map(a => a.committee_code) || []);
    
    return { 
      totalAssignments: data?.length || 0,
      uniqueCommittees: uniqueCommittees.size,
      sampleCommittees: Array.from(uniqueCommittees).slice(0, 5)
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
      .select('document_id, title, document_type')
      .in('submitter_id', memberIds)
      .limit(20);

    if (docError) throw new Error(`Document fetching failed: ${docError.message}`);

    return { 
      memberCount: memberIds.length,
      documentCount: documents?.length || 0,
      documentTypes: [...new Set(documents?.map(d => d.document_type) || [])]
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
      .select('speech_id, speaker_id, debate_name')
      .in('speaker_id', memberIds)
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
      .gte('event_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(10);

    if (error) throw new Error(`Calendar data fetching failed: ${error.message}`);

    if (data && data.length > 0) {
      const sampleEvent = data[0];
      
      // Validate date format
      if (sampleEvent.event_date && !Date.parse(sampleEvent.event_date)) {
        throw new Error('Invalid date format in calendar data');
      }

      // Check required fields
      if (!sampleEvent.title) {
        throw new Error('Calendar event missing title');
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
      .select('speech_id, speaker_id, speech_text, debate_name')
      .not('speech_text', 'is', null)
      .limit(10);

    if (error) throw new Error(`Speech data fetching failed: ${error.message}`);

    let qualityIssues = 0;
    let avgLength = 0;

    if (data && data.length > 0) {
      data.forEach(speech => {
        if (!speech.speech_text || speech.speech_text.trim().length < 10) {
          qualityIssues++;
        }
        avgLength += speech.speech_text?.length || 0;
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
      .select('vote_id, voting_id, member_id, vote')
      .limit(10);

    if (error) throw new Error(`Vote data fetching failed: ${error.message}`);

    let structureIssues = 0;
    const validVotes = ['Ja', 'Nej', 'Avstår', 'Frånvarande'];

    if (data && data.length > 0) {
      data.forEach(vote => {
        if (!vote.vote_id || !vote.voting_id || !vote.member_id) {
          structureIssues++;
        }
        if (vote.vote && !validVotes.includes(vote.vote)) {
          structureIssues++;
        }
      });
    }

    return { 
      voteCount: data?.length || 0,
      structureIssues,
      structureIntegrity: data && data.length > 0 ? ((data.length - structureIssues) / data.length) * 100 : 0,
      validVoteTypes: validVotes
    };
  }

  private async testDocumentSearch(): Promise<any> {
    const searchTerm = 'motion';
    
    const { data, error } = await supabase
      .from('document_data')
      .select('document_id, title, document_type')
      .ilike('title', `%${searchTerm}%`)
      .limit(10);

    if (error) throw new Error(`Document search failed: ${error.message}`);

    return { 
      searchTerm,
      resultCount: data?.length || 0,
      documentTypes: [...new Set(data?.map(d => d.document_type) || [])],
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
      .select('party_abbreviation, party_name');

    if (partyError) throw new Error(`Party data fetching failed: ${partyError.message}`);

    const memberParties = new Set(members?.map(m => m.party) || []);
    const registeredParties = new Set(parties?.map(p => p.party_abbreviation) || []);
    
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
        if (analysis.sentiment_score !== null && 
            analysis.complexity_score !== null &&
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
      .from('data_sync_logs')
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
