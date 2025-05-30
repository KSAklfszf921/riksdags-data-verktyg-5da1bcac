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
const MAX_CACHE_SIZE = 20; // Increased cache size for better performance

export const useVoteCache = () => {
  const cache = useRef<VoteCache>({});
  
  const generateCacheKey = useCallback((params: VoteSearchParams): string => {
    // Create a more reliable cache key with sorted arrays
    const normalizedParams = {
      ...params,
      rm: params.rm?.sort(),
      party: params.party?.sort(),
      // Include page number in cache key for pagination
      page: params.page || 1
    };
    
    return JSON.stringify(normalizedParams, Object.keys(normalizedParams).sort());
  }, []);

  const getCachedResult = useCallback((params: VoteSearchParams): { votes: RiksdagVote[], totalCount: number } | null => {
    try {
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
    } catch (error) {
      console.error('Error retrieving from cache:', error);
      return null;
    }
  }, [generateCacheKey]);

  const setCachedResult = useCallback((params: VoteSearchParams, votes: RiksdagVote[], totalCount: number): void => {
    try {
      const key = generateCacheKey(params);
      
      // Clean up old entries if cache is full
      const cacheKeys = Object.keys(cache.current);
      if (cacheKeys.length >= MAX_CACHE_SIZE) {
        // Remove oldest entries (keep cache size manageable)
        const entriesToRemove = cacheKeys
          .map(k => ({ key: k, timestamp: cache.current[k].timestamp }))
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(0, Math.floor(MAX_CACHE_SIZE / 2)); // Remove half when full
        
        entriesToRemove.forEach(entry => {
          delete cache.current[entry.key];
        });
      }
      
      cache.current[key] = {
        votes: [...votes], // Create a copy to avoid reference issues
        totalCount,
        timestamp: Date.now()
      };
      
      console.log('Cached result for:', key, `(${votes.length} votes)`);
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }, [generateCacheKey]);

  const clearCache = useCallback((): void => {
    cache.current = {};
    console.log('Vote cache cleared');
  }, []);

  const getCacheStats = useCallback(() => {
    const cacheKeys = Object.keys(cache.current);
    const validEntries = cacheKeys.filter(key => 
      Date.now() - cache.current[key].timestamp <= CACHE_DURATION
    );
    
    return {
      totalEntries: cacheKeys.length,
      validEntries: validEntries.length,
      oldEntries: cacheKeys.length - validEntries.length
    };
  }, []);

  return {
    getCachedResult,
    setCachedResult,
    clearCache,
    getCacheStats
  };
};
