
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
}

// Rate limiting and batch control
const BATCH_SIZE = 5; // Process 5 members at a time
const DELAY_BETWEEN_BATCHES = 3000; // 3 seconds between batches
const MAX_RETRIES = 2;
const REQUEST_TIMEOUT = 30000; // 30 seconds per member

// Global progress tracking
let currentProgress: BatchProgress | null = null;

function estimateCompletion(processed: number, total: number, startTime: Date): string {
  if (processed === 0) return 'Calculating...';
  
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
    console.log(`Fetching news for ${memberName} (attempt ${retryCount + 1})`);
    
    const { data, error } = await supabase.functions.invoke('fetch-member-news', {
      body: { memberName, memberId }
    });

    if (error) {
      throw new Error(error.message || 'Unknown error from fetch-member-news');
    }

    const newsCount = data?.newsItems?.length || 0;
    console.log(`✅ Successfully fetched ${newsCount} news items for ${memberName}`);
    
    return { 
      success: true, 
      newsCount 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to fetch news for ${memberName}: ${errorMessage}`);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying ${memberName} in 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchMemberNewsWithRetry(memberName, memberId, supabase, retryCount + 1);
    }
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

async function processBatch(
  members: Array<{ member_id: string; first_name: string; last_name: string }>,
  supabase: any
): Promise<Array<{ memberName: string; success: boolean; error?: string; newsCount?: number }>> {
  const promises = members.map(async (member) => {
    const memberName = `${member.first_name} ${member.last_name}`;
    const result = await fetchMemberNewsWithRetry(memberName, member.member_id, supabase);
    
    return {
      memberName,
      memberId: member.member_id,
      ...result
    };
  });

  return Promise.all(promises);
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

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'start';

    // Handle status requests
    if (action === 'status') {
      return new Response(
        JSON.stringify({ 
          progress: currentProgress || { status: 'idle' }
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
        JSON.stringify({ message: 'Batch processing stopped' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Start batch processing
    if (action === 'start') {
      // Check if already running
      if (currentProgress && currentProgress.status === 'running') {
        return new Response(
          JSON.stringify({ 
            error: 'Batch processing is already running',
            progress: currentProgress
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('🚀 Starting batch RSS feed fetching for all members...');

      // Fetch all active members
      const { data: members, error: membersError } = await supabase
        .from('member_data')
        .select('member_id, first_name, last_name')
        .eq('is_active', true)
        .order('last_name');

      if (membersError) {
        throw new Error(`Failed to fetch members: ${membersError.message}`);
      }

      if (!members || members.length === 0) {
        throw new Error('No active members found');
      }

      console.log(`Found ${members.length} active members to process`);

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
        errors: []
      };

      // Process in batches (background task)
      EdgeRuntime.waitUntil((async () => {
        try {
          for (let i = 0; i < members.length; i += BATCH_SIZE) {
            // Check if we should stop
            if (currentProgress?.status === 'paused') {
              console.log('Batch processing paused by user');
              break;
            }

            const batch = members.slice(i, i + BATCH_SIZE);
            console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.map(m => `${m.first_name} ${m.last_name}`).join(', ')}`);

            if (currentProgress) {
              currentProgress.currentMember = batch.map(m => `${m.first_name} ${m.last_name}`).join(', ');
            }

            const batchResults = await processBatch(batch, supabase);

            // Update progress
            if (currentProgress) {
              for (const result of batchResults) {
                currentProgress.processedMembers++;
                if (result.success) {
                  currentProgress.successfulFetches++;
                } else {
                  currentProgress.failedFetches++;
                  if (result.error) {
                    currentProgress.errors.push({
                      memberName: result.memberName,
                      error: result.error
                    });
                  }
                }
              }

              currentProgress.estimatedCompletion = estimateCompletion(
                currentProgress.processedMembers,
                currentProgress.totalMembers,
                new Date(currentProgress.startTime)
              );
            }

            console.log(`Batch completed. Successful: ${batchResults.filter(r => r.success).length}, Failed: ${batchResults.filter(r => !r.success).length}`);

            // Delay between batches (except for the last one)
            if (i + BATCH_SIZE < members.length && currentProgress?.status === 'running') {
              console.log(`Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
              await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
            }
          }

          // Mark as completed
          if (currentProgress && currentProgress.status === 'running') {
            currentProgress.status = 'completed';
            currentProgress.currentMember = 'Completed';
            
            const duration = Date.now() - new Date(currentProgress.startTime).getTime();
            console.log(`🎉 Batch processing completed in ${Math.round(duration / 1000)}s`);
            console.log(`Final results: ${currentProgress.successfulFetches} successful, ${currentProgress.failedFetches} failed`);
          }

        } catch (error) {
          console.error('Critical error in batch processing:', error);
          if (currentProgress) {
            currentProgress.status = 'error';
            currentProgress.errors.push({
              memberName: 'System',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      })());

      // Return immediate response
      return new Response(
        JSON.stringify({ 
          message: `Started batch processing for ${members.length} members`,
          progress: currentProgress
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action parameter' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('=== Error in fetch-all-members-news ===', err)
    
    let errorMessage = 'Unknown error occurred'
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
        error: `Failed to process batch: ${errorMessage}`,
        progress: currentProgress
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
