
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

// Helper function to calculate months between two dates
const getMonthsDifference = (startDate: Date, endDate: Date): number => {
  const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                 (endDate.getMonth() - startDate.getMonth()) + 1;
  return Math.max(1, months); // Minimum 1 month
};

// Helper function to fetch all speeches for a member and calculate average per month
const fetchMemberSpeechesAverage = async (memberId: string, riksdagsYear: string) => {
  try {
    const speeches = await fetchMemberSpeeches(memberId);
    
    if (!speeches || speeches.length === 0) {
      return 0;
    }

    // Calculate the period for the riksdag year
    const [startYear, endYear] = riksdagsYear.split('/').map(year => {
      if (year.length === 2) {
        return parseInt('20' + year);
      }
      return parseInt(year);
    });

    const periodStart = new Date(startYear, 8, 1); // September 1st
    const periodEnd = new Date(endYear, 5, 30); // June 30th
    const currentDate = new Date();
    
    // Use current date if we're still in the period, otherwise use period end
    const actualEndDate = currentDate < periodEnd ? currentDate : periodEnd;
    
    const monthsInPeriod = getMonthsDifference(periodStart, actualEndDate);
    const averagePerMonth = speeches.length / monthsInPeriod;
    
    return Math.round(averagePerMonth * 10) / 10; // Round to 1 decimal place
  } catch (error) {
    console.error(`Error fetching speeches for member ${memberId}:`, error);
    return 0;
  }
};

// Helper function to fetch all documents for a member
const fetchAllMemberDocuments = async (memberId: string) => {
  try {
    const documents = await fetchMemberDocuments(memberId);
    return documents;
  } catch (error) {
    console.error(`Error fetching documents for member ${memberId}:`, error);
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
      const membersResult = await fetchMembers(1, 100, 'current');
      const members = membersResult.members;

      // Process members data
      const memberStats = await Promise.all(
        members.map(async (member) => {
          try {
            const [documents, speechesAverage] = await Promise.all([
              fetchAllMemberDocuments(member.intressent_id).catch(() => []),
              fetchMemberSpeechesAverage(member.intressent_id, riksdagsYear).catch(() => 0)
            ]);

            const motions = documents.filter(doc => doc.typ === 'mot').length;
            const interpellations = documents.filter(doc => doc.typ === 'ip').length;
            const writtenQuestions = documents.filter(doc => doc.typ === 'fr').length;

            console.log(`Member ${member.efternamn}: ${speechesAverage} speeches/month, ${motions} motions, ${interpellations} interpellations, ${writtenQuestions} written questions`);

            return {
              id: member.intressent_id,
              name: `${member.tilltalsnamn} ${member.efternamn}`,
              party: member.parti,
              constituency: member.valkrets,
              imageUrl: member.bild_url_192 || member.bild_url_80,
              motions,
              interpellations,
              writtenQuestions,
              speeches: speechesAverage
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

      // Create top lists
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
