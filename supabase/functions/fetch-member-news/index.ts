
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

interface FormattedNewsItem {
  member_name: string;
  title: string;
  headline: string;
  body: string;
  image_url: string | null;
  link: string;
  source: string;
  pub_date: string;
}

// Function to format RSS items for display
function formatNewsItem(item: any, memberName: string): FormattedNewsItem {
  // Extract image URL from media:content or enclosure tags
  const imageUrl = item.media?.[0]?.url || 
                   item.enclosure?.url || 
                   item.imageUrl || 
                   null;
  
  return {
    member_name: memberName,
    title: item.title,
    headline: item.title, // Headline same as title for simplicity
    body: item.description || 'Ingen brödtext tillgänglig.',
    image_url: imageUrl,
    link: item.link,
    source: 'Google News',
    pub_date: item.pubDate.split('T')[0], // Format as YYYY-MM-DD
  };
}

// Enhanced RSS parsing function
async function fetchGoogleNewsRss(memberName: string, maxRetries = 3): Promise<NewsItem[]> {
  const proxies = [
    '', // Direct attempt first
    'https://api.allorigins.win/get?url=',
    'https://corsproxy.io/?',
  ];

  for (let retry = 0; retry < maxRetries; retry++) {
    for (const proxy of proxies) {
      try {
        const searchQuery = encodeURIComponent(`"${memberName}" site:svt.se OR site:dn.se OR site:aftonbladet.se OR site:expressen.se OR site:svenska.yle.fi`);
        let rssUrl = `https://news.google.com/rss/search?q=${searchQuery}&hl=sv&gl=SE&ceid=SE:sv`;
        
        if (proxy) {
          console.log(`Trying proxy: ${proxy}`);
          rssUrl = proxy + encodeURIComponent(rssUrl);
        }

        const response = await fetch(rssUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
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
        
        // Parse RSS XML with enhanced parsing for images
        const newsItems: NewsItem[] = [];
        const itemRegex = /<item>(.*?)<\/item>/gs;
        let match;

        while ((match = itemRegex.exec(xmlText)) !== null) {
          const itemContent = match[1];
          
          const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
          const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
          const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
          const descriptionMatch = itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/);
          
          // Try to extract image from various sources
          const mediaContentMatch = itemContent.match(/<media:content[^>]*url="([^"]*)"[^>]*>/);
          const enclosureMatch = itemContent.match(/<enclosure[^>]*url="([^"]*)"[^>]*type="image[^"]*"/);
          const imgMatch = itemContent.match(/<img[^>]*src="([^"]*)"[^>]*>/);
          
          const imageUrl = mediaContentMatch?.[1] || enclosureMatch?.[1] || imgMatch?.[1];
          
          if (titleMatch && linkMatch && pubDateMatch) {
            newsItems.push({
              title: titleMatch[1],
              link: linkMatch[1],
              pubDate: pubDateMatch[1],
              description: descriptionMatch ? descriptionMatch[1] : undefined,
              imageUrl: imageUrl,
            });
          }
        }

        console.log(`Parsed ${newsItems.length} news items from RSS`);
        return newsItems;

      } catch (error) {
        console.log(`Failed with proxy ${proxy}: ${error}`);
        continue;
      }
    }
  }

  throw new Error('All fetch attempts failed');
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

    console.log(`Fetching news for ${memberName} (${memberId})`)

    // Check if we have recent news in database (within last 4 hours) unless manual fetch
    if (!manualFetch) {
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      
      const { data: existingNews } = await supabase
        .from('member_news')
        .select('*')
        .eq('member_id', memberId)
        .gte('created_at', fourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(5)

      if (existingNews && existingNews.length > 0) {
        console.log(`Found ${existingNews.length} recent news items in cache`)
        
        // Format existing news items
        const formattedItems = existingNews.map(item => formatNewsItem({
          title: item.title,
          link: item.link,
          pubDate: item.pub_date,
          description: item.description,
          imageUrl: item.image_url
        }, memberName));

        return new Response(
          JSON.stringify({
            newsItems: existingNews.map(item => ({
              title: item.title,
              link: item.link,
              pubDate: item.pub_date,
              description: item.description,
              imageUrl: item.image_url
            })),
            formattedItems,
            source: 'cache',
            stored: 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Fetch fresh news from Google News RSS
    let newsItems: NewsItem[] = [];
    
    try {
      newsItems = await fetchGoogleNewsRss(memberName);
    } catch (error) {
      console.error('=== Error in fetch-member-news ===', error);
      
      // Return empty result instead of throwing
      return new Response(
        JSON.stringify({
          newsItems: [],
          formattedItems: [],
          source: 'error',
          stored: 0,
          error: error.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (newsItems.length === 0) {
      return new Response(
        JSON.stringify({
          newsItems: [],
          formattedItems: [],
          source: 'live',
          stored: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Store new items in database
    let storedCount = 0
    for (const item of newsItems) {
      try {
        // Check if this item already exists
        const { data: existing } = await supabase
          .from('member_news')
          .select('id')
          .eq('member_id', memberId)
          .eq('link', item.link)
          .single()

        if (!existing) {
          await supabase
            .from('member_news')
            .insert({
              member_id: memberId,
              title: item.title,
              link: item.link,
              pub_date: item.pubDate,
              description: item.description,
              image_url: item.imageUrl
            })
          storedCount++
        }
      } catch (error) {
        console.error('Error storing news item:', error)
      }
    }

    console.log(`Stored ${storedCount} new news items`)

    // Format items for display
    const formattedItems = newsItems.slice(0, 5).map(item => formatNewsItem(item, memberName));

    return new Response(
      JSON.stringify({
        newsItems: newsItems.slice(0, 5),
        formattedItems,
        source: 'live',
        stored: storedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in fetch-member-news:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        newsItems: [],
        formattedItems: [],
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
