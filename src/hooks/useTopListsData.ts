
import { useState, useEffect } from 'react';
import { fetchMembers, fetchMemberDocuments, fetchMemberSpeeches } from '../services/riksdagApi';
import { useProgressTracker } from './useProgressTracker';
import EnhancedCache from '../utils/enhancedCache';

export interface TopListMember {
  id: string;
  name: string;
  party: string;
  constituency: string;
  imageUrl?: string;
  count: number;
}

export interface TopListsData {
  motions: TopListMember[];
  speeches: TopListMember[];
  interpellations: TopListMember[];
  writtenQuestions: TopListMember[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const cache = EnhancedCache.getInstance();

const LOADING_STEPS = [
  { id: 'fetch-members', label: 'Hämtar riksdagsledamöter' },
  { id: 'process-batch-1', label: 'Bearbetar första gruppen' },
  { id: 'process-batch-2', label: 'Bearbetar andra gruppen' },
  { id: 'process-batch-3', label: 'Bearbetar tredje gruppen' },
  { id: 'create-toplists', label: 'Skapar topplistor' },
  { id: 'cache-results', label: 'Sparar resultat' }
];

// Optimized document fetching with retry logic
const fetchAllMemberDocuments = async (memberId: string, retries = 2): Promise<any[]> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`Fetching documents for member: ${memberId} (attempt ${attempt + 1})`);
      
      const documents = await fetchMemberDocuments(memberId, 1, 1000);
      console.log(`Found ${documents.length} documents for member ${memberId}`);
      return documents;
      
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed for member ${memberId}:`, error);
      
      if (attempt === retries) {
        console.error(`All attempts failed for member ${memberId}`);
        return [];
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  return [];
};

// Optimized speech fetching with retry logic
const fetchAllMemberSpeeches = async (memberId: string, retries = 2): Promise<any[]> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`Fetching speeches for member: ${memberId} (attempt ${attempt + 1})`);
      
      const speeches = await fetchMemberSpeeches(memberId, 1, 1000);
      console.log(`Found ${speeches.length} speeches for member ${memberId}`);
      return speeches;
      
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed for member ${memberId}:`, error);
      
      if (attempt === retries) {
        console.error(`All attempts failed for member ${memberId}`);
        return [];
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  return [];
};

export const useTopListsData = (riksdagsYear: string = '2024/25', topN: number = 10) => {
  const [topListsData, setTopListsData] = useState<TopListsData>({
    motions: [],
    speeches: [],
    interpellations: [],
    writtenQuestions: [],
    loading: true,
    error: null,
    lastUpdated: null
  });

  const { steps, updateStep, resetSteps, progress } = useProgressTracker(LOADING_STEPS);

  const loadFromCache = () => {
    const cacheKey = cache.generateKey('topLists', { riksdagsYear, topN });
    const cached = cache.get(cacheKey, CACHE_DURATION);
    
    if (cached) {
      console.log('Using cached top lists data');
      setTopListsData(prev => ({
        ...prev,
        ...cached,
        loading: false
      }));
      return true;
    }
    return false;
  };

  const saveToCache = (data: Omit<TopListsData, 'loading' | 'error'>) => {
    const cacheKey = cache.generateKey('topLists', { riksdagsYear, topN });
    cache.set(cacheKey, data, CACHE_DURATION, '2.0');
  };

  const fetchTopListsData = async () => {
    try {
      setTopListsData(prev => ({ ...prev, loading: true, error: null }));
      resetSteps();

      // Check cache first
      if (loadFromCache()) {
        return;
      }

      console.log('Fetching fresh top lists data...');

      // Step 1: Fetch members
      updateStep('fetch-members', false);
      const membersResult = await fetchMembers(1, 500, 'current');
      const members = membersResult.members.slice(0, 150); // Limit to 150 for better performance
      updateStep('fetch-members', true);

      console.log(`Processing ${members.length} members for top lists`);

      // Process members in batches with progress tracking
      const batchSize = Math.ceil(members.length / 3);
      const memberStats = [];

      for (let batchIndex = 0; batchIndex < 3; batchIndex++) {
        const stepId = `process-batch-${batchIndex + 1}`;
        updateStep(stepId, false);

        const startIndex = batchIndex * batchSize;
        const endIndex = Math.min(startIndex + batchSize, members.length);
        const batch = members.slice(startIndex, endIndex);

        if (batch.length === 0) {
          updateStep(stepId, true);
          continue;
        }

        console.log(`Processing batch ${batchIndex + 1}: ${batch.length} members`);
        
        try {
          // Process batch members with smaller sub-batches to avoid overwhelming API
          const subBatchSize = 3;
          for (let i = 0; i < batch.length; i += subBatchSize) {
            const subBatch = batch.slice(i, i + subBatchSize);
            
            const batchResults = await Promise.allSettled(
              subBatch.map(async (member) => {
                try {
                  const [documents, speeches] = await Promise.all([
                    fetchAllMemberDocuments(member.intressent_id),
                    fetchAllMemberSpeeches(member.intressent_id)
                  ]);

                  const motions = documents.filter(doc => doc.typ === 'mot').length;
                  const interpellations = documents.filter(doc => doc.typ === 'ip').length;
                  const writtenQuestions = documents.filter(doc => doc.typ === 'fr').length;
                  const speechCount = speeches.length;

                  return {
                    id: member.intressent_id,
                    name: `${member.tilltalsnamn} ${member.efternamn}`,
                    party: member.parti,
                    constituency: member.valkrets,
                    imageUrl: member.bild_url_192 || member.bild_url_80,
                    motions,
                    interpellations,
                    writtenQuestions,
                    speeches: speechCount
                  };
                } catch (error) {
                  console.error(`Error processing member ${member.efternamn}:`, error);
                  return {
                    id: member.intressent_id,
                    name: `${member.tilltalsnamn} ${member.efternamn}`,
                    party: member.parti,
                    constituency: member.valkrets,
                    imageUrl: member.bild_url_192 || member.bild_url_80,
                    motions: 0,
                    interpellations: 0,
                    writtenQuestions: 0,
                    speeches: 0
                  };
                }
              })
            );

            // Add successful results
            batchResults.forEach((result) => {
              if (result.status === 'fulfilled') {
                memberStats.push(result.value);
              }
            });

            // Small delay between sub-batches
            if (i + subBatchSize < batch.length) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }

          updateStep(stepId, true);
        } catch (error) {
          console.error(`Error processing batch ${batchIndex + 1}:`, error);
          updateStep(stepId, false, `Fel vid bearbetning av grupp ${batchIndex + 1}`);
        }

        // Delay between batches
        if (batchIndex < 2) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Step 5: Create top lists
      updateStep('create-toplists', false);
      const createTopList = (key: keyof typeof memberStats[0], count: number): TopListMember[] => {
        return memberStats
          .map(member => ({
            id: member.id,
            name: member.name,
            party: member.party,
            constituency: member.constituency,
            imageUrl: member.imageUrl,
            count: member[key] as number
          }))
          .filter(member => member.count > 0)
          .sort((a, b) => b.count - a.count)
          .slice(0, count);
      };

      const newData = {
        motions: createTopList('motions', topN),
        speeches: createTopList('speeches', topN),
        interpellations: createTopList('interpellations', topN),
        writtenQuestions: createTopList('writtenQuestions', topN),
        lastUpdated: new Date()
      };
      updateStep('create-toplists', true);

      // Step 6: Cache results
      updateStep('cache-results', false);
      saveToCache(newData);
      updateStep('cache-results', true);

      console.log('Top lists created successfully');

      setTopListsData(prev => ({
        ...prev,
        ...newData,
        loading: false
      }));

    } catch (error) {
      console.error('Error fetching top lists data:', error);
      setTopListsData(prev => ({
        ...prev,
        loading: false,
        error: 'Kunde inte ladda topplistor. Försök igen senare.'
      }));
    }
  };

  useEffect(() => {
    fetchTopListsData();
  }, [riksdagsYear, topN]);

  const refreshData = () => {
    const cacheKey = cache.generateKey('topLists', { riksdagsYear, topN });
    cache.delete(cacheKey);
    fetchTopListsData();
  };

  const getCacheStats = () => cache.getStats();

  return {
    ...topListsData,
    refreshData,
    loadingSteps: steps,
    loadingProgress: progress,
    getCacheStats
  };
};
