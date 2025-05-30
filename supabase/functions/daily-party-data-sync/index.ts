
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

serve(async (req) => {
  try {
    console.log('Daily party data sync triggered at:', new Date().toISOString());
    
    // Call the main fetch function
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/fetch-party-data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to sync party data: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Daily sync completed successfully:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Daily party data sync completed successfully',
        timestamp: new Date().toISOString(),
        result
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in daily sync:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
