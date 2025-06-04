
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type PartyData = Database['public']['Tables']['party_data']['Row'];
type MemberData = Database['public']['Tables']['member_data']['Row'];
type DocumentData = Database['public']['Tables']['document_data']['Row'];
type SpeechData = Database['public']['Tables']['speech_data']['Row'];
type VoteData = Database['public']['Tables']['vote_data']['Row'];
type CalendarData = Database['public']['Tables']['calendar_data']['Row'];
type DataSyncLog = Database['public']['Tables']['data_sync_log']['Row'];

export class SupabaseDataService {
  // Party Data Methods
  static async getPartyData() {
    const { data, error } = await supabase
      .from('party_data')
      .select('*')
      .order('active_members', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getPartyByCode(partyCode: string) {
    const { data, error } = await supabase
      .from('party_data')
      .select('*')
      .eq('party_code', partyCode)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Member Data Methods
  static async getMemberData(limit?: number) {
    let query = supabase
      .from('member_data')
      .select('*')
      .eq('is_active', true)
      .order('last_name');
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async getMemberById(memberId: string) {
    const { data, error } = await supabase
      .from('member_data')
      .select('*')
      .eq('member_id', memberId)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getMembersByParty(party: string) {
    const { data, error } = await supabase
      .from('member_data')
      .select('*')
      .eq('party', party)
      .eq('is_active', true)
      .order('last_name');
    
    if (error) throw error;
    return data;
  }

  // Document Data Methods
  static async getDocuments(filters?: {
    typ?: string;
    party?: string;
    limit?: number;
    fromDate?: string;
    toDate?: string;
  }) {
    let query = supabase
      .from('document_data')
      .select('*')
      .order('datum', { ascending: false });

    if (filters?.typ) {
      query = query.eq('typ', filters.typ);
    }
    if (filters?.party) {
      query = query.eq('party', filters.party);
    }
    if (filters?.fromDate) {
      query = query.gte('datum', filters.fromDate);
    }
    if (filters?.toDate) {
      query = query.lte('datum', filters.toDate);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async getDocumentById(documentId: string) {
    const { data, error } = await supabase
      .from('document_data')
      .select('*')
      .eq('document_id', documentId)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Speech Data Methods
  static async getSpeeches(filters?: {
    party?: string;
    memberId?: string;
    limit?: number;
    fromDate?: string;
    toDate?: string;
  }) {
    let query = supabase
      .from('speech_data')
      .select('*')
      .order('anforandedatum', { ascending: false });

    if (filters?.party) {
      query = query.eq('party', filters.party);
    }
    if (filters?.memberId) {
      query = query.eq('intressent_id', filters.memberId);
    }
    if (filters?.fromDate) {
      query = query.gte('anforandedatum', filters.fromDate);
    }
    if (filters?.toDate) {
      query = query.lte('anforandedatum', filters.toDate);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Vote Data Methods
  static async getVotes(filters?: {
    limit?: number;
    fromDate?: string;
    toDate?: string;
  }) {
    let query = supabase
      .from('vote_data')
      .select('*')
      .order('systemdatum', { ascending: false });

    if (filters?.fromDate) {
      query = query.gte('systemdatum', filters.fromDate);
    }
    if (filters?.toDate) {
      query = query.lte('systemdatum', filters.toDate);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async getVoteById(voteId: string) {
    const { data, error } = await supabase
      .from('vote_data')
      .select('*')
      .eq('vote_id', voteId)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Calendar Data Methods
  static async getCalendarEvents(filters?: {
    organ?: string;
    typ?: string;
    limit?: number;
    fromDate?: string;
    toDate?: string;
  }) {
    let query = supabase
      .from('calendar_data')
      .select('*')
      .order('datum', { ascending: true });

    if (filters?.organ) {
      query = query.eq('organ', filters.organ);
    }
    if (filters?.typ) {
      query = query.eq('typ', filters.typ);
    }
    if (filters?.fromDate) {
      query = query.gte('datum', filters.fromDate);
    }
    if (filters?.toDate) {
      query = query.lte('datum', filters.toDate);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async getUpcomingEvents(limit: number = 10) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('calendar_data')
      .select('*')
      .gte('datum', today)
      .order('datum', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  // Data Status Methods
  static async getDataStatus() {
    const validTables = ['party_data', 'member_data', 'document_data', 'speech_data', 'vote_data', 'calendar_data'];
    const status = [];

    for (const table of validTables) {
      try {
        const { count, error } = await supabase
          .from(table as any)
          .select('*', { count: 'exact', head: true });

        if (error) throw error;

        // Get latest update
        const { data: latestData, error: latestError } = await supabase
          .from(table as any)
          .select('updated_at')
          .order('updated_at', { ascending: false })
          .limit(1);

        if (latestError) {
          console.error(`Error fetching latest update for ${table}:`, latestError);
        }

        const lastUpdate = latestData && latestData.length > 0 && latestData[0] && 'updated_at' in latestData[0] ? latestData[0].updated_at : null;
        const hoursOld = lastUpdate && typeof lastUpdate === 'string' ? 
          (Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60) : null;

        status.push({
          table,
          recordCount: count || 0,
          lastUpdate,
          hoursOld,
          isStale: hoursOld ? hoursOld > 24 : true
        });
      } catch (error) {
        status.push({
          table,
          recordCount: 0,
          lastUpdate: null,
          hoursOld: null,
          isStale: true,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return status;
  }

  // Sync Log Methods
  static async getLatestSyncLogs(limit: number = 10) {
    const { data, error } = await supabase
      .from('data_sync_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async createSyncLog(logData: Omit<DataSyncLog, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('data_sync_log')
      .insert(logData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
