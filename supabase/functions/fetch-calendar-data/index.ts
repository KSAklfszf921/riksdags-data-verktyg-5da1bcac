
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RiksdagCalendarEvent {
  id: string;
  datum: string;
  titel: string;
  typ: string;
  org: string;
  akt?: string;
  tid?: string;
  plats?: string;
  beskrivning?: string;
  status?: string;
}

interface RiksdagCalendarResponse {
  kalender: {
    händelse: RiksdagCalendarEvent[] | RiksdagCalendarEvent;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting calendar data sync...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let totalProcessed = 0;
    let errors = 0;
    const startTime = Date.now();

    // Try multiple approaches to fetch calendar data
    const urls = [
      'https://data.riksdagen.se/kalender/?utformat=json&sz=500',
      'https://data.riksdagen.se/sv/riksdagen-denna-vecka?utformat=json',
      'https://data.riksdagen.se/sv/riksdagen-nasta-vecka?utformat=json'
    ];

    for (const url of urls) {
      try {
        console.log(`Fetching calendar data from: ${url}`);
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Riksdag-Calendar-Sync/1.0'
          }
        });

        if (!response.ok) {
          console.log(`HTTP error ${response.status} for URL: ${url}`);
          continue;
        }

        const data: RiksdagCalendarResponse = await response.json();
        
        if (!data.kalender || !data.kalender.händelse) {
          console.log(`No events found in response from: ${url}`);
          continue;
        }

        const events = Array.isArray(data.kalender.händelse) 
          ? data.kalender.händelse 
          : [data.kalender.händelse];

        console.log(`Processing ${events.length} events from ${url}`);

        // Process events in batches
        const batchSize = 50;
        for (let i = 0; i < events.length; i += batchSize) {
          const batch = events.slice(i, i + batchSize);
          
          try {
            const calendarData = batch.map(event => ({
              event_id: event.id || `${event.datum}-${event.org}-${Math.random()}`,
              datum: event.datum || null,
              tid: event.tid || null,
              plats: event.plats || null,
              aktivitet: event.akt || null,
              typ: event.typ || null,
              organ: event.org || null,
              summary: event.titel || null,
              description: event.beskrivning || null,
              status: event.status || null,
              url: null,
              sekretess: null,
              participants: null,
              related_documents: null,
              metadata: {
                source_url: url,
                synced_at: new Date().toISOString()
              }
            }));

            const { error } = await supabase
              .from('calendar_data')
              .upsert(calendarData, { 
                onConflict: 'event_id',
                ignoreDuplicates: false 
              });

            if (error) {
              console.error('Error inserting calendar batch:', error);
              errors += batch.length;
            } else {
              totalProcessed += batch.length;
              console.log(`Successfully processed batch of ${batch.length} events`);
            }
          } catch (batchError) {
            console.error('Error processing batch:', batchError);
            errors += batch.length;
          }
        }

        // Add delay between URLs to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (urlError) {
        console.error(`Error fetching from ${url}:`, urlError);
        continue;
      }
    }

    const syncDuration = Date.now() - startTime;

    // Log the sync operation
    const { error: logError } = await supabase
      .from('data_sync_log')
      .insert({
        sync_type: 'calendar_data',
        status: errors > 0 ? 'partial_success' : 'success',
        calendar_events_processed: totalProcessed,
        errors_count: errors,
        sync_duration_ms: syncDuration,
        error_details: errors > 0 ? { message: `${errors} events failed to process` } : null
      });

    if (logError) {
      console.error('Error logging sync operation:', logError);
    }

    console.log(`Calendar sync completed: ${totalProcessed} events processed, ${errors} errors, ${syncDuration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Calendar data sync completed',
        stats: {
          events_processed: totalProcessed,
          errors: errors,
          duration_ms: syncDuration
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Fatal error in calendar sync:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
