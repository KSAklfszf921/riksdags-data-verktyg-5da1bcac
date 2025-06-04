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
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'RiksdagDataSync/1.0'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        console.warn(`⚠️ Non-JSON response: ${contentType}`)
        const text = await response.text()
        console.log(`Response preview: ${text.substring(0, 200)}...`)
        
        if (contentType?.includes('text/html')) {
          throw new Error(`Endpoint returned HTML instead of JSON - possibly down or incorrect URL`)
        }
        
        return { error: 'Non-JSON response', content: text }
      }
      
      const data = await response.json()
      console.log(`✅ Fetch successful, data keys: ${Object.keys(data)}`)
      return data
    } catch (error) {
      console.error(`❌ Fetch attempt ${i + 1} failed:`, error)
      if (i === maxRetries) throw error
      
      const delay = 1000 * (i + 1)
      console.log(`⏱️ Waiting ${delay}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, delay))
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
    
    if (data.error) {
      console.warn(`⚠️ API error for year ${year}, page ${page}: ${data.error}`)
      return { documents: [], hasMore: false }
    }
    
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
  const maxPages = 50
  
  while (hasMore && page <= maxPages) {
    const { documents, hasMore: morePages } = await fetchDocumentsPaginated(year, page)
    allDocuments = [...allDocuments, ...documents]
    hasMore = morePages
    page++
    
    if (hasMore) {
      console.log(`⏱️ Waiting 500ms before next page...`)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  if (page > maxPages) {
    console.warn(`⚠️ Reached maximum page limit (${maxPages}) for year ${year}`)
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

async function fetchMemberData(): Promise<number> {
  console.log(`👥 === STARTING ENHANCED MEMBER DATA SYNC ===`)
  
  try {
    // Fetch ALL members (current and former)
    const url = `${BASE_URL}/personlista?utformat=json&sz=2000`
    const data = await fetchWithRetry(url)
    
    if (data.error) {
      console.warn(`⚠️ Member API error: ${data.error}`)
      return 0
    }
    
    if (!data.personlista?.person) {
      console.log(`⚠️ No members found`)
      return 0
    }
    
    const members = Array.isArray(data.personlista.person) 
      ? data.personlista.person 
      : [data.personlista.person]
    
    console.log(`👥 Found ${members.length} total members (current and former)`)
    
    // Process members with enhanced data including yearly statistics
    let stored = 0
    const batchSize = 25 // Smaller batches for enhanced processing
    
    for (let i = 0; i < members.length; i += batchSize) {
      const batch = members.slice(i, i + batchSize)
      console.log(`📦 Processing member batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(members.length/batchSize)}`)
      
      const enhancedMembers = []
      
      for (const member of batch) {
        try {
          // Fetch detailed assignments for each member
          const memberDetailUrl = `${BASE_URL}/person/${member.intressent_id}?utformat=json`
          let assignments = []
          let currentCommittees = []
          
          try {
            const memberDetailData = await fetchWithRetry(memberDetailUrl)
            if (memberDetailData.person?.personuppdrag?.uppdrag) {
              const uppdragList = Array.isArray(memberDetailData.person.personuppdrag.uppdrag)
                ? memberDetailData.person.personuppdrag.uppdrag
                : [memberDetailData.person.personuppdrag.uppdrag]
              
              assignments = uppdragList.map(uppdrag => ({
                organ_kod: uppdrag.organ_kod,
                roll: uppdrag.roll_kod,
                status: uppdrag.status,
                from: uppdrag.from,
                tom: uppdrag.tom,
                typ: uppdrag.typ,
                ordning: uppdrag.ordning,
                uppgift: uppdrag.uppgift
              }))
              
              // Extract current committees (active assignments)
              const currentDate = new Date()
              currentCommittees = assignments
                .filter(assignment => {
                  const endDate = assignment.tom ? new Date(assignment.tom) : null
                  return (!endDate || endDate > currentDate) && 
                         assignment.organ_kod !== 'Kammaren' && 
                         assignment.organ_kod !== 'kam'
                })
                .map(assignment => assignment.organ_kod)
            }
          } catch (error) {
            console.warn(`⚠️ Could not fetch details for member ${member.efternamn}:`, error.message)
          }
          
          // Calculate yearly document statistics
          const yearlyStats = await calculateYearlyStats(member.intressent_id)
          
          const enhancedMember = {
            member_id: member.intressent_id,
            first_name: member.tilltalsnamn || member.fornamn || '',
            last_name: member.efternamn || '',
            party: member.parti || '',
            constituency: member.valkrets || null,
            gender: member.kon || null,
            birth_year: member.fodd_ar ? parseInt(member.fodd_ar) : null,
            riksdag_status: member.status || null,
            is_active: member.status === 'Tjänstgörande' || member.status === null || member.status === '',
            current_committees: currentCommittees,
            assignments: assignments,
            committee_assignments: assignments,
            image_urls: {
              small: member.bild_url_80,
              medium: member.bild_url_192,
              large: member.bild_url_max
            },
            activity_data: {
              yearly_stats: yearlyStats,
              last_updated: new Date().toISOString()
            },
            updated_at: new Date().toISOString()
          }
          
          enhancedMembers.push(enhancedMember)
          
          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100))
          
        } catch (error) {
          console.error(`💥 Error processing member ${member.efternamn}:`, error)
        }
      }
      
      // Store enhanced member batch
      try {
        const { data: insertData, error } = await supabase
          .from('member_data')
          .upsert(enhancedMembers, { onConflict: 'member_id' })
          .select('id')
        
        if (!error) {
          stored += insertData?.length || 0
          console.log(`✅ Enhanced member batch stored: ${insertData?.length || 0}`)
        } else {
          console.error(`❌ Enhanced member batch error:`, error)
        }
      } catch (error) {
        console.error(`💥 Enhanced member database error:`, error)
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    console.log(`🎉 Enhanced member sync complete: ${stored} members stored with yearly statistics`)
    return stored
  } catch (error) {
    console.error(`💥 Enhanced member sync failed:`, error)
    return 0
  }
}

async function calculateYearlyStats(memberId: string): Promise<any> {
  const currentYear = new Date().getFullYear()
  const stats: any = {}
  
  try {
    // Calculate stats for current year and previous 2 years
    for (let year = currentYear - 2; year <= currentYear; year++) {
      const fromDate = `${year}-01-01`
      const toDate = year === currentYear ? 
        new Date().toISOString().split('T')[0] : 
        `${year}-12-31`
      
      const docUrl = `${BASE_URL}/dokumentlista/?utformat=json&f=intressent&id=${memberId}&from=${fromDate}&tom=${toDate}&sz=1000`
      
      try {
        const docData = await fetchWithRetry(docUrl)
        
        let documents = []
        if (docData.dokumentlista?.dokument) {
          documents = Array.isArray(docData.dokumentlista.dokument)
            ? docData.dokumentlista.dokument
            : [docData.dokumentlista.dokument]
        }
        
        stats[year] = {
          motions: documents.filter(doc => doc.typ === 'mot').length,
          interpellations: documents.filter(doc => doc.typ === 'ip').length,
          written_questions: documents.filter(doc => doc.typ === 'fr').length,
          total_documents: documents.length
        }
        
        console.log(`📊 Member ${memberId} year ${year}: ${stats[year].total_documents} documents`)
        
      } catch (error) {
        console.warn(`⚠️ Could not fetch documents for ${memberId} year ${year}:`, error.message)
        stats[year] = {
          motions: 0,
          interpellations: 0,
          written_questions: 0,
          total_documents: 0
        }
      }
      
      // Small delay between year requests
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    // Try to get speech count for current year
    try {
      const currentRiksdagYear = `${currentYear}/${(currentYear + 1).toString().slice(-2)}`
      const speechUrl = `${BASE_URL}/anforandelista?utformat=json&rm=${encodeURIComponent(currentRiksdagYear)}&f=intressent&id=${memberId}&sz=1000`
      
      const speechData = await fetchWithRetry(speechUrl)
      let speechCount = 0
      
      if (speechData.anforandelista?.anforande) {
        const speeches = Array.isArray(speechData.anforandelista.anforande)
          ? speechData.anforandelista.anforande
          : [speechData.anforandelista.anforande]
        speechCount = speeches.length
      }
      
      if (stats[currentYear]) {
        stats[currentYear].speeches = speechCount
      }
      
    } catch (error) {
      console.warn(`⚠️ Could not fetch speeches for ${memberId}:`, error.message)
    }
    
  } catch (error) {
    console.error(`💥 Error calculating yearly stats for ${memberId}:`, error)
  }
  
  return stats
}

async function fetchCalendarData(): Promise<number> {
  console.log(`📅 === STARTING CALENDAR DATA SYNC ===`)
  
  try {
    const currentDate = new Date()
    const fromDate = new Date(currentDate.getFullYear() - 1, 0, 1).toISOString().split('T')[0]
    const toDate = new Date(currentDate.getFullYear() + 1, 11, 31).toISOString().split('T')[0]
    
    const url = `${BASE_URL}/aktivitetslista?utformat=json&from=${fromDate}&tom=${toDate}&sz=1000`
    
    console.log(`📅 Fetching calendar data from ${fromDate} to ${toDate}`)
    const data = await fetchWithRetry(url)
    
    if (data.error) {
      console.warn(`⚠️ Calendar API error: ${data.error}`)
      return 0
    }
    
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
        event_id: event.id || `cal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

async function fetchSpeechData(): Promise<number> {
  console.log(`🎤 === STARTING SPEECH DATA SYNC ===`)
  
  try {
    const currentYear = new Date().getFullYear()
    const years = [
      `${currentYear}/${(currentYear + 1).toString().slice(-2)}`,
      `${currentYear - 1}/${currentYear.toString().slice(-2)}`,
      `${currentYear - 2}/${(currentYear - 1).toString().slice(-2)}`
    ]
    
    let totalStored = 0
    
    for (const year of years) {
      console.log(`🎤 Fetching speeches for Riksdag year: ${year}`)
      const url = `${BASE_URL}/anforandelista?utformat=json&rm=${encodeURIComponent(year)}&sz=1000`
      
      try {
        const data = await fetchWithRetry(url)
        
        if (data.error) {
          console.warn(`⚠️ Speech API error for ${year}: ${data.error}`)
          continue
        }
        
        if (!data.anforandelista?.anforande) {
          console.log(`⚠️ No speeches found for ${year}`)
          continue
        }
        
        const speeches = Array.isArray(data.anforandelista.anforande) 
          ? data.anforandelista.anforande 
          : [data.anforandelista.anforande]
        
        console.log(`🎤 Found ${speeches.length} speeches for ${year}`)
        
        let yearStored = 0
        const batchSize = 30
        
        for (let i = 0; i < speeches.length; i += batchSize) {
          const batch = speeches.slice(i, i + batchSize)
          
          const speechesToStore = batch.map((speech: any) => ({
            speech_id: speech.anforande_id || `speech_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            anforande_id: speech.anforande_id || null,
            intressent_id: speech.intressent_id || null,
            anforandedatum: speech.anforandedatum || null,
            anforandetext: speech.anforandetext?.substring(0, 50000) || null,
            anforandetyp: speech.anforandetyp || null,
            rel_dok_titel: speech.rel_dok_titel || null,
            talare: speech.talare || null,
            party: speech.parti || null,
            metadata: {
              fetched_at: new Date().toISOString(),
              source: 'riksdag_api',
              riksdag_year: year
            },
            updated_at: new Date().toISOString()
          }))
          
          try {
            const { data: insertData, error } = await supabase
              .from('speech_data')
              .upsert(speechesToStore, { onConflict: 'speech_id' })
              .select('id')
            
            if (!error) {
              yearStored += insertData?.length || 0
              console.log(`✅ Speech batch stored for ${year}: ${insertData?.length || 0}`)
            } else {
              console.error(`❌ Speech batch error for ${year}:`, error)
            }
          } catch (error) {
            console.error(`💥 Speech database error for ${year}:`, error)
          }
          
          await new Promise(resolve => setTimeout(resolve, 300))
        }
        
        totalStored += yearStored
        console.log(`🎤 Year ${year} complete: ${yearStored} speeches stored`)
        
      } catch (error) {
        console.error(`💥 Error fetching speeches for ${year}:`, error)
      }
    }
    
    console.log(`🎉 Speech sync complete: ${totalStored} speeches stored across all years`)
    return totalStored
  } catch (error) {
    console.error(`💥 Speech sync failed:`, error)
    return 0
  }
}

async function fetchVoteData(): Promise<number> {
  console.log(`🗳️ === STARTING VOTE DATA SYNC ===`)
  
  try {
    const currentYear = new Date().getFullYear()
    const years = [
      `${currentYear}/${(currentYear + 1).toString().slice(-2)}`,
      `${currentYear - 1}/${currentYear.toString().slice(-2)}`,
      `${currentYear - 2}/${(currentYear - 1).toString().slice(-2)}`
    ]
    
    let totalStored = 0
    
    for (const year of years) {
      console.log(`🗳️ Fetching votes for Riksdag year: ${year}`)
      const url = `${BASE_URL}/voteringlista?utformat=json&rm=${encodeURIComponent(year)}&sz=1000`
      
      try {
        const data = await fetchWithRetry(url)
        
        if (data.error) {
          console.warn(`⚠️ Vote API error for ${year}: ${data.error}`)
          continue
        }
        
        if (!data.voteringlista?.votering) {
          console.log(`⚠️ No votes found for ${year}`)
          continue
        }
        
        const votes = Array.isArray(data.voteringlista.votering) 
          ? data.voteringlista.votering 
          : [data.voteringlista.votering]
        
        console.log(`🗳️ Found ${votes.length} votes for ${year}`)
        
        let yearStored = 0
        const batchSize = 50
        
        for (let i = 0; i < votes.length; i += batchSize) {
          const batch = votes.slice(i, i + batchSize)
          
          const votesToStore = batch.map((vote: any) => ({
            vote_id: vote.votering_id || `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            hangar_id: vote.hangar_id || null,
            dok_id: vote.dok_id || null,
            beteckning: vote.beteckning || null,
            punkt: vote.punkt || null,
            votering: vote.votering || null,
            systemdatum: vote.systemdatum || null,
            rm: vote.rm || null,
            metadata: {
              fetched_at: new Date().toISOString(),
              source: 'riksdag_api',
              riksdag_year: year
            },
            updated_at: new Date().toISOString()
          }))
          
          try {
            const { data: insertData, error } = await supabase
              .from('vote_data')
              .upsert(votesToStore, { onConflict: 'vote_id' })
              .select('id')
            
            if (!error) {
              yearStored += insertData?.length || 0
              console.log(`✅ Vote batch stored for ${year}: ${insertData?.length || 0}`)
            } else {
              console.error(`❌ Vote batch error for ${year}:`, error)
            }
          } catch (error) {
            console.error(`💥 Vote database error for ${year}:`, error)
          }
          
          await new Promise(resolve => setTimeout(resolve, 200))
        }
        
        totalStored += yearStored
        console.log(`🗳️ Year ${year} complete: ${yearStored} votes stored`)
        
      } catch (error) {
        console.error(`💥 Error fetching votes for ${year}:`, error)
      }
    }
    
    console.log(`🎉 Vote sync complete: ${totalStored} votes stored across all years`)
    return totalStored
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
    
    console.log(`🚀 Starting enhanced comprehensive data sync`)
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
      console.log(`🔍 Testing database connection...`)
      const { count, error } = await supabase
        .from('document_data')
        .select('*', { count: 'exact', head: true })
      
      if (error) throw error
      console.log(`✅ Database connection OK. Current document count: ${count}`)
      
      // 1. ENHANCED MEMBER DATA - Now processes ALL members with yearly statistics
      console.log(`\n👥 === STARTING ENHANCED MEMBER DATA SYNC ===`)
      try {
        stats.members_stored = await fetchMemberData()
      } catch (error) {
        const errorMsg = `Enhanced member sync error: ${error.message}`
        console.error(`💥 ${errorMsg}`)
        stats.errors.push(errorMsg)
      }
      
      // 2. DOCUMENTS - Extended year range
      console.log(`\n📄 === STARTING DOCUMENT SYNC ===`)
      const currentYear = new Date().getFullYear()
      const startYear = 2010
      
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
      
      // 3. CALENDAR DATA
      console.log(`\n📅 === STARTING CALENDAR DATA SYNC ===`)
      try {
        stats.calendar_events_stored = await fetchCalendarData()
      } catch (error) {
        const errorMsg = `Calendar sync error: ${error.message}`
        console.error(`💥 ${errorMsg}`)
        stats.errors.push(errorMsg)
      }
      
      // 4. SPEECH DATA
      console.log(`\n🎤 === STARTING SPEECH DATA SYNC ===`)
      try {
        stats.speeches_stored = await fetchSpeechData()
      } catch (error) {
        const errorMsg = `Speech sync error: ${error.message}`
        console.error(`💥 ${errorMsg}`)
        stats.errors.push(errorMsg)
      }
      
      // 5. VOTE DATA
      console.log(`\n🗳️ === STARTING VOTE DATA SYNC ===`)
      try {
        stats.votes_stored = await fetchVoteData()
      } catch (error) {
        const errorMsg = `Vote sync error: ${error.message}`
        console.error(`💥 ${errorMsg}`)
        stats.errors.push(errorMsg)
      }
      
      // 6. TRIGGER TOPLISTS AND PARTY DATA SYNC
      console.log(`\n📊 === TRIGGERING TOPLISTS AND PARTY DATA SYNC ===`)
      try {
        const { error: toplistsError } = await supabase.functions.invoke('fetch-toplists-data')
        if (toplistsError) {
          console.error('❌ Error triggering toplists sync:', toplistsError)
          stats.errors.push(`Toplists sync error: ${toplistsError.message}`)
        } else {
          console.log('✅ Toplists and party data sync triggered successfully')
        }
      } catch (error) {
        const errorMsg = `Toplists trigger error: ${error.message}`
        console.error(`💥 ${errorMsg}`)
        stats.errors.push(errorMsg)
      }
      
      const duration = Date.now() - startTime
      stats.sync_duration_ms = duration
      
      console.log(`\n🎯 === ENHANCED COMPREHENSIVE SYNC COMPLETED ===`)
      console.log(`⏱️ Duration: ${duration}ms`)
      console.log(`📊 Final stats:`, stats)
      
      // Final database count check
      try {
        const { count: finalDocCount } = await supabase
          .from('document_data')
          .select('*', { count: 'exact', head: true })
        console.log(`📈 Final document count in database: ${finalDocCount}`)
        stats.final_document_count = finalDocCount
        
        const { count: finalMemberCount } = await supabase
          .from('member_data')
          .select('*', { count: 'exact', head: true })
        console.log(`👥 Final member count in database: ${finalMemberCount}`)
        
        const { count: finalCalCount } = await supabase
          .from('calendar_data')
          .select('*', { count: 'exact', head: true })
        console.log(`📅 Final calendar count in database: ${finalCalCount}`)
        
        const { count: finalSpeechCount } = await supabase
          .from('speech_data')
          .select('*', { count: 'exact', head: true })
        console.log(`🎤 Final speech count in database: ${finalSpeechCount}`)
        
        const { count: finalVoteCount } = await supabase
          .from('vote_data')
          .select('*', { count: 'exact', head: true })
        console.log(`🗳️ Final vote count in database: ${finalVoteCount}`)
      } catch (error) {
        console.error(`❌ Error checking final counts:`, error)
      }
      
      await updateSyncStatus('comprehensive', 'completed', stats)
      
      const response = {
        success: true,
        message: 'Enhanced comprehensive data sync completed successfully',
        stats,
        duration: `${duration}ms`,
        triggered_by: triggeredBy,
        improvements_implemented: [
          'Enhanced member data sync with ALL members (current and former)',
          'Added yearly statistics for each member (motions, questions, speeches per year)',
          'Extended document year range to 2010-2025',
          'Integrated toplists and party data sync',
          'Improved error handling and recovery',
          'Enhanced API retry logic with progressive backoff',
          'Added better logging and monitoring',
          'Optimized pagination for large datasets'
        ],
        debug_info: debugMode ? {
          start_time: new Date(startTime).toISOString(),
          end_time: new Date().toISOString(),
          years_range: `${startYear}-${currentYear}`,
          data_types_processed: ['enhanced_members', 'documents', 'calendar', 'speeches', 'votes', 'toplists', 'party_data']
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
    console.error('💥 Enhanced comprehensive sync failed:', error)
    console.error('Error stack:', error.stack)
    
    await updateSyncStatus('comprehensive', 'failed', null, error.message)
    
    const errorResponse = {
      success: false,
      error: error.message,
      message: 'Enhanced comprehensive data sync failed',
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
