
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

const fetchRiksdagData = async (endpoint: string): Promise<any> => {
  const url = `https://data.riksdagen.se${endpoint}`;
  console.log(`Fetching: ${url}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status} for ${url}`);
  }
  
  const data = await response.json();
  return data;
};

const transformPartyData = (parties: RiksdagParty[], members: RiksdagMember[]) => {
  return parties.map(party => {
    const partyMembers = members.filter(m => m.parti === party.kod);
    const activeMembers = partyMembers.filter(m => 
      !m.datum_tom || new Date(m.datum_tom) > new Date()
    );

    const genderStats = {
      male: activeMembers.filter(m => m.kon === 'man').length,
      female: activeMembers.filter(m => m.kon === 'kvinna').length
    };

    const currentYear = new Date().getFullYear();
    const ageGroups = {
      '20-30': 0,
      '31-40': 0,
      '41-50': 0,
      '51-60': 0,
      '61+': 0
    };

    activeMembers.forEach(member => {
      const age = currentYear - parseInt(member.fodd_ar);
      if (age <= 30) ageGroups['20-30']++;
      else if (age <= 40) ageGroups['31-40']++;
      else if (age <= 50) ageGroups['41-50']++;
      else if (age <= 60) ageGroups['51-60']++;
      else ageGroups['61+']++;
    });

    return {
      party_code: party.kod,
      party_name: party.namn,
      total_members: partyMembers.length,
      active_members: activeMembers.length,
      gender_distribution: genderStats,
      age_distribution: ageGroups,
      member_list: activeMembers.map(m => ({
        member_id: m.intressent_id,
        first_name: m.fornamn,
        last_name: m.efternamn,
        constituency: m.valkrets,
        birth_year: parseInt(m.fodd_ar),
        gender: m.kon
      }))
    };
  });
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

const transformDocumentData = (documents: any[]) => {
  return documents.map(doc => ({
    document_id: doc.dok_id,
    titel: doc.titel,
    beteckning: doc.beteckning,
    datum: doc.datum,
    typ: doc.doktyp,
    organ: doc.organ,
    intressent_id: doc.intressent_id,
    document_url_html: doc.dokument_url_html,
    document_url_text: doc.dokument_url_text,
    summary: doc.summary || doc.notis,
    rm: doc.rm,
    hangar_id: doc.hangar_id,
    publicerad: doc.publicerad,
    dokumentstatus: doc.dokumentstatus
  }));
};

const transformVoteData = (votes: any[]) => {
  const voteGroups: { [key: string]: any } = {};
  
  votes.forEach(vote => {
    const voteId = vote.votering_id || `${vote.dok_id}-${vote.beteckning}-${vote.punkt}`;
    
    if (!voteGroups[voteId]) {
      voteGroups[voteId] = {
        vote_id: voteId,
        dok_id: vote.dok_id,
        rm: vote.rm,
        beteckning: vote.beteckning,
        punkt: vote.punkt,
        votering: vote.votering,
        avser: vote.avser,
        hangar_id: vote.hangar_id,
        systemdatum: vote.systemdatum,
        vote_results: [],
        party_breakdown: {},
        constituency_breakdown: {}
      };
    }
    
    const group = voteGroups[voteId];
    group.vote_results.push({
      member_id: vote.intressent_id,
      name: vote.namn,
      party: vote.parti,
      constituency: vote.valkrets,
      vote: vote.rost
    });
    
    // Update party breakdown
    if (!group.party_breakdown[vote.parti]) {
      group.party_breakdown[vote.parti] = { Ja: 0, Nej: 0, Avstår: 0, Frånvarande: 0 };
    }
    group.party_breakdown[vote.parti][vote.rost]++;
    
    // Update constituency breakdown
    if (!group.constituency_breakdown[vote.valkrets]) {
      group.constituency_breakdown[vote.valkrets] = { Ja: 0, Nej: 0, Avstår: 0, Frånvarande: 0 };
    }
    group.constituency_breakdown[vote.valkrets][vote.rost]++;
  });
  
  return Object.values(voteGroups);
};

const transformSpeechData = (speeches: any[]) => {
  return speeches.map(speech => ({
    speech_id: speech.anforande_id || `${speech.dok_id}-${speech.anforande_nummer}`,
    anforande_id: speech.anforande_id,
    intressent_id: speech.intressent_id,
    rel_dok_id: speech.rel_dok_id,
    namn: speech.namn,
    party: speech.parti,
    anforandedatum: speech.anforandedatum,
    anforandetext: speech.anforandetext,
    anforandetyp: speech.anforandetyp,
    kammaraktivitet: speech.kammaraktivitet,
    anforande_nummer: speech.anforande_nummer,
    talare: speech.talare,
    rel_dok_titel: speech.rel_dok_titel,
    rel_dok_beteckning: speech.rel_dok_beteckning,
    anforande_url_html: speech.anforande_url_html,
    anf_klockslag: speech.anf_klockslag,
    word_count: speech.anforandetext ? speech.anforandetext.split(' ').length : 0,
    content_summary: speech.anforandetext ? speech.anforandetext.substring(0, 500) : null
  }));
};

const transformCalendarData = (events: any[]) => {
  return events.map(event => ({
    event_id: event.id || `${event.datum}-${event.tid}-${event.organ}`,
    datum: event.datum,
    tid: event.tid,
    summary: event.summary || event.aktivitet,
    organ: event.organ,
    typ: event.typ,
    aktivitet: event.aktivitet,
    plats: event.plats,
    status: event.status,
    url: event.url,
    sekretess: event.sekretess,
    description: event.description
  }));
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting comprehensive data sync...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const startTime = Date.now();
    let stats = {
      parties_processed: 0,
      members_processed: 0,
      documents_processed: 0,
      votes_processed: 0,
      speeches_processed: 0,
      calendar_events_processed: 0,
      errors_count: 0
    };

    // 1. Fetch and process parties
    try {
      console.log('Fetching parties...');
      const partiesData = await fetchRiksdagData('/partier.json');
      const parties = partiesData.partier?.parti || [];
      
      console.log('Fetching members...');
      const membersData = await fetchRiksdagData('/personlista/?utformat=json');
      const members = membersData.personlista?.person || [];
      
      const transformedParties = transformPartyData(parties, members);
      const transformedMembers = transformMemberData(members);
      
      stats.parties_processed = transformedParties.length;
      stats.members_processed = transformedMembers.length;
      
      // Insert party data
      const { error: partyError } = await supabase
        .from('party_data')
        .upsert(transformedParties, { onConflict: 'party_code' });
      
      if (partyError) {
        console.error('Party data error:', partyError);
        stats.errors_count++;
      }
      
      // Insert member data
      const { error: memberError } = await supabase
        .from('member_data')
        .upsert(transformedMembers, { onConflict: 'member_id' });
      
      if (memberError) {
        console.error('Member data error:', memberError);
        stats.errors_count++;
      }
      
    } catch (error) {
      console.error('Error processing parties/members:', error);
      stats.errors_count++;
    }

    // 2. Fetch and process documents
    try {
      console.log('Fetching documents...');
      const documentsData = await fetchRiksdagData('/dokumentlista/?doktyp=mot,prop&utformat=json&sz=500&sort=datum&sortorder=desc');
      const documents = documentsData.dokumentlista?.dokument || [];
      
      const transformedDocuments = transformDocumentData(documents);
      stats.documents_processed = transformedDocuments.length;
      
      const { error: docError } = await supabase
        .from('document_data')
        .upsert(transformedDocuments, { onConflict: 'document_id' });
      
      if (docError) {
        console.error('Document data error:', docError);
        stats.errors_count++;
      }
      
    } catch (error) {
      console.error('Error processing documents:', error);
      stats.errors_count++;
    }

    // 3. Fetch and process votes
    try {
      console.log('Fetching votes...');
      const votesData = await fetchRiksdagData('/voteringlista/?rm=latest&utformat=json&sz=500&gruppering=votering');
      
      let allVotes: any[] = [];
      if (votesData.voteringlista?.votering) {
        const votings = Array.isArray(votesData.voteringlista.votering) 
          ? votesData.voteringlista.votering 
          : [votesData.voteringlista.votering];
        
        votings.forEach(voting => {
          if (voting.personroster?.roster) {
            const roster = Array.isArray(voting.personroster.roster) 
              ? voting.personroster.roster 
              : [voting.personroster.roster];
            
            roster.forEach(vote => {
              allVotes.push({
                ...vote,
                votering_id: voting.votering_id,
                dok_id: voting.dok_id,
                rm: voting.rm,
                beteckning: voting.beteckning,
                punkt: voting.punkt,
                votering: voting.votering,
                avser: voting.avser,
                hangar_id: voting.hangar_id,
                systemdatum: voting.systemdatum
              });
            });
          }
        });
      }
      
      const transformedVotes = transformVoteData(allVotes);
      stats.votes_processed = transformedVotes.length;
      
      const { error: voteError } = await supabase
        .from('vote_data')
        .upsert(transformedVotes, { onConflict: 'vote_id' });
      
      if (voteError) {
        console.error('Vote data error:', voteError);
        stats.errors_count++;
      }
      
    } catch (error) {
      console.error('Error processing votes:', error);
      stats.errors_count++;
    }

    // 4. Fetch and process speeches
    try {
      console.log('Fetching speeches...');
      const speechesData = await fetchRiksdagData('/anforandelista/?utformat=json&sz=500&sort=datumtid&sortorder=desc');
      const speeches = speechesData.anforandelista?.anforande || [];
      
      const transformedSpeeches = transformSpeechData(speeches);
      stats.speeches_processed = transformedSpeeches.length;
      
      const { error: speechError } = await supabase
        .from('speech_data')
        .upsert(transformedSpeeches, { onConflict: 'speech_id' });
      
      if (speechError) {
        console.error('Speech data error:', speechError);
        stats.errors_count++;
      }
      
    } catch (error) {
      console.error('Error processing speeches:', error);
      stats.errors_count++;
    }

    // 5. Fetch and process calendar events
    try {
      console.log('Fetching calendar events...');
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
      const fromDate = today.toISOString().split('T')[0];
      const toDate = nextMonth.toISOString().split('T')[0];
      
      const calendarData = await fetchRiksdagData(`/kalender/?utformat=json&from=${fromDate}&tom=${toDate}&sz=500`);
      const events = calendarData.kalenderlista?.kalender || [];
      
      const transformedEvents = transformCalendarData(events);
      stats.calendar_events_processed = transformedEvents.length;
      
      const { error: calendarError } = await supabase
        .from('calendar_data')
        .upsert(transformedEvents, { onConflict: 'event_id' });
      
      if (calendarError) {
        console.error('Calendar data error:', calendarError);
        stats.errors_count++;
      }
      
    } catch (error) {
      console.error('Error processing calendar events:', error);
      stats.errors_count++;
    }

    const syncDuration = Date.now() - startTime;

    // Log the sync operation
    const { error: logError } = await supabase
      .from('data_sync_log')
      .insert({
        sync_type: 'comprehensive_data_sync',
        status: stats.errors_count > 0 ? 'partial_success' : 'success',
        parties_processed: stats.parties_processed,
        members_processed: stats.members_processed,
        documents_processed: stats.documents_processed,
        votes_processed: stats.votes_processed,
        speeches_processed: stats.speeches_processed,
        calendar_events_processed: stats.calendar_events_processed,
        errors_count: stats.errors_count,
        sync_duration_ms: syncDuration,
        error_details: stats.errors_count > 0 ? { 
          message: `Sync completed with ${stats.errors_count} errors` 
        } : null
      });

    if (logError) {
      console.error('Error logging sync operation:', logError);
    }

    console.log(`Comprehensive sync completed in ${syncDuration}ms:`, stats);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Comprehensive data sync completed successfully',
        stats,
        duration_ms: syncDuration
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Fatal error in comprehensive sync:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
