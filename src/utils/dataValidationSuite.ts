
import { supabase } from '@/integrations/supabase/client';
import { EnhancedTester, DetailedTestResult } from './enhancedTestUtils';

export class DataValidationSuite extends EnhancedTester {
  constructor() {
    super('Data Validation Tests');
  }

  async testCalendarDataIntegrity(): Promise<DetailedTestResult> {
    return this.runTest('Calendar Data Integrity', async () => {
      // Test for missing required fields
      const { data: missingData, error: missingError } = await supabase
        .from('calendar_data')
        .select('id, event_id, datum')
        .or('event_id.is.null,datum.is.null')
        .limit(10);

      if (missingError) throw new Error(`Integrity check failed: ${missingError.message}`);

      // Test for duplicate event_ids
      const { data: duplicates, error: dupError } = await supabase
        .from('calendar_data')
        .select('event_id')
        .not('event_id', 'is', null);

      if (dupError) throw new Error(`Duplicate check failed: ${dupError.message}`);

      const eventIds = duplicates?.map(d => d.event_id) || [];
      const uniqueEventIds = new Set(eventIds);
      const duplicateCount = eventIds.length - uniqueEventIds.size;

      return {
        missingRequiredFields: missingData?.length || 0,
        duplicateEventIds: duplicateCount,
        totalRecords: eventIds.length,
        dataQuality: missingData?.length === 0 && duplicateCount === 0 ? 'GOOD' : 'ISSUES_FOUND'
      };
    });
  }

  async testMemberDataConsistency(): Promise<DetailedTestResult> {
    return this.runTest('Member Data Consistency', async () => {
      // Test for members without names
      const { data: missingNames, error: nameError } = await supabase
        .from('member_data')
        .select('id, first_name, last_name')
        .or('first_name.is.null,last_name.is.null,first_name.eq.,last_name.eq.')
        .limit(10);

      if (nameError) throw new Error(`Name validation failed: ${nameError.message}`);

      // Test for invalid party codes
      const { data: invalidParties, error: partyError } = await supabase
        .from('member_data')
        .select('id, party')
        .or('party.is.null,party.eq.')
        .limit(10);

      if (partyError) throw new Error(`Party validation failed: ${partyError.message}`);

      return {
        membersWithoutNames: missingNames?.length || 0,
        membersWithoutParty: invalidParties?.length || 0,
        dataConsistency: (missingNames?.length || 0) === 0 && (invalidParties?.length || 0) === 0 ? 'CONSISTENT' : 'INCONSISTENT'
      };
    });
  }

  async testSpeechDataQuality(): Promise<DetailedTestResult> {
    return this.runTest('Speech Data Quality', async () => {
      // Test for empty speech texts
      const { data: emptySpeeches, error: emptyError } = await supabase
        .from('speech_data')
        .select('id, anforandetext')
        .or('anforandetext.is.null,anforandetext.eq.')
        .limit(10);

      if (emptyError) throw new Error(`Empty speech check failed: ${emptyError.message}`);

      // Test for speeches with word count
      const { data: withWordCount, error: wordError } = await supabase
        .from('speech_data')
        .select('id, word_count')
        .not('word_count', 'is', null)
        .gte('word_count', 10)
        .limit(100);

      if (wordError) throw new Error(`Word count check failed: ${wordError.message}`);

      return {
        emptySpeeches: emptySpeeches?.length || 0,
        speechesWithWordCount: withWordCount?.length || 0,
        dataQuality: (emptySpeeches?.length || 0) < 5 ? 'GOOD' : 'POOR'
      };
    });
  }

  async testVoteDataCompleteness(): Promise<DetailedTestResult> {
    return this.runTest('Vote Data Completeness', async () => {
      // Test for votes with statistics
      const { data: withStats, error: statsError } = await supabase
        .from('vote_data')
        .select('id, vote_statistics')
        .not('vote_statistics', 'is', null)
        .limit(50);

      if (statsError) throw new Error(`Vote statistics check failed: ${statsError.message}`);

      // Test for votes with party breakdown
      const { data: withBreakdown, error: breakdownError } = await supabase
        .from('vote_data')
        .select('id, party_breakdown')
        .not('party_breakdown', 'is', null)
        .limit(50);

      if (breakdownError) throw new Error(`Party breakdown check failed: ${breakdownError.message}`);

      return {
        votesWithStatistics: withStats?.length || 0,
        votesWithPartyBreakdown: withBreakdown?.length || 0,
        completenessRatio: ((withStats?.length || 0) + (withBreakdown?.length || 0)) / 100
      };
    });
  }

  async runAllValidationTests(): Promise<void> {
    await this.testCalendarDataIntegrity();
    await this.testMemberDataConsistency();
    await this.testSpeechDataQuality();
    await this.testVoteDataCompleteness();
  }
}
