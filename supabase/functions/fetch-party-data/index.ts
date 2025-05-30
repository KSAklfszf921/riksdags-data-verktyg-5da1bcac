
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting party data fetch...')

    // Fetch members from Riksdag API
    const membersResponse = await fetch('https://data.riksdagen.se/personlista/?iid=&fnamn=&enamn=&f_ar=&kon=&parti=&valkrets=&rdlstatus=&org=&utformat=json&sort=sorteringsnamn&sortorder=asc');
    
    if (!membersResponse.ok) {
      throw new Error(`Failed to fetch members: ${membersResponse.status}`);
    }

    const membersData = await membersResponse.json();
    const members = membersData?.personlista?.person || [];

    console.log(`Fetched ${members.length} members from API`)

    // Process and store member data
    const memberInserts = [];
    const partyStats = new Map();

    for (const member of members) {
      // Calculate age
      const currentYear = new Date().getFullYear();
      const birthYear = parseInt(member.fodd_ar);
      const age = !isNaN(birthYear) ? currentYear - birthYear : null;

      // Prepare member data
      const memberData = {
        member_id: member.intressent_id,
        first_name: member.tilltalsnamn || member.fornamn,
        last_name: member.efternamn,
        party: member.parti,
        constituency: member.valkrets,
        gender: member.kon,
        birth_year: birthYear,
        assignments: [], // Will be populated if we fetch assignments
        activity_data: {
          speeches: 0,
          motions: 0,
          interpellations: 0,
          written_questions: 0
        }
      };

      memberInserts.push(memberData);

      // Update party statistics
      const party = member.parti;
      if (!partyStats.has(party)) {
        partyStats.set(party, {
          party_code: party,
          party_name: party, // In a real implementation, you might want a mapping
          total_members: 0,
          active_members: 0,
          gender_distribution: { male: 0, female: 0 },
          age_distribution: { '20-30': 0, '31-40': 0, '41-50': 0, '51-60': 0, '61+': 0 },
          committee_distribution: {},
          activity_stats: {
            total_speeches: 0,
            total_motions: 0,
            total_interpellations: 0,
            total_written_questions: 0
          }
        });
      }

      const stats = partyStats.get(party);
      stats.total_members++;
      
      // Count gender
      if (member.kon === 'man') {
        stats.gender_distribution.male++;
      } else if (member.kon === 'kvinna') {
        stats.gender_distribution.female++;
      }

      // Count age groups
      if (age) {
        if (age <= 30) stats.age_distribution['20-30']++;
        else if (age <= 40) stats.age_distribution['31-40']++;
        else if (age <= 50) stats.age_distribution['41-50']++;
        else if (age <= 60) stats.age_distribution['51-60']++;
        else stats.age_distribution['61+']++;
      }

      // Check if member is currently active
      if (member.status === 'Tjänstgörande') {
        stats.active_members++;
      }
    }

    // Clear existing data and insert new data
    console.log('Clearing existing member data...')
    await supabaseClient.from('member_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('Inserting member data...')
    const { error: memberError } = await supabaseClient
      .from('member_data')
      .insert(memberInserts);

    if (memberError) {
      console.error('Error inserting member data:', memberError);
      throw memberError;
    }

    // Insert party data
    console.log('Clearing existing party data...')
    await supabaseClient.from('party_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const partyInserts = Array.from(partyStats.values());
    console.log('Inserting party data...')
    const { error: partyError } = await supabaseClient
      .from('party_data')
      .insert(partyInserts);

    if (partyError) {
      console.error('Error inserting party data:', partyError);
      throw partyError;
    }

    console.log(`Successfully processed ${members.length} members and ${partyInserts.length} parties`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${members.length} members and ${partyInserts.length} parties`,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in fetch-party-data function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
