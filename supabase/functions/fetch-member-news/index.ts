
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
  description: string;
  imageUrl?: string;
}

// Rate limiting map - i produktion skulle detta vara i en databas
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_PER_MINUTE = 10;
const RATE_LIMIT_WINDOW = 60000; // 1 minut

// Cache för RSS-data
const rssCache = new Map<string, { data: NewsItem[]; timestamp: number }>();
const CACHE_DURATION = 300000; // 5 minuter

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(key);
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (limit.count >= RATE_LIMIT_PER_MINUTE) {
    return false;
  }
  
  limit.count++;
  return true;
}

function getCachedNews(memberName: string): NewsItem[] | null {
  const cached = rssCache.get(memberName);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedNews(memberName: string, data: NewsItem[]): void {
  rssCache.set(memberName, { data, timestamp: Date.now() });
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Simple XML parser for Deno (replaces DOMParser)
function parseXMLSimple(xmlText: string): { items: any[] } {
  try {
    // Clean up XML text
    xmlText = xmlText.trim();
    
    // Simple regex-based XML parsing for RSS items
    const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi);
    
    if (!itemMatches) {
      console.log('No RSS items found in XML');
      return { items: [] };
    }
    
    const items = itemMatches.map(itemXml => {
      // Extract title
      const titleMatch = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : 'No title';
      
      // Extract link
      const linkMatch = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/i);
      const link = linkMatch ? linkMatch[1].trim() : '#';
      
      // Extract pubDate
      const pubDateMatch = itemXml.match(/<pubDate[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/pubDate>/i);
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();
      
      // Extract description
      const descriptionMatch = itemXml.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
      let description = descriptionMatch ? descriptionMatch[1].trim() : '';
      
      // Extract image from description
      const imgMatch = description.match(/<img[^>]+src=["'](.*?)["']/i);
      const imageUrl = imgMatch ? imgMatch[1] : undefined;
      
      // Clean HTML from description
      description = description
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Truncate description
      if (description.length > 200) {
        description = description.substring(0, 200) + '...';
      }
      
      return {
        title,
        link,
        pubDate,
        description,
        imageUrl
      };
    });
    
    return { items };
  } catch (error) {
    console.error('XML parsing error:', error);
    throw new Error(`XML parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function tryFetchRSS(memberName: string, maxRetries: number = 3): Promise<NewsItem[]> {
  const encodedName = encodeURIComponent(`"${memberName}"`);
  const rssUrl = `https://news.google.com/rss/search?q=${encodedName}&hl=sv&gl=SE`;
  
  console.log(`Starting RSS fetch for: ${memberName}`);
  console.log(`RSS URL: ${rssUrl}`);
  
  // Improved CORS proxies with better error handling
  const corsProxies = [
    { 
      url: 'https://api.allorigins.win/get?url=',
      format: 'allorigins',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
      }
    },
    {
      url: 'https://corsproxy.io/?',
      format: 'direct',
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
      }
    }
  ];

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    console.log(`Attempt ${attempt + 1}/${maxRetries} for ${memberName}`);
    
    for (const proxy of corsProxies) {
      try {
        let finalUrl: string;
        if (proxy.format === 'allorigins') {
          finalUrl = `${proxy.url}${encodeURIComponent(rssUrl)}`;
        } else {
          finalUrl = `${proxy.url}${rssUrl}`;
        }

        console.log(`Trying proxy: ${proxy.url}`);
        
        const response = await fetchWithTimeout(finalUrl, {
          method: 'GET',
          headers: proxy.headers
        }, 15000); // Increased timeout to 15 seconds

        if (!response.ok) {
          console.log(`HTTP ${response.status}: ${response.statusText}`);
          continue;
        }

        let xmlText = await response.text();
        console.log(`Received ${xmlText.length} characters from ${proxy.url}`);
        
        // Handle allorigins format
        if (proxy.format === 'allorigins') {
          try {
            const jsonResponse = JSON.parse(xmlText);
            if (jsonResponse.contents) {
              xmlText = jsonResponse.contents;
              console.log('Successfully extracted XML from allorigins response');
            } else {
              console.log('Invalid allorigins response format');
              continue;
            }
          } catch (e) {
            console.log('Failed to parse allorigins response:', e);
            continue;
          }
        }

        // Parse XML using our simple parser
        const parsed = parseXMLSimple(xmlText);
        console.log(`Parsed ${parsed.items.length} items from XML`);
        
        if (parsed.items.length > 0) {
          // Limit to 5 items and validate data
          const newsItems: NewsItem[] = parsed.items.slice(0, 5)
            .filter(item => item.title && item.title !== 'No title' && item.link && item.link !== '#')
            .map(item => ({
              title: item.title,
              link: item.link,
              pubDate: item.pubDate,
              description: item.description || '',
              imageUrl: item.imageUrl
            }));
          
          if (newsItems.length > 0) {
            console.log(`Successfully fetched ${newsItems.length} valid news items with proxy: ${proxy.url}`);
            setCachedNews(memberName, newsItems);
            return newsItems;
          }
        }
        
      } catch (err) {
        console.log(`Failed with proxy ${proxy.url}:`, err);
        lastError = err as Error;
        continue;
      }
    }
    
    // Wait before next retry (exponential backoff)
    if (attempt < maxRetries - 1) {
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Waiting ${delay}ms before next attempt`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('All proxies and retries failed');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { memberName, memberId } = await req.json()
    
    if (!memberName || !memberId) {
      return new Response(
        JSON.stringify({ error: 'Member name and ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`=== Fetching news for ${memberName} (${memberId}) ===`)

    // Rate limiting check
    const rateLimitKey = `${memberId}-${memberName}`;
    if (!checkRateLimit(rateLimitKey)) {
      console.log(`Rate limit exceeded for ${rateLimitKey}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check cache first
    const cachedNews = getCachedNews(memberName);
    if (cachedNews) {
      console.log(`Returning ${cachedNews.length} cached news items for ${memberName}`);
      return new Response(
        JSON.stringify({ 
          newsItems: cachedNews, 
          message: `Returned ${cachedNews.length} cached news items for ${memberName}`,
          source: 'cache'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch news from RSS
    console.log('Fetching news from RSS feeds...');
    const newsData = await tryFetchRSS(memberName);
    
    if (newsData.length === 0) {
      console.log(`No news found for ${memberName}`);
      return new Response(
        JSON.stringify({ 
          message: `No news found for ${memberName}`, 
          newsItems: [],
          source: 'rss'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Attempting to store ${newsData.length} news items in database...`);

    // Prepare data for database insertion
    const newsInserts = newsData.map(item => ({
      member_id: memberId,
      member_name: memberName,
      title: item.title,
      link: item.link,
      pub_date: item.pubDate,
      description: item.description,
      image_url: item.imageUrl,
      source: 'google_news'
    }));

    // Use upsert with the new unique constraint to avoid duplicates
    const { data, error } = await supabase
      .from('member_news')
      .upsert(newsInserts, { 
        onConflict: 'member_id,link',
        ignoreDuplicates: true 
      })
      .select()

    if (error) {
      console.error('Database error:', error);
      // Return fetched data even if database insert fails
      return new Response(
        JSON.stringify({ 
          newsItems: newsData, 
          warning: 'Failed to save to database but fetched successfully',
          dbError: error.message,
          source: 'rss'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const insertedCount = data ? data.length : newsData.length;
    console.log(`Successfully stored ${insertedCount} news items in database for ${memberName}`);

    return new Response(
      JSON.stringify({ 
        newsItems: newsData, 
        message: `Successfully fetched and stored ${newsData.length} news items for ${memberName}`,
        source: 'rss',
        cached: false,
        stored: insertedCount
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('=== Error in fetch-member-news ===', err)
    
    let errorMessage = 'Unknown error occurred'
    if (err instanceof Error) {
      if (err.message.includes('403') || err.message.includes('Forbidden')) {
        errorMessage = 'Access denied - Google News is blocking requests temporarily'
      } else if (err.message.includes('CORS')) {
        errorMessage = 'CORS error - cannot access news from this browser'
      } else if (err.message.includes('timeout') || err.message.includes('AbortError')) {
        errorMessage = 'Request timeout - Google News service is slow'
      } else if (err.message.includes('Network')) {
        errorMessage = 'Network error - check your internet connection'
      } else if (err.message.includes('Rate limit')) {
        errorMessage = 'Too many requests - please wait before trying again'
      } else {
        errorMessage = err.message
      }
    }

    return new Response(
      JSON.stringify({ 
        error: `Failed to fetch news: ${errorMessage}`,
        details: err instanceof Error ? err.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
