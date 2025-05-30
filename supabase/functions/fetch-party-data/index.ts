import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Party {
  id: string;
  name: string;
  abbreviation: string;
  website_url: string;
  logo_url: string;
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  party_id: string;
  role: string;
  district: string;
  image_url: string;
}

interface Document {
  id: string;
  title: string;
  subtitle: string;
  doc_date: string;
  category: string;
  url: string;
}

interface Vote {
  id: string;
  dok_id: string;
  rm: string;
  beteckning: string;
  punkt: string;
  votering_id: string;
  datum: string;
  tid: string;
  rost_id: string;
  namn: string;
  parti: string;
  valkrets: string;
  rost: string;
}

interface Speech {
  id: string;
  dok_id: string;
  anforande_nummer: string;
  talare: string;
  parti: string;
  anforandetext: string;
  datumtid: string;
}

const fetchParties = async (): Promise<Party[]> => {
  const url = 'https://data.riksdagen.se/partier.json';
  const response = await fetch(url);
  const data = await response.json();
  return data.partier.parti.map((p: any) => ({
    id: p.kod,
    name: p.namn,
    abbreviation: p.beteckning,
    website_url: p.webbadress,
    logo_url: p.bild_url
  }));
};

const fetchMembers = async (partyId: string): Promise<Member[]> => {
  const url = `https://data.riksdagen.se/personlista/?iid=&fnamn=&enamn=&parti=${partyId}&valkrets=&rdlstatus=tjanst&utformat=json&sort=efternamn`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.personlista || !data.personlista.person) {
    console.warn(`No members found for party ${partyId}`);
    return [];
  }

  const members = Array.isArray(data.personlista.person) ? data.personlista.person : [data.personlista.person];

  return members.map((m: any) => ({
    id: m.intressent_id,
    first_name: m.fornamn,
    last_name: m.efternamn,
    party_id: m.parti,
    role: m.roll_kod,
    district: m.valkrets,
    image_url: m.bild_url
  }));
};

const fetchDocuments = async (): Promise<Document[]> => {
  const url = 'https://data.riksdagen.se/dokumentlista/?sok=&doktyp=mot,prop&utformat=json&sort=datum&sortorder=desc&sz=500';
  const response = await fetch(url);
  const data = await response.json();

  if (!data.dokumentlista || !data.dokumentlista.dokument) {
    console.warn('No documents found');
    return [];
  }

  const documents = Array.isArray(data.dokumentlista.dokument) ? data.dokumentlista.dokument : [data.dokumentlista.dokument];

  return documents.map((d: any) => ({
    id: d.dok_id,
    title: d.titel,
    subtitle: d.subtitel,
    doc_date: d.datum,
    category: d.doktyp,
    url: d.dokument_url_html
  }));
};

const fetchVotes = async (): Promise<Vote[]> => {
  const url = 'https://data.riksdagen.se/voteringlista/?rm=latest&bet=&hang=&punkt=&votering=&utformat=json&gruppering=votering';
  const response = await fetch(url);
  const data = await response.json();

  if (!data.voteringlista || !data.voteringlista.votering) {
    console.warn('No votes found');
    return [];
  }

  const votes = Array.isArray(data.voteringlista.votering) ? data.voteringlista.votering : [data.voteringlista.votering];

  const allVotes: Vote[] = [];
  for (const vote of votes) {
    if (vote.personroster && vote.personroster.roster) {
      const roster = Array.isArray(vote.personroster.roster) ? vote.personroster.roster : [vote.personroster.roster];
      roster.forEach((r: any) => {
        allVotes.push({
          id: `${vote.votering_id}-${r.namn}`,
          dok_id: vote.dok_id,
          rm: vote.rm,
          beteckning: vote.beteckning,
          punkt: vote.punkt,
          votering_id: vote.votering_id,
          datum: vote.datum,
          tid: vote.tid,
          rost_id: r.rost_id,
          namn: r.namn,
          parti: r.parti,
          valkrets: r.valkrets,
          rost: r.rost
        });
      });
    }
  }
  return allVotes;
};

const fetchSpeeches = async (): Promise<Speech[]> => {
  const url = 'https://data.riksdagen.se/anforandeforlista/?doktyp=tal&utformat=json&sort=datumtid&sortorder=desc&sz=500';
  const response = await fetch(url);
  const data = await response.json();

  if (!data.anforandelista || !data.anforandelista.anforande) {
    console.warn('No speeches found');
    return [];
  }

  const speeches = Array.isArray(data.anforandelista.anforande) ? data.anforandelista.anforande : [data.anforandelista.anforande];

  return speeches.map((s: any) => ({
    id: s.dok_id,
    dok_id: s.dok_id,
    anforande_nummer: s.anforande_nummer,
    talare: s.talare,
    parti: s.parti,
    anforandetext: s.anforandetext,
    datumtid: s.datumtid
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
    let totalStats = {
      parties_processed: 0,
      members_processed: 0,
      documents_processed: 0,
      votes_processed: 0,
      speeches_processed: 0,
      calendar_events_processed: 0,
      errors_count: 0
    };

    // Sync Parties
    console.log('Syncing parties...');
    try {
      const parties = await fetchParties();
      totalStats.parties_processed = parties.length;

      const { error: partyError } = await supabase
        .from('parties')
        .upsert(parties, { onConflict: 'id' });

      if (partyError) {
        console.error('Error inserting parties:', partyError);
        totalStats.errors_count++;
      }
    } catch (error) {
      console.error('Error fetching or inserting parties:', error);
      totalStats.errors_count++;
    }

    // Sync Members
    console.log('Syncing members...');
    try {
      const parties = await fetchParties();
      let allMembers: Member[] = [];

      for (const party of parties) {
        const members = await fetchMembers(party.id);
        allMembers = allMembers.concat(members);
      }

      totalStats.members_processed = allMembers.length;

      const { error: memberError } = await supabase
        .from('members')
        .upsert(allMembers, { onConflict: 'id' });

      if (memberError) {
        console.error('Error inserting members:', memberError);
        totalStats.errors_count++;
      }
    } catch (error) {
      console.error('Error fetching or inserting members:', error);
      totalStats.errors_count++;
    }

    // Sync Documents
    console.log('Syncing documents...');
    try {
      const documents = await fetchDocuments();
      totalStats.documents_processed = documents.length;

      const { error: documentError } = await supabase
        .from('documents')
        .upsert(documents, { onConflict: 'id' });

      if (documentError) {
        console.error('Error inserting documents:', documentError);
        totalStats.errors_count++;
      }
    } catch (error) {
      console.error('Error fetching or inserting documents:', error);
      totalStats.errors_count++;
    }

    // Sync Votes
    console.log('Syncing votes...');
    try {
      const votes = await fetchVotes();
      totalStats.votes_processed = votes.length;

      const { error: voteError } = await supabase
        .from('votes')
        .upsert(votes, { onConflict: 'id' });

      if (voteError) {
        console.error('Error inserting votes:', voteError);
        totalStats.errors_count++;
      }
    } catch (error) {
      console.error('Error fetching or inserting votes:', error);
      totalStats.errors_count++;
    }

    // Sync Speeches
    console.log('Syncing speeches...');
    try {
      const speeches = await fetchSpeeches();
      totalStats.speeches_processed = speeches.length;

      const { error: speechError } = await supabase
        .from('speeches')
        .upsert(speeches, { onConflict: 'id' });

      if (speechError) {
        console.error('Error inserting speeches:', speechError);
        totalStats.errors_count++;
      }
    } catch (error) {
      console.error('Error fetching or inserting speeches:', error);
      totalStats.errors_count++;
    }

    // Add calendar data sync
    console.log('Starting calendar data sync...');
    try {
      const calendarResponse = await supabase.functions.invoke('fetch-calendar-data');
      
      if (calendarResponse.data?.success) {
        totalStats.calendar_events_processed = calendarResponse.data.stats?.events_processed || 0;
        console.log(`Calendar sync completed: ${totalStats.calendar_events_processed} events processed`);
      } else {
        console.error('Calendar sync failed:', calendarResponse.error);
        totalStats.errors_count++;
      }
    } catch (calendarError) {
      console.error('Error in calendar sync:', calendarError);
      totalStats.errors_count++;
    }

    const syncDuration = Date.now() - startTime;

    // Log the comprehensive sync operation
    const { error: logError } = await supabase
      .from('data_sync_log')
      .insert({
        sync_type: 'comprehensive',
        status: totalStats.errors_count > 0 ? 'partial_success' : 'success',
        parties_processed: totalStats.parties_processed,
        members_processed: totalStats.members_processed,
        documents_processed: totalStats.documents_processed,
        votes_processed: totalStats.votes_processed,
        speeches_processed: totalStats.speeches_processed,
        calendar_events_processed: totalStats.calendar_events_processed,
        errors_count: totalStats.errors_count,
        sync_duration_ms: syncDuration,
        error_details: totalStats.errors_count > 0 ? { 
          message: `Comprehensive sync completed with ${totalStats.errors_count} errors` 
        } : null
      });

    if (logError) {
      console.error('Error logging comprehensive sync operation:', logError);
    }

    console.log(`Comprehensive sync completed in ${syncDuration}ms:`, totalStats);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Comprehensive data sync completed successfully',
        stats: totalStats,
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
