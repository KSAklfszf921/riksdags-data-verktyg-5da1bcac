
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

interface CacheEntry {
  data: Omit<TopListsData, 'loading' | 'error'>;
  timestamp: number;
}

// Improved function to fetch ALL documents for a member with proper pagination
const fetchAllMemberDocuments = async (memberId: string) => {
  let allDocuments = [];
  let page = 1;
  const pageSize = 500; // Smaller page size for more reliable requests
  let hasMoreData = true;
  
  try {
    console.log(`Fetching all documents for member: ${memberId}`);
    
    while (hasMoreData) {
      console.log(`Fetching documents page ${page} for member ${memberId}`);
      
      const documents = await fetchMemberDocuments(memberId, page, pageSize);
      
      if (documents.length === 0) {
        hasMoreData = false;
      } else {
        allDocuments.push(...documents);
        page++;
        
        // If we got fewer documents than requested, we've reached the end
        if (documents.length < pageSize) {
          hasMoreData = false;
        }
        
        // Add small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`Total documents found for member ${memberId}: ${allDocuments.length}`);
    return allDocuments;
    
  } catch (error) {
    console.error(`Error fetching documents for member ${memberId}:`, error);
    return [];
  }
};

// Improved function to fetch ALL speeches for a member with proper pagination
const fetchAllMemberSpeeches = async (memberId: string) => {
  let allSpeeches = [];
  let page = 1;
  const pageSize = 500; // Smaller page size for more reliable requests
  let hasMoreData = true;
  
  try {
    console.log(`Fetching all speeches for member: ${memberId}`);
    
    while (hasMoreData) {
      console.log(`Fetching speeches page ${page} for member ${memberId}`);
      
      const speeches = await fetchMemberSpeeches(memberId, page, pageSize);
      
      if (speeches.length === 0) {
        hasMoreData = false;
      } else {
        allSpeeches.push(...speeches);
        page++;
        
        // If we got fewer speeches than requested, we've reached the end
        if (speeches.length < pageSize) {
          hasMoreData = false;
        }
        
        // Add small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`Total speeches found for member ${memberId}: ${allSpeeches.length}`);
    return allSpeeches;
    
  } catch (error) {
    console.error(`Error fetching speeches for member ${memberId}:`, error);
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
      return null;
    }
  };

  const saveToCache = (data: Omit<TopListsData, 'loading' | 'error'>) => {
    try {
      const cacheEntry: CacheEntry = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(`${CACHE_KEY}_${riksdagsYear}`, JSON.stringify(cacheEntry));
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
        setTopListsData(prev => ({
          ...prev,
          ...cached.data,
          loading: false
        }));
        return;
      }

      console.log('Fetching fresh top lists data...');

      // Fetch all current members
      const membersResult = await fetchMembers(1, 500, 'current'); // Increased to get more members
      const members = membersResult.members;

      console.log(`Processing ${members.length} members for top lists`);

      // Process members in smaller batches to avoid overwhelming the API
      const batchSize = 3; // Reduced batch size for better reliability
      const memberStats = [];

      for (let i = 0; i < members.length; i += batchSize) {
        const batch = members.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(members.length/batchSize)}`);
        
        const batchResults = await Promise.allSettled(
          batch.map(async (member) => {
            try {
              console.log(`Processing member: ${member.tilltalsnamn} ${member.efternamn} (${member.intressent_id})`);
              
              const [documents, speeches] = await Promise.all([
                fetchAllMemberDocuments(member.intressent_id),
                fetchAllMemberSpeeches(member.intressent_id)
              ]);

              // Count different document types
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

        // Add successful results to memberStats
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            memberStats.push(result.value);
          }
        });

        // Add delay between batches to avoid rate limiting
        if (i + batchSize < members.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Create top lists with improved filtering and sorting
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
          .filter(member => member.count > 0) // Only include members with activity
          .sort((a, b) => b.count - a.count) // Sort by count descending
          .slice(0, count); // Take top N
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

      // Log some sample data for verification
      console.log('Sample speech counts:', newData.speeches.slice(0, 3).map(m => `${m.name}: ${m.count}`));

      // Save to cache
      saveToCache(newData);

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
    localStorage.removeItem(`${CACHE_KEY}_${riksdagsYear}`);
    fetchTopListsData();
  };

  return {
    ...topListsData,
    refreshData
  };
};
