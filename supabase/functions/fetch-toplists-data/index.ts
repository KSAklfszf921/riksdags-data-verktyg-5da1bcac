
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const BASE_URL = 'https://data.riksdagen.se'

interface TopListMember {
  id: string;
  name: string;
  party: string;
  constituency: string;
  imageUrl?: string;
  count: number;
}

interface TopListsCache {
  motions: TopListMember[];
  speeches: TopListMember[];
  interpellations: TopListMember[];
  writtenQuestions: TopListMember[];
  lastUpdated: string;
  riksdagsYear: string;
}

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
        return { personlista: { person: [] } }
      }
      
      return await response.json()
    } catch (error) {
      console.error(`Fetch attempt ${i + 1} failed:`, error)
      if (i === maxRetries) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}

async function fetchMembers(): Promise<any[]> {
  const url = `${BASE_URL}/personlista/?utformat=json&sz=500&iid=`
  const data = await fetchWithRetry(url)
  return data.personlista?.person || []
}

async function fetchMemberDocuments(memberId: string): Promise<any[]> {
  try {
    const url = `${BASE_URL}/dokumentlista/?utformat=json&sz=1000&f=dokument&iid=${memberId}`
    const data = await fetchWithRetry(url)
    return data.dokumentlista?.dokument || []
  } catch (error) {
    console.error(`Error fetching documents for member ${memberId}:`, error)
    return []
  }
}

async function fetchMemberSpeeches(memberId: string): Promise<any[]> {
  try {
    const url = `${BASE_URL}/anforandelista/?utformat=json&sz=1000&iid=${memberId}`
    const data = await fetchWithRetry(url)
    return data.anforandelista?.anforande || []
  } catch (error) {
    console.error(`Error fetching speeches for member ${memberId}:`, error)
    return []
  }
}

async function generateTopLists(): Promise<TopListsCache> {
  console.log('Starting top lists generation...')
  
  const members = await fetchMembers()
  const currentMembers = members.filter(member => member.status === 'Tjänstgörande')
  
  console.log(`Processing ${currentMembers.length} active members`)
  
  const memberStats = []
  const batchSize = 10
  
  for (let i = 0; i < currentMembers.length; i += batchSize) {
    const batch = currentMembers.slice(i, i + batchSize)
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(currentMembers.length / batchSize)}`)
    
    const batchResults = await Promise.all(
      batch.map(async (member) => {
        try {
          const [documents, speeches] = await Promise.all([
            fetchMemberDocuments(member.intressent_id),
            fetchMemberSpeeches(member.intressent_id)
          ])

          const motions = documents.filter(doc => doc.typ === 'mot').length
          const interpellations = documents.filter(doc => doc.typ === 'ip').length
          const writtenQuestions = documents.filter(doc => doc.typ === 'fr').length
          const speechCount = speeches.length

          return {
            id: member.intressent_id,
            name: `${member.tilltalsnamn} ${member.efternamn}`,
            party: member.parti,
            constituency: member.valkrets,
            imageUrl: member.bild_url_192 || member.bild_url_80,
            motions,
            interpellations,
            writtenQuestions,
            speeches: speechCount
          }
        } catch (error) {
          console.error(`Error processing member ${member.efternamn}:`, error)
          return {
            id: member.intressent_id,
            name: `${member.tilltalsnamn} ${member.efternamn}`,
            party: member.parti,
            constituency: member.valkrets,
            imageUrl: member.bild_url_192 || member.bild_url_80,
            motions: 0,
            interpellations: 0,
            writtenQuestions: 0,
            speeches: 0
          }
        }
      })
    )
    
    memberStats.push(...batchResults)
    
    if (i + batchSize < currentMembers.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const createTopList = (key: string): TopListMember[] => {
    return memberStats
      .map(member => ({
        id: member.id,
        name: member.name,
        party: member.party,
        constituency: member.constituency,
        imageUrl: member.imageUrl,
        count: member[key] || 0
      }))
      .filter(member => member.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20) // Top 20 för att ha lite extra data
  }

  return {
    motions: createTopList('motions'),
    speeches: createTopList('speeches'),
    interpellations: createTopList('interpellations'),
    writtenQuestions: createTopList('writtenQuestions'),
    lastUpdated: new Date().toISOString(),
    riksdagsYear: '2024/25'
  }
}

async function storeTopListsCache(data: TopListsCache): Promise<void> {
  const { error } = await supabase
    .from('cached_toplists')
    .upsert({
      riksdags_year: data.riksdagsYear,
      data: data,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'riksdags_year'
    })

  if (error) {
    throw new Error(`Failed to store top lists cache: ${error.message}`)
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const body = await req.json().catch(() => ({}))
    const triggeredBy = body.triggered_by || 'cron'
    
    console.log(`📊 Starting top lists data sync (triggered by: ${triggeredBy})`)
    
    await updateSyncStatus('toplists_cache', 'running')
    
    const startTime = Date.now()
    
    const topListsData = await generateTopLists()
    await storeTopListsCache(topListsData)
    
    const duration = Date.now() - startTime
    const stats = {
      motions_count: topListsData.motions.length,
      speeches_count: topListsData.speeches.length,
      interpellations_count: topListsData.interpellations.length,
      written_questions_count: topListsData.writtenQuestions.length,
      sync_duration_ms: duration,
      riksdags_year: topListsData.riksdagsYear
    }
    
    await updateSyncStatus('toplists_cache', 'completed', stats)
    
    console.log(`✅ Top lists sync completed in ${duration}ms`)
    console.log('Top lists stats:', stats)
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Top lists data sync completed successfully',
      stats,
      duration: `${duration}ms`,
      triggered_by: triggeredBy
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('💥 Top lists sync failed:', error)
    
    await updateSyncStatus('toplists_cache', 'failed', null, error.message)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Top lists data sync failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
