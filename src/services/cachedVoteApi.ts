
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface CachedVoteData {
  id: string;
  vote_id: string;
  hangar_id: string | null;
  rm: string | null;
  beteckning: string | null;
  punkt: string | null;
  votering: string | null;
  avser: string | null;
  dok_id: string | null;
  systemdatum: string | null;
  vote_results: Json | null;
  vote_statistics: Json | null;
  party_breakdown: Json | null;
  constituency_breakdown: Json | null;
  created_at: string;
  updated_at: string;
}

export const fetchCachedVoteData = async (limit = 100): Promise<CachedVoteData[]> => {
  console.log('Fetching cached vote data...');
  
  const { data, error } = await supabase
    .from('vote_data')
    .select('*')
    .order('systemdatum', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching cached vote data:', error);
    throw new Error(`Failed to fetch cached vote data: ${error.message}`);
  }

  return data || [];
};

export const fetchVotesByParty = async (party: string): Promise<CachedVoteData[]> => {
  console.log(`Fetching votes for party: ${party}`);
  
  const { data, error } = await supabase
    .from('vote_data')
    .select('*')
    .contains('party_breakdown', { [party]: {} })
    .order('systemdatum', { ascending: false });

  if (error) {
    console.error('Error fetching votes by party:', error);
    throw new Error(`Failed to fetch votes by party: ${error.message}`);
  }

  return data || [];
};

export const fetchVotesByDateRange = async (fromDate: string, toDate: string): Promise<CachedVoteData[]> => {
  console.log(`Fetching votes from ${fromDate} to ${toDate}`);
  
  const { data, error } = await supabase
    .from('vote_data')
    .select('*')
    .gte('systemdatum', fromDate)
    .lte('systemdatum', toDate)
    .order('systemdatum', { ascending: false });

  if (error) {
    console.error('Error fetching votes by date range:', error);
    throw new Error(`Failed to fetch votes by date range: ${error.message}`);
  }

  return data || [];
};

export const fetchVoteDetails = async (voteId: string): Promise<CachedVoteData | null> => {
  console.log(`Fetching vote details for: ${voteId}`);
  
  const { data, error } = await supabase
    .from('vote_data')
    .select('*')
    .eq('vote_id', voteId)
    .single();

  if (error) {
    console.error('Error fetching vote details:', error);
    return null;
  }

  return data;
};

export const getVoteDataFreshness = async (): Promise<{ lastUpdated: string | null; isStale: boolean }> => {
  const { data, error } = await supabase
    .from('vote_data')
    .select('updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return { lastUpdated: null, isStale: true };
  }

  const lastUpdated = data.updated_at;
  const lastUpdateTime = new Date(lastUpdated);
  const now = new Date();
  const hoursSinceUpdate = (now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60);
  
  const isStale = hoursSinceUpdate > 24;

  return { lastUpdated, isStale };
};

// Utility functions for working with vote data
export const extractVoteResults = (voteResults: Json): any[] => {
  if (voteResults && typeof voteResults === 'object' && !Array.isArray(voteResults)) {
    const results = (voteResults as any)?.votering_resultat_lista?.votering_resultat;
    return Array.isArray(results) ? results : [];
  }
  return [];
};

export const extractPartyBreakdown = (partyBreakdown: Json): { [key: string]: any } => {
  if (partyBreakdown && typeof partyBreakdown === 'object' && !Array.isArray(partyBreakdown)) {
    return partyBreakdown as { [key: string]: any };
  }
  return {};
};

export const calculateVoteStatistics = (voteData: CachedVoteData) => {
  const results = extractVoteResults(voteData.vote_results);
  const stats = {
    total: results.length,
    ja: 0,
    nej: 0,
    avstår: 0,
    frånvarande: 0
  };

  results.forEach((result: any) => {
    const vote = result.rost?.toLowerCase();
    if (stats.hasOwnProperty(vote)) {
      (stats as any)[vote]++;
    }
  });

  return stats;
};
