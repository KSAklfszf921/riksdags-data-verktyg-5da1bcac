
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
  const { error } = await supabase
    .from('feed_batch_jobs')
    .update({
      processed_items: processed,
      successful_items: supabase.rpc('increment_field', { 
        table_name: 'feed_batch_jobs',
        field_name: 'successful_items',
        increment_by: successful,
        condition: `id = '${jobId}'`
      }),
      failed_items: supabase.rpc('increment_field', {
        table_name: 'feed_batch_jobs', 
        field_name: 'failed_items',
        increment_by: failed,
        condition: `id = '${jobId}'`
      }),
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId)

  if (error) {
    console.error('Error updating job progress:', error)
  }
}

async function fetchRssFeed(url: string): Promise<RssItem[]> {
  console.log(`Fetching RSS feed from: ${url}`)

  const proxies = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`
  ]

  for (const proxyUrl of proxies) {
    try {
      console.log(`Trying proxy: ${proxyUrl}`)
      
      const response = await fetch(proxyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RiksdagskollenBot/1.0)'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      let xmlContent: string

      if (proxyUrl.includes('allorigins.win')) {
        const data = await response.json()
        xmlContent = data.contents
      } else {
        xmlContent = await response.text()
      }

      console.log(`Received ${xmlContent.length} characters from ${proxyUrl}`)

      // Parse XML
      const parser = new DOMParser()
      const doc = parser.parseFromString(xmlContent, 'application/xml')

      const items: RssItem[] = []
      const itemElements = doc.querySelectorAll('item')

      itemElements.forEach(item => {
        const title = item.querySelector('title')?.textContent?.trim()
        const link = item.querySelector('link')?.textContent?.trim()
        
        if (title && link) {
          items.push({
            title,
            link,
            description: item.querySelector('description')?.textContent?.trim(),
            pubDate: item.querySelector('pubDate')?.textContent?.trim(),
            guid: item.querySelector('guid')?.textContent?.trim(),
            author: item.querySelector('author')?.textContent?.trim(),
            categories: Array.from(item.querySelectorAll('category')).map(cat => cat.textContent?.trim()).filter(Boolean) as string[],
            content: item.querySelector('content\\:encoded, content')?.textContent?.trim()
          })
        }
      })

      console.log(`Successfully parsed ${items.length} items from XML`)
      return items

    } catch (error) {
      console.error(`Failed with proxy ${proxyUrl}:`, error)
      continue
    }
  }

  throw new Error(`Failed to fetch RSS feed from ${url} using all available proxies`)
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
