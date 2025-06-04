
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface RiksdagDocument {
  id: string;
  titel: string;
  beteckning: string;
  datum: string;
  typ: string;
  organ: string;
  intressent_id?: string;
  hangar_id?: string;
  dokument_url_text?: string;
  dokument_url_html?: string;
  dokumentstatus?: string;
  publicerad?: string;
  rm?: string;
}

interface RiksdagMember {
  intressent_id: string;
  tilltalsnamn: string;
  efternamn: string;
  parti: string;
  valkrets: string;
  kon: string;
  fodd_ar: string;
  bild_url_192?: string;
}

interface RiksdagSpeech {
  anforande_id: string;
  intressent_id: string;
  namn: string;
  parti: string;
  anforandedatum: string;
  anforandetext: string;
  rel_dok_id: string;
  rel_dok_titel?: string;
}

interface RiksdagVote {
  votering_id: string;
  hangar_id: string;
  rm: string;
  beteckning: string;
  punkt: string;
  namn: string;
  parti: string;
  rost: string;
  intressent_id: string;
  systemdatum: string;
}

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
      
      return await response.json()
    } catch (error) {
      console.error(`Fetch attempt ${i + 1} failed:`, error)
      if (i === maxRetries) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}

async function fetchDocumentsFromYear(year: number): Promise<RiksdagDocument[]> {
  const fromDate = `${year}-01-01`
  const toDate = year === new Date().getFullYear() ? 
    new Date().toISOString().split('T')[0] : 
    `${year}-12-31`
  
  const url = `${BASE_URL}/dokumentlista/?utformat=json&from=${fromDate}&tom=${toDate}&sz=1000&sort=datum&sortorder=desc`
  
  try {
    const data = await fetchWithRetry(url)
    const documents = data.dokumentlista?.dokument || []
    console.log(`Fetched ${documents.length} documents for year ${year}`)
    return documents
  } catch (error) {
    console.error(`Error fetching documents for year ${year}:`, error)
    return []
  }
}

async function storeDocuments(documents: RiksdagDocument[]): Promise<number> {
  if (documents.length === 0) return 0
  
  let stored = 0
  const batchSize = 100
  
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize)
    
    const documentsToStore = batch.map(doc => ({
      document_id: doc.id,
      titel: doc.titel?.substring(0, 500) || null,
      beteckning: doc.beteckning?.substring(0, 100) || null,
      datum: doc.datum || null,
      typ: doc.typ?.substring(0, 50) || null,
      organ: doc.organ?.substring(0, 100) || null,
      intressent_id: doc.intressent_id || null,
      hangar_id: doc.hangar_id || null,
      document_url_text: doc.dokument_url_text || null,
      document_url_html: doc.dokument_url_html || null,
      dokumentstatus: doc.dokumentstatus || null,
      publicerad: doc.publicerad || null,
      rm: doc.rm || null,
      summary: null,
      content_preview: null,
      metadata: { 
        fetched_at: new Date().toISOString(),
        source: 'riksdag_api'
      },
      updated_at: new Date().toISOString()
    }))
    
    try {
      const { data, error } = await supabase
        .from('document_data')
        .upsert(documentsToStore, { 
          onConflict: 'document_id',
          ignoreDuplicates: false 
        })
        .select('id')
      
      if (error) {
        console.error('Batch insert error:', error)
      } else {
        const batchStored = data?.length || 0
        stored += batchStored
        console.log(`Stored batch: ${batchStored}/${batch.length} documents`)
      }
    } catch (error) {
      console.error('Database error in batch:', error)
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return stored
}

async function fetchMembers(): Promise<RiksdagMember[]> {
  const url = `${BASE_URL}/personlista/?utformat=json`
  
  try {
    const data = await fetchWithRetry(url)
    const members = data.personlista?.person || []
    console.log(`Fetched ${members.length} members`)
    return members.filter((member: RiksdagMember) => {
      // Filter active members
      return member.tilltalsnamn && member.efternamn && member.parti
    })
  } catch (error) {
    console.error('Error fetching members:', error)
    return []
  }
}

async function storeMembers(members: RiksdagMember[]): Promise<number> {
  if (members.length === 0) return 0
  
  const membersToStore = members.map(member => ({
    member_id: member.intressent_id,
    first_name: member.tilltalsnamn?.substring(0, 100) || '',
    last_name: member.efternamn?.substring(0, 100) || '',
    party: member.parti?.substring(0, 10) || '',
    constituency: member.valkrets?.substring(0, 100) || null,
    gender: member.kon?.substring(0, 10) || null,
    birth_year: member.fodd_ar ? parseInt(member.fodd_ar) : null,
    image_urls: member.bild_url_192 ? { url_192: member.bild_url_192 } : null,
    is_active: true,
    updated_at: new Date().toISOString()
  }))
  
  try {
    const { data, error } = await supabase
      .from('member_data')
      .upsert(membersToStore, { 
        onConflict: 'member_id',
        ignoreDuplicates: false 
      })
      .select('id')
    
    if (error) {
      console.error('Members insert error:', error)
      return 0
    }
    
    return data?.length || 0
  } catch (error) {
    console.error('Database error storing members:', error)
    return 0
  }
}

async function fetchRecentSpeeches(): Promise<RiksdagSpeech[]> {
  const currentYear = new Date().getFullYear()
  const url = `${BASE_URL}/anforandelista/?utformat=json&rm=${currentYear}%2F${(currentYear + 1).toString().slice(-2)}&sz=500`
  
  try {
    const data = await fetchWithRetry(url)
    const speeches = data.anforandelista?.anforande || []
    console.log(`Fetched ${speeches.length} recent speeches`)
    return speeches
  } catch (error) {
    console.error('Error fetching speeches:', error)
    return []
  }
}

async function storeSpeeches(speeches: RiksdagSpeech[]): Promise<number> {
  if (speeches.length === 0) return 0
  
  const speechesToStore = speeches.map(speech => ({
    speech_id: speech.anforande_id,
    anforande_id: speech.anforande_id,
    intressent_id: speech.intressent_id || null,
    namn: speech.namn?.substring(0, 200) || null,
    party: speech.parti?.substring(0, 10) || null,
    anforandedatum: speech.anforandedatum || null,
    anforandetext: speech.anforandetext || null,
    rel_dok_id: speech.rel_dok_id || null,
    rel_dok_titel: speech.rel_dok_titel?.substring(0, 500) || null,
    word_count: speech.anforandetext ? speech.anforandetext.split(/\s+/).length : null,
    updated_at: new Date().toISOString()
  }))
  
  try {
    const { data, error } = await supabase
      .from('speech_data')
      .upsert(speechesToStore, { 
        onConflict: 'speech_id',
        ignoreDuplicates: false 
      })
      .select('id')
    
    if (error) {
      console.error('Speeches insert error:', error)
      return 0
    }
    
    return data?.length || 0
  } catch (error) {
    console.error('Database error storing speeches:', error)
    return 0
  }
}

async function fetchRecentVotes(): Promise<RiksdagVote[]> {
  const currentYear = new Date().getFullYear()
  const url = `${BASE_URL}/voteringlista/?utformat=json&rm=${currentYear}%2F${(currentYear + 1).toString().slice(-2)}&sz=500&gruppering=votering_id`
  
  try {
    const data = await fetchWithRetry(url)
    const votes = data.voteringlista?.votering || []
    console.log(`Fetched ${votes.length} recent votes`)
    return votes
  } catch (error) {
    console.error('Error fetching votes:', error)
    return []
  }
}

async function storeVotes(votes: RiksdagVote[]): Promise<number> {
  if (votes.length === 0) return 0
  
  // Group votes by votering_id
  const voteGroups = new Map<string, RiksdagVote[]>()
  votes.forEach(vote => {
    const key = vote.votering_id
    if (!voteGroups.has(key)) {
      voteGroups.set(key, [])
    }
    voteGroups.get(key)!.push(vote)
  })
  
  const votesToStore = Array.from(voteGroups.entries()).map(([voteId, voteList]) => {
    const firstVote = voteList[0]
    
    // Calculate statistics
    const stats = {
      ja: voteList.filter(v => v.rost === 'Ja').length,
      nej: voteList.filter(v => v.rost === 'Nej').length,
      avstar: voteList.filter(v => v.rost === 'Avstår').length,
      franvarande: voteList.filter(v => v.rost === 'Frånvarande').length
    }
    
    // Party breakdown
    const partyBreakdown: { [key: string]: any } = {}
    voteList.forEach(vote => {
      if (!partyBreakdown[vote.parti]) {
        partyBreakdown[vote.parti] = { ja: 0, nej: 0, avstar: 0, franvarande: 0 }
      }
      
      switch (vote.rost) {
        case 'Ja': partyBreakdown[vote.parti].ja++; break
        case 'Nej': partyBreakdown[vote.parti].nej++; break
        case 'Avstår': partyBreakdown[vote.parti].avstar++; break
        case 'Frånvarande': partyBreakdown[vote.parti].franvarande++; break
      }
    })
    
    return {
      vote_id: voteId,
      hangar_id: firstVote.hangar_id || null,
      rm: firstVote.rm || null,
      beteckning: firstVote.beteckning?.substring(0, 100) || null,
      punkt: firstVote.punkt?.substring(0, 200) || null,
      systemdatum: firstVote.systemdatum || null,
      vote_statistics: stats,
      party_breakdown: partyBreakdown,
      vote_results: voteList.map(v => ({
        intressent_id: v.intressent_id,
        namn: v.namn,
        parti: v.parti,
        rost: v.rost
      })),
      updated_at: new Date().toISOString()
    }
  })
  
  try {
    const { data, error } = await supabase
      .from('vote_data')
      .upsert(votesToStore, { 
        onConflict: 'vote_id',
        ignoreDuplicates: false 
      })
      .select('id')
    
    if (error) {
      console.error('Votes insert error:', error)
      return 0
    }
    
    return data?.length || 0
  } catch (error) {
    console.error('Database error storing votes:', error)
    return 0
  }
}

async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  const today = new Date()
  const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
  
  const fromDate = today.toISOString().split('T')[0]
  const toDate = twoWeeksFromNow.toISOString().split('T')[0]
  
  const url = `${BASE_URL}/kalender/?utformat=json&from=${fromDate}&tom=${toDate}&sz=200`
  
  try {
    const data = await fetchWithRetry(url)
    const events = data.kalenderlista?.kalender || []
    console.log(`Fetched ${events.length} calendar events`)
    return events
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
    metadata: {
      fetched_at: new Date().toISOString(),
      source: 'riksdag_api'
    },
    updated_at: new Date().toISOString()
  }))
  
  try {
    const { data, error } = await supabase
      .from('calendar_data')
      .upsert(eventsToStore, { 
        onConflict: 'event_id',
        ignoreDuplicates: false 
      })
      .select('id')
    
    if (error) {
      console.error('Calendar events insert error:', error)
      return 0
    }
    
    return data?.length || 0
  } catch (error) {
    console.error('Database error storing calendar events:', error)
    return 0
  }
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
    const triggeredBy = body.triggered_by || 'cron'
    
    console.log(`🚀 Starting comprehensive data sync (triggered by: ${triggeredBy})`)
    
    await updateSyncStatus('comprehensive', 'running')
    
    const startTime = Date.now()
    const stats = {
      documents_stored: 0,
      members_stored: 0,
      speeches_stored: 0,
      votes_stored: 0,
      calendar_events_stored: 0,
      years_processed: 0
    }
    
    // Fetch documents from 2022 onwards
    const currentYear = new Date().getFullYear()
    const startYear = 2022
    
    console.log(`📄 Fetching documents from ${startYear} to ${currentYear}`)
    
    for (let year = startYear; year <= currentYear; year++) {
      try {
        console.log(`Processing year ${year}...`)
        const documents = await fetchDocumentsFromYear(year)
        
        if (documents.length > 0) {
          const stored = await storeDocuments(documents)
          stats.documents_stored += stored
          console.log(`✅ Year ${year}: ${stored}/${documents.length} documents stored`)
        }
        
        stats.years_processed++
        
        // Small delay between years to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`Error processing year ${year}:`, error)
      }
    }
    
    // Fetch and store members
    console.log(`👥 Fetching members...`)
    try {
      const members = await fetchMembers()
      stats.members_stored = await storeMembers(members)
      console.log(`✅ Members: ${stats.members_stored} stored`)
    } catch (error) {
      console.error('Error processing members:', error)
    }
    
    // Fetch and store recent speeches
    console.log(`🎤 Fetching recent speeches...`)
    try {
      const speeches = await fetchRecentSpeeches()
      stats.speeches_stored = await storeSpeeches(speeches)
      console.log(`✅ Speeches: ${stats.speeches_stored} stored`)
    } catch (error) {
      console.error('Error processing speeches:', error)
    }
    
    // Fetch and store recent votes
    console.log(`🗳️ Fetching recent votes...`)
    try {
      const votes = await fetchRecentVotes()
      stats.votes_stored = await storeVotes(votes)
      console.log(`✅ Votes: ${stats.votes_stored} stored`)
    } catch (error) {
      console.error('Error processing votes:', error)
    }
    
    // Fetch and store calendar events
    console.log(`📅 Fetching calendar events...`)
    try {
      const events = await fetchCalendarEvents()
      stats.calendar_events_stored = await storeCalendarEvents(events)
      console.log(`✅ Calendar events: ${stats.calendar_events_stored} stored`)
    } catch (error) {
      console.error('Error processing calendar events:', error)
    }
    
    const duration = Date.now() - startTime
    stats.sync_duration_ms = duration
    
    await updateSyncStatus('comprehensive', 'completed', stats)
    
    console.log(`🎉 Comprehensive sync completed in ${duration}ms`)
    console.log('Final stats:', stats)
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Comprehensive data sync completed successfully',
      stats,
      duration: `${duration}ms`,
      triggered_by: triggeredBy
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('💥 Comprehensive sync failed:', error)
    
    await updateSyncStatus('comprehensive', 'failed', null, error.message)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Comprehensive data sync failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
