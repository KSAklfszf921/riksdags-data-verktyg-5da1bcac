export interface RiksdagMember {
  intressent_id: string;
  hangar_guid: string;
  tilltalsnamn: string;
  efternamn: string;
  parti: string;
  valkrets: string;
  status: string;
  kon: string;
  fodd_ar: string;
  datum_fran?: string;
  datum_tom?: string;
  fodd_datum: string;
  bild_url_80?: string;
  bild_url_192?: string;
  bild_url_max?: string;
}

export interface RiksdagMemberAssignment {
  organ_kod: string;
  roll: string;
  status: string;
  from: string;
  tom: string;
  typ: string;
  ordning?: string;
  uppgift: string;
}

export interface RiksdagMemberDetails {
  intressent_id: string;
  tilltalsnamn: string;
  efternamn: string;
  parti: string;
  valkrets: string;
  kon: string;
  fodd_ar: string;
  yrke?: string;
  bild_url_80?: string;
  bild_url_192?: string;
  bild_url_max?: string;
  assignments: RiksdagMemberAssignment[];
  email: string;
}

export interface RiksdagPersonResponse {
  personlista: {
    person: (RiksdagMember & { 
      personuppdrag?: { uppdrag: any[] }; 
      personuppgift?: { uppgift: any[] } 
    })[];
    '@hits': string;
  };
}

export interface RiksdagDocument {
  id: string;
  titel: string;
  beteckning: string;
  datum: string;
  typ: string;
  intressent_id?: string;
  organ: string;
  undertitel?: string;
  hangar_id?: string;
  hangar_guid?: string;
  dokument_url_text?: string;
  dokument_url_html?: string;
  dokumentstatus?: string;
  publicerad?: string;
  kalla?: string;
  rm?: string;
  tempbet?: string;
  nummer?: string;
  slutdatum?: string;
  systemdatum?: string;
  summary?: string;
  notis?: string;
  notisrubrik?: string;
  subtyp?: string;
  doktyp?: string;
  score?: string;
}

export interface RiksdagDocumentResponse {
  dokumentlista: {
    dokument: RiksdagDocument[];
    '@hits'?: string;
  };
}

export interface RiksdagSpeech {
  id: string;
  anforande_id: string;
  intressent_id: string;
  rel_dok_id: string;
  namn: string;
  parti: string;
  anforandedatum: string;
  anforandetext: string;
  anforandetyp: string;
  kammaraktivitet: string;
  anforande_nummer: string;
  talare: string;
  rel_dok_titel?: string;
  rel_dok_beteckning?: string;
  rel_dok_datum?: string;
  anf_klockslag?: string;
  anf_sekunder?: string;
  anforande_url_html?: string;
  dok_id?: string;
  dok_titel?: string;
  protokoll_url_www?: string;
}

export interface RiksdagSpeechResponse {
  anforandelista: {
    anforande: RiksdagSpeech[];
    '@hits'?: string;
  };
}

export interface RiksdagVote {
  votering_id: string;
  hangar_id: string;
  rm: string;
  beteckning: string;
  punkt: string;
  votering: string;
  namn: string;
  parti: string;
  valkrets: string;
  rost: 'Ja' | 'Nej' | 'Avstår' | 'Frånvarande';
  avser: string;
  votering_url_xml: string;
  dok_id: string;
  systemdatum: string;
  intressent_id: string;
}

export interface RiksdagVoteResponse {
  voteringlista: {
    votering: RiksdagVote[];
    '@hits'?: string;
  };
}

export interface RiksdagCalendarEvent {
  id: string;
  datum: string;
  tid: string;
  plats: string;
  aktivitet: string;
  typ: string;
  organ: string;
  summary: string;
  description?: string;
  status: string;
  url?: string;
  sekretess?: string;
}

export interface RiksdagCalendarResponse {
  kalenderlista: {
    kalender: RiksdagCalendarEvent[];
    '@hits'?: string;
  };
}

export interface DocumentSearchParams {
  searchTerm?: string;
  doktyp?: string;
  fromDate?: string;
  toDate?: string;
  intressentId?: string;
  org?: string;
  parti?: string[];
  rm?: string;
  bet?: string;
  tempbet?: string;
  nr?: string;
  ts?: string;
  iid?: string;
  talare?: string;
  exakt?: string;
  planering?: string;
  facets?: string;
  rapport?: string;
  avd?: string;
  webbtv?: string;
  sort?: 'rel' | 'datum' | 'systemdatum' | 'bet' | 'debattdag' | 'debattdagtid' | 'beslutsdag' | 'justeringsdag' | 'beredningsdag' | 'publiceringsdatum';
  sortorder?: 'asc' | 'desc';
  sz?: number;
}

export interface SpeechSearchParams {
  rm?: string;
  anftyp?: 'Nej' | '';
  date?: string;
  systemDate?: string;
  party?: string;
  intressentId?: string;
  pageSize?: number;
}

export interface VoteSearchParams {
  rm?: string[];
  beteckning?: string;
  punkt?: string;
  party?: string[];
  valkrets?: string;
  rost?: 'Ja' | 'Nej' | 'Avstår' | 'Frånvarande' | '';
  intressentId?: string;
  pageSize?: number;
  gruppering?: 'iid' | 'namn' | 'parti' | 'valkrets' | 'rm' | 'votering_id' | 'bet' | '';
}

export interface CalendarSearchParams {
  org?: string[];
  akt?: string[];
  fromDate?: string;
  toDate?: string;
  pageSize?: number;
}

const BASE_URL = 'https://data.riksdagen.se';

// Updated committee codes based on actual Riksdagen structure
const VALID_COMMITTEE_CODES = [
  'AU', 'CU', 'FiU', 'FöU', 'JuU', 'KU', 'KrU', 'MjU', 'NU', 'SkU', 'SfU', 
  'SoU', 'TU', 'UbU', 'UU', 'UFöU', 'EUN', 'SäU'
];

export const fetchMemberSuggestions = async (query: string): Promise<RiksdagMember[]> => {
  if (query.length < 1) return [];
  
  const url = `${BASE_URL}/personlista/?fnamn=${encodeURIComponent(query)}&utformat=json`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Kunde inte hämta ledamöter');
    }
    const data: RiksdagPersonResponse = await response.json();
    return data.personlista?.person || [];
  } catch (error) {
    console.error('Error fetching member suggestions:', error);
    return [];
  }
};

export const fetchMemberDetails = async (intressentId: string): Promise<RiksdagMemberDetails | null> => {
  try {
    console.log(`Fetching member details for: ${intressentId}`);
    const url = `${BASE_URL}/personlista/?iid=${intressentId}&utformat=json`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Failed to fetch member details for ${intressentId}: ${response.status}`);
      throw new Error('Kunde inte hämta ledamotsinformation');
    }
    
    const data: RiksdagPersonResponse = await response.json();
    const person = data.personlista?.person?.[0];
    
    if (!person) {
      console.log(`No person found for intressent_id: ${intressentId}`);
      return null;
    }

    // Extract assignments directly from personlista response
    const rawAssignments = person.personuppdrag?.uppdrag || [];
    console.log(`Raw assignments for ${intressentId}:`, rawAssignments);
    
    // Filter and map assignments with corrected typ filtering
    const assignments: RiksdagMemberAssignment[] = rawAssignments
      .filter(assignment => {
        // Filter for committee assignments using typ === 'uppdrag' and validate committee codes
        const isCommitteeAssignment = assignment.typ === 'uppdrag';
        const hasValidOrgan = assignment.organ_kod && VALID_COMMITTEE_CODES.includes(assignment.organ_kod);
        const hasCommitteeName = assignment.uppgift && Array.isArray(assignment.uppgift) && assignment.uppgift[0];
        
        const result = isCommitteeAssignment && hasValidOrgan && hasCommitteeName;
        console.log(`Assignment filter for ${intressentId}: ${assignment.organ_kod} (${assignment.typ}) - Valid: ${result}`);
        return result;
      })
      .map(assignment => ({
        organ_kod: assignment.organ_kod,
        roll: assignment.roll_kod || assignment.roll,
        status: assignment.status,
        from: assignment.from,
        tom: assignment.tom,
        typ: assignment.typ,
        ordning: assignment.ordningsnummer || assignment.ordning,
        uppgift: Array.isArray(assignment.uppgift) ? assignment.uppgift[0] : assignment.uppgift
      }));

    console.log(`Processed ${assignments.length} committee assignments for ${person.tilltalsnamn} ${person.efternamn}`);

    // Handle email extraction with improved logic
    let email = `${person.tilltalsnamn.toLowerCase()}.${person.efternamn.toLowerCase()}@riksdagen.se`;
    
    if (person.personuppgift?.uppgift) {
      const emailEntry = person.personuppgift.uppgift.find(u => 
        u.kod === 'Officiell e-postadress' || 
        (u.uppgift && Array.isArray(u.uppgift) && u.uppgift[0]?.includes('@'))
      );
      
      if (emailEntry && emailEntry.uppgift) {
        const emailValue = Array.isArray(emailEntry.uppgift) ? emailEntry.uppgift[0] : emailEntry.uppgift;
        email = emailValue.replace('[på]', '@').replace('(at)', '@');
      }
    }

    // Normalize email format
    email = email.replace(/\s+/g, '').toLowerCase()
      .replace(/ä/g, 'a').replace(/å/g, 'a').replace(/ö/g, 'o')
      .replace(/[^a-z0-9@.-]/g, '');

    return {
      intressent_id: person.intressent_id,
      tilltalsnamn: person.tilltalsnamn,
      efternamn: person.efternamn,
      parti: person.parti,
      valkrets: person.valkrets,
      kon: person.kon,
      fodd_ar: person.fodd_ar,
      bild_url_80: person.bild_url_80,
      bild_url_192: person.bild_url_192,
      bild_url_max: person.bild_url_max,
      assignments,
      email
    };
  } catch (error) {
    console.error(`Error fetching member details for ${intressentId}:`, error);
    return null;
  }
};

export const fetchMembersWithCommittees = async (
  page: number = 1,
  pageSize: number = 20,
  status: 'current' | 'all' | 'former' = 'current',
  committee?: string
): Promise<{ members: RiksdagMemberDetails[]; totalCount: number }> => {
  try {
    // Validate committee code if provided
    if (committee && committee !== 'all' && !VALID_COMMITTEE_CODES.includes(committee)) {
      console.warn(`Potentially invalid committee code: ${committee}`);
    }

    let url = `${BASE_URL}/personlista/?utformat=json`;
    
    // Apply committee filter at API level for efficiency
    if (committee && committee !== 'all') {
      url += `&org=${encodeURIComponent(committee)}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Kunde inte hämta ledamöter');
    }
    
    const data: RiksdagPersonResponse = await response.json();
    let allMembers = data.personlista?.person || [];
    
    const currentDate = new Date();
    
    // Filter by status with improved date handling
    if (status === 'current') {
      allMembers = allMembers.filter(member => {
        if (!member.datum_tom || member.datum_tom.trim() === '') {
          return true;
        }
        try {
          const endDate = new Date(member.datum_tom);
          return endDate > currentDate;
        } catch {
          return true; // Include if date parsing fails
        }
      });
    } else if (status === 'former') {
      allMembers = allMembers.filter(member => {
        if (!member.datum_tom || member.datum_tom.trim() === '') {
          return false;
        }
        try {
          const endDate = new Date(member.datum_tom);
          return endDate <= currentDate;
        } catch {
          return false;
        }
      });
    }
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedMembers = allMembers.slice(startIndex, endIndex);
    
    // Optimize: Batch fetch member details with reduced parallel requests
    const batchSize = 5; // Limit concurrent API calls
    const detailedMembers: RiksdagMemberDetails[] = [];
    
    for (let i = 0; i < paginatedMembers.length; i += batchSize) {
      const batch = paginatedMembers.slice(i, i + batchSize);
      const batchDetails = await Promise.all(
        batch.map(async (member) => {
          const details = await fetchMemberDetails(member.intressent_id);
          return details || {
            intressent_id: member.intressent_id,
            tilltalsnamn: member.tilltalsnamn,
            efternamn: member.efternamn,
            parti: member.parti,
            valkrets: member.valkrets,
            kon: member.kon,
            fodd_ar: member.fodd_ar,
            bild_url_80: member.bild_url_80,
            bild_url_192: member.bild_url_192,
            bild_url_max: member.bild_url_max,
            assignments: [],
            email: `${member.tilltalsnamn.toLowerCase()}.${member.efternamn.toLowerCase()}@riksdagen.se`
          };
        })
      );
      detailedMembers.push(...batchDetails);
    }
    
    return {
      members: detailedMembers,
      totalCount: allMembers.length
    };
  } catch (error) {
    console.error('Error fetching members with committees:', error);
    return { members: [], totalCount: 0 };
  }
};

export const fetchAllCommittees = async (): Promise<string[]> => {
  // Use hardcoded list since utskott endpoint returns 404
  const committees = [
    'Arbetsmarknadsutskottet',
    'Civilutskottet',
    'Finansutskottet',
    'Försvarsutskottet',
    'Justitieutskottet',
    'Konstitutionsutskottet',
    'Kulturutskottet',
    'Miljö- och jordbruksutskottet',
    'Näringsutskottet',
    'Skatteutskottet',
    'Socialförsäkringsutskottet',
    'Socialutskottet',
    'Trafikutskottet',
    'Utbildningsutskottet',
    'Utrikesutskottet',
    'Sammansatta utrikes- och försvarsutskottet',
    'EU-nämnden',
    'Säkerhetsutskottet'
  ];
  
  console.log(`Returning ${committees.length} hardcoded committees`);
  return committees;
};

export const fetchMembers = async (
  page: number = 1,
  pageSize: number = 20,
  status: 'current' | 'all' | 'former' = 'current'
): Promise<{ members: RiksdagMember[]; totalCount: number }> => {
  let url = `${BASE_URL}/personlista/?utformat=json`;
  
  console.log(`Fetching members with status: ${status}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Kunde inte hämta ledamöter');
    }
    const data: RiksdagPersonResponse = await response.json();
    let allMembers = data.personlista?.person || [];
    
    console.log(`Initial fetch returned ${allMembers.length} members`);
    
    const currentDate = new Date();
    
    if (status === 'current') {
      allMembers = allMembers.filter(member => {
        if (!member.datum_tom || member.datum_tom.trim() === '') {
          return true;
        }
        try {
          const endDate = new Date(member.datum_tom);
          return endDate > currentDate;
        } catch {
          return true;
        }
      });
    } else if (status === 'former') {
      allMembers = allMembers.filter(member => {
        if (!member.datum_tom || member.datum_tom.trim() === '') {
          return false;
        }
        try {
          const endDate = new Date(member.datum_tom);
          return endDate <= currentDate;
        } catch {
          return false;
        }
      });
    }
    
    console.log(`After filtering for ${status}: ${allMembers.length} members`);
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedMembers = allMembers.slice(startIndex, endIndex);
    
    console.log(`Returning page ${page}: ${paginatedMembers.length} members (${startIndex}-${endIndex})`);
    
    return {
      members: paginatedMembers,
      totalCount: allMembers.length
    };
  } catch (error) {
    console.error('Error fetching members:', error);
    return { members: [], totalCount: 0 };
  }
};

export const fetchAllMembers = async (): Promise<RiksdagMember[]> => {
  const url = `${BASE_URL}/personlista/?utformat=json&rdlstatus=tjanstgorande`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Kunde inte hämta ledamöter');
    }
    const data: RiksdagPersonResponse = await response.json();
    let members = data.personlista?.person || [];
    
    const currentDate = new Date();
    members = members.filter(member => {
      if (!member.datum_tom || member.datum_tom.trim() === '') {
        return true;
      }
      const endDate = new Date(member.datum_tom);
      return endDate > currentDate;
    });
    
    return members;
  } catch (error) {
    console.error('Error fetching all members:', error);
    return [];
  }
};

export const searchDocuments = async (params: DocumentSearchParams): Promise<{documents: RiksdagDocument[], totalCount: number}> => {
  let url = `${BASE_URL}/dokumentlista/?utformat=json`;
  
  // Use 10 results per page for pagination
  if (params.sz) {
    url += `&sz=${params.sz}`;
  } else {
    url += '&sz=10';
  }
  
  if (params.searchTerm) url += `&sok=${encodeURIComponent(params.searchTerm)}`;
  if (params.doktyp) url += `&doktyp=${params.doktyp}`;
  if (params.fromDate) url += `&from=${params.fromDate}`;
  if (params.toDate) url += `&tom=${params.toDate}`;
  if (params.intressentId) url += `&iid=${params.intressentId}`;
  if (params.org) url += `&org=${params.org}`;
  if (params.rm) url += `&rm=${params.rm}`;
  if (params.bet) url += `&bet=${encodeURIComponent(params.bet)}`;
  if (params.tempbet) url += `&tempbet=${params.tempbet}`;
  if (params.nr) url += `&nr=${params.nr}`;
  if (params.ts) url += `&ts=${params.ts}`;
  if (params.iid) url += `&iid=${params.iid}`;
  if (params.talare) url += `&talare=${encodeURIComponent(params.talare)}`;
  if (params.exakt) url += `&exakt=${params.exakt}`;
  if (params.planering) url += `&planering=${params.planering}`;
  if (params.facets) url += `&facets=${params.facets}`;
  if (params.rapport) url += `&rapport=${params.rapport}`;
  if (params.avd) url += `&avd=${params.avd}`;
  if (params.webbtv) url += `&webbtv=${params.webbtv}`;
  
  if (params.parti && params.parti.length > 0) {
    params.parti.forEach(p => {
      url += `&parti=${p}`;
    });
  }
  
  if (params.sort) url += `&sort=${params.sort}`;
  if (params.sortorder) url += `&sortorder=${params.sortorder}`;
  
  console.log('API URL:', url);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    const data: RiksdagDocumentResponse = await response.json();
    const documents = data.dokumentlista?.dokument || [];
    const totalCount = parseInt(data.dokumentlista?.['@hits'] || '0');
    
    console.log('API Response:', { documents: documents.length, totalCount });
    
    return { documents, totalCount };
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
};

export const searchSpeeches = async (params: SpeechSearchParams): Promise<{speeches: RiksdagSpeech[], totalCount: number}> => {
  let url = `${BASE_URL}/anforandelista/?utformat=json`;
  
  if (params.pageSize) {
    url += `&sz=${params.pageSize}`;
  } else {
    url += '&sz=50';
  }
  
  if (params.rm) url += `&rm=${encodeURIComponent(params.rm)}`;
  if (params.anftyp) url += `&anftyp=${params.anftyp}`;
  if (params.date) url += `&d=${params.date}`;
  if (params.systemDate) url += `&ts=${params.systemDate}`;
  if (params.party) url += `&parti=${params.party}`;
  if (params.intressentId) url += `&iid=${params.intressentId}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    const data: RiksdagSpeechResponse = await response.json();
    const speeches = data.anforandelista?.anforande || [];
    const totalCount = parseInt(data.anforandelista?.['@hits'] || '0');
    
    return { speeches, totalCount };
  } catch (error) {
    console.error('Error searching speeches:', error);
    throw error;
  }
};

export const searchVotes = async (params: VoteSearchParams): Promise<{votes: RiksdagVote[], totalCount: number}> => {
  let url = `${BASE_URL}/voteringlista/?utformat=json`;
  
  if (params.pageSize) {
    url += `&sz=${params.pageSize}`;
  } else {
    url += '&sz=50';
  }
  
  if (params.rm && params.rm.length > 0) {
    params.rm.forEach(rm => {
      url += `&rm=${encodeURIComponent(rm)}`;
    });
  }
  if (params.beteckning) url += `&bet=${encodeURIComponent(params.beteckning)}`;
  if (params.punkt) url += `&punkt=${params.punkt}`;
  if (params.valkrets) url += `&valkrets=${encodeURIComponent(params.valkrets)}`;
  if (params.rost) url += `&rost=${params.rost}`;
  if (params.intressentId) url += `&iid=${params.intressentId}`;
  if (params.gruppering) url += `&gruppering=${params.gruppering}`;
  
  if (params.party && params.party.length > 0) {
    params.party.forEach(p => {
      url += `&parti=${p}`;
    });
  }
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    const data: RiksdagVoteResponse = await response.json();
    const votes = data.voteringlista?.votering || [];
    const totalCount = parseInt(data.voteringlista?.['@hits'] || '0');
    
    return { votes, totalCount };
  } catch (error) {
    console.error('Error searching votes:', error);
    throw error;
  }
};

export const searchCalendarEvents = async (params: CalendarSearchParams): Promise<{events: RiksdagCalendarEvent[], totalCount: number}> => {
  let url = `${BASE_URL}/kalender/?utformat=json`;
  
  if (params.pageSize) {
    url += `&sz=${params.pageSize}`;
  } else {
    url += '&sz=50';
  }
  
  if (params.org && params.org.length > 0) {
    params.org.forEach(org => {
      url += `&org=${encodeURIComponent(org)}`;
    });
  }
  
  if (params.akt && params.akt.length > 0) {
    params.akt.forEach(akt => {
      url += `&akt=${encodeURIComponent(akt)}`;
    });
  }
  
  if (params.fromDate) url += `&from=${params.fromDate}`;
  if (params.toDate) url += `&tom=${params.toDate}`;
  
  try {
    console.log(`Fetching calendar events from: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Calendar API error: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Calendar API did not return JSON:', contentType);
      console.log('Response text preview:', await response.text().then(text => text.substring(0, 200)));
      return { events: [], totalCount: 0 };
    }
    
    const data: RiksdagCalendarResponse = await response.json();
    const events = data.kalenderlista?.kalender || [];
    const totalCount = parseInt(data.kalenderlista?.['@hits'] || '0');
    
    console.log(`Calendar events fetched: ${events.length}, total: ${totalCount}`);
    return { events, totalCount };
  } catch (error) {
    console.error('Error searching calendar events:', error);
    // Return empty result instead of throwing to prevent blocking member loading
    return { events: [], totalCount: 0 };
  }
};

export const fetchMemberDocuments = async (intressentId: string): Promise<RiksdagDocument[]> => {
  try {
    console.log(`Fetching documents for member: ${intressentId}`);
    
    const { documents } = await searchDocuments({
      iid: intressentId,
      sz: 100,
      sort: 'datum',
      sortorder: 'desc'
    });
    
    console.log(`Found ${documents.length} documents for member ${intressentId}`);
    
    const enrichedDocuments = documents.map(doc => ({
      ...doc,
      intressent_id: intressentId
    }));
    
    return enrichedDocuments;
  } catch (error) {
    console.error(`Error fetching documents for member ${intressentId}:`, error);
    return [];
  }
};

export const fetchMemberSpeeches = async (intressentId: string): Promise<RiksdagSpeech[]> => {
  try {
    console.log(`Fetching speeches for member: ${intressentId}`);
    
    const { speeches } = await searchSpeeches({
      intressentId,
      pageSize: 100
    });
    
    console.log(`Found ${speeches.length} speeches for member ${intressentId}`);
    return speeches;
  } catch (error) {
    console.error(`Error fetching speeches for member ${intressentId}:`, error);
    return [];
  }
};

export const fetchMemberVotes = async (intressentId: string): Promise<RiksdagVote[]> => {
  try {
    console.log(`Fetching votes for member: ${intressentId}`);
    
    const { votes } = await searchVotes({
      intressentId,
      pageSize: 100
    });
    
    console.log(`Found ${votes.length} votes for member ${intressentId}`);
    return votes;
  } catch (error) {
    console.error(`Error fetching votes for member ${intressentId}:`, error);
    return [];
  }
};

export const fetchMemberCalendarEvents = async (intressentId: string): Promise<RiksdagCalendarEvent[]> => {
  try {
    console.log(`Fetching calendar events for member: ${intressentId}`);
    // Calendar events in Riksdag API are not member-specific, so return empty array
    // The API doesn't support filtering by member ID for calendar events
    return [];
  } catch (error) {
    console.error(`Error fetching calendar events for member ${intressentId}:`, error);
    return [];
  }
};

// New utility function to get committee assignments for a member
export const getMemberCommitteeAssignments = async (intressentId: string): Promise<RiksdagMemberAssignment[]> => {
  const memberDetails = await fetchMemberDetails(intressentId);
  if (!memberDetails) {
    return [];
  }
  
  // Return committee assignments, already filtered and validated
  return memberDetails.assignments;
};

// Updated utility function to validate committee codes
export const isValidCommitteeCode = (code: string): boolean => {
  return VALID_COMMITTEE_CODES.includes(code);
};

// ... keep existing code (other exports)
