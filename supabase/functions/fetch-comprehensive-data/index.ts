
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

async function fetchDocumentsFromYear(year: number): Promise<RiksdagDocument[]> {
  const fromDate = `${year}-01-01`
  const toDate = year === new Date().getFullYear() ? 
    new Date().toISOString().split('T')[0] : 
    `${year}-12-31`
  
  const url = `${BASE_URL}/dokumentlista/?utformat=json&from=${fromDate}&tom=${toDate}&sz=1000&sort=datum&sortorder=desc`
  
  try {
    console.log(`📅 Fetching documents for year ${year} from ${fromDate} to ${toDate}`)
    const data = await fetchWithRetry(url)
    
    if (!data.dokumentlista) {
      console.warn(`⚠️ No dokumentlista found in response for year ${year}`)
      console.log(`Response structure:`, Object.keys(data))
      return []
    }
    
    const documents = data.dokumentlista.dokument || []
    console.log(`📄 Year ${year}: Found ${documents.length} documents`)
    
    if (documents.length > 0) {
      console.log(`First document sample:`, {
        id: documents[0].id,
        titel: documents[0].titel?.substring(0, 50),
        typ: documents[0].typ,
        datum: documents[0].datum
      })
    }
    
    return documents
  } catch (error) {
    console.error(`💥 Error fetching documents for year ${year}:`, error)
    return []
  }
}

async function storeDocuments(documents: RiksdagDocument[]): Promise<number> {
  if (documents.length === 0) {
    console.log(`⚠️ No documents to store`)
    return 0
  }
  
  console.log(`💾 Starting to store ${documents.length} documents`)
  let stored = 0
  const batchSize = 50 // Reduced batch size for better reliability
  
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize)
    console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(documents.length/batchSize)} (${batch.length} documents)`)
    
    const documentsToStore = batch.map(doc => {
      const storeDoc = {
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
      }
      
      return storeDoc
    })
    
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
        console.error(`Error details:`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
      } else {
        const batchStored = data?.length || 0
        stored += batchStored
        console.log(`✅ Batch success: ${batchStored}/${batch.length} documents stored (total: ${stored})`)
      }
    } catch (error) {
      console.error(`💥 Database error in batch:`, error)
    }
    
    // Add delay between batches to avoid overwhelming the database
    if (i + batchSize < documents.length) {
      console.log(`⏱️ Waiting 200ms before next batch...`)
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
  
  console.log(`🎉 Document storage complete: ${stored}/${documents.length} documents stored`)
  return stored
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
  // Handle CORS preflight requests
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
    
    // Focus on documents first since that's what the user wants to debug
    const currentYear = new Date().getFullYear()
    const startYear = 2022
    
    console.log(`📄 Starting document fetch from ${startYear} to ${currentYear}`)
    
    // Test database connection first
    try {
      console.log(`🔍 Testing database connection...`)
      const { count, error } = await supabase
        .from('document_data')
        .select('*', { count: 'exact', head: true })
      
      if (error) throw error
      console.log(`✅ Database connection OK. Current document count: ${count}`)
    } catch (error) {
      console.error(`❌ Database connection failed:`, error)
      throw new Error(`Database connection failed: ${error.message}`)
    }
    
    for (let year = startYear; year <= currentYear; year++) {
      try {
        console.log(`\n📅 === PROCESSING YEAR ${year} ===`)
        const documents = await fetchDocumentsFromYear(year)
        
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
        
        // Add delay between years
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
    
    const duration = Date.now() - startTime
    stats.sync_duration_ms = duration
    
    console.log(`\n🎯 === SYNC COMPLETED ===`)
    console.log(`⏱️ Duration: ${duration}ms`)
    console.log(`📊 Final stats:`, stats)
    
    // Final database count check
    try {
      const { count } = await supabase
        .from('document_data')
        .select('*', { count: 'exact', head: true })
      console.log(`📈 Final document count in database: ${count}`)
      stats.final_document_count = count
    } catch (error) {
      console.error(`❌ Error checking final count:`, error)
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
        years_range: `${startYear}-${currentYear}`
      } : undefined
    }
    
    console.log(`📤 Sending response:`, response)
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
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
