import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface CachedVoteData {
  id: string;
  vote_id: string;
  dok_id: string | null;
  rm: string | null;
  hangar_id: string | null;
  beteckning: string | null;
  avser: string | null;
  votering: string | null;
  systemdatum: string | null;
  punkt: number | null;
  vote_results: Json;
  party_breakdown: Json;
  constituency_breakdown: Json;
  metadata: Json;
  vote_statistics: Json;
  created_at: string;
  updated_at: string;
}

export const fetchCachedVoteData = async (limit: number = 100): Promise<CachedVoteData[]> => {
  const { data, error } = await supabase
    .from('vote_data')
    .select('*')
    .order('systemdatum', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching cached vote data:', error);
    throw new Error(`Failed to fetch cached vote data: ${error.message}`);
  }

  return data?.map(item => ({
    id: String(item.id),
    vote_id: item.vote_id,
    dok_id: item.dok_id,
    rm: item.rm,
    hangar_id: item.hangar_id,
    beteckning: item.beteckning,
    avser: item.avser,
    votering: item.votering,
    systemdatum: item.systemdatum,
    punkt: item.punkt,
    vote_results: item.vote_results,
    party_breakdown: item.party_breakdown,
    constituency_breakdown: item.constituency_breakdown,
    metadata: item.metadata,
    vote_statistics: item.metadata || {},
    created_at: item.created_at,
    updated_at: item.updated_at
  })) || [];
};

export const fetchVotesByDocument = async (dokId: string): Promise<CachedVoteData[]> => {
  const { data, error } = await supabase
    .from('vote_data')
    .select('*')
    .eq('dok_id', dokId)
    .order('systemdatum', { ascending: false });

  if (error) {
    console.error('Error fetching votes by document:', error);
    throw new Error(`Failed to fetch votes by document: ${error.message}`);
  }

  return data?.map(item => ({
    id: String(item.id),
    vote_id: item.vote_id,
    dok_id: item.dok_id,
    rm: item.rm,
    hangar_id: item.hangar_id,
    beteckning: item.beteckning,
    avser: item.avser,
    votering: item.votering,
    systemdatum: item.systemdatum,
    punkt: item.punkt,
    vote_results: item.vote_results,
    party_breakdown: item.party_breakdown,
    constituency_breakdown: item.constituency_breakdown,
    metadata: item.metadata,
    vote_statistics: item.metadata || {},
    created_at: item.created_at,
    updated_at: item.updated_at
  })) || [];
};

export const searchVotes = async (query: string): Promise<CachedVoteData[]> => {
  const { data, error } = await supabase
    .from('vote_data')
    .select('*')
    .or(`avser.ilike.%${query}%, beteckning.ilike.%${query}%`)
    .order('systemdatum', { ascending: false });

  if (error) {
    console.error('Error searching votes:', error);
    throw new Error(`Failed to search votes: ${error.message}`);
  }

  return data?.map(item => ({
    id: String(item.id),
    vote_id: item.vote_id,
    dok_id: item.dok_id,
    rm: item.rm,
    hangar_id: item.hangar_id,
    beteckning: item.beteckning,
    avser: item.avser,
    votering: item.votering,
    systemdatum: item.systemdatum,
    punkt: item.punkt,
    vote_results: item.vote_results,
    party_breakdown: item.party_breakdown,
    constituency_breakdown: item.constituency_breakdown,
    metadata: item.metadata,
    vote_statistics: item.metadata || {},
    created_at: item.created_at,
    updated_at: item.updated_at
  })) || [];
};

export const fetchVoteById = async (voteId: string): Promise<CachedVoteData | null> => {
  const { data, error } = await supabase
    .from('vote_data')
    .select('*')
    .eq('vote_id', voteId)
    .single();

  if (error) {
    console.error('Error fetching vote by ID:', error);
    return null;
  }

  if (!data) return null;

  return {
    id: String(data.id),
    vote_id: data.vote_id,
    dok_id: data.dok_id,
    rm: data.rm,
    hangar_id: data.hangar_id,
    beteckning: data.beteckning,
    avser: data.avser,
    votering: data.votering,
    systemdatum: data.systemdatum,
    punkt: data.punkt,
    vote_results: data.vote_results,
    party_breakdown: data.party_breakdown,
    constituency_breakdown: data.constituency_breakdown,
    metadata: data.metadata,
    vote_statistics: data.metadata || {},
    created_at: data.created_at,
    updated_at: data.updated_at
  };
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

  return data?.map(item => ({
    id: String(item.id),
    vote_id: item.vote_id,
    dok_id: item.dok_id,
    rm: item.rm,
    hangar_id: item.hangar_id,
    beteckning: item.beteckning,
    avser: item.avser,
    votering: item.votering,
    systemdatum: item.systemdatum,
    punkt: item.punkt,
    vote_results: item.vote_results,
    party_breakdown: item.party_breakdown,
    constituency_breakdown: item.constituency_breakdown,
    metadata: item.metadata,
    vote_statistics: item.metadata || {},
    created_at: item.created_at,
    updated_at: item.updated_at
  })) || [];
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

  return data?.map(item => ({
    id: String(item.id),
    vote_id: item.vote_id,
    dok_id: item.dok_id,
    rm: item.rm,
    hangar_id: item.hangar_id,
    beteckning: item.beteckning,
    avser: item.avser,
    votering: item.votering,
    systemdatum: item.systemdatum,
    punkt: item.punkt,
    vote_results: item.vote_results,
    party_breakdown: item.party_breakdown,
    constituency_breakdown: item.constituency_breakdown,
    metadata: item.metadata,
    vote_statistics: item.metadata || {},
    created_at: item.created_at,
    updated_at: item.updated_at
  })) || [];
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

  if (!data) return null;

  return {
    id: String(data.id),
    vote_id: data.vote_id,
    dok_id: data.dok_id,
    rm: data.rm,
    hangar_id: data.hangar_id,
    beteckning: data.beteckning,
    avser: data.avser,
    votering: data.votering,
    systemdatum: data.systemdatum,
    punkt: data.punkt,
    vote_results: data.vote_results,
    party_breakdown: data.party_breakdown,
    constituency_breakdown: data.constituency_breakdown,
    metadata: data.metadata,
    vote_statistics: data.metadata || {},
    created_at: data.created_at,
    updated_at: data.updated_at
  };
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
    if (Object.prototype.hasOwnProperty.call(stats, vote)) {
      (stats as any)[vote]++;
    }
  });

  return stats;
};

export const formatVoteDate = (dateString: string | null): string => {
  if (!dateString) return 'Okänt datum';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE');
  } catch {
    return dateString;
  }
};

export const getVoteResult = (voteData: CachedVoteData): string => {
  if (!voteData.vote_results) return 'Okänt resultat';
  
  try {
    const results = voteData.vote_results as any;
    if (results.outcome) {
      return results.outcome;
    }
    return 'Okänt resultat';
  } catch {
    return 'Okänt resultat';
  }
};

export const getPartyVotes = (voteData: CachedVoteData): any => {
  if (!voteData.party_breakdown) return {};
  
  try {
    return voteData.party_breakdown as any;
  } catch {
    return {};
  }
};
