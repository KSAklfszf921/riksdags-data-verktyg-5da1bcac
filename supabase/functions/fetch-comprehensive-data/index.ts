
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

const fetchRiksdagData = async (endpoint: string, retries = 3): Promise<any> => {
  const url = `https://data.riksdagen.se${endpoint}`;
  console.log(`Fetching: ${url}`);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Riksdag-Data-Sync/2.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status} for ${url}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn(`Non-JSON response from ${url}, content-type: ${contentType}`);
        if (attempt === retries) {
          throw new Error(`Invalid content type: ${contentType}`);
        }
        continue;
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Attempt ${attempt}/${retries} failed for ${url}:`, error);
      if (attempt === retries) {
        throw error;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

const fetchPartiesAndMembers = async () => {
  console.log('Fetching parties and members...');
  
  // Hämta medlemmar först (detta fungerar)
  const membersData = await fetchRiksdagData('/personlista/?utformat=json&rdlstatus=tjanstgorande');
  const members = membersData.personlista?.person || [];
  console.log(`Found ${members.length} members`);
  
  // Skapa parti-data från medlemsdata (eftersom partier-API:t inte fungerar)
  const partyStats: { [key: string]: any } = {};
  
  members.forEach((member: RiksdagMember) => {
    if (!partyStats[member.parti]) {
      partyStats[member.parti] = {
        kod: member.parti,
        namn: member.parti, // Vi får använda koden som namn tills vi hittar bättre data
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
    
    // Kontrollera om medlemmen är aktiv
    const isActive = !member.datum_tom || new Date(member.datum_tom) > new Date();
    if (isActive) {
      party.activeMembers++;
      
      // Könsstatistik
      if (member.kon === 'man') party.genderStats.male++;
      if (member.kon === 'kvinna') party.genderStats.female++;
      
      // Åldersfördelning
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
};

const transformPartyData = (partiesData: any[]) => {
  return partiesData.map(party => ({
    party_code: party.kod,
    party_name: party.namn,
    total_members: party.totalMembers,
    active_members: party.activeMembers,
    gender_distribution: party.genderStats,
    age_distribution: party.ageGroups,
    member_list: party.members.map((m: RiksdagMember) => ({
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
  console.log(`Processing ${votes.length} individual vote records...`);
  
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
    
    // Uppdatera partifördelning
    if (!group.party_breakdown[vote.parti]) {
      group.party_breakdown[vote.parti] = { Ja: 0, Nej: 0, Avstår: 0, Frånvarande: 0 };
    }
    group.party_breakdown[vote.parti][vote.rost || 'Frånvarande']++;
    
    // Uppdatera valkretsfördelning
    if (!group.constituency_breakdown[vote.valkrets]) {
      group.constituency_breakdown[vote.valkrets] = { Ja: 0, Nej: 0, Avstår: 0, Frånvarande: 0 };
    }
    group.constituency_breakdown[vote.valkrets][vote.rost || 'Frånvarande']++;
  });
  
  const groupedVotes = Object.values(voteGroups);
  console.log(`Grouped into ${groupedVotes.length} vote events`);
  return groupedVotes;
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting enhanced comprehensive data sync...');

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
      errors_count: 0,
      warnings: [] as string[]
    };

    // 1. Hämta och bearbeta partier och medlemmar
    try {
      console.log('=== Phase 1: Parties and Members ===');
      const { parties, members } = await fetchPartiesAndMembers();
      
      const transformedParties = transformPartyData(parties);
      const transformedMembers = transformMemberData(members);
      
      stats.parties_processed = transformedParties.length;
      stats.members_processed = transformedMembers.length;
      
      console.log(`Processed ${stats.parties_processed} parties and ${stats.members_processed} members`);
      
      // Infoga partidata
      const { error: partyError } = await supabase
        .from('party_data')
        .upsert(transformedParties, { onConflict: 'party_code' });
      
      if (partyError) {
        console.error('Party data error:', partyError);
        stats.errors_count++;
      }
      
      // Infoga medlemsdata i batches
      const batchSize = 100;
      for (let i = 0; i < transformedMembers.length; i += batchSize) {
        const batch = transformedMembers.slice(i, i + batchSize);
        const { error: memberError } = await supabase
          .from('member_data')
          .upsert(batch, { onConflict: 'member_id' });
        
        if (memberError) {
          console.error(`Member data batch error (${i}-${i + batch.length}):`, memberError);
          stats.errors_count++;
        }
      }
      
    } catch (error) {
      console.error('Error processing parties/members:', error);
      stats.errors_count++;
    }

    // 2. Hämta och bearbeta dokument (utökad mängd)
    try {
      console.log('=== Phase 2: Documents (Expanded) ===');
      
      // Hämta fler dokument med flera olika typer
      const documentTypes = ['mot', 'prop', 'bet', 'rskr', 'dir', 'skr'];
      let allDocuments: any[] = [];
      
      for (const docType of documentTypes) {
        try {
          const documentsData = await fetchRiksdagData(
            `/dokumentlista/?doktyp=${docType}&utformat=json&sz=1000&sort=datum&sortorder=desc`
          );
          const documents = documentsData.dokumentlista?.dokument || [];
          console.log(`Found ${documents.length} documents of type ${docType}`);
          allDocuments.push(...documents);
        } catch (docError) {
          console.warn(`Failed to fetch documents of type ${docType}:`, docError);
          stats.warnings.push(`Failed to fetch ${docType} documents`);
        }
      }
      
      // Remove duplicates based on dok_id
      const uniqueDocuments = allDocuments.filter((doc, index, self) => 
        index === self.findIndex(d => d.dok_id === doc.dok_id)
      );
      
      console.log(`Total unique documents: ${uniqueDocuments.length}`);
      
      const transformedDocuments = transformDocumentData(uniqueDocuments);
      stats.documents_processed = transformedDocuments.length;
      
      // Infoga dokument i batches
      const docBatchSize = 200;
      for (let i = 0; i < transformedDocuments.length; i += docBatchSize) {
        const batch = transformedDocuments.slice(i, i + docBatchSize);
        const { error: docError } = await supabase
          .from('document_data')
          .upsert(batch, { onConflict: 'document_id' });
        
        if (docError) {
          console.error(`Document batch error (${i}-${i + batch.length}):`, docError);
          stats.errors_count++;
        } else {
          console.log(`Successfully processed document batch ${i + 1}-${i + batch.length}`);
        }
      }
      
    } catch (error) {
      console.error('Error processing documents:', error);
      stats.errors_count++;
    }

    // 3. Hämta och bearbeta voteringar (förbättrad)
    try {
      console.log('=== Phase 3: Votes (Enhanced) ===');
      
      // Försök hämta voteringar från flera riksmöten
      const riksmoten = ['2024/25', '2023/24', 'latest'];
      let allVotes: any[] = [];
      
      for (const rm of riksmoten) {
        try {
          console.log(`Fetching votes for riksmöte: ${rm}`);
          const votesData = await fetchRiksdagData(
            `/voteringlista/?rm=${rm}&utformat=json&sz=1000`
          );
          
          if (votesData.voteringlista?.votering) {
            const votings = Array.isArray(votesData.voteringlista.votering) 
              ? votesData.voteringlista.votering 
              : [votesData.voteringlista.votering];
            
            console.log(`Found ${votings.length} vote events for ${rm}`);
            
            // Extrahera individuella röster från varje votering
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
          
          // Begränsa för att undvika timeout
          if (allVotes.length > 5000) break;
          
        } catch (voteError) {
          console.warn(`Failed to fetch votes for ${rm}:`, voteError);
          stats.warnings.push(`Failed to fetch votes for ${rm}`);
        }
      }
      
      console.log(`Total individual votes collected: ${allVotes.length}`);
      
      if (allVotes.length > 0) {
        const transformedVotes = transformVoteData(allVotes);
        stats.votes_processed = transformedVotes.length;
        
        // Infoga röstningsdata i batches
        const voteBatchSize = 100;
        for (let i = 0; i < transformedVotes.length; i += voteBatchSize) {
          const batch = transformedVotes.slice(i, i + voteBatchSize);
          const { error: voteError } = await supabase
            .from('vote_data')
            .upsert(batch, { onConflict: 'vote_id' });
          
          if (voteError) {
            console.error(`Vote batch error (${i}-${i + batch.length}):`, voteError);
            stats.errors_count++;
          } else {
            console.log(`Successfully processed vote batch ${i + 1}-${i + batch.length}`);
          }
        }
      }
      
    } catch (error) {
      console.error('Error processing votes:', error);
      stats.errors_count++;
    }

    // 4. Hämta och bearbeta anföranden
    try {
      console.log('=== Phase 4: Speeches ===');
      const speechesData = await fetchRiksdagData('/anforandelista/?utformat=json&sz=1000&sort=datumtid&sortorder=desc');
      const speeches = speechesData.anforandelista?.anforande || [];
      
      const transformedSpeeches = transformSpeechData(speeches);
      stats.speeches_processed = transformedSpeeches.length;
      
      // Infoga anföranden i batches
      const speechBatchSize = 200;
      for (let i = 0; i < transformedSpeeches.length; i += speechBatchSize) {
        const batch = transformedSpeeches.slice(i, i + speechBatchSize);
        const { error: speechError } = await supabase
          .from('speech_data')
          .upsert(batch, { onConflict: 'speech_id' });
        
        if (speechError) {
          console.error(`Speech batch error (${i}-${i + batch.length}):`, speechError);
          stats.errors_count++;
        }
      }
      
    } catch (error) {
      console.error('Error processing speeches:', error);
      stats.errors_count++;
    }

    // 5. Kalenderhändelser - hoppa över tills vidare pga API-problem
    console.log('=== Phase 5: Calendar Events (Skipped) ===');
    console.log('Skipping calendar events due to API issues - will be addressed in next phase');
    stats.warnings.push('Calendar events skipped due to API returning HTML instead of JSON');

    const syncDuration = Date.now() - startTime;

    // Logga synkroniseringsoperationen
    const { error: logError } = await supabase
      .from('data_sync_log')
      .insert({
        sync_type: 'enhanced_comprehensive_sync',
        status: stats.errors_count > 2 ? 'partial_success' : 'success',
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
          message: `Enhanced sync completed with ${stats.errors_count} errors`
        }
      });

    if (logError) {
      console.error('Error logging sync operation:', logError);
    }

    console.log(`=== SYNC COMPLETED ===`);
    console.log(`Duration: ${syncDuration}ms`);
    console.log(`Stats:`, stats);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Enhanced comprehensive data sync completed',
        stats,
        duration_ms: syncDuration,
        warnings: stats.warnings
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Fatal error in enhanced sync:', error);
    
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
