
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

async function tryFetchRSS(memberName: string, maxRetries: number = 3): Promise<NewsItem[]> {
  const encodedName = encodeURIComponent(`"${memberName}"`);
  const rssUrl = `https://news.google.com/rss/search?q=${encodedName}&hl=sv&gl=SE`;
  
  // Förbättrade CORS-proxies med fallback-strategi
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
    },
    {
      url: 'https://cors-anywhere.herokuapp.com/',
      format: 'direct',
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
        'X-Requested-With': 'XMLHttpRequest'
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

        console.log(`Trying proxy: ${proxy.url} for ${memberName}`);
        
        const response = await fetchWithTimeout(finalUrl, {
          method: 'GET',
          headers: proxy.headers
        }, 8000); // 8 sekunder timeout

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        let xmlText = await response.text();
        
        // Hantera allorigins-format
        if (proxy.format === 'allorigins') {
          try {
            const jsonResponse = JSON.parse(xmlText);
            if (jsonResponse.contents) {
              xmlText = jsonResponse.contents;
            } else {
              throw new Error('Invalid allorigins response format');
            }
          } catch (e) {
            console.log('Failed to parse allorigins response:', e);
            continue;
          }
        }

        // Förbättrad XML-parsing
        const newsItems = parseRSSFeed(xmlText, memberName);
        
        if (newsItems.length > 0) {
          console.log(`Successfully fetched ${newsItems.length} items with proxy: ${proxy.url}`);
          setCachedNews(memberName, newsItems);
          return newsItems;
        }
        
      } catch (err) {
        console.log(`Failed with proxy ${proxy.url}:`, err);
        lastError = err as Error;
        
        // Vänta innan nästa försök (exponential backoff)
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
        continue;
      }
    }
  }

  throw lastError || new Error('All proxies and retries failed');
}

function parseRSSFeed(xmlText: string, memberName: string): NewsItem[] {
  try {
    // Rensa upp XML-texten
    xmlText = xmlText.trim();
    
    // Kontrollera om det finns XML-deklaration
    if (!xmlText.startsWith('<?xml') && !xmlText.startsWith('<rss')) {
      throw new Error('Invalid XML format - missing XML declaration or RSS root');
    }
    
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, 'text/xml');
    
    // Kontrollera XML-parsing-fel
    const parseError = xml.querySelector('parsererror');
    if (parseError) {
      console.error('XML Parse Error:', parseError.textContent);
      throw new Error(`XML Parse Error: ${parseError.textContent}`);
    }
    
    // Kontrollera RSS-struktur
    const rssElement = xml.querySelector('rss');
    if (!rssElement) {
      throw new Error('Invalid RSS format - missing RSS element');
    }
    
    const items = xml.querySelectorAll('item');
    console.log(`Found ${items.length} RSS items for ${memberName}`);
    
    if (items.length === 0) {
      return [];
    }

    const newsData: NewsItem[] = [];
    
    // Begränsa till 5 senaste artiklarna
    const itemsToProcess = Math.min(items.length, 5);
    
    for (let i = 0; i < itemsToProcess; i++) {
      const item = items[i];
      
      try {
        const title = item.querySelector('title')?.textContent?.trim() || 'No title';
        const link = item.querySelector('link')?.textContent?.trim() || '#';
        const pubDate = item.querySelector('pubDate')?.textContent?.trim() || new Date().toISOString();
        const description = item.querySelector('description')?.textContent?.trim() || '';
        
        // Extrahera bild från beskrivning
        const imgMatch = description.match(/<img[^>]+src=["'](.*?)["']/i);
        const imageUrl = imgMatch ? imgMatch[1] : undefined;
        
        // Rensa HTML från beskrivning med förbättrad metod
        let cleanDescription = '';
        if (description) {
          try {
            const tempDiv = parser.parseFromString(`<div>${description}</div>`, 'text/html');
            cleanDescription = tempDiv.body?.textContent || tempDiv.body?.innerText || '';
          } catch {
            // Fallback: enkel HTML-tag-borttagning
            cleanDescription = description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          }
        }
        
        const truncatedDescription = cleanDescription.length > 200 
          ? cleanDescription.substring(0, 200) + '...' 
          : cleanDescription;
        
        // Validera att vi har rimlig data
        if (title && title !== 'No title' && link && link !== '#') {
          newsData.push({
            title,
            link,
            pubDate,
            description: truncatedDescription,
            imageUrl
          });
        }
        
      } catch (itemError) {
        console.warn(`Error parsing RSS item ${i}:`, itemError);
        // Fortsätt med nästa item
      }
    }

    return newsData;
    
  } catch (error) {
    console.error('RSS parsing error:', error);
    throw new Error(`RSS parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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

    console.log(`Fetching news for ${memberName} (${memberId})`)

    // Rate limiting check
    const rateLimitKey = `${memberId}-${memberName}`;
    if (!checkRateLimit(rateLimitKey)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check cache first
    const cachedNews = getCachedNews(memberName);
    if (cachedNews) {
      console.log(`Returning cached news for ${memberName}`);
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
    const newsData = await tryFetchRSS(memberName);
    
    if (newsData.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: `No news found for ${memberName}`, 
          newsItems: [],
          source: 'rss'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Lagra i databasen med förbättrade operationer
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

    // Använd upsert för att undvika dubbletter
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

    console.log(`Successfully stored ${newsData.length} news items for ${memberName}`)

    return new Response(
      JSON.stringify({ 
        newsItems: newsData, 
        message: `Successfully fetched and stored ${newsData.length} news items for ${memberName}`,
        source: 'rss',
        cached: false
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error in fetch-member-news:', err)
    
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
