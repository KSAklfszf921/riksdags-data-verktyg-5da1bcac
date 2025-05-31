
import { proxyManager } from './proxyManager';
import { searchStrategyManager } from './searchStrategyManager';

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
  imageUrl?: string;
}

interface FetchResult {
  success: boolean;
  items: RssItem[];
  error?: string;
  strategy?: string;
  proxy?: string;
  metrics?: {
    strategiesAttempted: number;
    proxiesAttempted: number;
    totalRetries: number;
    responseTime: number;
  };
}

class EnhancedRssFetcher {
  private readonly REQUEST_TIMEOUT = 15000;
  private readonly MAX_RETRIES = 2;

  async fetchNewsForMember(memberName: string, maxStrategies = 4): Promise<FetchResult> {
    console.log(`🔍 Enhanced RSS fetch for ${memberName}`);
    
    const startTime = Date.now();
    let totalStrategiesAttempted = 0;
    let totalProxiesAttempted = 0;
    let totalRetries = 0;

    // Get optimal search strategies
    const strategies = searchStrategyManager.getOptimalStrategies(memberName, maxStrategies);
    
    for (let strategyIndex = 0; strategyIndex < strategies.length; strategyIndex++) {
      const strategy = strategies[strategyIndex];
      const query = strategy.generator(memberName);
      
      totalStrategiesAttempted++;
      console.log(`📋 Strategy ${strategyIndex + 1} (${strategy.name}): ${query}`);
      
      // Get working proxies
      const workingProxies = proxyManager.getWorkingProxies();
      
      for (let proxyIndex = 0; proxyIndex < workingProxies.length; proxyIndex++) {
        const proxy = workingProxies[proxyIndex];
        totalProxiesAttempted++;
        
        for (let retry = 0; retry < this.MAX_RETRIES; retry++) {
          totalRetries++;
          
          try {
            const proxyStartTime = Date.now();
            const result = await this.tryFetchWithProxy(query, proxy, memberName, retry + 1);
            const responseTime = Date.now() - proxyStartTime;
            
            if (result.success && result.items.length > 0) {
              // Mark proxy as successful
              proxyManager.markProxySuccess(proxy, responseTime);
              
              // Update strategy performance
              searchStrategyManager.updateStrategyPerformance(strategy.id, true, result.items.length);
              
              console.log(`✅ Success with strategy ${strategyIndex + 1}, proxy ${proxyIndex + 1}: ${result.items.length} items`);
              
              return {
                ...result,
                strategy: `${strategyIndex + 1} (${strategy.name})`,
                proxy: proxy || 'direct',
                metrics: {
                  strategiesAttempted: totalStrategiesAttempted,
                  proxiesAttempted: totalProxiesAttempted,
                  totalRetries,
                  responseTime: Date.now() - startTime
                }
              };
            }
          } catch (error) {
            // Mark proxy failure
            proxyManager.markProxyFailure(proxy, error instanceof Error ? error : new Error('Unknown error'));
            
            console.log(`❌ Failed strategy ${strategyIndex + 1}, proxy ${proxyIndex + 1}, retry ${retry + 1}:`, error);
            
            // Add delay between retries
            if (retry < this.MAX_RETRIES - 1) {
              await this.delay(1000 * (retry + 1));
            }
          }
        }
        
        // Add delay between proxies
        await this.delay(500);
      }
      
      // Update strategy performance for failed strategy
      searchStrategyManager.updateStrategyPerformance(strategy.id, false, 0);
    }
    
    return {
      success: false,
      items: [],
      error: 'All strategies and proxies failed',
      metrics: {
        strategiesAttempted: totalStrategiesAttempted,
        proxiesAttempted: totalProxiesAttempted,
        totalRetries,
        responseTime: Date.now() - startTime
      }
    };
  }

  private async tryFetchWithProxy(query: string, proxy: string, memberName: string, attempt: number): Promise<FetchResult> {
    const searchQuery = encodeURIComponent(query);
    let rssUrl = `https://news.google.com/rss/search?q=${searchQuery}&hl=sv&gl=SE&ceid=SE:sv`;
    
    if (proxy) {
      rssUrl = proxy + encodeURIComponent(rssUrl);
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);
    
    try {
      const response = await fetch(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
          'Accept': 'application/rss+xml, application/xml, text/xml',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let xmlText: string;
      
      if (proxy === 'https://api.allorigins.win/get?url=') {
        const data = await response.json();
        xmlText = data.contents;
      } else {
        xmlText = await response.text();
      }
      
      const items = this.parseRssXml(xmlText, memberName);
      
      return {
        success: true,
        items: items
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private parseRssXml(xmlText: string, memberName: string): RssItem[] {
    const items: RssItem[] = [];
    
    // Try different item patterns
    const itemPatterns = [
      /<item>(.*?)<\/item>/gs,
      /<entry>(.*?)<\/entry>/gs,
    ];
    
    let matches: RegExpMatchArray[] = [];
    for (const pattern of itemPatterns) {
      matches = Array.from(xmlText.matchAll(pattern));
      if (matches.length > 0) break;
    }

    if (matches.length === 0) {
      console.log('No RSS items found in XML');
      return items;
    }

    for (const match of matches) {
      const itemContent = match[1];
      const item = this.parseRssItem(itemContent, memberName);
      
      if (item && this.isRelevantToMember(item, memberName)) {
        items.push(item);
      }
    }

    return items;
  }

  private parseRssItem(itemContent: string, memberName: string): RssItem | null {
    // Enhanced title extraction
    let title = '';
    const titlePatterns = [
      /<title><!\[CDATA\[(.*?)\]\]><\/title>/,
      /<title>(.*?)<\/title>/,
    ];
    
    for (const pattern of titlePatterns) {
      const match = itemContent.match(pattern);
      if (match) {
        title = this.cleanText(match[1]);
        break;
      }
    }
    
    // Enhanced link extraction
    let link = '';
    const linkPatterns = [
      /<link>(.*?)<\/link>/,
      /<link[^>]*href="([^"]*)"[^>]*>/,
      /<guid[^>]*>(.*?)<\/guid>/,
    ];
    
    for (const pattern of linkPatterns) {
      const match = itemContent.match(pattern);
      if (match) {
        link = match[1];
        break;
      }
    }
    
    // Enhanced date extraction
    let pubDate = '';
    const datePatterns = [
      /<pubDate>(.*?)<\/pubDate>/,
      /<published>(.*?)<\/published>/,
      /<updated>(.*?)<\/updated>/,
    ];
    
    for (const pattern of datePatterns) {
      const match = itemContent.match(pattern);
      if (match) {
        pubDate = match[1];
        break;
      }
    }
    
    // Enhanced description extraction
    let description = '';
    const descPatterns = [
      /<description><!\[CDATA\[(.*?)\]\]><\/description>/,
      /<description>(.*?)<\/description>/,
      /<summary><!\[CDATA\[(.*?)\]\]><\/summary>/,
      /<summary>(.*?)<\/summary>/,
    ];
    
    for (const pattern of descPatterns) {
      const match = itemContent.match(pattern);
      if (match) {
        description = this.cleanText(match[1]);
        break;
      }
    }
    
    // Enhanced image extraction
    const mediaContentMatch = itemContent.match(/<media:content[^>]*url="([^"]*)"[^>]*>/);
    const enclosureMatch = itemContent.match(/<enclosure[^>]*url="([^"]*)"[^>]*type="image[^"]*"/);
    const imgMatch = itemContent.match(/<img[^>]*src="([^"]*)"[^>]*>/);
    
    const imageUrl = mediaContentMatch?.[1] || enclosureMatch?.[1] || imgMatch?.[1];
    
    if (!title || !link || !pubDate) {
      return null;
    }
    
    return {
      title,
      link,
      pubDate,
      description,
      imageUrl
    };
  }

  private isRelevantToMember(item: RssItem, memberName: string): boolean {
    const titleLower = item.title.toLowerCase();
    const descLower = (item.description || '').toLowerCase();
    const memberLower = memberName.toLowerCase();
    
    // Split name into parts for better matching
    const nameParts = memberName.toLowerCase().split(' ');
    const lastName = nameParts[nameParts.length - 1];
    const firstName = nameParts[0];
    
    // Enhanced relevance scoring
    let relevanceScore = 0;
    
    // Check for exact name match (highest score)
    if (titleLower.includes(memberLower) || descLower.includes(memberLower)) {
      relevanceScore += 10;
    }
    
    // Check for last name match (common in news)
    if (lastName.length > 2 && (titleLower.includes(lastName) || descLower.includes(lastName))) {
      relevanceScore += 7;
    }
    
    // Check for first + last name combinations
    if (firstName.length > 2 && lastName.length > 2) {
      const hasFirstName = titleLower.includes(firstName) || descLower.includes(firstName);
      const hasLastName = titleLower.includes(lastName) || descLower.includes(lastName);
      
      if (hasFirstName && hasLastName) {
        relevanceScore += 8;
      } else if (hasFirstName || hasLastName) {
        relevanceScore += 3;
      }
    }
    
    // Boost score for political context
    const politicalKeywords = ['riksdag', 'politik', 'parti', 'minister', 'ledamot', 'regering'];
    const politicalContext = politicalKeywords.some(keyword => 
      titleLower.includes(keyword) || descLower.includes(keyword)
    );
    
    if (politicalContext) {
      relevanceScore += 2;
    }
    
    // Minimum relevance threshold
    return relevanceScore >= 5;
  }

  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[^;]+;/g, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Diagnostic methods
  getProxyStats() {
    return proxyManager.getProxyStats();
  }

  getStrategyStats() {
    return searchStrategyManager.getStrategyStats();
  }
}

export const enhancedRssFetcher = new EnhancedRssFetcher();
export type { RssItem, FetchResult };
