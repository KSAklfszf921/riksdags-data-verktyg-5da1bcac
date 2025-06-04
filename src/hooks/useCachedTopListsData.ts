
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TopListMember {
  id: string;
  name: string;
  party: string;
  constituency: string;
  imageUrl?: string;
  count: number;
}

export interface CachedTopListsData {
  motions: TopListMember[];
  speeches: TopListMember[];
  interpellations: TopListMember[];
  writtenQuestions: TopListMember[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const useCachedTopListsData = (riksdagsYear: string = '2024/25', topN: number = 10) => {
  const [topListsData, setTopListsData] = useState<CachedTopListsData>({
    motions: [],
    speeches: [],
    interpellations: [],
    writtenQuestions: [],
    loading: true,
    error: null,
    lastUpdated: null
  });

  const loadCachedData = async () => {
    try {
      setTopListsData(prev => ({ ...prev, loading: true, error: null }));

      console.log('Loading cached top lists data...');
      
      // Use direct SQL query since cached_toplists is not in the generated types yet
      const { data, error } = await supabase
        .from('cached_toplists' as any)
        .select('*')
        .eq('riksdags_year', riksdagsYear)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (!data) {
        setTopListsData(prev => ({
          ...prev,
          loading: false,
          error: 'Ingen cachad data tillgänglig. Data uppdateras automatiskt dagligen.'
        }));
        return;
      }

      const cachedData = data.data;
      
      // Trim to requested number
      const trimToTopN = (list: TopListMember[]) => list.slice(0, topN);

      setTopListsData({
        motions: trimToTopN(cachedData.motions || []),
        speeches: trimToTopN(cachedData.speeches || []),
        interpellations: trimToTopN(cachedData.interpellations || []),
        writtenQuestions: trimToTopN(cachedData.writtenQuestions || []),
        loading: false,
        error: null,
        lastUpdated: new Date(cachedData.lastUpdated)
      });

      console.log('Cached top lists data loaded successfully');
      
    } catch (err) {
      console.error('Error loading cached top lists data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Kunde inte ladda topplistor. Data uppdateras automatiskt dagligen.';
      setTopListsData(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  };

  useEffect(() => {
    loadCachedData();
  }, [riksdagsYear, topN]);

  return {
    ...topListsData,
    refreshData: loadCachedData
  };
};
