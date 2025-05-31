import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
  imageUrl?: string;
}

interface FetchResult {
  success: boolean;
  items: NewsItem[];
  error?: string;
  strategy?: string;
  proxy?: string;
}

// Enhanced RSS fetcher with multiple strategies and proxies
class EnhancedRssFetcher {
  private proxies = [
    '', // Direct
    'https://corsproxy.io/?',
    'https://api.allorigins.win/get?url=',
    'https://proxy.cors.sh/',
  ];

  private searchStrategies = [
    (name: string) => `"${name}" riksdag (site:svt.se OR site:dn.se OR site:aftonbladet.se OR site:expressen.se)`,
    (name: string) => `"${name}" politik Sverige (site:svt.se OR site:dn.se)`,
    (name: string) => {
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ');
      return `"${lastName}" riksdag Sverige`;
    },
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
            console.log(`❌ Failed strategy ${strategyIndex + 1}, proxy ${proxyIndex + 1}, retry ${retry + 1}:`, error.message);
            
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
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
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

  private parseRssXml(xmlText: string, memberName: string): NewsItem[] {
    const items: NewsItem[] = [];
    
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

  private parseRssItem(itemContent: string, memberName: string): NewsItem | null {
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

  private isRelevantToMember(item: NewsItem, memberName: string): boolean {
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

// Function to format RSS items for display
function formatNewsItem(item: any, memberName: string): FormattedNewsItem {
  const imageUrl = item.media?.[0]?.url || 
                   item.enclosure?.url || 
                   item.imageUrl || 
                   null;
  
  return {
    member_name: memberName,
    title: item.title,
    headline: item.title,
    body: item.description || 'Ingen brödtext tillgänglig.',
    image_url: imageUrl,
    link: item.link,
    source: 'Google News',
    pub_date: item.pubDate.split('T')[0],
  };
}

// Generate multiple search strategies for better coverage
function generateSearchQueries(memberName: string): string[] {
  const [firstName, ...lastNameParts] = memberName.split(' ');
  const lastName = lastNameParts.join(' ');
  
  const queries = [
    // Strategy 1: Full name with Swedish news sites
    `"${memberName}" (site:svt.se OR site:dn.se OR site:aftonbladet.se OR site:expressen.se OR site:svenska.yle.fi)`,
    
    // Strategy 2: Last name only (more results)
    `"${lastName}" riksdag (site:svt.se OR site:dn.se OR site:aftonbladet.se)`,
    
    // Strategy 3: Full name without site restriction
    `"${memberName}" riksdag Sverige`,
    
    // Strategy 4: Name with political keywords
    `"${memberName}" politik Sverige`,
    
    // Strategy 5: Simple name search
    `"${memberName}"`
  ];
  
  return queries;
}

// Enhanced RSS parsing with better error handling and logging
async function fetchGoogleNewsRss(memberName: string, maxRetries = 2): Promise<NewsItem[]> {
  const proxies = [
    '', // Direct attempt first
    'https://api.allorigins.win/get?url=',
    'https://corsproxy.io/?',
  ];

  const searchQueries = generateSearchQueries(memberName);
  console.log(`Generated ${searchQueries.length} search strategies for ${memberName}`);

  let allNewsItems: NewsItem[] = [];
  let successfulFetches = 0;

  // Try each search strategy
  for (let queryIndex = 0; queryIndex < searchQueries.length; queryIndex++) {
    const query = searchQueries[queryIndex];
    console.log(`\n=== Strategy ${queryIndex + 1} for ${memberName} ===`);
    console.log(`Query: ${query}`);

    // Try each proxy for this query
    for (let proxyIndex = 0; proxyIndex < proxies.length; proxyIndex++) {
      const proxy = proxies[proxyIndex];
      
      for (let retry = 0; retry < maxRetries; retry++) {
        try {
          const searchQuery = encodeURIComponent(query);
          let rssUrl = `https://news.google.com/rss/search?q=${searchQuery}&hl=sv&gl=SE&ceid=SE:sv`;
          
          if (proxy) {
            console.log(`Trying proxy ${proxyIndex + 1}: ${proxy.split('?')[0]}...`);
            rssUrl = proxy + encodeURIComponent(rssUrl);
          } else {
            console.log('Trying direct connection...');
          }

          const response = await fetch(rssUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
              'Accept': 'application/rss+xml, application/xml, text/xml',
            },
          });

          if (!response.ok) {
            console.log(`HTTP ${response.status}: ${response.statusText}`);
            continue;
          }

          let xmlText: string;
          
          if (proxy === 'https://api.allorigins.win/get?url=') {
            const data = await response.json();
            xmlText = data.contents;
          } else {
            xmlText = await response.text();
          }
          
          console.log(`Received ${xmlText.length} characters of XML data`);
          
          // Enhanced XML parsing with better regex patterns
          const newsItems: NewsItem[] = [];
          
          // First, try to find items using different patterns
          const itemPatterns = [
            /<item>(.*?)<\/item>/gs,
            /<entry>(.*?)<\/entry>/gs,
          ];
          
          let items: RegExpMatchArray[] = [];
          for (const pattern of itemPatterns) {
            const matches = Array.from(xmlText.matchAll(pattern));
            if (matches.length > 0) {
              items = matches;
              console.log(`Found ${matches.length} items using pattern: ${pattern.source}`);
              break;
            }
          }

          if (items.length === 0) {
            console.log('No items found in RSS feed');
            console.log('XML snippet:', xmlText.substring(0, 500));
            continue;
          }

          for (const match of items) {
            const itemContent = match[1];
            
            // Enhanced title extraction
            let title = '';
            const titlePatterns = [
              /<title><!\[CDATA\[(.*?)\]\]><\/title>/,
              /<title>(.*?)<\/title>/,
            ];
            
            for (const pattern of titlePatterns) {
              const titleMatch = itemContent.match(pattern);
              if (titleMatch) {
                title = titleMatch[1];
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
              const linkMatch = itemContent.match(pattern);
              if (linkMatch) {
                link = linkMatch[1];
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
              const dateMatch = itemContent.match(pattern);
              if (dateMatch) {
                pubDate = dateMatch[1];
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
              const descMatch = itemContent.match(pattern);
              if (descMatch) {
                description = descMatch[1];
                break;
              }
            }
            
            // Enhanced image extraction
            const mediaContentMatch = itemContent.match(/<media:content[^>]*url="([^"]*)"[^>]*>/);
            const enclosureMatch = itemContent.match(/<enclosure[^>]*url="([^"]*)"[^>]*type="image[^"]*"/);
            const imgMatch = itemContent.match(/<img[^>]*src="([^"]*)"[^>]*>/);
            
            const imageUrl = mediaContentMatch?.[1] || enclosureMatch?.[1] || imgMatch?.[1];
            
            if (title && link && pubDate) {
              // Check if this news item is actually about our member
              const titleLower = title.toLowerCase();
              const descLower = description.toLowerCase();
              const memberLower = memberName.toLowerCase();
              const lastNameLower = memberName.split(' ').pop()?.toLowerCase() || '';
              
              if (titleLower.includes(memberLower) || 
                  titleLower.includes(lastNameLower) || 
                  descLower.includes(memberLower) ||
                  descLower.includes(lastNameLower)) {
                
                newsItems.push({
                  title,
                  link,
                  pubDate,
                  description: description || undefined,
                  imageUrl: imageUrl || undefined,
                });
              }
            }
          }

          if (newsItems.length > 0) {
            console.log(`✓ Strategy ${queryIndex + 1} successful: Found ${newsItems.length} relevant items`);
            allNewsItems.push(...newsItems);
            successfulFetches++;
            
            // If we found news with this strategy, continue to next strategy
            break;
          } else {
            console.log(`Strategy ${queryIndex + 1} found items but none were relevant`);
          }

        } catch (error) {
          console.log(`Error with strategy ${queryIndex + 1}, proxy ${proxyIndex + 1}, retry ${retry + 1}:`, error.message);
          continue;
        }
      }
      
      // If we found results with this proxy, try next strategy
      if (allNewsItems.length > 0) break;
    }
    
    // Stop trying more strategies if we have enough results
    if (allNewsItems.length >= 10) {
      console.log(`Stopping search - found ${allNewsItems.length} articles`);
      break;
    }
  }

  // Remove duplicates based on link
  const uniqueItems = allNewsItems.filter((item, index, self) => 
    index === self.findIndex(other => other.link === item.link)
  );

  console.log(`\n=== Final Results for ${memberName} ===`);
  console.log(`Successful fetches: ${successfulFetches}/${searchQueries.length} strategies`);
  console.log(`Total items found: ${allNewsItems.length}`);
  console.log(`Unique items: ${uniqueItems.length}`);

  return uniqueItems;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { memberName, memberId, manualFetch = false } = await req.json()
    
    if (!memberName || !memberId) {
      return new Response(
        JSON.stringify({ error: 'Missing memberName or memberId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`\n🔍 Starting enhanced news fetch for ${memberName} (${memberId})`)
    console.log(`Manual fetch: ${manualFetch}`)

    // Check if we have recent news in database (within last 4 hours) unless manual fetch
    if (!manualFetch) {
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      
      const { data: existingNews } = await supabase
        .from('member_news')
        .select('*')
        .eq('member_id', memberId)
        .gte('created_at', fourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(10)

      if (existingNews && existingNews.length > 0) {
        console.log(`✓ Found ${existingNews.length} recent news items in cache`)
        
        return new Response(
          JSON.stringify({
            newsItems: existingNews.map(item => ({
              title: item.title,
              link: item.link,
              pubDate: item.pub_date,
              description: item.description,
              imageUrl: item.image_url
            })),
            source: 'cache',
            stored: 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Use enhanced RSS fetcher
    const enhancedFetcher = new EnhancedRssFetcher();
    let result: FetchResult;
    
    try {
      result = await enhancedFetcher.fetchNewsForMember(memberName);
    } catch (error) {
      console.error('=== Error in enhanced fetch-member-news ===', error);
      
      return new Response(
        JSON.stringify({
          newsItems: [],
          source: 'error',
          stored: 0,
          error: error.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!result.success || result.items.length === 0) {
      console.log(`⚠️ No news items found for ${memberName}: ${result.error}`);
      return new Response(
        JSON.stringify({
          newsItems: [],
          source: 'live',
          stored: 0,
          error: result.error
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Store new items in database
    let storedCount = 0
    console.log(`💾 Attempting to store ${result.items.length} items...`);
    
    for (const item of result.items) {
      try {
        // Check if this item already exists
        const { data: existing } = await supabase
          .from('member_news')
          .select('id')
          .eq('member_id', memberId)
          .eq('link', item.link)
          .single()

        if (!existing) {
          const { error: insertError } = await supabase
            .from('member_news')
            .insert({
              member_id: memberId,
              title: item.title,
              link: item.link,
              pub_date: item.pubDate,
              description: item.description,
              image_url: item.imageUrl
            })
          
          if (insertError) {
            console.error('Insert error:', insertError);
          } else {
            storedCount++;
            console.log(`✓ Stored: ${item.title.substring(0, 50)}...`);
          }
        } else {
          console.log(`- Duplicate: ${item.title.substring(0, 50)}...`);
        }
      } catch (error) {
        console.error('Error storing news item:', error)
      }
    }

    console.log(`✓ Successfully stored ${storedCount}/${result.items.length} new items for ${memberName}`);

    return new Response(
      JSON.stringify({
        newsItems: result.items.slice(0, 10),
        source: 'live',
        stored: storedCount,
        strategy: result.strategy,
        proxy: result.proxy
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in enhanced fetch-member-news:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        newsItems: [],
        source: 'error',
        stored: 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
