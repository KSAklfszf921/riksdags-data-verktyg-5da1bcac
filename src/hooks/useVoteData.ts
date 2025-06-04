
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VoteData {
  id: string;
  vote_id: string;
  beteckning: string | null;
  punkt: string | null;
  rm: string | null;
  avser: string | null;
  systemdatum: string | null;
  vote_results: any;
  vote_statistics: any;
  party_breakdown: any;
  constituency_breakdown: any;
  created_at: string;
  updated_at: string;
}

interface VoteDataState {
  votes: VoteData[];
  loading: boolean;
  error: string | null;
  totalCount: number;
}

export const useVoteData = () => {
  const [state, setState] = useState<VoteDataState>({
    votes: [],
    loading: true,
    error: null,
    totalCount: 0
  });

  const fetchRecentVotes = useCallback(async (limit: number = 10) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error, count } = await supabase
        .from('vote_data')
        .select('*', { count: 'exact' })
        .order('systemdatum', { ascending: false })
        .limit(limit);

      if (error) throw error;

      setState({
        votes: data || [],
        loading: false,
        error: null,
        totalCount: count || 0
      });

      console.log(`Fetched ${data?.length || 0} recent votes`);
      
    } catch (error) {
      console.error('Error fetching recent votes:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, []);

  const fetchVotesByDateRange = useCallback(async (fromDate: string, toDate: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase
        .from('vote_data')
        .select('*')
        .gte('systemdatum', fromDate)
        .lte('systemdatum', toDate)
        .order('systemdatum', { ascending: false });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        votes: data || [],
        loading: false,
        error: null
      }));

      console.log(`Fetched ${data?.length || 0} votes for date range ${fromDate} to ${toDate}`);
      
    } catch (error) {
      console.error('Error fetching votes by date range:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, []);

  const fetchVotesByParty = useCallback(async (party: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase
        .from('vote_data')
        .select('*')
        .contains('party_breakdown', { [party]: {} })
        .order('systemdatum', { ascending: false });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        votes: data || [],
        loading: false,
        error: null
      }));

      console.log(`Fetched ${data?.length || 0} votes for party ${party}`);
      
    } catch (error) {
      console.error('Error fetching votes by party:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, []);

  const syncVoteData = useCallback(async () => {
    try {
      console.log('Starting vote data synchronization...');
      
      const { data, error } = await supabase.functions.invoke('fetch-comprehensive-data', {
        body: { 
          types: ['votes'], 
          forceRefresh: true 
        }
      });

      if (error) throw error;

      console.log('Vote sync completed:', data);
      
      // Refresh local data after sync
      await fetchRecentVotes();
      
      return data;
      
    } catch (error) {
      console.error('Error syncing vote data:', error);
      throw error;
    }
  }, [fetchRecentVotes]);

  const getVoteStatistics = useCallback(() => {
    const { votes } = state;
    
    if (votes.length === 0) {
      return {
        totalVotes: 0,
        uniqueDesignations: 0,
        dateRange: null,
        partiesInvolved: 0
      };
    }

    const uniqueDesignations = new Set(votes.map(v => v.beteckning).filter(Boolean));
    const dates = votes.map(v => v.systemdatum).filter(Boolean).sort();
    const parties = new Set(
      votes.flatMap(v => v.party_breakdown ? Object.keys(v.party_breakdown) : [])
    );

    return {
      totalVotes: votes.length,
      uniqueDesignations: uniqueDesignations.size,
      dateRange: dates.length > 0 ? {
        from: dates[0],
        to: dates[dates.length - 1]
      } : null,
      partiesInvolved: parties.size
    };
  }, [state.votes]);

  // Auto-load recent votes on mount
  useEffect(() => {
    fetchRecentVotes();
  }, [fetchRecentVotes]);

  return {
    ...state,
    fetchRecentVotes,
    fetchVotesByDateRange,
    fetchVotesByParty,
    syncVoteData,
    getVoteStatistics
  };
};
