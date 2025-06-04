
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CachedMemberData } from '../services/cachedPartyApi';

export interface EnhancedMember extends CachedMemberData {
  profession?: string;
  education?: string;
  date_from?: string;
  date_to?: string;
  last_sync_at?: string;
  status_history?: any[];
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
        
        let query = supabase
          .from('member_data')
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

        const { data, error: queryError, count } = await query;

        if (queryError) {
          throw queryError;
        }

        const enhancedMembers: EnhancedMember[] = (data || []).map(member => {
          const activityData = member.activity_data as any;
          const yearlyStats = activityData?.yearly_stats || {};
          
          // Calculate current year stats
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
            current_year_stats: currentYearStats
          };
        });

        if (page === 1) {
          setMembers(enhancedMembers);
        } else {
          setMembers(prev => [...prev, ...enhancedMembers]);
        }

        setTotalCount(count || 0);
        setHasMore((count || 0) > page * pageSize);
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
            current_year_stats: currentYearStats
          });
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
