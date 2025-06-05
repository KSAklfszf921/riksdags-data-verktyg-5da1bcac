
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// API interfaces following the official specification
interface RiksdagMember {
  id: string;
  fnamn: string;
  enamn: string;
  parti: string;
  valkrets: string;
  kon: string;
  fodd?: string;
  bild_url?: string;
  uppdrag?: Array<{
    roll: string;
    organ: string;
  }>;
}

interface RiksdagPersonResponse {
  personlista: {
    person: RiksdagMember[];
    '@antal_total': string;
  };
}

// Enhanced API request function with proper error handling
const makeRiksdagApiRequest = async (endpoint: string, params: Record<string, any> = {}): Promise<any> => {
  const url = new URL(endpoint, 'https://data.riksdagen.se');
  
  // Add default JSON format
  params.utformat = 'json';
  
  // Add parameters to URL
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  console.log(`Making API request to: ${url.toString()}`);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Riksdag-Data-Sync/2.0',
        'Cache-Control': 'no-cache'
      },
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error ${response.status} for ${url.toString()}:`, errorText.substring(0, 200));
      
      if (response.status === 413) {
        throw new Error('Response too large - API returned too much data');
      } else if (response.status === 400) {
        throw new Error('Invalid API parameters');
      } else if (response.status === 404) {
        throw new Error('API endpoint not found');
      }
      
      throw new Error(`HTTP error ${response.status}: ${errorText.substring(0, 100)}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textContent = await response.text();
      console.error(`Non-JSON response from ${url.toString()}:`, textContent.substring(0, 200));
      throw new Error(`Expected JSON but got ${contentType}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched data from ${url.toString()}`);
    return data;
    
  } catch (error) {
    console.error(`API request failed for ${url.toString()}:`, error.message);
    throw error;
  }
};

// Test API connectivity
const testApiConnectivity = async (): Promise<boolean> => {
  try {
    console.log('Testing API connectivity...');
    
    // Test with a minimal request
    const data = await makeRiksdagApiRequest('/personlista/', { 
      p: 1,
      parti: 'S' // Small subset to test connectivity
    });
    
    if (data && data.personlista) {
      console.log('✅ API connectivity test successful');
      return true;
    }
    
    console.warn('⚠️ API returned unexpected structure');
    return false;
    
  } catch (error) {
    console.error('❌ API connectivity test failed:', error.message);
    return false;
  }
};

// Create test data when API is unavailable
const createTestData = () => {
  console.log('Creating test data due to API unavailability...');
  
  const testMembers: RiksdagMember[] = [
    {
      id: 'test_s_001',
      fnamn: 'Anna',
      enamn: 'Andersson',
      parti: 'S',
      valkrets: 'Stockholms län',
      kon: 'K',
      fodd: '1975',
      bild_url: 'https://example.com/placeholder.jpg'
    },
    {
      id: 'test_m_001', 
      fnamn: 'Lars',
      enamn: 'Larsson',
      parti: 'M',
      valkrets: 'Västra Götalands län',
      kon: 'M',
      fodd: '1968',
      bild_url: 'https://example.com/placeholder.jpg'
    },
    {
      id: 'test_sd_001',
      fnamn: 'Erik',
      enamn: 'Eriksson', 
      parti: 'SD',
      valkrets: 'Skåne län',
      kon: 'M',
      fodd: '1980',
      bild_url: 'https://example.com/placeholder.jpg'
    }
  ];

  return { members: testMembers };
};

// Fetch members with proper error handling
const fetchMembersData = async (): Promise<{ members: RiksdagMember[]; apiAvailable: boolean }> => {
  try {
    console.log('Fetching members from Riksdag API...');
    
    // Test API first
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
          kategori: 'nuvarande'
        });
        
        const partyMembers = data.personlista?.person || [];
        allMembers = allMembers.concat(partyMembers);
        console.log(`Fetched ${partyMembers.length} members for ${parti}`);
        
        // Small delay between requests to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (partyError) {
        console.warn(`Failed to fetch members for party ${parti}:`, partyError.message);
        // Continue with other parties
      }
    }
    
    console.log(`Total members fetched: ${allMembers.length}`);
    return { members: allMembers, apiAvailable: true };
    
  } catch (error) {
    console.error('Failed to fetch members from API:', error.message);
    console.log('Falling back to test data');
    const testData = createTestData();
    return { members: testData.members, apiAvailable: false };
  }
};

// Transform member data for database storage
const transformMemberData = (members: RiksdagMember[]) => {
  return members.map(member => ({
    member_id: member.id,
    first_name: member.fnamn,
    last_name: member.enamn,
    party: member.parti,
    constituency: member.valkrets,
    gender: member.kon === 'K' ? 'kvinna' : 'man',
    birth_year: member.fodd ? parseInt(member.fodd) : null,
    riksdag_status: 'Riksdagsledamot',
    is_active: true,
    image_urls: member.bild_url ? {
      large: member.bild_url,
      medium: member.bild_url,
      small: member.bild_url
    } : {},
    assignments: member.uppdrag || [],
    current_committees: member.uppdrag?.map(u => u.organ).filter(Boolean) || []
  }));
};

// Transform member data for party statistics
const transformPartyData = (members: RiksdagMember[]) => {
  const partyStats: { [key: string]: any } = {};
  
  members.forEach(member => {
    if (!partyStats[member.parti]) {
      partyStats[member.parti] = {
        party_code: member.parti,
        party_name: getPartyName(member.parti),
        total_members: 0,
        active_members: 0,
        gender_distribution: { male: 0, female: 0 },
        age_distribution: { '20-30': 0, '31-40': 0, '41-50': 0, '51-60': 0, '61+': 0 },
        member_list: []
      };
    }
    
    const party = partyStats[member.parti];
    party.total_members++;
    party.active_members++;
    
    // Gender statistics
    if (member.kon === 'M') party.gender_distribution.male++;
    if (member.kon === 'K') party.gender_distribution.female++;
    
    // Age statistics
    if (member.fodd) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - parseInt(member.fodd);
      if (age <= 30) party.age_distribution['20-30']++;
      else if (age <= 40) party.age_distribution['31-40']++;
      else if (age <= 50) party.age_distribution['41-50']++;
      else if (age <= 60) party.age_distribution['51-60']++;
      else party.age_distribution['61+']++;
    }
    
    // Member list
    party.member_list.push({
      member_id: member.id,
      first_name: member.fnamn,
      last_name: member.enamn,
      constituency: member.valkrets,
      birth_year: member.fodd ? parseInt(member.fodd) : null,
      gender: member.kon === 'K' ? 'kvinna' : 'man'
    });
  });
  
  return Object.values(partyStats);
};

// Get party full name
const getPartyName = (code: string): string => {
  const partyNames: { [key: string]: string } = {
    'S': 'Socialdemokraterna',
    'M': 'Moderaterna', 
    'SD': 'Sverigedemokraterna',
    'C': 'Centerpartiet',
    'V': 'Vänsterpartiet',
    'KD': 'Kristdemokraterna',
    'L': 'Liberalerna',
    'MP': 'Miljöpartiet'
  };
  return partyNames[code] || code;
};

// Safe database insertion
const safeInsertData = async (supabase: any, tableName: string, data: any[], conflictColumn: string) => {
  if (!data || data.length === 0) {
    console.log(`No data to insert for ${tableName}`);
    return { success: true, processed: 0 };
  }

  console.log(`Inserting ${data.length} records into ${tableName}`);
  
  try {
    const { error, count } = await supabase
      .from(tableName)
      .upsert(data, { onConflict: conflictColumn, count: 'exact' });
    
    if (error) {
      console.error(`Database error for ${tableName}:`, error);
      return { success: false, processed: 0 };
    }
    
    console.log(`Successfully inserted ${count || data.length} records into ${tableName}`);
    return { success: true, processed: count || data.length };
    
  } catch (insertError) {
    console.error(`Insert error for ${tableName}:`, insertError);
    return { success: false, processed: 0 };
  }
};

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

    // Phase 1: Test API and fetch members
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

    // Skip other phases for now as they require more complex API interactions
    console.log('=== Skipping advanced data phases ===');
    stats.warnings.push('Advanced data collection (documents, votes, speeches) skipped - focusing on core member/party data with corrected API');

    const syncDuration = Date.now() - startTime;

    // Log sync operation
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

    console.log(`=== CORRECTED API SYNC COMPLETED ===`);
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

  } catch (error) {
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
