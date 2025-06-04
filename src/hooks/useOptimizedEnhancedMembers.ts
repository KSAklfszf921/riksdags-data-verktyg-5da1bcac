
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type DatabaseEnhancedMemberProfile = Database['public']['Tables']['enhanced_member_profiles']['Row'];

export interface OptimizedEnhancedMember {
  id: string;
  member_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  party: string;
  constituency: string | null;
  gender: string | null;
  birth_year: number | null;
  birth_date: string | null;
  is_active: boolean;
  riksdag_status: string;
  current_committees: string[] | null;
  assignments: any;
  activity_summary: any;
  yearly_activity: any;
  committee_history: any;
  status_history: any;
  social_media: any;
  image_urls: any;
  primary_image_url: string | null;
  data_completeness_score: number;
  data_quality_issues: any;
  missing_fields: string[] | null;
  latest_activity_date: string | null;
  education: string | null;
  email: string | null;
  profession: string | null;
  website_url: string | null;
  phone: string | null;
  sync_version: string | null;
  sync_source: string | null;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UseOptimizedEnhancedMembersOptions {
  page?: number;
  pageSize?: number;
  status?: 'current' | 'all' | 'former';
  party?: string;
  committee?: string;
  search?: string;
  minCompleteness?: number;
  autoLoad?: boolean;
}

interface UseOptimizedEnhancedMembersReturn {
  members: OptimizedEnhancedMember[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  hasMore: boolean;
  loadMore: () => void;
  reload: () => void;
  loadPage: (page: number) => void;
}

// Optimized converter with minimal processing
const convertToOptimizedMember = (profile: DatabaseEnhancedMemberProfile): OptimizedEnhancedMember => ({
  id: profile.id,
  member_id: profile.member_id,
  first_name: profile.first_name,
  last_name: profile.last_name,
  full_name: profile.full_name || `${profile.first_name} ${profile.last_name}`,
  party: profile.party,
  constituency: profile.constituency,
  gender: profile.gender,
  birth_year: profile.birth_year,
  birth_date: profile.birth_date ? profile.birth_date.toString() : null,
  is_active: profile.is_active ?? false,
  riksdag_status: profile.riksdag_status || 'Riksdagsledamot',
  current_committees: profile.current_committees,
  assignments: profile.assignments,
  activity_summary: profile.activity_summary,
  yearly_activity: profile.yearly_activity,
  committee_history: profile.committee_history,
  status_history: profile.status_history,
  social_media: profile.social_media,
  image_urls: profile.image_urls,
  primary_image_url: profile.primary_image_url,
  data_completeness_score: profile.data_completeness_score || 0,
  data_quality_issues: profile.data_quality_issues,
  missing_fields: profile.missing_fields,
  latest_activity_date: profile.latest_activity_date ? profile.latest_activity_date.toString() : null,
  education: profile.education,
  email: profile.email,
  profession: profile.profession,
  website_url: profile.website_url,
  phone: profile.phone,
  sync_version: profile.sync_version,
  sync_source: profile.sync_source,
  last_sync_at: profile.last_sync_at || new Date().toISOString(),
  created_at: profile.created_at || new Date().toISOString(),
  updated_at: profile.updated_at || new Date().toISOString()
});

export const useOptimizedEnhancedMembers = (
  options: UseOptimizedEnhancedMembersOptions = {}
): UseOptimizedEnhancedMembersReturn => {
  const {
    page = 1,
    pageSize = 20,
    status = 'current',
    party,
    committee,
    search,
    minCompleteness,
    autoLoad = true
  } = options;

  const [members, setMembers] = useState<OptimizedEnhancedMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);

  // Memoized query builder
  const buildQuery = useCallback(() => {
    let query = supabase
      .from('enhanced_member_profiles')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status === 'current') {
      query = query.eq('is_active', true);
    } else if (status === 'former') {
      query = query.eq('is_active', false);
    }

    if (party) {
      query = query.eq('party', party);
    }

    if (committee) {
      query = query.contains('current_committees', [committee]);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,party.ilike.%${search}%,constituency.ilike.%${search}%`);
    }

    if (minCompleteness !== undefined) {
      query = query.gte('data_completeness_score', minCompleteness);
    }

    return query;
  }, [status, party, committee, search, minCompleteness]);

  const loadMembers = useCallback(async (pageNum: number, append: boolean = false) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const query = buildQuery();
      
      // Apply pagination
      const from = (pageNum - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error: queryError, count } = await query
        .range(from, to)
        .order('last_name');

      if (queryError) {
        throw queryError;
      }

      const optimizedMembers = (data || []).map(convertToOptimizedMember);

      if (append && pageNum > 1) {
        setMembers(prev => [...prev, ...optimizedMembers]);
      } else {
        setMembers(optimizedMembers);
      }

      setTotalCount(count || 0);
      setCurrentPage(pageNum);
    } catch (err) {
      console.error('Error loading enhanced members:', err);
      setError('Could not load member data');
      if (!append) {
        setMembers([]);
        setTotalCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, [buildQuery, pageSize, loading]);

  // Auto-load on mount and dependency changes
  useEffect(() => {
    if (autoLoad) {
      loadMembers(1, false);
    }
  }, [loadMembers, autoLoad]);

  // Computed properties
  const hasMore = useMemo(() => {
    return totalCount > currentPage * pageSize;
  }, [totalCount, currentPage, pageSize]);

  // Action handlers
  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadMembers(currentPage + 1, true);
    }
  }, [hasMore, loading, currentPage, loadMembers]);

  const reload = useCallback(() => {
    loadMembers(1, false);
  }, [loadMembers]);

  const loadPage = useCallback((pageNum: number) => {
    loadMembers(pageNum, false);
  }, [loadMembers]);

  return {
    members,
    loading,
    error,
    totalCount,
    hasMore,
    loadMore,
    reload,
    loadPage
  };
};

// Optimized member details hook
export const useOptimizedMemberDetails = (memberId: string) => {
  const [member, setMember] = useState<OptimizedEnhancedMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!memberId) {
      setMember(null);
      setLoading(false);
      return;
    }

    const loadMemberDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from('enhanced_member_profiles')
          .select('*')
          .eq('member_id', memberId)
          .single();

        if (queryError) {
          throw queryError;
        }

        if (data) {
          setMember(convertToOptimizedMember(data));
        } else {
          setMember(null);
        }
      } catch (err) {
        console.error('Error loading member details:', err);
        setError('Could not load member details');
        setMember(null);
      } finally {
        setLoading(false);
      }
    };

    loadMemberDetails();
  }, [memberId]);

  return { member, loading, error };
};
