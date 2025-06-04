
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { CachedMemberData } from '../services/cachedPartyApi';

type DatabaseEnhancedMemberProfile = Database['public']['Tables']['enhanced_member_profiles']['Row'];

export interface EnhancedMember extends CachedMemberData {
  yearly_stats: {
    [year: string]: {
      motions: number;
      interpellations: number;
      written_questions: number;
      speeches: number;
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
        
        // Check if enhanced_member_profiles table exists and has data
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

        if (enhancedError) {
          // If enhanced table doesn't exist or has issues, show friendly message
          console.log('Enhanced member profiles table not ready yet');
          setMembers([]);
          setTotalCount(0);
          setHasMore(false);
          setError(null);
          return;
        }

        // If we have enhanced data, use it
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
          // If no enhanced data, set empty result
          console.log('No enhanced member profiles found - database might be empty');
          setMembers([]);
          setTotalCount(0);
          setHasMore(false);
        }

        setError(null);
        
      } catch (err) {
        console.error('Error loading enhanced members:', err);
        // Show a more user-friendly error message
        setError(null);
        setMembers([]);
        setTotalCount(0);
        setHasMore(false);
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
          console.log('Member not found in enhanced profiles');
          setMember(null);
        }

        setError(null);
      } catch (err) {
        console.error('Error loading member details:', err);
        setError(null);
        setMember(null);
      } finally {
        setLoading(false);
      }
    };

    loadMemberDetails();
  }, [memberId]);

  return { member, loading, error };
};
