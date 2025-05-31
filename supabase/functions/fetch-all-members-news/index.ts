
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BatchProgress {
  totalMembers: number;
  processedMembers: number;
  successfulFetches: number;
  failedFetches: number;
  currentMember: string;
  status: 'running' | 'completed' | 'paused' | 'error';
  startTime: string;
  estimatedCompletion?: string;
  errors: Array<{ memberName: string; error: string }>;
  totalRssItems: number;
  currentBatchRssItems: number;
}

// Process control
const DELAY_BETWEEN_MEMBERS = 2000; // 2 seconds between each member
const MAX_RETRIES = 2;
const REQUEST_TIMEOUT = 30000; // 30 seconds per member

// Global progress tracking
let currentProgress: BatchProgress | null = null;

function estimateCompletion(processed: number, total: number, startTime: Date): string {
  if (processed === 0) return 'Beräknar...';
  
  const elapsed = Date.now() - startTime.getTime();
  const avgTimePerMember = elapsed / processed;
  const remaining = total - processed;
  const estimatedMs = remaining * avgTimePerMember;
  
  const completionTime = new Date(Date.now() + estimatedMs);
  return completionTime.toLocaleTimeString('sv-SE');
}

async function fetchMemberNewsWithRetry(
  memberName: string, 
  memberId: string, 
  supabase: any,
  retryCount = 0
): Promise<{ success: boolean; error?: string; newsCount?: number }> {
  try {
    console.log(`🔄 Hämtar nyheter för ${memberName} (försök ${retryCount + 1})`);
    
    const { data, error } = await supabase.functions.invoke('fetch-member-news', {
      body: { memberName, memberId }
    });

    if (error) {
      throw new Error(error.message || 'Okänt fel från fetch-member-news');
    }

    const newsCount = data?.newsItems?.length || 0;
    console.log(`✅ Hämtade ${newsCount} nyhetsobjekt för ${memberName}`);
    
    return { 
      success: true, 
      newsCount 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Okänt fel';
    console.error(`❌ Misslyckades att hämta nyheter för ${memberName}: ${errorMessage}`);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`🔄 Försöker igen ${memberName} om 2 sekunder...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchMemberNewsWithRetry(memberName, memberId, supabase, retryCount + 1);
    }
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { action } = await req.json();

    // Handle status requests
    if (action === 'status') {
      return new Response(
        JSON.stringify({ 
          progress: currentProgress || { 
            status: 'idle', 
            totalMembers: 0, 
            processedMembers: 0, 
            successfulFetches: 0, 
            failedFetches: 0,
            totalRssItems: 0,
            currentBatchRssItems: 0,
            currentMember: '',
            startTime: '',
            errors: []
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle stop requests
    if (action === 'stop') {
      if (currentProgress) {
        currentProgress.status = 'paused';
      }
      return new Response(
        JSON.stringify({ message: 'Batch-bearbetning stoppad' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Start batch processing
    if (action === 'start') {
      // Check if already running
      if (currentProgress && currentProgress.status === 'running') {
        return new Response(
          JSON.stringify({ 
            error: 'Batch-bearbetning körs redan',
            progress: currentProgress
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('🚀 Startar en-i-taget RSS-hämtning för alla ledamöter...');

      // Fetch all active members
      const { data: members, error: membersError } = await supabase
        .from('member_data')
        .select('member_id, first_name, last_name')
        .eq('is_active', true)
        .order('last_name');

      if (membersError) {
        throw new Error(`Misslyckades att hämta ledamöter: ${membersError.message}`);
      }

      if (!members || members.length === 0) {
        throw new Error('Inga aktiva ledamöter hittades');
      }

      console.log(`Hittade ${members.length} aktiva ledamöter att bearbeta`);

      // Initialize progress tracking
      const startTime = new Date();
      currentProgress = {
        totalMembers: members.length,
        processedMembers: 0,
        successfulFetches: 0,
        failedFetches: 0,
        currentMember: '',
        status: 'running',
        startTime: startTime.toISOString(),
        errors: [],
        totalRssItems: 0,
        currentBatchRssItems: 0
      };

      // Process one member at a time (background task)
      EdgeRuntime.waitUntil((async () => {
        try {
          for (let i = 0; i < members.length; i++) {
            // Check if we should stop
            if (currentProgress?.status === 'paused') {
              console.log('⏸️ Batch-bearbetning pausad av användare');
              break;
            }

            const member = members[i];
            const memberName = `${member.first_name} ${member.last_name}`;
            
            console.log(`📋 Bearbetar ledamot ${i + 1}/${members.length}: ${memberName}`);

            if (currentProgress) {
              currentProgress.currentMember = memberName;
              currentProgress.currentBatchRssItems = 0; // Reset for new member
            }

            const result = await fetchMemberNewsWithRetry(memberName, member.member_id, supabase);

            // Update progress immediately after each member
            if (currentProgress) {
              currentProgress.processedMembers++;
              
              if (result.success) {
                currentProgress.successfulFetches++;
                const rssCount = result.newsCount || 0;
                currentProgress.totalRssItems += rssCount;
                currentProgress.currentBatchRssItems = rssCount;
                console.log(`📊 Totalt RSS-objekt nu: ${currentProgress.totalRssItems} (+${rssCount} från ${memberName})`);
              } else {
                currentProgress.failedFetches++;
                if (result.error) {
                  currentProgress.errors.push({
                    memberName: memberName,
                    error: result.error
                  });
                }
              }

              currentProgress.estimatedCompletion = estimateCompletion(
                currentProgress.processedMembers,
                currentProgress.totalMembers,
                new Date(currentProgress.startTime)
              );

              console.log(`📈 Framsteg: ${currentProgress.processedMembers}/${currentProgress.totalMembers} - ${currentProgress.successfulFetches} lyckade, ${currentProgress.failedFetches} misslyckade`);
            }

            // Delay between members (except for the last one)
            if (i < members.length - 1 && currentProgress?.status === 'running') {
              console.log(`⏱️ Väntar ${DELAY_BETWEEN_MEMBERS}ms innan nästa ledamot...`);
              await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_MEMBERS));
            }
          }

          // Mark as completed
          if (currentProgress && currentProgress.status === 'running') {
            currentProgress.status = 'completed';
            currentProgress.currentMember = 'Slutförd';
            
            const duration = Date.now() - new Date(currentProgress.startTime).getTime();
            console.log(`🎉 En-i-taget bearbetning slutförd på ${Math.round(duration / 1000)}s`);
            console.log(`📊 Slutresultat: ${currentProgress.successfulFetches} lyckade, ${currentProgress.failedFetches} misslyckade, ${currentProgress.totalRssItems} RSS-objekt totalt`);
          }

        } catch (error) {
          console.error('💥 Kritiskt fel i batch-bearbetning:', error);
          if (currentProgress) {
            currentProgress.status = 'error';
            currentProgress.errors.push({
              memberName: 'System',
              error: error instanceof Error ? error.message : 'Okänt fel'
            });
          }
        }
      })());

      // Return immediate response
      return new Response(
        JSON.stringify({ 
          message: `Startade en-i-taget bearbetning för ${members.length} ledamöter`,
          progress: currentProgress
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Ogiltig action-parameter' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('=== Fel i fetch-all-members-news ===', err)
    
    let errorMessage = 'Okänt fel inträffade'
    if (err instanceof Error) {
      errorMessage = err.message
    }

    if (currentProgress) {
      currentProgress.status = 'error';
      currentProgress.errors.push({
        memberName: 'System',
        error: errorMessage
      });
    }

    return new Response(
      JSON.stringify({ 
        error: `Misslyckades att bearbeta batch: ${errorMessage}`,
        progress: currentProgress
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
