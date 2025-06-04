
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

interface MemberData {
  intressent_id: string;
  fornamn: string;
  efternamn: string;
  parti: string;
  valkrets?: string;
  kon?: string;
  fodd_ar?: number;
  status?: string;
}

interface CalendarEvent {
  id: string;
  datum: string;
  tid?: string;
  aktivitet: string;
  typ?: string;
  plats?: string;
  organ?: string;
  sekretess?: string;
}

const BASE_URL = 'https://data.riksdagen.se'

async function fetchWithRetry(url: string, maxRetries = 3): Promise<any> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      console.log(`📡 Fetching: ${url} (attempt ${i + 1}/${maxRetries + 1})`)
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log(`✅ Fetch successful, data keys: ${Object.keys(data)}`)
      return data
    } catch (error) {
      console.error(`❌ Fetch attempt ${i + 1} failed:`, error)
      if (i === maxRetries) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}

async function fetchDocumentsPaginated(year: number, page = 1): Promise<{ documents: RiksdagDocument[], hasMore: boolean }> {
  const fromDate = `${year}-01-01`
  const toDate = year === new Date().getFullYear() ? 
    new Date().toISOString().split('T')[0] : 
    `${year}-12-31`
  
  const pageSize = 1000
  const url = `${BASE_URL}/dokumentlista/?utformat=json&from=${fromDate}&tom=${toDate}&sz=${pageSize}&p=${page}&sort=datum&sortorder=desc`
  
  try {
    console.log(`📅 Fetching documents for year ${year}, page ${page}`)
    const data = await fetchWithRetry(url)
    
    if (!data.dokumentlista) {
      console.warn(`⚠️ No dokumentlista found in response for year ${year}, page ${page}`)
      return { documents: [], hasMore: false }
    }
    
    const documents = data.dokumentlista.dokument || []
    const hasMore = documents.length === pageSize
    
    console.log(`📄 Year ${year}, page ${page}: Found ${documents.length} documents, hasMore: ${hasMore}`)
    
    return { documents, hasMore }
  } catch (error) {
    console.error(`💥 Error fetching documents for year ${year}, page ${page}:`, error)
    return { documents: [], hasMore: false }
  }
}

async function fetchAllDocumentsForYear(year: number): Promise<RiksdagDocument[]> {
  let allDocuments: RiksdagDocument[] = []
  let page = 1
  let hasMore = true
  
  while (hasMore) {
    const { documents, hasMore: morePages } = await fetchDocumentsPaginated(year, page)
    allDocuments = [...allDocuments, ...documents]
    hasMore = morePages
    page++
    
    if (hasMore) {
      console.log(`⏱️ Waiting 500ms before next page...`)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  console.log(`📚 Year ${year}: Total ${allDocuments.length} documents fetched across ${page - 1} pages`)
  return allDocuments
}

async function storeDocuments(documents: RiksdagDocument[]): Promise<number> {
  if (documents.length === 0) {
    console.log(`⚠️ No documents to store`)
    return 0
  }
  
  console.log(`💾 Starting to store ${documents.length} documents`)
  let stored = 0
  const batchSize = 50
  
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize)
    console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(documents.length/batchSize)} (${batch.length} documents)`)
    
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
        source: 'riksdag_api',
        batch_info: `${Math.floor(i/batchSize) + 1}/${Math.ceil(documents.length/batchSize)}`
      },
      updated_at: new Date().toISOString()
    }))
    
    try {
      console.log(`🔄 Upserting batch to database...`)
      const { data, error } = await supabase
        .from('document_data')
        .upsert(documentsToStore, { 
          onConflict: 'document_id',
          ignoreDuplicates: false 
        })
        .select('id')
      
      if (error) {
        console.error(`❌ Batch insert error:`, error)
      } else {
        const batchStored = data?.length || 0
        stored += batchStored
        console.log(`✅ Batch success: ${batchStored}/${batch.length} documents stored (total: ${stored})`)
      }
    } catch (error) {
      console.error(`💥 Database error in batch:`, error)
    }
    
    if (i + batchSize < documents.length) {
      console.log(`⏱️ Waiting 200ms before next batch...`)
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
  
  console.log(`🎉 Document storage complete: ${stored}/${documents.length} documents stored`)
  return stored
}

async function fetchCalendarData(): Promise<number> {
  console.log(`📅 === STARTING CALENDAR DATA SYNC ===`)
  
  try {
    const currentDate = new Date()
    const fromDate = new Date(currentDate.getFullYear() - 1, 0, 1).toISOString().split('T')[0]
    const toDate = new Date(currentDate.getFullYear() + 1, 11, 31).toISOString().split('T')[0]
    
    const url = `${BASE_URL}/aktivitetslista/?utformat=json&from=${fromDate}&tom=${toDate}&sz=1000`
    
    const data = await fetchWithRetry(url)
    
    if (!data.aktivitetslista?.aktivitet) {
      console.log(`⚠️ No calendar events found`)
      return 0
    }
    
    const events = Array.isArray(data.aktivitetslista.aktivitet) 
      ? data.aktivitetslista.aktivitet 
      : [data.aktivitetslista.aktivitet]
    
    console.log(`📅 Found ${events.length} calendar events`)
    
    let stored = 0
    const batchSize = 50
    
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize)
      
      const eventsToStore = batch.map((event: any) => ({
        event_id: event.id || `cal_${Date.now()}_${i}`,
        datum: event.datum || null,
        tid: event.tid || null,
        aktivitet: event.aktivitet || null,
        typ: event.typ || null,
        plats: event.plats || null,
        organ: event.organ || null,
        sekretess: event.sekretess || null,
        metadata: {
          fetched_at: new Date().toISOString(),
          source: 'riksdag_api'
        },
        updated_at: new Date().toISOString()
      }))
      
      try {
        const { data: insertData, error } = await supabase
          .from('calendar_data')
          .upsert(eventsToStore, { onConflict: 'event_id' })
          .select('id')
        
        if (!error) {
          stored += insertData?.length || 0
          console.log(`✅ Calendar batch stored: ${insertData?.length || 0}`)
        } else {
          console.error(`❌ Calendar batch error:`, error)
        }
      } catch (error) {
        console.error(`💥 Calendar database error:`, error)
      }
      
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    console.log(`🎉 Calendar sync complete: ${stored} events stored`)
    return stored
  } catch (error) {
    console.error(`💥 Calendar sync failed:`, error)
    return 0
  }
}

async function fetchMemberData(): Promise<number> {
  console.log(`👥 === STARTING MEMBER DATA SYNC ===`)
  
  try {
    const url = `${BASE_URL}/personlista/?utformat=json&sz=1000`
    const data = await fetchWithRetry(url)
    
    if (!data.personlista?.person) {
      console.log(`⚠️ No members found`)
      return 0
    }
    
    const members = Array.isArray(data.personlista.person) 
      ? data.personlista.person 
      : [data.personlista.person]
    
    console.log(`👥 Found ${members.length} members`)
    
    let stored = 0
    const batchSize = 50
    
    for (let i = 0; i < members.length; i += batchSize) {
      const batch = members.slice(i, i + batchSize)
      
      const membersToStore = batch.map((member: any) => ({
        member_id: member.intressent_id || member.id,
        first_name: member.fornamn || '',
        last_name: member.efternamn || '',
        party: member.parti || '',
        constituency: member.valkrets || null,
        gender: member.kon || null,
        birth_year: member.fodd_ar ? parseInt(member.fodd_ar) : null,
        riksdag_status: member.status || null,
        is_active: member.status === 'Tjänstgörande' || true,
        updated_at: new Date().toISOString()
      }))
      
      try {
        const { data: insertData, error } = await supabase
          .from('member_data')
          .upsert(membersToStore, { onConflict: 'member_id' })
          .select('id')
        
        if (!error) {
          stored += insertData?.length || 0
          console.log(`✅ Member batch stored: ${insertData?.length || 0}`)
        } else {
          console.error(`❌ Member batch error:`, error)
        }
      } catch (error) {
        console.error(`💥 Member database error:`, error)
      }
      
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    console.log(`🎉 Member sync complete: ${stored} members stored`)
    return stored
  } catch (error) {
    console.error(`💥 Member sync failed:`, error)
    return 0
  }
}

async function fetchSpeechData(): Promise<number> {
  console.log(`🎤 === STARTING SPEECH DATA SYNC ===`)
  
  try {
    // Hämta anföranden från senaste året
    const currentYear = new Date().getFullYear()
    const url = `${BASE_URL}/anforandelista/?utformat=json&rm=${currentYear}%2F${(currentYear + 1).toString().slice(-2)}&sz=1000`
    
    const data = await fetchWithRetry(url)
    
    if (!data.anforandelista?.anforande) {
      console.log(`⚠️ No speeches found`)
      return 0
    }
    
    const speeches = Array.isArray(data.anforandelista.anforande) 
      ? data.anforandelista.anforande 
      : [data.anforandelista.anforande]
    
    console.log(`🎤 Found ${speeches.length} speeches`)
    
    let stored = 0
    const batchSize = 30 // Mindre batch för anföranden pga större datamängd
    
    for (let i = 0; i < speeches.length; i += batchSize) {
      const batch = speeches.slice(i, i + batchSize)
      
      const speechesToStore = batch.map((speech: any) => ({
        speech_id: speech.anforande_id || `speech_${Date.now()}_${i}`,
        anforande_id: speech.anforande_id || null,
        intressent_id: speech.intressent_id || null,
        anforandedatum: speech.anforandedatum || null,
        anforandetext: speech.anforandetext?.substring(0, 50000) || null, // Begränsa textstorlek
        anforandetyp: speech.anforandetyp || null,
        rel_dok_titel: speech.rel_dok_titel || null,
        talare: speech.talare || null,
        party: speech.parti || null,
        metadata: {
          fetched_at: new Date().toISOString(),
          source: 'riksdag_api'
        },
        updated_at: new Date().toISOString()
      }))
      
      try {
        const { data: insertData, error } = await supabase
          .from('speech_data')
          .upsert(speechesToStore, { onConflict: 'speech_id' })
          .select('id')
        
        if (!error) {
          stored += insertData?.length || 0
          console.log(`✅ Speech batch stored: ${insertData?.length || 0}`)
        } else {
          console.error(`❌ Speech batch error:`, error)
        }
      } catch (error) {
        console.error(`💥 Speech database error:`, error)
      }
      
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    console.log(`🎉 Speech sync complete: ${stored} speeches stored`)
    return stored
  } catch (error) {
    console.error(`💥 Speech sync failed:`, error)
    return 0
  }
}

async function fetchVoteData(): Promise<number> {
  console.log(`🗳️ === STARTING VOTE DATA SYNC ===`)
  
  try {
    const currentYear = new Date().getFullYear()
    const url = `${BASE_URL}/voteringlista/?utformat=json&rm=${currentYear}%2F${(currentYear + 1).toString().slice(-2)}&sz=1000`
    
    const data = await fetchWithRetry(url)
    
    if (!data.voteringlista?.votering) {
      console.log(`⚠️ No votes found`)
      return 0
    }
    
    const votes = Array.isArray(data.voteringlista.votering) 
      ? data.voteringlista.votering 
      : [data.voteringlista.votering]
    
    console.log(`🗳️ Found ${votes.length} votes`)
    
    let stored = 0
    const batchSize = 50
    
    for (let i = 0; i < votes.length; i += batchSize) {
      const batch = votes.slice(i, i + batchSize)
      
      const votesToStore = batch.map((vote: any) => ({
        vote_id: vote.votering_id || `vote_${Date.now()}_${i}`,
        hangar_id: vote.hangar_id || null,
        dok_id: vote.dok_id || null,
        beteckning: vote.beteckning || null,
        punkt: vote.punkt || null,
        votering: vote.votering || null,
        systemdatum: vote.systemdatum || null,
        rm: vote.rm || null,
        metadata: {
          fetched_at: new Date().toISOString(),
          source: 'riksdag_api'
        },
        updated_at: new Date().toISOString()
      }))
      
      try {
        const { data: insertData, error } = await supabase
          .from('vote_data')
          .upsert(votesToStore, { onConflict: 'vote_id' })
          .select('id')
        
        if (!error) {
          stored += insertData?.length || 0
          console.log(`✅ Vote batch stored: ${insertData?.length || 0}`)
        } else {
          console.error(`❌ Vote batch error:`, error)
        }
      } catch (error) {
        console.error(`💥 Vote database error:`, error)
      }
      
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    console.log(`🎉 Vote sync complete: ${stored} votes stored`)
    return stored
  } catch (error) {
    console.error(`💥 Vote sync failed:`, error)
    return 0
  }
}

async function updateSyncStatus(syncType: string, status: string, stats?: any, errorMessage?: string) {
  console.log(`📊 Updating sync status: ${syncType} - ${status}`)
  
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
  
  try {
    const { error } = await supabase.from('automated_sync_status').insert(syncData)
    if (error) {
      console.error(`❌ Error updating sync status:`, error)
    } else {
      console.log(`✅ Sync status updated successfully`)
    }
  } catch (error) {
    console.error(`💥 Exception updating sync status:`, error)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const body = await req.json().catch(() => ({}))
    const manualTrigger = body.manual_trigger || false
    const triggeredBy = body.triggered_by || 'cron'
    const debugMode = body.debug_mode || false
    
    console.log(`🚀 Starting comprehensive data sync`)
    console.log(`📋 Trigger info: manual=${manualTrigger}, by=${triggeredBy}, debug=${debugMode}`)
    
    await updateSyncStatus('comprehensive', 'running')
    
    const startTime = Date.now()
    const stats = {
      documents_stored: 0,
      members_stored: 0,
      speeches_stored: 0,
      votes_stored: 0,
      calendar_events_stored: 0,
      years_processed: 0,
      errors: []
    }
    
    try {
      // Test database connection
      console.log(`🔍 Testing database connection...`)
      const { count, error } = await supabase
        .from('document_data')
        .select('*', { count: 'exact', head: true })
      
      if (error) throw error
      console.log(`✅ Database connection OK. Current document count: ${count}`)
      
      // 1. DOCUMENTS - Förbättrad för att hämta alla sidor
      console.log(`📄 === STARTING DOCUMENT SYNC ===`)
      const currentYear = new Date().getFullYear()
      const startYear = 2020 // Utökat från 2022 för mer data
      
      for (let year = startYear; year <= currentYear; year++) {
        try {
          console.log(`\n📅 === PROCESSING YEAR ${year} ===`)
          const documents = await fetchAllDocumentsForYear(year)
          
          if (documents.length > 0) {
            console.log(`📄 Year ${year}: Retrieved ${documents.length} documents, starting storage...`)
            const stored = await storeDocuments(documents)
            stats.documents_stored += stored
            console.log(`✅ Year ${year}: Successfully stored ${stored}/${documents.length} documents`)
            
            if (stored < documents.length) {
              const errorMsg = `Year ${year}: Only ${stored}/${documents.length} documents stored`
              stats.errors.push(errorMsg)
              console.warn(`⚠️ ${errorMsg}`)
            }
          } else {
            console.log(`⚠️ Year ${year}: No documents retrieved`)
          }
          
          stats.years_processed++
          
          // Vänta mellan år
          if (year < currentYear) {
            console.log(`⏱️ Waiting 1 second before next year...`)
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        } catch (error) {
          const errorMsg = `Error processing year ${year}: ${error.message}`
          console.error(`💥 ${errorMsg}`)
          stats.errors.push(errorMsg)
        }
      }
      
      // 2. CALENDAR DATA
      console.log(`\n📅 === MOVING TO CALENDAR DATA ===`)
      try {
        stats.calendar_events_stored = await fetchCalendarData()
      } catch (error) {
        const errorMsg = `Calendar sync error: ${error.message}`
        console.error(`💥 ${errorMsg}`)
        stats.errors.push(errorMsg)
      }
      
      // 3. MEMBER DATA
      console.log(`\n👥 === MOVING TO MEMBER DATA ===`)
      try {
        stats.members_stored = await fetchMemberData()
      } catch (error) {
        const errorMsg = `Member sync error: ${error.message}`
        console.error(`💥 ${errorMsg}`)
        stats.errors.push(errorMsg)
      }
      
      // 4. SPEECH DATA
      console.log(`\n🎤 === MOVING TO SPEECH DATA ===`)
      try {
        stats.speeches_stored = await fetchSpeechData()
      } catch (error) {
        const errorMsg = `Speech sync error: ${error.message}`
        console.error(`💥 ${errorMsg}`)
        stats.errors.push(errorMsg)
      }
      
      // 5. VOTE DATA
      console.log(`\n🗳️ === MOVING TO VOTE DATA ===`)
      try {
        stats.votes_stored = await fetchVoteData()
      } catch (error) {
        const errorMsg = `Vote sync error: ${error.message}`
        console.error(`💥 ${errorMsg}`)
        stats.errors.push(errorMsg)
      }
      
      const duration = Date.now() - startTime
      stats.sync_duration_ms = duration
      
      console.log(`\n🎯 === COMPREHENSIVE SYNC COMPLETED ===`)
      console.log(`⏱️ Duration: ${duration}ms`)
      console.log(`📊 Final stats:`, stats)
      
      // Final database count check
      try {
        const { count: finalDocCount } = await supabase
          .from('document_data')
          .select('*', { count: 'exact', head: true })
        console.log(`📈 Final document count in database: ${finalDocCount}`)
        stats.final_document_count = finalDocCount
        
        const { count: finalCalCount } = await supabase
          .from('calendar_data')
          .select('*', { count: 'exact', head: true })
        console.log(`📅 Final calendar count in database: ${finalCalCount}`)
        
        const { count: finalMemberCount } = await supabase
          .from('member_data')
          .select('*', { count: 'exact', head: true })
        console.log(`👥 Final member count in database: ${finalMemberCount}`)
      } catch (error) {
        console.error(`❌ Error checking final counts:`, error)
      }
      
      await updateSyncStatus('comprehensive', 'completed', stats)
      
      const response = {
        success: true,
        message: 'Comprehensive data sync completed successfully',
        stats,
        duration: `${duration}ms`,
        triggered_by: triggeredBy,
        debug_info: debugMode ? {
          start_time: new Date(startTime).toISOString(),
          end_time: new Date().toISOString(),
          years_range: `${startYear}-${currentYear}`,
          data_types_processed: ['documents', 'calendar', 'members', 'speeches', 'votes']
        } : undefined
      }
      
      console.log(`📤 Sending response:`, response)
      
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
      
    } catch (error) {
      console.error('💥 Data sync process failed:', error)
      throw error
    }
    
  } catch (error) {
    console.error('💥 Comprehensive sync failed:', error)
    console.error('Error stack:', error.stack)
    
    await updateSyncStatus('comprehensive', 'failed', null, error.message)
    
    const errorResponse = {
      success: false,
      error: error.message,
      message: 'Comprehensive data sync failed',
      error_details: {
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    }
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
