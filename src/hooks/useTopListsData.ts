
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
            const [documents, speeches] = await Promise.all([
              fetchMemberDocuments(member.intressent_id).catch(() => []),
              fetchMemberSpeeches(member.intressent_id).catch(() => [])
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
