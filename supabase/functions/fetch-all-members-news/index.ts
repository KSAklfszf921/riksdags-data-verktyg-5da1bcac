
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
  status: 'running' | 'completed' | 'paused' | 'error' | 'idle';
  startTime: string;
  estimatedCompletion?: string;
  errors: Array<{ memberName: string; error: string }>;
  totalRssItems: number;
  currentBatchRssItems: number;
}

// Process control
const MEMBERS_PER_CHUNK = 5; // Process 5 members per chunk
const DELAY_BETWEEN_MEMBERS = 2000;
const MAX_RETRIES = 2;

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
    
    return { success: true, newsCount };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Okänt fel';
    console.error(`❌ Misslyckades att hämta nyheter för ${memberName}: ${errorMessage}`);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`🔄 Försöker igen ${memberName} om 2 sekunder...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchMemberNewsWithRetry(memberName, memberId, supabase, retryCount + 1);
    }
    
    return { success: false, error: errorMessage };
  }
}

async function getOrCreateBatchSession(supabase: any, sessionId: string, members: any[]) {
  // Try to get existing session
  const { data: existingSession } = await supabase
    .from('batch_progress')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (existingSession) {
    return existingSession;
  }

  // Create new session
  const { data: newSession, error } = await supabase
    .from('batch_progress')
    .insert({
      session_id: sessionId,
      status: 'idle',
      total_members: members.length,
      member_list: members,
      start_time: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create batch session: ${error.message}`);
  }

  return newSession;
}

async function updateBatchProgress(supabase: any, sessionId: string, updates: any) {
  const { error } = await supabase
    .from('batch_progress')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('session_id', sessionId);

  if (error) {
    console.error('Failed to update batch progress:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { action, sessionId = 'default' } = await req.json();

    // Handle status requests
    if (action === 'status') {
      const { data: session } = await supabase
        .from('batch_progress')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (!session) {
        return new Response(
          JSON.stringify({ 
            progress: { 
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

      const progress: BatchProgress = {
        totalMembers: session.total_members,
        processedMembers: session.processed_members,
        successfulFetches: session.successful_fetches,
        failedFetches: session.failed_fetches,
        currentMember: session.current_member_name || '',
        status: session.status,
        startTime: session.start_time || '',
        estimatedCompletion: session.estimated_completion,
        errors: session.errors || [],
        totalRssItems: session.total_rss_items,
        currentBatchRssItems: session.current_batch_rss_items
      };

      return new Response(
        JSON.stringify({ progress }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle stop requests
    if (action === 'stop') {
      await updateBatchProgress(supabase, sessionId, { status: 'paused' });
      return new Response(
        JSON.stringify({ message: 'Batch-bearbetning pausad' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle start/continue requests
    if (action === 'start' || action === 'continue') {
      console.log(`🚀 ${action === 'start' ? 'Startar' : 'Fortsätter'} batch RSS-hämtning...`);

      // Get all active members if starting fresh
      let members = [];
      if (action === 'start') {
        const { data: memberData, error: membersError } = await supabase
          .from('member_data')
          .select('member_id, first_name, last_name')
          .eq('is_active', true)
          .order('last_name');

        if (membersError) {
          throw new Error(`Misslyckades att hämta ledamöter: ${membersError.message}`);
        }

        members = memberData || [];
        console.log(`Hittade ${members.length} aktiva ledamöter att bearbeta`);
      }

      // Get or create batch session
      const session = await getOrCreateBatchSession(supabase, sessionId, members);
      
      if (action === 'start' && session.status === 'running') {
        return new Response(
          JSON.stringify({ 
            error: 'Batch-bearbetning körs redan',
            progress: {
              totalMembers: session.total_members,
              processedMembers: session.processed_members,
              successfulFetches: session.successful_fetches,
              failedFetches: session.failed_fetches,
              currentMember: session.current_member_name || '',
              status: session.status,
              startTime: session.start_time || '',
              errors: session.errors || [],
              totalRssItems: session.total_rss_items,
              currentBatchRssItems: session.current_batch_rss_items
            }
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Mark as running
      await updateBatchProgress(supabase, sessionId, { 
        status: 'running',
        start_time: action === 'start' ? new Date().toISOString() : session.start_time
      });

      const memberList = session.member_list || [];
      const startIndex = session.current_member_index || 0;
      const endIndex = Math.min(startIndex + MEMBERS_PER_CHUNK, memberList.length);

      console.log(`📋 Bearbetar chunk ${startIndex}-${endIndex} av ${memberList.length} ledamöter`);

      let processedInChunk = 0;
      let successfulInChunk = 0;
      let failedInChunk = 0;
      let totalRssInChunk = 0;
      const errorsInChunk = [];

      // Process the current chunk
      for (let i = startIndex; i < endIndex; i++) {
        // Check if we should stop
        const { data: currentSession } = await supabase
          .from('batch_progress')
          .select('status')
          .eq('session_id', sessionId)
          .single();

        if (currentSession?.status === 'paused') {
          console.log('⏸️ Batch-bearbetning pausad av användare');
          break;
        }

        const member = memberList[i];
        const memberName = `${member.first_name} ${member.last_name}`;
        
        console.log(`📋 Bearbetar ledamot ${i + 1}/${memberList.length}: ${memberName}`);

        // Update current member
        await updateBatchProgress(supabase, sessionId, {
          current_member_name: memberName,
          current_member_index: i,
          current_batch_rss_items: 0
        });

        const result = await fetchMemberNewsWithRetry(memberName, member.member_id, supabase);

        processedInChunk++;
        
        if (result.success) {
          successfulInChunk++;
          const rssCount = result.newsCount || 0;
          totalRssInChunk += rssCount;
          
          // Update progress with current RSS count
          await updateBatchProgress(supabase, sessionId, {
            processed_members: session.processed_members + processedInChunk,
            successful_fetches: session.successful_fetches + successfulInChunk,
            failed_fetches: session.failed_fetches + failedInChunk,
            total_rss_items: session.total_rss_items + totalRssInChunk,
            current_batch_rss_items: rssCount
          });

          console.log(`📊 Totalt RSS-objekt nu: ${session.total_rss_items + totalRssInChunk} (+${rssCount} från ${memberName})`);
        } else {
          failedInChunk++;
          if (result.error) {
            errorsInChunk.push({
              memberName: memberName,
              error: result.error
            });
          }
        }

        // Add delay between members (except for the last one)
        if (i < endIndex - 1) {
          console.log(`⏱️ Väntar ${DELAY_BETWEEN_MEMBERS}ms innan nästa ledamot...`);
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_MEMBERS));
        }
      }

      // Update final progress for this chunk
      const isCompleted = endIndex >= memberList.length;
      const newErrors = [...(session.errors || []), ...errorsInChunk];
      
      const finalUpdates = {
        processed_members: session.processed_members + processedInChunk,
        successful_fetches: session.successful_fetches + successfulInChunk,
        failed_fetches: session.failed_fetches + failedInChunk,
        total_rss_items: session.total_rss_items + totalRssInChunk,
        current_member_index: endIndex,
        errors: newErrors,
        status: isCompleted ? 'completed' : 'running'
      };

      if (isCompleted) {
        finalUpdates.current_member_name = 'Slutförd';
        console.log(`🎉 Batch-bearbetning slutförd!`);
        console.log(`📊 Slutresultat: ${session.successful_fetches + successfulInChunk} lyckade, ${session.failed_fetches + failedInChunk} misslyckade, ${session.total_rss_items + totalRssInChunk} RSS-objekt totalt`);
      } else {
        const estimatedCompletion = estimateCompletion(
          session.processed_members + processedInChunk,
          session.total_members,
          new Date(session.start_time)
        );
        finalUpdates.estimated_completion = estimatedCompletion;
      }

      await updateBatchProgress(supabase, sessionId, finalUpdates);

      // Get updated session data
      const { data: updatedSession } = await supabase
        .from('batch_progress')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      const progress: BatchProgress = {
        totalMembers: updatedSession.total_members,
        processedMembers: updatedSession.processed_members,
        successfulFetches: updatedSession.successful_fetches,
        failedFetches: updatedSession.failed_fetches,
        currentMember: updatedSession.current_member_name || '',
        status: updatedSession.status,
        startTime: updatedSession.start_time || '',
        estimatedCompletion: updatedSession.estimated_completion,
        errors: updatedSession.errors || [],
        totalRssItems: updatedSession.total_rss_items,
        currentBatchRssItems: updatedSession.current_batch_rss_items
      };

      return new Response(
        JSON.stringify({ 
          message: isCompleted 
            ? `Batch-bearbetning slutförd! Bearbetade ${processedInChunk} ledamöter i denna chunk.`
            : `Bearbetade chunk med ${processedInChunk} ledamöter. ${memberList.length - endIndex} ledamöter kvar.`,
          progress,
          isCompleted,
          hasMore: !isCompleted
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

    return new Response(
      JSON.stringify({ 
        error: `Misslyckades att bearbeta batch: ${errorMessage}`
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
