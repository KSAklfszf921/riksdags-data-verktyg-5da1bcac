
import { supabase } from '@/integrations/supabase/client';

export interface CachedMemberData {
  id: string;
  member_id: string;
  first_name: string;
  last_name: string;
  party: string;
  constituency: string | null;
  gender: string | null;
  birth_year: number | null;
  assignments: any[] | null;
  activity_data: any | null;
  created_at: string;
  updated_at: string;
}

export interface CachedPartyData {
  id: string;
  party_code: string;
  party_name: string;
  total_members: number;
  active_members: number;
  gender_distribution: any | null;
  age_distribution: any | null;
  committee_distribution: any | null;
  activity_stats: any | null;
  created_at: string;
  updated_at: string;
}

export const fetchCachedPartyData = async (): Promise<CachedPartyData[]> => {
  console.log('Fetching cached party data...');
  
  const { data, error } = await supabase
    .from('party_data')
    .select('*')
    .order('total_members', { ascending: false });

  if (error) {
    console.error('Error fetching cached party data:', error);
    throw new Error(`Failed to fetch cached party data: ${error.message}`);
  }

  return data || [];
};

export const fetchCachedMemberData = async (): Promise<CachedMemberData[]> => {
  console.log('Fetching cached member data...');
  
  const { data, error } = await supabase
    .from('member_data')
    .select('*')
    .order('last_name');

  if (error) {
    console.error('Error fetching cached member data:', error);
    throw new Error(`Failed to fetch cached member data: ${error.message}`);
  }

  return data || [];
};

export const getDataFreshness = async (): Promise<{ lastUpdated: string | null; isStale: boolean }> => {
  const { data, error } = await supabase
    .from('party_data')
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
  
  // Consider data stale if it's older than 24 hours
  const isStale = hoursSinceUpdate > 24;

  return { lastUpdated, isStale };
};

export const refreshPartyData = async (): Promise<void> => {
  console.log('Triggering party data refresh...');
  
  const { error } = await supabase.functions.invoke('fetch-party-data');
  
  if (error) {
    console.error('Error refreshing party data:', error);
    throw new Error(`Failed to refresh party data: ${error.message}`);
  }
};
