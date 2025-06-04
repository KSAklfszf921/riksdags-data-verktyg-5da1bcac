
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    console.log('🕒 Starting daily toplists sync job')
    
    // Call the main fetch-toplists-data function
    const { data, error } = await supabase.functions.invoke('fetch-toplists-data', {
      body: { 
        scheduled: true,
        timestamp: new Date().toISOString()
      }
    })
    
    if (error) {
      throw error
    }
    
    console.log('✅ Daily toplists sync completed successfully')
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Daily toplists sync completed',
      data,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('💥 Daily toplists sync failed:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
