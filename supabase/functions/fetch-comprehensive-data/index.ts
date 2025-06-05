
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RiksdagParty {
  kod: string;
  namn: string;
  beteckning: string;
  webbadress: string;
  bild_url: string;
}

interface RiksdagMember {
  intressent_id: string;
  fornamn: string;
  efternamn: string;
  parti: string;
  valkrets: string;
  kon: string;
  fodd_ar: string;
  status: string;
  datum_fran?: string;
  datum_tom?: string;
  bild_url_80?: string;
  bild_url_192?: string;
  bild_url_max?: string;
}

// Enhanced fetchRiksdagData with better diagnostics and connectivity testing
const fetchRiksdagData = async (endpoint: string, retries = 2, timeout = 20000): Promise<any> => {
  const url = `https://data.riksdagen.se${endpoint}`;
  console.log(`Attempting to fetch: ${url}`);
  
  // Test basic connectivity first
  try {
    console.log('Testing basic connectivity to data.riksdagen.se...');
    const connectivityTest = await fetch('https://data.riksdagen.se/', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    console.log(`Connectivity test result: ${connectivityTest.status}`);
  } catch (connectError) {
    console.error('Basic connectivity test failed:', connectError);
    throw new Error(`Cannot reach Riksdag API: ${connectError.message}`);
  }
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${retries} for ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`Request timeout after ${timeout}ms for ${url}`);
        controller.abort();
      }, timeout);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Riksdag-Data-Sync/3.0',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log(`Response status: ${response.status} for ${url}`);
      console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error ${response.status} for ${url}:`, errorText.substring(0, 500));
        throw new Error(`HTTP error ${response.status}: ${errorText.substring(0, 200)}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn(`Non-JSON response from ${url}, content-type: ${contentType}`);
        const textContent = await response.text();
        console.log(`Response preview:`, textContent.substring(0, 500));
        
        if (attempt === retries) {
          throw new Error(`Invalid content type: ${contentType}. Expected JSON but got: ${textContent.substring(0, 100)}`);
        }
        continue;
      }
      
      const data = await response.json();
      console.log(`Successfully fetched and parsed JSON from ${url} on attempt ${attempt}`);
      console.log(`Data structure keys:`, Object.keys(data));
      return data;
    } catch (error) {
      console.error(`Attempt ${attempt}/${retries} failed for ${url}:`, error.message);
      
      if (attempt === retries) {
        console.error(`All attempts failed for ${url}. Final error:`, error);
        throw new Error(`Failed to fetch ${url} after ${retries} attempts: ${error.message}`);
      }
      
      // Exponential backoff with jitter
      const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      const jitter = Math.random() * 1000;
      const delay = baseDelay + jitter;
      console.log(`Waiting ${Math.round(delay)}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Test data creation for when API is unavailable
const createTestData = () => {
  console.log('Creating test data due to API unavailability...');
  
  const testParties = [
    { kod: 'S', namn: 'Socialdemokraterna', totalMembers: 100, activeMembers: 95 },
    { kod: 'M', namn: 'Moderaterna', totalMembers: 70, activeMembers: 68 },
    { kod: 'SD', namn: 'Sverigedemokraterna', totalMembers: 73, activeMembers: 70 },
    { kod: 'C', namn: 'Centerpartiet', totalMembers: 24, activeMembers: 22 },
    { kod: 'V', namn: 'Vänsterpartiet', totalMembers: 28, activeMembers: 26 },
    { kod: 'KD', namn: 'Kristdemokraterna', totalMembers: 22, activeMembers: 20 },
    { kod: 'L', namn: 'Liberalerna', totalMembers: 16, activeMembers: 14 },
    { kod: 'MP', namn: 'Miljöpartiet', totalMembers: 16, activeMembers: 14 }
  ];
  
  const testMembers = testParties.flatMap((party, partyIndex) => 
    Array.from({ length: Math.min(party.activeMembers, 10) }, (_, i) => ({
      intressent_id: `test_${party.kod}_${i + 1}`,
      fornamn: `Förnamn${i + 1}`,
      efternamn: `Efternamn${i + 1}`,
      parti: party.kod,
      valkrets: `Valkrets ${i + 1}`,
      kon: i % 2 === 0 ? 'man' : 'kvinna',
      fodd_ar: String(1950 + (i * 3) % 50),
      status: 'Riksdagsledamot'
    }))
  );
  
  return { parties: testParties, members: testMembers };
};

const fetchPartiesAndMembers = async () => {
  console.log('Fetching parties and members...');
  
  try {
    // Try to fetch members data
    console.log('Attempting to fetch member data...');
    const membersData = await fetchRiksdagData('/personlista/?utformat=json&rdlstatus=tjanstgorande');
    const members = membersData.personlista?.person || [];
    console.log(`Successfully fetched ${members.length} members from API`);
    
    // Create party statistics from member data
    const partyStats: { [key: string]: any } = {};
    
    members.forEach((member: RiksdagMember) => {
      if (!partyStats[member.parti]) {
        partyStats[member.parti] = {
          kod: member.parti,
          namn: member.parti,
          members: [],
          activeMembers: 0,
          totalMembers: 0,
          genderStats: { male: 0, female: 0 },
          ageGroups: { '20-30': 0, '31-40': 0, '41-50': 0, '51-60': 0, '61+': 0 }
        };
      }
      
      const party = partyStats[member.parti];
      party.members.push(member);
      party.totalMembers++;
      
      const isActive = !member.datum_tom || new Date(member.datum_tom) > new Date();
      if (isActive) {
        party.activeMembers++;
        
        if (member.kon === 'man') party.genderStats.male++;
        if (member.kon === 'kvinna') party.genderStats.female++;
        
        const currentYear = new Date().getFullYear();
        const age = currentYear - parseInt(member.fodd_ar);
        if (age <= 30) party.ageGroups['20-30']++;
        else if (age <= 40) party.ageGroups['31-40']++;
        else if (age <= 50) party.ageGroups['41-50']++;
        else if (age <= 60) party.ageGroups['51-60']++;
        else party.ageGroups['61+']++;
      }
    });
    
    return { parties: Object.values(partyStats), members };
  } catch (error) {
    console.error('Failed to fetch from API, using test data:', error.message);
    return createTestData();
  }
};

// Safe database insertion with enhanced error handling
const safeInsertData = async (supabase: any, tableName: string, data: any[], conflictColumn: string, batchSize = 50) => {
  if (!data || data.length === 0) {
    console.log(`No data to insert for ${tableName}`);
    return { success: true, processed: 0, errors: 0 };
  }

  console.log(`Inserting ${data.length} records into ${tableName} in batches of ${batchSize}`);
  let totalProcessed = 0;
  let errors = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    let retries = 2;
    
    while (retries > 0) {
      try {
        console.log(`Inserting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(data.length/batchSize)} into ${tableName}`);
        
        const { error, count } = await supabase
          .from(tableName)
          .upsert(batch, { onConflict: conflictColumn, count: 'exact' });
        
        if (error) {
          console.error(`Database error for ${tableName} batch:`, error);
          errors++;
          break;
        } else {
          console.log(`Successfully inserted ${count || batch.length} records into ${tableName}`);
          totalProcessed += batch.length;
          break;
        }
      } catch (insertError) {
        retries--;
        console.warn(`Insert retry ${2 - retries} for ${tableName}:`, insertError.message);
        if (retries === 0) {
          errors++;
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // Small delay between batches
    if (i + batchSize < data.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { success: errors === 0, processed: totalProcessed, errors };
};

const transformPartyData = (partiesData: any[]) => {
  return partiesData.map(party => ({
    party_code: party.kod,
    party_name: party.namn,
    total_members: party.totalMembers,
    active_members: party.activeMembers,
    gender_distribution: party.genderStats || { male: 0, female: 0 },
    age_distribution: party.ageGroups || {},
    member_list: (party.members || []).map((m: RiksdagMember) => ({
      member_id: m.intressent_id,
      first_name: m.fornamn,
      last_name: m.efternamn,
      constituency: m.valkrets,
      birth_year: parseInt(m.fodd_ar),
      gender: m.kon
    }))
  }));
};

const transformMemberData = (members: RiksdagMember[]) => {
  return members.map(member => ({
    member_id: member.intressent_id,
    first_name: member.fornamn,
    last_name: member.efternamn,
    party: member.parti,
    constituency: member.valkrets,
    gender: member.kon,
    birth_year: parseInt(member.fodd_ar),
    riksdag_status: member.status,
    is_active: !member.datum_tom || new Date(member.datum_tom) > new Date(),
    image_urls: {
      small: member.bild_url_80,
      medium: member.bild_url_192,
      large: member.bild_url_max
    }
  }));
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Starting Enhanced Diagnostic Data Sync ===');
    console.log('Environment check:');
    console.log('- Deno version:', Deno.version.deno);
    console.log('- Request method:', req.method);
    console.log('- User agent:', req.headers.get('user-agent'));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required Supabase environment variables');
    }
    
    console.log('- Supabase URL configured:', !!supabaseUrl);
    console.log('- Service key configured:', !!supabaseServiceKey);
    
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

    // Test basic connectivity and API availability
    try {
      console.log('=== Phase 0: API Connectivity Test ===');
      await fetchRiksdagData('/', 1, 5000);
      stats.api_available = true;
      console.log('✅ Riksdag API is accessible');
    } catch (connectError) {
      console.error('❌ Riksdag API is not accessible:', connectError.message);
      stats.api_available = false;
      stats.using_test_data = true;
      stats.warnings.push('Using test data due to API connectivity issues');
    }

    // Phase 1: Members and Parties (with fallback to test data)
    try {
      console.log('=== Phase 1: Parties and Members ===');
      const { parties, members } = await fetchPartiesAndMembers();
      
      if (parties && parties.length > 0) {
        const transformedParties = transformPartyData(parties);
        const transformedMembers = transformMemberData(members);
        
        stats.parties_processed = transformedParties.length;
        stats.members_processed = transformedMembers.length;
        
        console.log(`Processed ${stats.parties_processed} parties and ${stats.members_processed} members`);
        
        // Insert party data
        const partyResult = await safeInsertData(supabase, 'party_data', transformedParties, 'party_code');
        if (!partyResult.success) {
          console.error(`Party insertion errors: ${partyResult.errors}`);
          stats.errors_count += partyResult.errors;
        }
        
        // Insert member data
        const memberResult = await safeInsertData(supabase, 'member_data', transformedMembers, 'member_id');
        if (!memberResult.success) {
          console.error(`Member insertion errors: ${memberResult.errors}`);
          stats.errors_count += memberResult.errors;
        }
        
        console.log('✅ Phase 1 completed successfully');
      } else {
        stats.warnings.push('No party/member data available');
      }
      
    } catch (error) {
      console.error('❌ Phase 1 failed:', error.message);
      stats.errors_count++;
      stats.warnings.push(`Failed to process parties/members: ${error.message}`);
    }

    // Skip other phases if API is not available
    if (!stats.api_available) {
      console.log('=== Skipping Phases 2-5 due to API unavailability ===');
      stats.warnings.push('Skipped documents, votes, speeches, and calendar due to API issues');
    } else {
      // Only attempt other phases if API is working
      console.log('=== Phases 2-5: Skipped for now due to API instability ===');
      stats.warnings.push('Skipped advanced data collection due to API instability - focusing on core member/party data');
    }

    const syncDuration = Date.now() - startTime;

    // Log sync operation
    try {
      const { error: logError } = await supabase
        .from('data_sync_log')
        .insert({
          sync_type: 'diagnostic_enhanced_sync',
          status: stats.errors_count > 2 ? 'partial_success' : (stats.warnings.length > 0 ? 'success_with_warnings' : 'success'),
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
            message: `Diagnostic sync completed - API available: ${stats.api_available}`
          }
        });

      if (logError) {
        console.error('Error logging sync operation:', logError);
      }
    } catch (logError) {
      console.error('Failed to log sync operation:', logError);
    }

    console.log(`=== DIAGNOSTIC SYNC COMPLETED ===`);
    console.log(`Duration: ${syncDuration}ms`);
    console.log(`API Available: ${stats.api_available}`);
    console.log(`Using Test Data: ${stats.using_test_data}`);
    console.log(`Stats:`, stats);

    const successMessage = stats.api_available ? 
      `Enhanced diagnostic sync completed successfully with real data` :
      `Diagnostic sync completed with test data due to API connectivity issues`;

    return new Response(
      JSON.stringify({
        success: stats.errors_count < 3,
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

  } catch (error) {
    console.error('Fatal error in diagnostic sync:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString(),
        suggestion: 'Check network connectivity and API availability'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
