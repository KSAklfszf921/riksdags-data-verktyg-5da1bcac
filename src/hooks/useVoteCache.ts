
import { useState, useRef, useCallback } from 'react';
import { RiksdagVote, VoteSearchParams } from '../services/riksdagApi';

interface CacheEntry {
  votes: RiksdagVote[];
  totalCount: number;
  timestamp: number;
}

interface VoteCache {
  [key: string]: CacheEntry;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 10; // Maximum number of cached queries

export const useVoteCache = () => {
  const cache = useRef<VoteCache>({});
  
  const generateCacheKey = useCallback((params: VoteSearchParams): string => {
    return JSON.stringify({
      ...params,
      // Sort arrays to ensure consistent keys
      rm: params.rm?.sort(),
      party: params.party?.sort()
    });
  }, []);

  const getCachedResult = useCallback((params: VoteSearchParams): { votes: RiksdagVote[], totalCount: number } | null => {
    const key = generateCacheKey(params);
    const entry = cache.current[key];
    
    if (!entry) return null;
    
    // Check if cache entry is still valid
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      delete cache.current[key];
      return null;
    }
    
    console.log('Cache hit for:', key);
    return { votes: entry.votes, totalCount: entry.totalCount };
  }, [generateCacheKey]);

  const setCachedResult = useCallback((params: VoteSearchParams, votes: RiksdagVote[], totalCount: number): void => {
    const key = generateCacheKey(params);
    
    // Clean up old entries if cache is full
    const cacheKeys = Object.keys(cache.current);
    if (cacheKeys.length >= MAX_CACHE_SIZE) {
      // Remove oldest entry
      const oldestKey = cacheKeys.reduce((oldest, current) => {
        return cache.current[current].timestamp < cache.current[oldest].timestamp ? current : oldest;
      });
      delete cache.current[oldestKey];
    }
    
    cache.current[key] = {
      votes,
      totalCount,
      timestamp: Date.now()
    };
    
    console.log('Cached result for:', key);
  }, [generateCacheKey]);

  const clearCache = useCallback((): void => {
    cache.current = {};
    console.log('Cache cleared');
  }, []);

  return {
    getCachedResult,
    setCachedResult,
    clearCache
  };
};
