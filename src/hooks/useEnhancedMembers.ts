
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CachedMemberData } from '../services/cachedPartyApi';

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
          const enhancedMembers: EnhancedMember[] = enhancedData.map(profile => {
            const yearlyStats = profile.yearly_activity || {};
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
              is_active: profile.is_active,
              riksdag_status: profile.riksdag_status,
              current_committees: profile.current_committees,
              committee_assignments: profile.committee_history,
              image_urls: profile.image_urls,
              primary_image_url: profile.primary_image_url,
              assignments: profile.assignments,
              activity_data: profile.activity_summary,
              yearly_stats: yearlyStats,
              current_year_stats: currentYearStats,
              data_completeness_score: profile.data_completeness_score,
              missing_fields: profile.missing_fields,
              created_at: profile.created_at,
              updated_at: profile.updated_at
            };
          });

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

          const enhancedMembers: EnhancedMember[] = (fallbackData || []).map(member => {
            const activityData = member.activity_data as any;
            const yearlyStats = activityData?.yearly_stats || {};
            
            const currentYear = new Date().getFullYear();
            const currentYearStats = yearlyStats[currentYear] || {
              motions: 0,
              interpellations: 0,
              written_questions: 0,
              speeches: 0,
              total_documents: 0
            };

            return {
              ...member,
              yearly_stats: yearlyStats,
              current_year_stats: currentYearStats,
              data_completeness_score: 0, // Default for legacy data
              missing_fields: []
            };
          });

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
          const yearlyStats = enhancedData.yearly_activity || {};
          const currentYear = new Date().getFullYear();
          const currentYearStats = yearlyStats[currentYear] || {
            motions: 0,
            interpellations: 0,
            written_questions: 0,
            speeches: 0,
            total_documents: 0
          };

          setMember({
            id: enhancedData.id,
            member_id: enhancedData.member_id,
            first_name: enhancedData.first_name,
            last_name: enhancedData.last_name,
            party: enhancedData.party,
            constituency: enhancedData.constituency,
            gender: enhancedData.gender,
            birth_year: enhancedData.birth_year,
            is_active: enhancedData.is_active,
            riksdag_status: enhancedData.riksdag_status,
            current_committees: enhancedData.current_committees,
            committee_assignments: enhancedData.committee_history,
            image_urls: enhancedData.image_urls,
            primary_image_url: enhancedData.primary_image_url,
            assignments: enhancedData.assignments,
            activity_data: enhancedData.activity_summary,
            yearly_stats: yearlyStats,
            current_year_stats: currentYearStats,
            data_completeness_score: enhancedData.data_completeness_score,
            missing_fields: enhancedData.missing_fields,
            created_at: enhancedData.created_at,
            updated_at: enhancedData.updated_at
          });
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
            const activityData = data.activity_data as any;
            const yearlyStats = activityData?.yearly_stats || {};
            
            const currentYear = new Date().getFullYear();
            const currentYearStats = yearlyStats[currentYear] || {
              motions: 0,
              interpellations: 0,
              written_questions: 0,
              speeches: 0,
              total_documents: 0
            };

            setMember({
              ...data,
              yearly_stats: yearlyStats,
              current_year_stats: currentYearStats,
              data_completeness_score: 0,
              missing_fields: []
            });
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
