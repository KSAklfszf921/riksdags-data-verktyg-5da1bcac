
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
}

class EnhancedRssFetcher {
  private proxies = [
    '', // Direct
    'https://corsproxy.io/?',
    'https://api.allorigins.win/get?url=',
    'https://proxy.cors.sh/',
    'https://cors-anywhere.herokuapp.com/',
  ];

  private searchStrategies = [
    // High precision strategies
    (name: string) => `"${name}" riksdag (site:svt.se OR site:dn.se OR site:aftonbladet.se OR site:expressen.se)`,
    (name: string) => `"${name}" politik Sverige (site:svt.se OR site:dn.se)`,
    
    // Medium precision strategies
    (name: string) => {
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ');
      return `"${lastName}" riksdag Sverige`;
    },
    
    // Broad strategies for fallback
    (name: string) => `"${name}" politik`,
    (name: string) => `"${name}" Sverige`,
  ];

  async fetchNewsForMember(memberName: string, maxRetries = 2): Promise<FetchResult> {
    console.log(`🔍 Enhanced RSS fetch for ${memberName}`);
    
    for (let strategyIndex = 0; strategyIndex < this.searchStrategies.length; strategyIndex++) {
      const strategy = this.searchStrategies[strategyIndex];
      const query = strategy(memberName);
      
      console.log(`📋 Strategy ${strategyIndex + 1}: ${query}`);
      
      for (let proxyIndex = 0; proxyIndex < this.proxies.length; proxyIndex++) {
        const proxy = this.proxies[proxyIndex];
        
        for (let retry = 0; retry < maxRetries; retry++) {
          try {
            const result = await this.tryFetchWithProxy(query, proxy, memberName, retry + 1);
            
            if (result.success && result.items.length > 0) {
              console.log(`✅ Success with strategy ${strategyIndex + 1}, proxy ${proxyIndex + 1}: ${result.items.length} items`);
              return {
                ...result,
                strategy: `${strategyIndex + 1}`,
                proxy: proxy || 'direct'
              };
            }
          } catch (error) {
            console.log(`❌ Failed strategy ${strategyIndex + 1}, proxy ${proxyIndex + 1}, retry ${retry + 1}:`, error);
            
            // Add delay between retries
            if (retry < maxRetries - 1) {
              await this.delay(1000 * (retry + 1));
            }
          }
        }
        
        // Add delay between proxies
        await this.delay(500);
      }
    }
    
    return {
      success: false,
      items: [],
      error: 'All strategies and proxies failed'
    };
  }

  private async tryFetchWithProxy(query: string, proxy: string, memberName: string, attempt: number): Promise<FetchResult> {
    const searchQuery = encodeURIComponent(query);
    let rssUrl = `https://news.google.com/rss/search?q=${searchQuery}&hl=sv&gl=SE&ceid=SE:sv`;
    
    if (proxy) {
      rssUrl = proxy + encodeURIComponent(rssUrl);
    }
    
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

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
    
    // Check for exact name match
    if (titleLower.includes(memberLower) || descLower.includes(memberLower)) {
      return true;
    }
    
    // Check for last name match (common in news)
    if (lastName.length > 2 && (titleLower.includes(lastName) || descLower.includes(lastName))) {
      return true;
    }
    
    // Check for first + last name combinations
    if (firstName.length > 2 && lastName.length > 2) {
      const hasFirstName = titleLower.includes(firstName) || descLower.includes(firstName);
      const hasLastName = titleLower.includes(lastName) || descLower.includes(lastName);
      
      if (hasFirstName && hasLastName) {
        return true;
      }
    }
    
    return false;
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
}

export const enhancedRssFetcher = new EnhancedRssFetcher();
export type { RssItem, FetchResult };
