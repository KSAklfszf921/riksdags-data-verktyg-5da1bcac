
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EnhancedMemberProfile {
  id: string;
  member_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  party: string;
  constituency: string | null;
  birth_year: number | null;
  birth_date: string | null;
  gender: string | null;
  profession: string | null;
  education: string | null;
  email: string | null;
  phone: string | null;
  website_url: string | null;
  social_media: Record<string, any>;
  image_urls: Record<string, string>;
  primary_image_url: string | null;
  is_active: boolean;
  riksdag_status: string;
  status_history: any[];
  current_committees: string[] | null;
  assignments: any[];
  committee_history: any[];
  activity_summary: Record<string, any>;
  yearly_activity: Record<string, any>;
  latest_activity_date: string | null;
  data_completeness_score: number;
  missing_fields: string[] | null;
  data_quality_issues: any[];
  last_sync_at: string;
  sync_source: string;
  sync_version: string;
  created_at: string;
  updated_at: string;
}

export interface DataQualityMetrics {
  totalMembers: number;
  averageCompleteness: number;
  membersWithIssues: number;
  missingImageCount: number;
  missingContactCount: number;
  lastSyncTime: string | null;
}

export const useEnhancedMemberProfiles = (
  page: number = 1,
  pageSize: number = 20,
  filters: {
    status?: 'current' | 'all' | 'former';
    party?: string;
    committee?: string;
    search?: string;
    minCompleteness?: number;
  } = {}
) => {
  const [members, setMembers] = useState<EnhancedMemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const loadEnhancedMembers = async () => {
      try {
        setLoading(true);
        console.log(`Loading enhanced member profiles: page=${page}, pageSize=${pageSize}, filters=`, filters);
        
        let query = supabase
          .from('enhanced_member_profiles')
          .select('*', { count: 'exact' });

        // Apply filters
        if (filters.status === 'current') {
          query = query.eq('is_active', true);
        } else if (filters.status === 'former') {
          query = query.eq('is_active', false);
        }

        if (filters.party) {
          query = query.eq('party', filters.party);
        }

        if (filters.committee) {
          query = query.contains('current_committees', [filters.committee]);
        }

        if (filters.search) {
          query = query.or(`full_name.ilike.%${filters.search}%,party.ilike.%${filters.search}%,constituency.ilike.%${filters.search}%`);
        }

        if (filters.minCompleteness !== undefined) {
          query = query.gte('data_completeness_score', filters.minCompleteness);
        }

        // Apply pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to).order('last_name');

        const { data, error: queryError, count } = await query;

        if (queryError) {
          throw queryError;
        }

        if (page === 1) {
          setMembers(data || []);
        } else {
          setMembers(prev => [...prev, ...(data || [])]);
        }

        setTotalCount(count || 0);
        setHasMore((count || 0) > page * pageSize);
        setError(null);
        
      } catch (err) {
        setError('Kunde inte ladda förbättrade medlemsprofiler');
        console.error('Error loading enhanced member profiles:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEnhancedMembers();
  }, [page, pageSize, filters.status, filters.party, filters.committee, filters.search, filters.minCompleteness]);

  return { 
    members, 
    loading, 
    error, 
    totalCount, 
    hasMore
  };
};

export const useDataQualityMetrics = () => {
  const [metrics, setMetrics] = useState<DataQualityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true);
        
        const { data, error: queryError } = await supabase
          .from('enhanced_member_profiles')
          .select('data_completeness_score, primary_image_url, email, last_sync_at, data_quality_issues');

        if (queryError) {
          throw queryError;
        }

        const totalMembers = data?.length || 0;
        const averageCompleteness = totalMembers > 0 
          ? Math.round(data.reduce((sum, member) => sum + member.data_completeness_score, 0) / totalMembers)
          : 0;
        
        const membersWithIssues = data?.filter(member => 
          member.data_quality_issues && Array.isArray(member.data_quality_issues) && member.data_quality_issues.length > 0
        ).length || 0;

        const missingImageCount = data?.filter(member => !member.primary_image_url).length || 0;
        const missingContactCount = data?.filter(member => !member.email).length || 0;

        const lastSyncTimes = data?.map(member => member.last_sync_at).filter(Boolean) || [];
        const lastSyncTime = lastSyncTimes.length > 0 
          ? new Date(Math.max(...lastSyncTimes.map(time => new Date(time).getTime()))).toISOString()
          : null;

        setMetrics({
          totalMembers,
          averageCompleteness,
          membersWithIssues,
          missingImageCount,
          missingContactCount,
          lastSyncTime
        });

        setError(null);
      } catch (err) {
        setError('Kunde inte ladda datakvalitetsmetrik');
        console.error('Error loading data quality metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, []);

  return { metrics, loading, error };
};

export const useMemberDataMigration = () => {
  const [migrationStatus, setMigrationStatus] = useState<{
    running: boolean;
    completed: boolean;
    migratedCount: number;
    error: string | null;
  }>({
    running: false,
    completed: false,
    migratedCount: 0,
    error: null
  });

  const runMigration = async () => {
    try {
      setMigrationStatus(prev => ({ ...prev, running: true, error: null }));
      
      const { data, error } = await supabase.rpc('migrate_to_enhanced_member_profiles');
      
      if (error) {
        throw error;
      }

      setMigrationStatus({
        running: false,
        completed: true,
        migratedCount: data || 0,
        error: null
      });

      return data;
    } catch (err) {
      setMigrationStatus(prev => ({
        ...prev,
        running: false,
        error: err instanceof Error ? err.message : 'Migration failed'
      }));
      throw err;
    }
  };

  return { migrationStatus, runMigration };
};
