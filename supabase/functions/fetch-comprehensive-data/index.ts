// supabase/functions/fetch-comprehensive-data/index.ts

import { serve } from 'https://deno.land/std@0.193.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.5';
import { corsHeaders } from '../_shared/cors.ts';

// ---- Types ----
type RiksdagMember = {
  intressent_id: string;
  fnamn: string;
  enamn: string;
  parti: string;
  valkrets: string;
  kon: string;
  fodd: string;
  bild_url: string;
};

type RiksdagPersonResponse = {
  personlista: {
    person: RiksdagMember[];
    '@antal_total'?: string;
  };
};

type Document = {
  id: string;
  titel: string;
  typ: string;
  datum: string;
  organ: string;
  dokument_url_html?: string;
};

type Vote = {
  id: string;
  // Add more fields as needed
};

type Speech = {
  id: string;
  // Add more fields as needed
};

type CalendarEvent = {
  event_id: string;
  datum: string;
  summary: string;
  organ: string;
  typ: string;
};

// ---- Utility: Robust fetch with Deno-compatible timeout ----
const makeRiksdagApiRequest = async (path: string, params: Record<string, any>) => {
  const url = new URL(`https://data.riksdagen.se${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, String(value)));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Riksdag-Data-Sync/2.0',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error ${response.status} for ${url.toString()}:`, errorText.substring(0, 200));
      if (response.status === 413) throw new Error('Response too large - API returned too much data');
      if (response.status === 400) throw new Error('Invalid API parameters');
      if (response.status === 404) throw new Error('API endpoint not found');
      throw new Error(`HTTP error ${response.status}: ${errorText.substring(0, 100)}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textContent = await response.text();
      console.error(`Non-JSON response from ${url.toString()}:`, textContent.substring(0, 200));
      throw new Error(`Expected JSON but got ${contentType}`);
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonErr) {
      console.error(`Failed to parse JSON from ${url}:`, jsonErr);
      throw new Error('Malformed JSON from API');
    }

    console.log(`Successfully fetched data from ${url.toString()}`);
    return data;

  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error && error.name === "AbortError") {
      console.error(`Request timed out for ${url.toString()}`);
      throw new Error('API request timed out');
    }
    console.error(`API request failed for ${url.toString()}:`, error?.message || error);
    throw error;
  }
};

// ---- API Connectivity Test ----
const testApiConnectivity = async (): Promise<boolean> => {
  try {
    console.log('Testing API connectivity...');
    const data = await makeRiksdagApiRequest('/personlista/', { p: 1, parti: 'S', utformat: 'json' });
    if (data && data.personlista) {
      console.log('✅ API connectivity test successful');
      return true;
    }
    console.warn('⚠️ API returned unexpected structure');
    return false;
  } catch (error: any) {
    console.error('❌ API connectivity test failed:', error.message);
    return false;
  }
};

// ---- Test Data ----
const createTestData = () => {
  console.log('Creating test data due to API unavailability...');
  const testMembers: RiksdagMember[] = [
    {
      intressent_id: 'test_s_001',
      fnamn: 'Anna',
      enamn: 'Andersson',
      parti: 'S',
      valkrets: 'Stockholms län',
      kon: 'K',
      fodd: '1975',
      bild_url: 'https://example.com/placeholder.jpg'
    },
    {
      intressent_id: 'test_m_001',
      fnamn: 'Lars',
      enamn: 'Larsson',
      parti: 'M',
      valkrets: 'Västra Götalands län',
      kon: 'M',
      fodd: '1968',
      bild_url: 'https://example.com/placeholder.jpg'
    },
    {
      intressent_id: 'test_sd_001',
      fnamn: 'Erik',
      enamn: 'Eriksson',
      parti: 'SD',
      valkrets: 'Skåne län',
      kon: 'M',
      fodd: '1980',
      bild_url: 'https://example.com/placeholder.jpg'
    }
  ];

  const testDocuments: Document[] = [{
    id: 'doc1',
    titel: 'Testdokument',
    typ: 'mot',
    datum: '2025-01-01',
    organ: 'Testorgan',
    dokument_url_html: 'https://example.com/doc.html'
  }];

  const testVotes: Vote[] = [{ id: 'vote1' }];
  const testSpeeches: Speech[] = [{ id: 'speech1' }];
  const testCalendar: CalendarEvent[] = [{
    event_id: 'event1',
    datum: '2025-01-01',
    summary: 'Testhändelse',
    organ: 'Testorgan',
    typ: 'Sammanträde'
  }];

  return {
    members: testMembers,
    documents: testDocuments,
    votes: testVotes,
    speeches: testSpeeches,
    calendar: testCalendar
  };
};

// ---- Data Fetching ----
const fetchMembersData = async (): Promise<{ members: RiksdagMember[]; apiAvailable: boolean }> => {
  try {
    console.log('Fetching members from Riksdag API...');
    const apiAvailable = await testApiConnectivity();
    if (!apiAvailable) {
      console.log('API not available, using test data');
      const testData = createTestData();
      return { members: testData.members, apiAvailable: false };
    }

    // Fetch current members in smaller batches to avoid 413 errors
    const parties = ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP'];
    let allMembers: RiksdagMember[] = [];
    for (const parti of parties) {
      try {
        console.log(`Fetching members for party: ${parti}`);
        const data: RiksdagPersonResponse = await makeRiksdagApiRequest('/personlista/', {
          parti,
          kategori: 'nuvarande',
          utformat: 'json'
        });
        const partyMembers = data.personlista?.person || [];
        allMembers = allMembers.concat(partyMembers);
        console.log(`Fetched ${partyMembers.length} members for ${parti}`);
        await new Promise(resolve => setTimeout(resolve, 100)); // avoid hammering API
      } catch (partyError: any) {
        console.warn(`Failed to fetch members for party ${parti}:`, partyError?.message || partyError);
        // Continue with other parties
      }
    }
    console.log(`Total members fetched: ${allMembers.length}`);
    return { members: allMembers, apiAvailable: true };
  } catch (error: any) {
    console.error('Failed to fetch members from API:', error?.message || error);
    console.log('Falling back to test data');
    const testData = createTestData();
    return { members: testData.members, apiAvailable: false };
  }
};

const fetchDocuments = async (apiAvailable: boolean) => {
  if (!apiAvailable) return createTestData().documents;
  try {
    const url = '/dokumentlista/';
    const params = {
      sok: '',
      doktyp: 'mot,prop',
      utformat: 'json',
      sort: 'datum',
      sortorder: 'desc',
      sz: 500
    };
    const data = await makeRiksdagApiRequest(url, params);
    if (!data.dokumentlista || !data.dokumentlista.dokument) {
      console.warn('No documents found');
      return [];
    }
    const documents = Array.isArray(data.dokumentlista.dokument) ? data.dokumentlista.dokument : [data.dokumentlista.dokument];
    return documents.map((d: any) => ({
      id: d.dok_id,
      titel: d.titel,
      typ: d.doktyp,
      datum: d.datum,
      organ: d.organ,
      dokument_url_html: d.dokument_url_html
    }));
  } catch (error: any) {
    console.error('Error fetching documents:', error?.message || error);
    return [];
  }
};

const fetchVotes = async (apiAvailable: boolean) => {
  if (!apiAvailable) return createTestData().votes;
  try {
    // Dummy implementation: you can expand this with actual Riksdag API endpoints for votes
    // Example endpoint: /voteringlista/
    return [];
  } catch (error: any) {
    console.error('Error fetching votes:', error?.message || error);
    return [];
  }
};

const fetchSpeeches = async (apiAvailable: boolean) => {
  if (!apiAvailable) return createTestData().speeches;
  try {
    // Dummy implementation: you can expand this with actual Riksdag API endpoints for speeches
    // Example endpoint: /anforandelista/
    return [];
  } catch (error: any) {
    console.error('Error fetching speeches:', error?.message || error);
    return [];
  }
};

const fetchCalendar = async (apiAvailable: boolean) => {
  if (!apiAvailable) return createTestData().calendar;
  try {
    const url = '/kalender/';
    const params = {
      utformat: 'json',
      sz: 50,
      sort: 'datum',
      sortorder: 'desc'
    };
    const data = await makeRiksdagApiRequest(url, params);
    if (!data.kalenderlista || !data.kalenderlista.kalender) {
      console.warn('No calendar events found');
      return [];
    }
    const events = Array.isArray(data.kalenderlista.kalender) ? data.kalenderlista.kalender : [data.kalenderlista.kalender];
    return events.map((e: any) => ({
      event_id: e.id || `${e.datum || Date.now()}-${e.org || 'unknown'}-${Math.random().toString(36).substr(2, 6)}`,
      datum: e.datum,
      summary: e.summary || e.titel,
      organ: e.org,
      typ: e.typ
    }));
  } catch (error: any) {
    console.error('Error fetching calendar events:', error?.message || error);
    return [];
  }
};

// ---- Data Transformation ----
const transformMemberData = (members: RiksdagMember[]) => {
  return members
    .filter(member => member.intressent_id) // Filter out members without valid ID
    .map(member => ({
      member_id: member.intressent_id, // Fixed: use intressent_id as member_id
      first_name: member.fnamn || '',
      last_name: member.enamn || '',
      party: member.parti || '',
      constituency: member.valkrets || '',
      gender: member.kon || '',
      birth_year: member.fodd ? parseInt(member.fodd) : null,
      image_urls: member.bild_url ? { max: member.bild_url } : {},
      is_active: true,
      riksdag_status: 'Riksdagsledamot',
      current_committees: [],
      assignments: [],
      activity_data: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
};

const transformPartyData = (members: RiksdagMember[]) => {
  const partyMap: Record<string, { party_code: string; party_name: string; total_members: number }> = {};
  members.forEach(member => {
    if (!partyMap[member.parti]) {
      partyMap[member.parti] = {
        party_code: member.parti,
        party_name: member.parti,
        total_members: 1
      };
    } else {
      partyMap[member.parti].total_members++;
    }
  });
  return Object.values(partyMap).map(p => ({
    ...p,
    active_members: p.total_members,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
};

// ---- DB Insert Helper ----
const safeInsertData = async (supabase: any, tableName: string, data: any[], conflictKey: string) => {
  if (!data || data.length === 0) {
    console.warn(`No data to insert for ${tableName}`);
    return { success: true, processed: 0 };
  }
  
  console.log(`Inserting ${data.length} records into ${tableName}`);
  
  try {
    const { error, count } = await supabase
      .from(tableName)
      .upsert(data, { onConflict: conflictKey, count: 'exact' });
    
    if (error) {
      console.error(`Database error for ${tableName}:`, error);
      return { success: false, processed: 0 };
    }
    
    console.log(`Successfully inserted ${count || data.length} records into ${tableName}`);
    return { success: true, processed: count ?? data.length };
  } catch (insertError) {
    console.error(`Insert error for ${tableName}:`, insertError);
    return { success: false, processed: 0 };
  }
};

// ---- Main Supabase Edge Function ----
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Starting Corrected API Sync ===');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const startTime = Date.now();
    const stats = {
      parties_processed: 0,
      members_processed: 0,
      documents_processed: 0,
      votes_processed: 0,
      speeches_processed: 0,
      calendar_events_processed: 0,
      errors_count: 0,
      warnings: [] as string[],
      api_available: false,
      using_test_data: false
    };

    // ---- Phase 1: Test API and fetch members ----
    console.log('=== Phase 1: API Test and Member Data ===');
    const { members, apiAvailable } = await fetchMembersData();
    stats.api_available = apiAvailable;
    stats.using_test_data = !apiAvailable;

    if (!apiAvailable) {
      stats.warnings.push('Using test data due to API connectivity issues');
    }

    if (members.length > 0) {
      // Transform and insert member data
      const transformedMembers = transformMemberData(members);
      const memberResult = await safeInsertData(supabase, 'member_data', transformedMembers, 'member_id');
      stats.members_processed = memberResult.processed;
      if (!memberResult.success) {
        stats.errors_count++;
        stats.warnings.push('Failed to insert some member data');
      }

      // Transform and insert party data
      const transformedParties = transformPartyData(members);
      const partyResult = await safeInsertData(supabase, 'party_data', transformedParties, 'party_code');
      stats.parties_processed = partyResult.processed;
      if (!partyResult.success) {
        stats.errors_count++;
        stats.warnings.push('Failed to insert some party data');
      }
      console.log(`✅ Phase 1 completed: ${stats.members_processed} members, ${stats.parties_processed} parties`);
    } else {
      stats.warnings.push('No member data available');
    }

    // Skip advanced data phases for now to focus on core functionality
    console.log('=== Skipping advanced data phases ===');
    stats.warnings.push('Advanced data collection (documents, votes, speeches) skipped - focusing on core member/party data with corrected API');

    const syncDuration = Date.now() - startTime;

    // ---- Log sync operation ----
    try {
      const { error: logError } = await supabase
        .from('data_sync_log')
        .insert({
          sync_type: 'corrected_api_sync',
          status: stats.errors_count > 0 ? 'partial_success' : (stats.warnings.length > 0 ? 'success_with_warnings' : 'success'),
          parties_processed: stats.parties_processed,
          members_processed: stats.members_processed,
          documents_processed: stats.documents_processed,
          votes_processed: stats.votes_processed,
          speeches_processed: stats.speeches_processed,
          calendar_events_processed: stats.calendar_events_processed,
          errors_count: stats.errors_count,
          sync_duration_ms: syncDuration,
          error_details: {
            warnings: stats.warnings,
            api_available: stats.api_available,
            using_test_data: stats.using_test_data,
            message: `Corrected API sync completed - API available: ${stats.api_available}`
          }
        });
      if (logError) {
        console.error('Error logging sync operation:', logError);
      }
    } catch (logError) {
      console.error('Failed to log sync operation:', logError);
    }

    console.log('=== CORRECTED API SYNC COMPLETED ===');
    console.log(`Duration: ${syncDuration}ms`);
    console.log(`API Available: ${stats.api_available}`);
    console.log(`Stats:`, stats);

    const successMessage = stats.api_available ?
      `Corrected API sync completed successfully with real data from Riksdag API` :
      `Sync completed with test data due to API connectivity issues`;

    return new Response(
      JSON.stringify({
        success: stats.errors_count === 0,
        message: successMessage,
        stats,
        duration_ms: syncDuration,
        warnings: stats.warnings,
        api_status: {
          available: stats.api_available,
          using_test_data: stats.using_test_data
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Fatal error in corrected API sync:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        suggestion: 'Check API specification compliance and network connectivity'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
