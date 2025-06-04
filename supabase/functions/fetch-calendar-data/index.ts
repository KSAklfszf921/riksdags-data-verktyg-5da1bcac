
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface CalendarEvent {
  id: string;
  datum: string;
  tid: string;
  plats: string;
  aktivitet: string;
  typ: string;
  organ: string;
  summary: string;
  status: string;
  sekretess?: string;
  url?: string;
}

const BASE_URL = 'https://data.riksdagen.se'

async function fetchWithRetry(url: string, maxRetries = 3): Promise<any> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      console.log(`Fetching: ${url} (attempt ${i + 1}/${maxRetries + 1})`)
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Response is not JSON:', contentType)
        return { kalenderlista: { kalender: [] } }
      }
      
      return await response.json()
    } catch (error) {
      console.error(`Fetch attempt ${i + 1} failed:`, error)
      if (i === maxRetries) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}

async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  const today = new Date()
  const threeMonthsFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)
  
  const fromDate = today.toISOString().split('T')[0]
  const toDate = threeMonthsFromNow.toISOString().split('T')[0]
  
  const url = `${BASE_URL}/kalender/?utformat=json&from=${fromDate}&tom=${toDate}&sz=500`
  
  try {
    const data = await fetchWithRetry(url)
    const events = data.kalenderlista?.kalender || []
    console.log(`Fetched ${events.length} calendar events`)
    
    // Filter and validate events
    return events.filter((event: CalendarEvent) => {
      return event.id && event.datum && event.summary
    })
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return []
  }
}

async function storeCalendarEvents(events: CalendarEvent[]): Promise<number> {
  if (events.length === 0) return 0
  
  const eventsToStore = events.map(event => ({
    event_id: event.id,
    datum: event.datum || null,
    tid: event.tid || null,
    plats: event.plats?.substring(0, 200) || null,
    aktivitet: event.aktivitet?.substring(0, 300) || null,
    typ: event.typ?.substring(0, 100) || null,
    organ: event.organ?.substring(0, 100) || null,
    summary: event.summary?.substring(0, 500) || null,
    status: event.status || null,
    sekretess: event.sekretess || null,
    url: event.url || null,
    metadata: {
      fetched_at: new Date().toISOString(),
      source: 'riksdag_calendar_api',
      sync_type: 'calendar_backup'
    },
    updated_at: new Date().toISOString()
  }))
  
  let stored = 0
  const batchSize = 50
  
  for (let i = 0; i < eventsToStore.length; i += batchSize) {
    const batch = eventsToStore.slice(i, i + batchSize)
    
    try {
      const { data, error } = await supabase
        .from('calendar_data')
        .upsert(batch, { 
          onConflict: 'event_id',
          ignoreDuplicates: false 
        })
        .select('id')
      
      if (error) {
        console.error('Calendar batch insert error:', error)
      } else {
        const batchStored = data?.length || 0
        stored += batchStored
        console.log(`Stored calendar batch: ${batchStored}/${batch.length} events`)
      }
    } catch (error) {
      console.error('Database error in calendar batch:', error)
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return stored
}

async function updateSyncStatus(syncType: string, status: string, stats?: any, errorMessage?: string) {
  const syncData = {
    sync_type: syncType,
    status,
    started_at: new Date().toISOString(),
    stats: stats || null,
    error_message: errorMessage || null
  }
  
  if (status === 'completed' || status === 'failed') {
    syncData.completed_at = new Date().toISOString()
  }
  
  await supabase.from('automated_sync_status').insert(syncData)
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const body = await req.json().catch(() => ({}))
    const manualTrigger = body.manual_trigger || false
    const testMode = body.test_mode || false
    const triggeredBy = body.triggered_by || 'cron'
    
    console.log(`📅 Starting calendar data sync (triggered by: ${triggeredBy}, test mode: ${testMode})`)
    
    await updateSyncStatus('calendar_backup', 'running')
    
    const startTime = Date.now()
    
    // Fetch calendar events
    const events = await fetchCalendarEvents()
    const stored = await storeCalendarEvents(events)
    
    const duration = Date.now() - startTime
    const stats = {
      calendar_events_fetched: events.length,
      calendar_events_stored: stored,
      sync_duration_ms: duration,
      test_mode: testMode
    }
    
    await updateSyncStatus('calendar_backup', 'completed', stats)
    
    console.log(`✅ Calendar sync completed in ${duration}ms`)
    console.log('Calendar stats:', stats)
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Calendar data sync completed successfully',
      stats,
      duration: `${duration}ms`,
      triggered_by: triggeredBy
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('💥 Calendar sync failed:', error)
    
    await updateSyncStatus('calendar_backup', 'failed', null, error.message)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Calendar data sync failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
