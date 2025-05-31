
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
    console.log('Starting comprehensive calendar data sync...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let totalProcessed = 0;
    let errors = 0;
    const startTime = Date.now();

    // API endpoints according to technical specification
    const apiEndpoints = [
      'https://data.riksdagen.se/kalender/?utformat=json&sz=500',
      'https://data.riksdagen.se/kalender/?utformat=json&sz=200&sort=c&sortorder=asc',
      'https://data.riksdagen.se/kalender/?utformat=json&sz=200&sort=c&sortorder=desc',
      'https://data.riksdagen.se/kalender/?utformat=json&sz=300&from=2024-01-01&tom=2025-12-31',
      'https://data.riksdagen.se/kalender/?utformat=json&sz=200&typ=sammantrade',
      'https://data.riksdagen.se/kalender/?utformat=json&sz=200&typ=debatt',
      'https://data.riksdagen.se/kalender/?utformat=json&sz=200&org=kamm',
      'https://data.riksdagen.se/kalender/?utformat=json&sz=200&org=eun'
    ];

    console.log(`Attempting to fetch from ${apiEndpoints.length} different endpoints...`);

    for (const url of apiEndpoints) {
      try {
        console.log(`Fetching calendar data from: ${url}`);
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Riksdag-Calendar-Sync/3.0',
            'Cache-Control': 'no-cache'
          }
        });

        console.log(`Response status for ${url}: ${response.status}`);

        if (!response.ok) {
          console.log(`HTTP error ${response.status} for URL: ${url}`);
          continue;
        }

        const responseText = await response.text();
        console.log(`Response length: ${responseText.length} characters`);

        if (!responseText || responseText.trim().length === 0) {
          console.log(`Empty response from: ${url}`);
          continue;
        }

        // Check if response is HTML (error page)
        if (responseText.trim().startsWith('<')) {
          console.log(`HTML response received from: ${url}, skipping...`);
          continue;
        }

        let data: RiksdagCalendarResponse;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`JSON parse error for ${url}:`, parseError);
          console.log(`Response snippet: ${responseText.substring(0, 200)}...`);
          continue;
        }

        if (!data.kalender || !data.kalender.händelse) {
          console.log(`No events found in response from: ${url}`);
          console.log(`Response structure:`, Object.keys(data));
          continue;
        }

        const events = Array.isArray(data.kalender.händelse) 
          ? data.kalender.händelse 
          : [data.kalender.händelse];

        console.log(`Processing ${events.length} events from ${url}`);

        if (events.length === 0) {
          console.log(`No events to process from: ${url}`);
          continue;
        }

        // Process events in smaller batches
        const batchSize = 20;
        for (let i = 0; i < events.length; i += batchSize) {
          const batch = events.slice(i, i + batchSize);
          
          try {
            const calendarData = batch.map(event => {
              // Generate unique event ID
              const eventId = event.id || `${event.datum || 'no-date'}-${event.org || 'no-org'}-${event.titel?.substring(0, 10) || 'no-title'}-${Math.random().toString(36).substr(2, 9)}`;
              
              return {
                event_id: eventId,
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
                  synced_at: new Date().toISOString(),
                  original_id: event.id || null
                }
              };
            });

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
              console.log(`Successfully processed batch of ${batch.length} events (total: ${totalProcessed})`);
            }
          } catch (batchError) {
            console.error('Error processing batch:', batchError);
            errors += batch.length;
          }
        }

        // Add delay between endpoints
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (urlError) {
        console.error(`Error fetching from ${url}:`, urlError);
        continue;
      }
    }

    const syncDuration = Date.now() - startTime;

    console.log(`Calendar sync completed: ${totalProcessed} events processed, ${errors} errors, ${syncDuration}ms`);

    // Log the sync operation
    const { error: logError } = await supabase
      .from('data_sync_log')
      .insert({
        sync_type: 'calendar_data',
        status: totalProcessed > 0 ? (errors > 0 ? 'partial_success' : 'success') : 'failed',
        calendar_events_processed: totalProcessed,
        errors_count: errors,
        sync_duration_ms: syncDuration,
        error_details: errors > 0 ? { 
          message: `${errors} events failed to process`,
          total_attempted: totalProcessed + errors 
        } : null
      });

    if (logError) {
      console.error('Error logging sync operation:', logError);
    }

    const success = totalProcessed > 0;
    const statusCode = success ? 200 : (errors > 0 ? 207 : 404);

    return new Response(
      JSON.stringify({
        success,
        message: success 
          ? `Calendar data sync completed successfully. ${totalProcessed} events processed.`
          : 'No calendar data could be retrieved from any endpoint.',
        stats: {
          events_processed: totalProcessed,
          errors: errors,
          duration_ms: syncDuration,
          endpoints_tried: apiEndpoints.length
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode
      }
    );

  } catch (error) {
    console.error('Fatal error in calendar sync:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: 'Fatal error occurred during calendar sync',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
