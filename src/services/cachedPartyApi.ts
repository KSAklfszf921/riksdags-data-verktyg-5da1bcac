
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface CachedMemberData {
  id: string;
  member_id: string;
  first_name: string;
  last_name: string;
  party: string;
  constituency: string | null;
  gender: string | null;
  birth_year: number | null;
  is_active: boolean | null;
  riksdag_status: string | null;
  current_committees: string[] | null;
  committee_assignments: Json | null;
  image_urls: Json | null;
  assignments: Json | null;
  activity_data: Json | null;
  created_at: string;
  updated_at: string;
}

export interface CachedPartyData {
  id: string;
  party_code: string;
  party_name: string;
  total_members: number;
  active_members: number;
  gender_distribution: Json | null;
  age_distribution: Json | null;
  committee_distribution: Json | null;
  committee_members: Json | null;
  member_list: Json | null;
  activity_stats: Json | null;
  created_at: string;
  updated_at: string;
}

export interface DataSyncLog {
  id: string;
  sync_type: string;
  status: string;
  members_processed: number | null;
  parties_processed: number | null;
  errors_count: number | null;
  sync_duration_ms: number | null;
  error_details: Json | null;
  created_at: string;
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

export const fetchMembersByCommittee = async (committeeCode: string): Promise<CachedMemberData[]> => {
  console.log(`Fetching members for committee: ${committeeCode}`);
  
  const { data, error } = await supabase
    .from('member_data')
    .select('*')
    .contains('current_committees', [committeeCode])
    .eq('is_active', true)
    .order('last_name');

  if (error) {
    console.error('Error fetching committee members:', error);
    throw new Error(`Failed to fetch committee members: ${error.message}`);
  }

  return data || [];
};

export const fetchPartyCommitteeBreakdown = async (partyCode: string): Promise<any> => {
  console.log(`Fetching committee breakdown for party: ${partyCode}`);
  
  const { data, error } = await supabase
    .from('party_data')
    .select('committee_members, committee_distribution')
    .eq('party_code', partyCode)
    .single();

  if (error) {
    console.error('Error fetching party committee breakdown:', error);
    throw new Error(`Failed to fetch party committee breakdown: ${error.message}`);
  }

  return data;
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

export const getLastSyncInfo = async (): Promise<DataSyncLog | null> => {
  const { data, error } = await supabase
    .from('data_sync_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching sync info:', error);
    return null;
  }

  return data;
};

export const refreshPartyData = async (): Promise<void> => {
  console.log('Triggering party data refresh...');
  
  const { error } = await supabase.functions.invoke('fetch-party-data');
  
  if (error) {
    console.error('Error refreshing party data:', error);
    throw new Error(`Failed to refresh party data: ${error.message}`);
  }
};

// Utility functions for working with the enhanced data
export const extractCommitteeAssignments = (assignments: Json): any[] => {
  if (Array.isArray(assignments)) {
    return assignments;
  }
  return [];
};

export const extractImageUrls = (imageUrls: Json): { small?: string; medium?: string; large?: string } => {
  if (imageUrls && typeof imageUrls === 'object' && !Array.isArray(imageUrls)) {
    return imageUrls as { small?: string; medium?: string; large?: string };
  }
  return {};
};

export const extractMemberList = (memberList: Json): any[] => {
  if (Array.isArray(memberList)) {
    return memberList;
  }
  return [];
};

export const extractCommitteeMembers = (committeeMembers: Json): { [key: string]: any[] } => {
  if (committeeMembers && typeof committeeMembers === 'object' && !Array.isArray(committeeMembers)) {
    return committeeMembers as { [key: string]: any[] };
  }
  return {};
};
