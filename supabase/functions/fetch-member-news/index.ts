
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { memberName, memberId } = await req.json()
    
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

    // Check if we have recent news in database (within last 4 hours)
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

    // Try to fetch fresh news from Google News RSS
    const searchQuery = encodeURIComponent(`"${memberName}" site:svt.se OR site:dn.se OR site:aftonbladet.se OR site:expressen.se OR site:svenska.yle.fi`)
    const rssUrl = `https://news.google.com/rss/search?q=${searchQuery}&hl=sv&gl=SE&ceid=SE:sv`
    
    console.log(`Fetching from RSS: ${rssUrl}`)
    
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
      },
    })

    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status} ${response.statusText}`)
    }

    const xmlText = await response.text()
    
    // Parse RSS XML
    const newsItems: NewsItem[] = []
    const itemRegex = /<item>(.*?)<\/item>/gs
    let match

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1]
      
      const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)
      const linkMatch = itemContent.match(/<link>(.*?)<\/link>/)
      const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/)
      const descriptionMatch = itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)
      
      if (titleMatch && linkMatch && pubDateMatch) {
        newsItems.push({
          title: titleMatch[1],
          link: linkMatch[1],
          pubDate: pubDateMatch[1],
          description: descriptionMatch ? descriptionMatch[1] : undefined,
        })
      }
    }

    console.log(`Parsed ${newsItems.length} news items from RSS`)

    if (newsItems.length === 0) {
      return new Response(
        JSON.stringify({
          newsItems: [],
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

    return new Response(
      JSON.stringify({
        newsItems: newsItems.slice(0, 5),
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
