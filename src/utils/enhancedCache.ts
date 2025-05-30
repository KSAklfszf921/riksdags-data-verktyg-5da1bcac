
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
  hits: number;
  lastAccessed: number;
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  oldestEntry: number;
}

class EnhancedCache {
  private static instance: EnhancedCache;
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  private defaultTTL: number;
  private hits = 0;
  private misses = 0;

  constructor(maxSize = 50, defaultTTL = 24 * 60 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  static getInstance(): EnhancedCache {
    if (!EnhancedCache.instance) {
      EnhancedCache.instance = new EnhancedCache();
    }
    return EnhancedCache.instance;
  }

  generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `${prefix}:${sortedParams}`;
  }

  set<T>(key: string, data: T, ttl = this.defaultTTL, version = '1.0'): void {
    try {
      // Ensure we don't exceed max size
      if (this.cache.size >= this.maxSize) {
        this.evictLRU();
      }

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version,
        hits: 0,
        lastAccessed: Date.now()
      };

      this.cache.set(key, entry);
      
      // Persist to localStorage for selected keys
      if (key.includes('topLists')) {
        try {
          localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
        } catch (e) {
          console.warn('Failed to persist cache to localStorage:', e);
        }
      }
      
      console.log(`Cache set: ${key} (TTL: ${ttl}ms)`);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  get<T>(key: string, ttl = this.defaultTTL): T | null {
    try {
      let entry = this.cache.get(key);

      // If not in memory, try localStorage
      if (!entry && key.includes('topLists')) {
        try {
          const stored = localStorage.getItem(`cache_${key}`);
          if (stored) {
            entry = JSON.parse(stored);
            if (entry) {
              this.cache.set(key, entry);
            }
          }
        } catch (e) {
          console.warn('Failed to load cache from localStorage:', e);
        }
      }

      if (!entry) {
        this.misses++;
        return null;
      }

      const isExpired = Date.now() - entry.timestamp > ttl;
      if (isExpired) {
        this.delete(key);
        this.misses++;
        return null;
      }

      // Update access stats
      entry.hits++;
      entry.lastAccessed = Date.now();
      this.hits++;

      console.log(`Cache hit: ${key} (hits: ${entry.hits})`);
      return entry.data;
    } catch (error) {
      console.error('Cache get error:', error);
      this.misses++;
      return null;
    }
  }

  delete(key: string): void {
    this.cache.delete(key);
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (e) {
      console.warn('Failed to remove from localStorage:', e);
    }
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    
    // Clear localStorage cache entries
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Failed to clear localStorage cache:', e);
    }
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      console.log(`Evicted LRU cache entry: ${oldestKey}`);
    }
  }

  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalRequests = this.hits + this.misses;
    
    return {
      totalEntries: this.cache.size,
      totalSize: this.estimateSize(),
      hitRate: totalRequests > 0 ? this.hits / totalRequests : 0,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : 0
    };
  }

  private estimateSize(): number {
    // Rough estimation of cache size in KB
    let size = 0;
    for (const entry of this.cache.values()) {
      size += JSON.stringify(entry).length;
    }
    return Math.round(size / 1024);
  }

  preload(key: string, dataLoader: () => Promise<any>, ttl = this.defaultTTL): Promise<any> {
    const cached = this.get(key, ttl);
    if (cached) {
      return Promise.resolve(cached);
    }

    return dataLoader().then(data => {
      this.set(key, data, ttl);
      return data;
    });
  }
}

export default EnhancedCache;
