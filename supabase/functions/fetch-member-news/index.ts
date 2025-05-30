
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Lista över CORS-proxies att testa
    const corsProxies = [
      'https://corsproxy.io/?',
      'https://api.allorigins.win/get?url=',
      'https://cors-anywhere.herokuapp.com/',
      'https://cors.isomorphic-git.org/'
    ]

    // Skapa Google News RSS-URL
    const encodedName = encodeURIComponent(`"${memberName}"`)
    const rssUrl = `https://news.google.com/rss/search?q=${encodedName}&hl=sv&gl=SE`

    let xmlText = null
    let lastError = null

    // Försök med olika CORS-proxies
    for (const proxy of corsProxies) {
      try {
        let finalUrl
        if (proxy.includes('allorigins')) {
          finalUrl = `${proxy}${encodeURIComponent(rssUrl)}`
        } else {
          finalUrl = `${proxy}${encodeURIComponent(rssUrl)}`
        }

        console.log(`Trying proxy: ${proxy}`)
        
        const response = await fetch(finalUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/rss+xml, application/xml, text/xml',
            'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        let text = await response.text()
        
        // Hantera allorigins-format
        if (proxy.includes('allorigins')) {
          try {
            const jsonResponse = JSON.parse(text)
            text = jsonResponse.contents
          } catch (e) {
            console.log('Not allorigins JSON format, using text directly')
          }
        }

        xmlText = text
        console.log(`Successfully fetched with proxy: ${proxy}`)
        break
      } catch (err) {
        console.log(`Failed with proxy ${proxy}:`, err)
        lastError = err
        continue
      }
    }

    if (!xmlText) {
      throw lastError || new Error('All CORS proxies failed')
    }

    // Parsa XML
    const parser = new DOMParser()
    const xml = parser.parseFromString(xmlText, 'text/xml')
    
    // Kontrollera om XML är giltigt
    const parseError = xml.querySelector('parsererror')
    if (parseError) {
      console.error('XML Parse Error:', parseError.textContent)
      throw new Error('Invalid XML response from RSS feed')
    }
    
    const items = xml.querySelectorAll('item')
    console.log(`Found ${items.length} news items`)
    
    if (items.length === 0) {
      return new Response(
        JSON.stringify({ message: `No news found for ${memberName}`, newsItems: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const newsData: NewsItem[] = []
    
    // Begränsa till 5 senaste artiklarna
    const itemsToProcess = Math.min(items.length, 5)
    
    for (let i = 0; i < itemsToProcess; i++) {
      const item = items[i]
      const title = item.querySelector('title')?.textContent || 'No title'
      const link = item.querySelector('link')?.textContent || '#'
      const pubDate = item.querySelector('pubDate')?.textContent || ''
      const description = item.querySelector('description')?.textContent || ''
      
      // Extrahera bild från beskrivning
      const imgMatch = description.match(/<img[^>]+src=["'](.*?)["']/i)
      const imageUrl = imgMatch ? imgMatch[1] : undefined
      
      // Rensa HTML från beskrivning
      const tempDiv = new DOMParser().parseFromString(description, 'text/html')
      const cleanDescription = tempDiv.body?.textContent || tempDiv.body?.innerText || ''
      const truncatedDescription = cleanDescription.substring(0, 200) + (cleanDescription.length > 200 ? '...' : '')
      
      newsData.push({
        title,
        link,
        pubDate,
        description: truncatedDescription,
        imageUrl
      })
    }

    // Lagra i databasen (använd upsert för att undvika dubbletter)
    const newsInserts = newsData.map(item => ({
      member_id: memberId,
      member_name: memberName,
      title: item.title,
      link: item.link,
      pub_date: item.pubDate,
      description: item.description,
      image_url: item.imageUrl,
      source: 'google_news'
    }))

    const { data, error } = await supabase
      .from('member_news')
      .upsert(newsInserts, { 
        onConflict: 'member_id,link',
        ignoreDuplicates: true 
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      // Return fetched data even if database insert fails
      return new Response(
        JSON.stringify({ 
          newsItems: newsData, 
          warning: 'Failed to save to database but fetched successfully',
          dbError: error.message 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Successfully stored ${newsData.length} news items for ${memberName}`)

    return new Response(
      JSON.stringify({ 
        newsItems: newsData, 
        message: `Successfully fetched and stored ${newsData.length} news items for ${memberName}` 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error in fetch-member-news:', err)
    
    let errorMessage = 'Unknown error occurred'
    if (err instanceof Error) {
      if (err.message.includes('403')) {
        errorMessage = 'Access denied - Google News is blocking requests temporarily'
      } else if (err.message.includes('CORS')) {
        errorMessage = 'CORS error - cannot access news from this browser'
      } else if (err.message.includes('Network')) {
        errorMessage = 'Network error - check your internet connection'
      } else {
        errorMessage = err.message
      }
    }

    return new Response(
      JSON.stringify({ error: `Failed to fetch news: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
