
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
  kalender?: {
    händelse: RiksdagCalendarEvent[] | RiksdagCalendarEvent;
  };
  kalenderlista?: {
    kalender?: RiksdagCalendarEvent[] | RiksdagCalendarEvent;
  };
}

const isValidJsonResponse = (text: string): boolean => {
  if (!text || text.trim().length === 0) return false;
  if (text.trim().startsWith('<')) return false; // HTML response
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
};

const extractEvents = (data: RiksdagCalendarResponse): RiksdagCalendarEvent[] => {
  // Try different response structures
  if (data.kalender?.händelse) {
    return Array.isArray(data.kalender.händelse) 
      ? data.kalender.händelse 
      : [data.kalender.händelse];
  }
  
  if (data.kalenderlista?.kalender) {
    return Array.isArray(data.kalenderlista.kalender) 
      ? data.kalenderlista.kalender 
      : [data.kalenderlista.kalender];
  }
  
  return [];
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting improved calendar data sync...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let totalProcessed = 0;
    let errors = 0;
    const startTime = Date.now();

    // Updated API endpoints with better parameter combinations
    const apiEndpoints = [
      'https://data.riksdagen.se/kalender/?utformat=json&sz=100',
      'https://data.riksdagen.se/kalender/?utformat=json&sz=50&sort=datum&sortorder=desc',
      'https://data.riksdagen.se/kalender/?utformat=json&sz=50&sort=datum&sortorder=asc',
      'https://data.riksdagen.se/kalender/?utformat=json&sz=50&typ=sammanträde',
      'https://data.riksdagen.se/kalender/?utformat=json&sz=50&org=kamm',
      'https://data.riksdagen.se/kalender/?utformat=json&sz=50&from=2024-11-01',
      'https://data.riksdagen.se/kalender/?utformat=json&sz=30'
    ];

    console.log(`Attempting to fetch from ${apiEndpoints.length} different endpoints...`);

    for (const url of apiEndpoints) {
      try {
        console.log(`Fetching calendar data from: ${url}`);
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; Riksdag-Calendar-Sync/3.0)',
            'Cache-Control': 'no-cache'
          }
        });

        console.log(`Response status for ${url}: ${response.status}`);

        if (!response.ok) {
          console.log(`HTTP error ${response.status} for URL: ${url}`);
          errors++;
          continue;
        }

        const responseText = await response.text();
        console.log(`Response length: ${responseText.length} characters`);

        if (!isValidJsonResponse(responseText)) {
          console.log(`Invalid JSON response from: ${url} (likely HTML error page)`);
          console.log(`Response preview: ${responseText.substring(0, 200)}...`);
          errors++;
          continue;
        }

        let data: RiksdagCalendarResponse;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`JSON parse error for ${url}:`, parseError);
          errors++;
          continue;
        }

        const events = extractEvents(data);
        console.log(`Found ${events.length} events from ${url}`);

        if (events.length === 0) {
          console.log(`No events to process from: ${url}`);
          continue;
        }

        // Process events in smaller batches
        const batchSize = 10;
        for (let i = 0; i < events.length; i += batchSize) {
          const batch = events.slice(i, i + batchSize);
          
          try {
            const calendarData = batch.map(event => {
              // Generate unique event ID with better fallback
              const eventId = event.id || 
                `${event.datum || new Date().toISOString().split('T')[0]}-${event.org || 'unknown'}-${event.titel?.substring(0, 20).replace(/\s+/g, '-') || 'event'}-${Math.random().toString(36).substr(2, 6)}`;
              
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
                  original_id: event.id || null,
                  api_response_type: data.kalender ? 'kalender' : 'kalenderlista'
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

        // Add delay between endpoints to be respectful
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (urlError) {
        console.error(`Error fetching from ${url}:`, urlError);
        errors++;
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
          message: `${errors} endpoint/batch failures during sync`,
          total_attempted: totalProcessed + errors,
          endpoints_tried: apiEndpoints.length
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
          ? `Calendar data sync completed successfully. ${totalProcessed} events processed with ${errors} errors.`
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
