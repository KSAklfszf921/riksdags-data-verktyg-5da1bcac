
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { CachedMemberData } from '../services/cachedPartyApi';

type DatabaseEnhancedMemberProfile = Database['public']['Tables']['enhanced_member_profiles']['Row'];
type DatabaseMemberData = Database['public']['Tables']['member_data']['Row'];

export interface EnhancedMember extends CachedMemberData {
  yearly_stats: {
    [year: string]: {
      motions: number;
      interpellations: number;
      written_questions: number;
      speeches?: number;
      total_documents: number;
    }
  };
  current_year_stats: {
    motions: number;
    interpellations: number;
    written_questions: number;
    speeches: number;
    total_documents: number;
  };
  data_completeness_score?: number;
  missing_fields?: string[];
  primary_image_url?: string;
}

// Helper function to safely parse yearly activity data
const parseYearlyActivity = (yearlyActivity: any): EnhancedMember['yearly_stats'] => {
  if (!yearlyActivity || typeof yearlyActivity !== 'object') {
    return {};
  }

  const result: EnhancedMember['yearly_stats'] = {};
  
  for (const [year, data] of Object.entries(yearlyActivity)) {
    if (data && typeof data === 'object') {
      result[year] = {
        motions: (data as any).motions || 0,
        interpellations: (data as any).interpellations || 0,
        written_questions: (data as any).written_questions || 0,
        speeches: (data as any).speeches || 0,
        total_documents: (data as any).total_documents || 0,
      };
    }
  }
  
  return result;
};

// Helper function to convert enhanced member profile to EnhancedMember
const convertEnhancedProfileToMember = (profile: DatabaseEnhancedMemberProfile): EnhancedMember => {
  const yearlyStats = parseYearlyActivity(profile.yearly_activity);
  const currentYear = new Date().getFullYear();
  const currentYearStats = yearlyStats[currentYear] || {
    motions: 0,
    interpellations: 0,
    written_questions: 0,
    speeches: 0,
    total_documents: 0
  };

  return {
    id: profile.id,
    member_id: profile.member_id,
    first_name: profile.first_name,
    last_name: profile.last_name,
    party: profile.party,
    constituency: profile.constituency,
    gender: profile.gender,
    birth_year: profile.birth_year,
    is_active: profile.is_active || false,
    riksdag_status: profile.riksdag_status || 'Riksdagsledamot',
    current_committees: profile.current_committees,
    committee_assignments: (profile.committee_history as any) || [],
    image_urls: (profile.image_urls as Record<string, string>) || {},
    primary_image_url: profile.primary_image_url,
    assignments: (profile.assignments as any) || [],
    activity_data: (profile.activity_summary as any) || {},
    yearly_stats: yearlyStats,
    current_year_stats: currentYearStats,
    data_completeness_score: profile.data_completeness_score || 0,
    missing_fields: profile.missing_fields || [],
    created_at: profile.created_at || new Date().toISOString(),
    updated_at: profile.updated_at || new Date().toISOString()
  };
};

// Helper function to convert legacy member data to EnhancedMember
const convertLegacyMemberToEnhanced = (member: DatabaseMemberData): EnhancedMember => {
  const activityData = member.activity_data as any;
  const yearlyStats = parseYearlyActivity(activityData?.yearly_stats);
  
  const currentYear = new Date().getFullYear();
  const currentYearStats = yearlyStats[currentYear] || {
    motions: 0,
    interpellations: 0,
    written_questions: 0,
    speeches: 0,
    total_documents: 0
  };

  return {
    id: member.id,
    member_id: member.member_id,
    first_name: member.first_name,
    last_name: member.last_name,
    party: member.party,
    constituency: member.constituency,
    gender: member.gender,
    birth_year: member.birth_year,
    is_active: member.is_active || false,
    riksdag_status: member.riksdag_status || 'Riksdagsledamot',
    current_committees: member.current_committees,
    committee_assignments: (member.committee_assignments as any) || [],
    image_urls: (member.image_urls as Record<string, string>) || {},
    primary_image_url: member.image_urls ? 
      (member.image_urls as any)?.max || 
      (member.image_urls as any)?.['192'] || 
      (member.image_urls as any)?.['80'] : 
      undefined,
    assignments: (member.assignments as any) || [],
    activity_data: activityData || {},
    yearly_stats: yearlyStats,
    current_year_stats: currentYearStats,
    data_completeness_score: 0, // Default for legacy data
    missing_fields: [],
    created_at: member.created_at,
    updated_at: member.updated_at
  };
};

export const useEnhancedMembers = (
  page: number = 1,
  pageSize: number = 20,
  status: 'current' | 'all' | 'former' = 'current',
  committee?: string
) => {
  const [members, setMembers] = useState<EnhancedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const loadEnhancedMembers = async () => {
      try {
        setLoading(true);
        console.log(`Loading enhanced members: page=${page}, pageSize=${pageSize}, status=${status}, committee=${committee}`);
        
        // Try to load from enhanced_member_profiles first, fall back to member_data
        let query = supabase
          .from('enhanced_member_profiles')
          .select('*', { count: 'exact' });

        // Apply status filter
        if (status === 'current') {
          query = query.eq('is_active', true);
        } else if (status === 'former') {
          query = query.eq('is_active', false);
        }

        // Apply committee filter
        if (committee && committee !== 'all') {
          query = query.contains('current_committees', [committee]);
        }

        // Apply pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to).order('last_name');

        const { data: enhancedData, error: enhancedError, count: enhancedCount } = await query;

        // If enhanced profiles are available, use them
        if (enhancedData && enhancedData.length > 0) {
          const enhancedMembers = enhancedData.map(convertEnhancedProfileToMember);

          if (page === 1) {
            setMembers(enhancedMembers);
          } else {
            setMembers(prev => [...prev, ...enhancedMembers]);
          }

          setTotalCount(enhancedCount || 0);
          setHasMore((enhancedCount || 0) > page * pageSize);
        } else {
          // Fall back to the original member_data table
          console.log('No enhanced profiles found, falling back to member_data');
          
          let fallbackQuery = supabase
            .from('member_data')
            .select('*', { count: 'exact' });

          // Apply the same filters to the fallback query
          if (status === 'current') {
            fallbackQuery = fallbackQuery.eq('is_active', true);
          } else if (status === 'former') {
            fallbackQuery = fallbackQuery.eq('is_active', false);
          }

          if (committee && committee !== 'all') {
            fallbackQuery = fallbackQuery.contains('current_committees', [committee]);
          }

          fallbackQuery = fallbackQuery.range(from, to).order('last_name');

          const { data: fallbackData, error: fallbackError, count: fallbackCount } = await fallbackQuery;

          if (fallbackError) {
            throw fallbackError;
          }

          const enhancedMembers = (fallbackData || []).map(convertLegacyMemberToEnhanced);

          if (page === 1) {
            setMembers(enhancedMembers);
          } else {
            setMembers(prev => [...prev, ...enhancedMembers]);
          }

          setTotalCount(fallbackCount || 0);
          setHasMore((fallbackCount || 0) > page * pageSize);
        }

        setError(null);
        
      } catch (err) {
        setError('Kunde inte ladda förbättrade ledamöter');
        console.error('Error loading enhanced members:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEnhancedMembers();
  }, [page, pageSize, status, committee]);

  const loadMore = () => {
    if (!loading && hasMore) {
      return { page: page + 1, pageSize, status };
    }
    return null;
  };

  return { 
    members, 
    loading, 
    error, 
    totalCount, 
    hasMore, 
    loadMore 
  };
};

export const useEnhancedMemberDetails = (memberId: string) => {
  const [member, setMember] = useState<EnhancedMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMemberDetails = async () => {
      if (!memberId) return;

      try {
        setLoading(true);
        
        // Try enhanced_member_profiles first
        const { data: enhancedData, error: enhancedError } = await supabase
          .from('enhanced_member_profiles')
          .select('*')
          .eq('member_id', memberId)
          .single();

        if (enhancedData && !enhancedError) {
          setMember(convertEnhancedProfileToMember(enhancedData));
        } else {
          // Fall back to member_data
          const { data, error: queryError } = await supabase
            .from('member_data')
            .select('*')
            .eq('member_id', memberId)
            .single();

          if (queryError) {
            throw queryError;
          }

          if (data) {
            setMember(convertLegacyMemberToEnhanced(data));
          }
        }

        setError(null);
      } catch (err) {
        setError('Kunde inte ladda ledamotens detaljer');
        console.error('Error loading member details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMemberDetails();
  }, [memberId]);

  return { member, loading, error };
};
