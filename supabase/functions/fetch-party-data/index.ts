
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Committee mapping for better data organization
const COMMITTEE_MAPPING: { [key: string]: string } = {
  'AU': 'Arbetsmarknadsutskottet',
  'CU': 'Civilutskottet', 
  'FiU': 'Finansutskottet',
  'FöU': 'Försvarsutskottet',
  'JuU': 'Justitieutskottet',
  'KU': 'Konstitutionsutskottet',
  'KrU': 'Kulturutskottet',
  'MjU': 'Miljö- och jordbruksutskottet',
  'NU': 'Näringsutskottet',
  'SkU': 'Skatteutskottet',
  'SfU': 'Socialförsäkringsutskottet',
  'SoU': 'Socialutskottet',
  'TU': 'Trafikutskottet',
  'UbU': 'Utbildningsutskottet',
  'UU': 'Utrikesutskottet',
  'UFöU': 'Sammansatta utrikes- och försvarsutskottet',
  'EUN': 'EU-nämnden',
  'SäU': 'Säkerhetsutskottet'
};

const VALID_COMMITTEE_CODES = Object.keys(COMMITTEE_MAPPING);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let syncLogId: string | null = null;

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting enhanced party data fetch...')

    // Log sync start
    const { data: syncLog, error: syncLogError } = await supabaseClient
      .from('data_sync_log')
      .insert({
        sync_type: 'manual',
        status: 'running'
      })
      .select('id')
      .single();

    if (syncLogError) {
      console.error('Error creating sync log:', syncLogError);
    } else {
      syncLogId = syncLog.id;
    }

    // Fetch members from Riksdag API
    const membersResponse = await fetch('https://data.riksdagen.se/personlista/?iid=&fnamn=&enamn=&f_ar=&kon=&parti=&valkrets=&rdlstatus=&org=&utformat=json&sort=sorteringsnamn&sortorder=asc');
    
    if (!membersResponse.ok) {
      throw new Error(`Failed to fetch members: ${membersResponse.status}`);
    }

    const membersData = await membersResponse.json();
    const members = membersData?.personlista?.person || [];

    console.log(`Fetched ${members.length} members from API`)

    // Process members and collect committee information
    const memberInserts = [];
    const partyStats = new Map();
    const committeeStats = new Map();
    let processedMembers = 0;
    let errorCount = 0;

    for (const member of members) {
      try {
        // Calculate age
        const currentYear = new Date().getFullYear();
        const birthYear = parseInt(member.fodd_ar);
        const age = !isNaN(birthYear) ? currentYear - birthYear : null;

        // Extract committee assignments
        let committeeAssignments = [];
        let currentCommittees = [];
        
        if (member.personuppdrag?.uppdrag) {
          const assignments = Array.isArray(member.personuppdrag.uppdrag) 
            ? member.personuppdrag.uppdrag 
            : [member.personuppdrag.uppdrag];
          
          const currentDate = new Date();
          
          assignments.forEach(assignment => {
            if (assignment && assignment.organ_kod) {
              const organKod = assignment.organ_kod;
              
              // Only include valid committee codes
              if (VALID_COMMITTEE_CODES.includes(organKod)) {
                const assignmentData = {
                  organ_kod: organKod,
                  organ_namn: COMMITTEE_MAPPING[organKod] || organKod,
                  roll: assignment.roll_kod || assignment.roll || 'ledamot',
                  status: assignment.status || 'aktiv',
                  from: assignment.from || assignment.datum_fran || '',
                  tom: assignment.tom || assignment.datum_tom || '',
                  typ: assignment.typ || 'uppdrag'
                };
                
                committeeAssignments.push(assignmentData);
                
                // Check if assignment is current
                if (!assignment.tom || assignment.tom.trim() === '') {
                  currentCommittees.push(organKod);
                } else {
                  try {
                    const endDate = new Date(assignment.tom);
                    if (endDate > currentDate) {
                      currentCommittees.push(organKod);
                    }
                  } catch (e) {
                    // If date parsing fails, assume it's current
                    currentCommittees.push(organKod);
                  }
                }
              }
            }
          });
        }

        // Prepare member data with enhanced information
        const memberData = {
          member_id: member.intressent_id,
          first_name: member.tilltalsnamn || member.fornamn,
          last_name: member.efternamn,
          party: member.parti,
          constituency: member.valkrets,
          gender: member.kon,
          birth_year: birthYear,
          is_active: member.status === 'Tjänstgörande' || !member.status,
          riksdag_status: member.status || 'Okänd',
          current_committees: currentCommittees,
          committee_assignments: committeeAssignments,
          image_urls: {
            small: member.bild_url_80,
            medium: member.bild_url_192,
            large: member.bild_url_max
          },
          assignments: [], // Legacy field for compatibility
          activity_data: {
            speeches: 0,
            motions: 0,
            interpellations: 0,
            written_questions: 0
          }
        };

        memberInserts.push(memberData);
        processedMembers++;

        // Update party statistics
        const party = member.parti;
        if (!partyStats.has(party)) {
          partyStats.set(party, {
            party_code: party,
            party_name: party,
            total_members: 0,
            active_members: 0,
            gender_distribution: { male: 0, female: 0 },
            age_distribution: { '20-30': 0, '31-40': 0, '41-50': 0, '51-60': 0, '61+': 0 },
            committee_distribution: {},
            committee_members: {},
            member_list: [],
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
        stats.member_list.push({
          id: member.intressent_id,
          name: `${memberData.first_name} ${memberData.last_name}`,
          committees: currentCommittees
        });
        
        // Count gender (convert percentages to counts)
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

        // Track committee distribution for party
        currentCommittees.forEach(committee => {
          if (!stats.committee_distribution[committee]) {
            stats.committee_distribution[committee] = 0;
          }
          stats.committee_distribution[committee]++;
          
          if (!stats.committee_members[committee]) {
            stats.committee_members[committee] = [];
          }
          stats.committee_members[committee].push({
            id: member.intressent_id,
            name: `${memberData.first_name} ${memberData.last_name}`,
            role: committeeAssignments.find(a => a.organ_kod === committee)?.roll || 'ledamot'
          });
        });

        // Check if member is currently active
        if (memberData.is_active) {
          stats.active_members++;
        }

      } catch (error) {
        console.error(`Error processing member ${member.intressent_id}:`, error);
        errorCount++;
      }
    }

    // Convert gender counts to percentages for party stats
    partyStats.forEach(stats => {
      const totalMembers = stats.total_members;
      if (totalMembers > 0) {
        stats.gender_distribution = {
          male: Math.round((stats.gender_distribution.male / totalMembers) * 100),
          female: Math.round((stats.gender_distribution.female / totalMembers) * 100)
        };
      }
    });

    // Clear existing data and insert new data
    console.log('Clearing existing member data...')
    await supabaseClient.from('member_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('Inserting enhanced member data...')
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
    console.log('Inserting enhanced party data...')
    const { error: partyError } = await supabaseClient
      .from('party_data')
      .insert(partyInserts);

    if (partyError) {
      console.error('Error inserting party data:', partyError);
      throw partyError;
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Update sync log with success
    if (syncLogId) {
      await supabaseClient
        .from('data_sync_log')
        .update({
          status: 'completed',
          members_processed: processedMembers,
          parties_processed: partyInserts.length,
          errors_count: errorCount,
          sync_duration_ms: duration
        })
        .eq('id', syncLogId);
    }

    console.log(`Successfully processed ${processedMembers} members and ${partyInserts.length} parties in ${duration}ms`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${processedMembers} members and ${partyInserts.length} parties`,
        sync_duration_ms: duration,
        errors_count: errorCount,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.error('Error in fetch-party-data function:', error)
    
    // Update sync log with error
    if (syncLogId) {
      try {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        
        await supabaseClient
          .from('data_sync_log')
          .update({
            status: 'failed',
            sync_duration_ms: duration,
            error_details: { error: error.message, stack: error.stack }
          })
          .eq('id', syncLogId);
      } catch (logError) {
        console.error('Error updating sync log:', logError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        sync_duration_ms: duration,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
