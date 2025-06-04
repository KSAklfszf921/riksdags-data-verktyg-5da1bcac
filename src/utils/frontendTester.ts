
import { EnhancedTester, DetailedTestResult } from './enhancedTestUtils';
import { supabase } from '@/integrations/supabase/client';

export class FrontendTester extends EnhancedTester {
  constructor() {
    super('Frontend Components Test Suite');
  }

  async testCalendarComponentData(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Calendar Component Data Loading',
      async () => {
        const { data, error } = await supabase
          .from('calendar_data')
          .select('event_id, datum, summary, organ, typ')
          .limit(10);
        
        if (error) throw error;
        
        const validEvents = data?.filter(event => 
          event.datum && 
          event.summary && 
          event.organ
        ) || [];
        
        return {
          totalEvents: data?.length || 0,
          validEvents: validEvents.length,
          hasValidData: validEvents.length > 0,
          sampleEvent: validEvents[0] || null
        };
      }
    );
  }

  async testMemberComponentData(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Member Component Data Loading',
      async () => {
        const { data, error } = await supabase
          .from('member_data')
          .select('member_id, first_name, last_name, party, is_active')
          .eq('is_active', true)
          .limit(10);
        
        if (error) throw error;
        
        return {
          totalMembers: data?.length || 0,
          allHaveNames: data?.every(m => m.first_name && m.last_name) || false,
          allHaveParties: data?.every(m => m.party) || false,
          sampleMember: data?.[0] || null
        };
      }
    );
  }

  async testPartyComponentData(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Party Component Data Loading',
      async () => {
        const { data, error } = await supabase
          .from('party_data')
          .select('party_code, party_name, total_members, active_members')
          .limit(10);
        
        if (error) throw error;
        
        return {
          totalParties: data?.length || 0,
          allHaveMembers: data?.every(p => p.total_members && p.total_members > 0) || false,
          largestParty: data?.reduce((prev, current) => 
            (prev.total_members > current.total_members) ? prev : current
          ) || null
        };
      }
    );
  }

  async testDocumentComponentData(): Promise<DetailedTestResult> {
    return this.testApiEndpoint(
      'Document Component Data Loading',
      async () => {
        const { data, error } = await supabase
          .from('document_data')
          .select('document_id, titel, typ, datum, organ')
          .limit(10);
        
        if (error) throw error;
        
        return {
          totalDocuments: data?.length || 0,
          allHaveTitles: data ? data.every(d => d.titel) : false,
          documentTypes: data ? [...new Set(data.map(d => d.typ).filter(Boolean))] : [],
          sampleDocument: data?.[0] || null
        };
      }
    );
  }

  async runAllFrontendTests(): Promise<void> {
    console.log('🎨 Starting frontend component testing...');
    
    await this.testCalendarComponentData();
    await this.testMemberComponentData();
    await this.testPartyComponentData();
    await this.testDocumentComponentData();
    
    console.log('✅ Frontend testing completed');
  }
}
