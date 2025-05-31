
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RssSource {
  id: string
  name: string
  url: string
  is_active: boolean
}

interface RssItem {
  title: string
  description?: string
  link: string
  pubDate?: string
  guid?: string
  author?: string
  categories?: string[]
  content?: string
}

// Simple XML parser for Deno environment
function parseXML(xmlString: string): RssItem[] {
  const items: RssItem[] = []
  
  try {
    // Find all <item> tags using regex
    const itemMatches = xmlString.match(/<item[^>]*>[\s\S]*?<\/item>/gi)
    
    if (!itemMatches) return items
    
    for (const itemXml of itemMatches) {
      const item: RssItem = {
        title: extractTextFromTag(itemXml, 'title') || '',
        link: extractTextFromTag(itemXml, 'link') || '',
        description: extractTextFromTag(itemXml, 'description'),
        pubDate: extractTextFromTag(itemXml, 'pubDate'),
        guid: extractTextFromTag(itemXml, 'guid'),
        author: extractTextFromTag(itemXml, 'author'),
        content: extractTextFromTag(itemXml, 'content:encoded') || extractTextFromTag(itemXml, 'content')
      }
      
      // Extract categories
      const categoryMatches = itemXml.match(/<category[^>]*>([^<]*)<\/category>/gi)
      if (categoryMatches) {
        item.categories = categoryMatches.map(match => {
          const textMatch = match.match(/>([^<]*)</)
          return textMatch ? textMatch[1].trim() : ''
        }).filter(Boolean)
      }
      
      if (item.title && item.link) {
        items.push(item)
      }
    }
  } catch (error) {
    console.error('Error parsing XML:', error)
  }
  
  return items
}

function extractTextFromTag(xml: string, tagName: string): string | undefined {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i')
  const match = xml.match(regex)
  if (match && match[1]) {
    // Clean up CDATA and HTML entities
    let text = match[1].trim()
    text = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    text = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    return text
  }
  return undefined
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, jobId } = await req.json()

    switch (action) {
      case 'start':
        return await startBatchJob(supabase)
      case 'cancel':
        return await cancelJob(supabase, jobId)
      case 'status':
        return await getJobStatus(supabase, jobId)
      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('Error in batch-rss-fetcher:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function startBatchJob(supabase: any) {
  console.log('Starting new batch RSS job...')

  // Get all active RSS sources
  const { data: sources, error: sourcesError } = await supabase
    .from('rss_sources')
    .select('*')
    .eq('is_active', true)

  if (sourcesError) {
    throw new Error(`Failed to fetch RSS sources: ${sourcesError.message}`)
  }

  if (!sources || sources.length === 0) {
    throw new Error('No active RSS sources found')
  }

  // Create a new batch job
  const { data: job, error: jobError } = await supabase
    .from('feed_batch_jobs')
    .insert({
      job_type: 'rss_fetch',
      status: 'running',
      started_at: new Date().toISOString(),
      total_items: sources.length,
      processed_items: 0,
      successful_items: 0,
      failed_items: 0,
      config: { sources: sources.map(s => s.id) }
    })
    .select()
    .single()

  if (jobError) {
    throw new Error(`Failed to create batch job: ${jobError.message}`)
  }

  console.log(`Created job ${job.id} for ${sources.length} RSS sources`)

  // Start processing in background
  processRssSources(supabase, job.id, sources)

  return new Response(
    JSON.stringify({ jobId: job.id, message: 'Batch job started' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function processRssSources(supabase: any, jobId: string, sources: RssSource[]) {
  console.log(`Processing ${sources.length} RSS sources for job ${jobId}`)

  for (const [index, source] of sources.entries()) {
    try {
      console.log(`Processing source ${index + 1}/${sources.length}: ${source.name}`)

      // Fetch RSS feed
      const items = await fetchRssFeed(source.url)
      console.log(`Fetched ${items.length} items from ${source.name}`)

      // Store items in database
      if (items.length > 0) {
        const itemsToInsert = items.map(item => ({
          source_id: source.id,
          title: item.title,
          description: item.description,
          link: item.link,
          pub_date: item.pubDate ? new Date(item.pubDate).toISOString() : null,
          guid: item.guid,
          author: item.author,
          categories: item.categories,
          content: item.content
        }))

        const { error: insertError } = await supabase
          .from('rss_feed_items')
          .upsert(itemsToInsert, { 
            onConflict: 'source_id,guid',
            ignoreDuplicates: true 
          })

        if (insertError) {
          console.error(`Error inserting items for ${source.name}:`, insertError)
          await updateJobProgress(supabase, jobId, index + 1, 0, 1)
        } else {
          console.log(`Successfully stored ${items.length} items for ${source.name}`)
          await updateJobProgress(supabase, jobId, index + 1, 1, 0)
        }
      } else {
        console.log(`No items found for ${source.name}`)
        await updateJobProgress(supabase, jobId, index + 1, 1, 0)
      }

      // Delay between requests to be respectful
      if (index < sources.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    } catch (error) {
      console.error(`Error processing source ${source.name}:`, error)
      await updateJobProgress(supabase, jobId, index + 1, 0, 1)
    }
  }

  // Mark job as completed
  await supabase
    .from('feed_batch_jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', jobId)

  console.log(`Completed job ${jobId}`)
}

async function updateJobProgress(supabase: any, jobId: string, processed: number, successful: number, failed: number) {
  try {
    // Get current values first
    const { data: currentJob } = await supabase
      .from('feed_batch_jobs')
      .select('successful_items, failed_items')
      .eq('id', jobId)
      .single()

    if (currentJob) {
      const { error } = await supabase
        .from('feed_batch_jobs')
        .update({
          processed_items: processed,
          successful_items: currentJob.successful_items + successful,
          failed_items: currentJob.failed_items + failed,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)

      if (error) {
        console.error('Error updating job progress:', error)
      }
    }
  } catch (error) {
    console.error('Error in updateJobProgress:', error)
  }
}

async function fetchRssFeed(url: string): Promise<RssItem[]> {
  console.log(`Fetching RSS feed from: ${url}`)

  const proxies = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://cors-anywhere.herokuapp.com/${url}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
  ]

  let lastError: Error | null = null

  for (const proxyUrl of proxies) {
    try {
      console.log(`Trying proxy: ${proxyUrl}`)
      
      const response = await fetch(proxyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RiksdagskollenBot/1.0)',
          'Accept': 'application/rss+xml, application/xml, text/xml'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      let xmlContent: string

      if (proxyUrl.includes('allorigins.win')) {
        const data = await response.json()
        if (data.status?.http_code && data.status.http_code !== 200) {
          throw new Error(`Proxy returned HTTP ${data.status.http_code}`)
        }
        xmlContent = data.contents
      } else if (proxyUrl.includes('codetabs.com')) {
        const data = await response.json()
        xmlContent = data.data || data.content || JSON.stringify(data)
      } else {
        xmlContent = await response.text()
      }

      if (!xmlContent || xmlContent.length < 100) {
        throw new Error('Received empty or too short response')
      }

      console.log(`Received ${xmlContent.length} characters from ${proxyUrl}`)

      // Parse XML using our custom parser
      const items = parseXML(xmlContent)

      console.log(`Successfully parsed ${items.length} items from XML`)
      return items

    } catch (error) {
      console.error(`Failed with proxy ${proxyUrl}:`, error)
      lastError = error as Error
      continue
    }
  }

  throw new Error(`Failed to fetch RSS feed from ${url} using all available proxies. Last error: ${lastError?.message}`)
}

async function cancelJob(supabase: any, jobId: string) {
  const { error } = await supabase
    .from('feed_batch_jobs')
    .update({
      status: 'cancelled',
      completed_at: new Date().toISOString()
    })
    .eq('id', jobId)

  if (error) {
    throw new Error(`Failed to cancel job: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ message: 'Job cancelled' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getJobStatus(supabase: any, jobId: string) {
  const { data: job, error } = await supabase
    .from('feed_batch_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (error) {
    throw new Error(`Failed to get job status: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ job }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
