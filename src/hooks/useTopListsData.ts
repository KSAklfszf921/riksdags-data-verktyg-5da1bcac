
import { useState, useEffect } from 'react';
import { fetchMembers, fetchMemberDocuments, fetchMemberSpeeches } from '../services/riksdagApi';

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

const CACHE_KEY = 'topListsCache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CacheData {
  motions: TopListMember[];
  speeches: TopListMember[];
  interpellations: TopListMember[];
  writtenQuestions: TopListMember[];
  lastUpdated: string; // Store as ISO string for JSON serialization
}

interface CacheEntry {
  data: CacheData;
  timestamp: number;
}

// Helper function to fetch all speeches for a member with retry logic
const fetchAllMemberSpeeches = async (memberId: string, retries = 2): Promise<any[]> => {
  try {
    console.log(`Fetching speeches for member: ${memberId}`);
    const speeches = await fetchMemberSpeeches(memberId, 1, 1000);
    console.log(`Found ${speeches.length} speeches for member ${memberId}`);
    return speeches;
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying speeches fetch for member ${memberId}, ${retries} retries left`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      return fetchAllMemberSpeeches(memberId, retries - 1);
    }
    console.error(`Failed to fetch speeches for member ${memberId}:`, error);
    return [];
  }
};

// Helper function to fetch all documents for a member with retry logic
const fetchAllMemberDocuments = async (memberId: string, retries = 2): Promise<any[]> => {
  try {
    console.log(`Fetching documents for member: ${memberId}`);
    const documents = await fetchMemberDocuments(memberId, 1, 1000);
    console.log(`Found ${documents.length} documents for member ${memberId}`);
    return documents;
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying documents fetch for member ${memberId}, ${retries} retries left`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      return fetchAllMemberDocuments(memberId, retries - 1);
    }
    console.error(`Failed to fetch documents for member ${memberId}:`, error);
    return [];
  }
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

  const loadFromCache = (): CacheEntry | null => {
    try {
      const cached = localStorage.getItem(`${CACHE_KEY}_${riksdagsYear}`);
      if (!cached) return null;
      
      const cacheEntry: CacheEntry = JSON.parse(cached);
      const isExpired = Date.now() - cacheEntry.timestamp > CACHE_DURATION;
      
      if (isExpired) {
        localStorage.removeItem(`${CACHE_KEY}_${riksdagsYear}`);
        return null;
      }
      
      return cacheEntry;
    } catch (error) {
      console.error('Error loading cache:', error);
      localStorage.removeItem(`${CACHE_KEY}_${riksdagsYear}`); // Clear corrupted cache
      return null;
    }
  };

  const saveToCache = (data: Omit<TopListsData, 'loading' | 'error'>) => {
    try {
      const cacheData: CacheData = {
        motions: data.motions,
        speeches: data.speeches,
        interpellations: data.interpellations,
        writtenQuestions: data.writtenQuestions,
        lastUpdated: data.lastUpdated?.toISOString() || new Date().toISOString()
      };
      
      const cacheEntry: CacheEntry = {
        data: cacheData,
        timestamp: Date.now()
      };
      
      localStorage.setItem(`${CACHE_KEY}_${riksdagsYear}`, JSON.stringify(cacheEntry));
      console.log('Data cached successfully');
    } catch (error) {
      console.error('Error saving cache:', error);
    }
  };

  const fetchTopListsData = async () => {
    try {
      setTopListsData(prev => ({ ...prev, loading: true, error: null }));

      // Check cache first
      const cached = loadFromCache();
      if (cached) {
        console.log('Using cached top lists data');
        const cacheData = cached.data;
        setTopListsData(prev => ({
          ...prev,
          motions: cacheData.motions,
          speeches: cacheData.speeches,
          interpellations: cacheData.interpellations,
          writtenQuestions: cacheData.writtenQuestions,
          lastUpdated: new Date(cacheData.lastUpdated),
          loading: false
        }));
        return;
      }

      console.log('Fetching fresh top lists data...');

      // Fetch all current members with error handling
      let membersResult;
      try {
        membersResult = await fetchMembers(1, 100, 'current');
      } catch (error) {
        throw new Error('Kunde inte hämta ledamöter från riksdagen');
      }
      
      const members = membersResult.members;
      console.log(`Processing ${members.length} members for top lists`);

      // Process members data with better error handling and batching
      const batchSize = 10; // Process members in smaller batches to avoid overwhelming the API
      const memberStats = [];

      for (let i = 0; i < members.length; i += batchSize) {
        const batch = members.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(members.length / batchSize)}`);
        
        const batchResults = await Promise.all(
          batch.map(async (member) => {
            try {
              console.log(`Processing member: ${member.tilltalsnamn} ${member.efternamn} (${member.intressent_id})`);
              
              const [documents, speeches] = await Promise.all([
                fetchAllMemberDocuments(member.intressent_id),
                fetchAllMemberSpeeches(member.intressent_id)
              ]);

              const motions = documents.filter(doc => doc.typ === 'mot').length;
              const interpellations = documents.filter(doc => doc.typ === 'ip').length;
              const writtenQuestions = documents.filter(doc => doc.typ === 'fr').length;
              const speechCount = speeches.length;

              console.log(`Member ${member.efternamn}: ${speechCount} speeches, ${motions} motions, ${interpellations} interpellations, ${writtenQuestions} written questions`);

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
        
        memberStats.push(...batchResults);
        
        // Add a small delay between batches to be respectful to the API
        if (i + batchSize < members.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Create top lists with validation
      const createTopList = (key: keyof typeof memberStats[0], count: number): TopListMember[] => {
        return memberStats
          .map(member => ({
            id: member.id,
            name: member.name,
            party: member.party,
            constituency: member.constituency,
            imageUrl: member.imageUrl,
            count: (member[key] as number) || 0
          }))
          .filter(member => member.count > 0) // Only include members with activity
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

      console.log('Top lists created:', {
        motions: newData.motions.length,
        speeches: newData.speeches.length,
        interpellations: newData.interpellations.length,
        writtenQuestions: newData.writtenQuestions.length
      });

      // Save to cache
      saveToCache(newData);

      setTopListsData(prev => ({
        ...prev,
        ...newData,
        loading: false
      }));

    } catch (error) {
      console.error('Error fetching top lists data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Kunde inte ladda topplistor. Försök igen senare.';
      setTopListsData(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  };

  useEffect(() => {
    fetchTopListsData();
  }, [riksdagsYear, topN]);

  const refreshData = () => {
    localStorage.removeItem(`${CACHE_KEY}_${riksdagsYear}`);
    fetchTopListsData();
  };

  return {
    ...topListsData,
    refreshData
  };
};
