import { Member } from '../types/member';

const API_BASE_URL = 'https://data.riksdagen.se';

export interface RiksdagSearchResult {
  personlista: {
    '@hits': string;
    person: RiksdagMember[];
  };
}

export interface RiksdagMember {
  hangar_guid: string;
  sourceid: string;
  intressent_id: string;
  hangar_id: string;
  fodd_ar: string;
  kon: string;
  efternamn: string;
  tilltalsnamn: string;
  sorteringsnamn: string;
  iort: string;
  parti: string;
  valkrets: string;
  status: string;
  person_url_xml: string;
  bild_url_80: string;
  bild_url_192: string;
  bild_url_max: string;
  datum_fran?: string;
  datum_tom?: string;
  fodd_datum?: string;
}

// Flattened document interface to match component usage
export interface RiksdagDocument {
  id: string;
  titel: string;
  undertitel: string;
  rm: string;
  datum: string;
  typ: string;
  subtyp: string;
  nummer: string;
  beteckning: string;
  organ: string;
  mottagare: string;
  dokument_url_html: string;
  dokument_url_text: string;
}

// API response structure (nested)
export interface RiksdagDocumentResponse {
  dok: {
    id: string;
    titel: string;
    undertitel: string;
    rm: string;
    datum: string;
    typ: string;
    subtyp: string;
    nummer: string;
    beteckning: string;
    organ: string;
    mottagare: string;
    dokument_url_html: string;
    dokument_url_text: string;
  };
}

// Flattened speech interface to match component usage
export interface RiksdagSpeech {
  anforande_id: string;
  dok_id: string;
  anforande_nummer: string;
  anforande_url_html: string;
  anforandetext: string;
  anforandedatum: string;
  anforandeperspektiv: string;
  anforandetyp: string;
  intressent_id: string;
  replik: string;
  rm: string;
  sekvensnummer: string;
  source: string;
  talare: string;
  titel: string;
  undertitel: string;
  rel_dok_id: string;
  rel_dok_rm: string;
  rel_dok_titel: string;
  rel_dok_subtitel: string;
  rel_dok_dokument_url_html: string;
  rel_dok_dokument_url_text: string;
  kammaraktivitet: string;
  anf_klockslag: string;
  anf_sekunder: string;
  avsnittsrubrik: string;
  dok_titel: string;
  parti: string;
  protokoll_url_www: string;
}

// API response structure for speeches (nested)
export interface RiksdagSpeechResponse {
  anforande: {
    anforande_id: string;
    dok_id: string;
    anforandetext: string;
    anforandedatum: string;
    anforandeperspektiv: string;
    anforandetyp: string;
    intressent_id: string;
    replik: string;
    rm: string;
    sekvensnummer: string;
    source: string;
    talare: string;
    titel: string;
    undertitel: string;
    rel_dok_id: string;
    rel_dok_rm: string;
    rel_dok_titel: string;
    rel_dok_subtitel: string;
    rel_dok_dokument_url_html: string;
    rel_dok_dokument_url_text: string;
    kammaraktivitet: string;
    anf_klockslag: string;
    anf_sekunder: string;
  };
}

// Flattened calendar event interface
export interface RiksdagCalendarEvent {
  id: string;
  datum: string;
  tid: string;
  typ: string;
  titel: string;
  undertitel: string;
  organ: string;
  beskrivning: string;
  url: string;
  summary: string;
  aktivitet: string;
  plats: string;
  description: string;
}

// API response structure for calendar events (nested)
export interface RiksdagCalendarEventResponse {
  event: {
    id: string;
    datum: string;
    tid: string;
    typ: string;
    titel: string;
    undertitel: string;
    organ: string;
    beskrivning: string;
    url: string;
  };
}

export interface RiksdagMemberDetails {
  assignments: any[];
  email: string | null;
  intressent_id: string;
  tilltalsnamn: string;
  efternamn: string;
  parti: string;
  valkrets: string;
  kon: string;
  fodd_ar: string;
  bild_url_80: string;
  bild_url_192: string;
  bild_url_max: string;
}

export interface RiksdagMemberDetailsWithBiography extends RiksdagMemberDetails {
  biography?: RiksdagMemberBiography[];
}

export interface RiksdagCommitteeAssignments {
  utskottsforslag: {
    forslag: {
      hangar_id: string;
      intressent_id: string;
      namn: string;
      parti: string;
      roll_kod: string;
      ordningsnummer: string;
      status: string;
      from: string;
      tom: string;
    }[];
  };
}

export interface RiksdagMemberBiography {
  kod: string;
  uppgift: string;
  typ: string;
  intressent_id?: string;
  hangar_id?: string;
}

// Vote interface for VoteSearch
export interface RiksdagVote {
  id: string;
  titel: string;
  datum: string;
  typ: string;
  beteckning: string;
  utfall: string;
  ja: number;
  nej: number;
  frånvarande: number;
  avstår: number;
}

// Updated search parameter interfaces to match component usage
export interface DocumentSearchParams {
  searchTerm?: string;
  iid?: string;
  doktyp?: string;
  rm?: string;
  org?: string;
  fromDate?: string;
  toDate?: string;
  bet?: string;
  sort?: string;
  sortorder?: string;
  parti?: string[];
  sz?: number;
  pageSize?: number;
  page?: number;
}

export interface SpeechSearchParams {
  intressentId?: string;
  rm?: string;
  anftyp?: 'Nej' | '';
  party?: string;
  date?: string;
  systemDate?: string;
  pageSize?: number;
  page?: number;
}

export interface CalendarSearchParams {
  fromDate?: string;
  toDate?: string;
  org?: string[];
  akt?: string[];
  pageSize?: number;
  page?: number;
}

export interface VoteSearchParams {
  rm?: string;
  org?: string;
  typ?: string;
  fromDate?: string;
  toDate?: string;
  pageSize?: number;
  page?: number;
}

// Search result interfaces
export interface DocumentSearchResult {
  documents: RiksdagDocument[];
  totalCount: number;
}

export interface SpeechSearchResult {
  speeches: RiksdagSpeech[];
  totalCount: number;
}

export interface CalendarSearchResult {
  events: RiksdagCalendarEvent[];
  totalCount: number;
}

export interface VoteSearchResult {
  votes: RiksdagVote[];
  totalCount: number;
}

// Search functions
export const searchDocuments = async (params: DocumentSearchParams): Promise<DocumentSearchResult> => {
  try {
    let url = `${API_BASE_URL}/dokumentlista/?utformat=json`;
    
    if (params.searchTerm) {
      url += `&sok=${encodeURIComponent(params.searchTerm)}`;
    }
    if (params.iid) {
      url += `&iid=${params.iid}`;
    }
    if (params.doktyp) {
      url += `&doktyp=${params.doktyp}`;
    }
    if (params.rm) {
      url += `&rm=${params.rm}`;
    }
    if (params.org) {
      url += `&org=${params.org}`;
    }
    if (params.fromDate) {
      url += `&from=${params.fromDate}`;
    }
    if (params.toDate) {
      url += `&tom=${params.toDate}`;
    }
    if (params.bet) {
      url += `&bet=${params.bet}`;
    }
    if (params.sort) {
      url += `&sort=${params.sort}`;
    }
    if (params.sortorder) {
      url += `&sortorder=${params.sortorder}`;
    }
    if (params.parti && params.parti.length > 0) {
      url += `&parti=${params.parti.join(',')}`;
    }
    if (params.sz) {
      url += `&sz=${params.sz}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to search documents: ${response.status}`);
    }

    const data = await response.json();
    const documentList = data.dokumentlista?.dokument || [];
    const totalCount = parseInt(data.dokumentlista?.['@hits'], 10) || 0;

    // Flatten the nested structure
    const documents: RiksdagDocument[] = documentList.map((docResponse: RiksdagDocumentResponse) => ({
      id: docResponse.dok.id,
      titel: docResponse.dok.titel,
      undertitel: docResponse.dok.undertitel || '',
      rm: docResponse.dok.rm || '',
      datum: docResponse.dok.datum,
      typ: docResponse.dok.typ,
      subtyp: docResponse.dok.subtyp || '',
      nummer: docResponse.dok.nummer || '',
      beteckning: docResponse.dok.beteckning,
      organ: docResponse.dok.organ || '',
      mottagare: docResponse.dok.mottagare || '',
      dokument_url_html: docResponse.dok.dokument_url_html,
      dokument_url_text: docResponse.dok.dokument_url_text || ''
    }));

    return { documents, totalCount };
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
};

export const searchVotes = async (params: VoteSearchParams): Promise<VoteSearchResult> => {
  try {
    let url = `${API_BASE_URL}/voteringlista/?utformat=json`;
    
    if (params.rm) {
      url += `&rm=${params.rm}`;
    }
    if (params.org) {
      url += `&org=${params.org}`;
    }
    if (params.typ) {
      url += `&typ=${params.typ}`;
    }
    if (params.fromDate) {
      url += `&from=${params.fromDate}`;
    }
    if (params.toDate) {
      url += `&tom=${params.toDate}`;
    }
    if (params.pageSize) {
      url += `&sz=${params.pageSize}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to search votes: ${response.status}`);
    }

    const data = await response.json();
    const voteList = data.voteringlista?.votering || [];
    const totalCount = parseInt(data.voteringlista?.['@hits'], 10) || 0;

    const votes: RiksdagVote[] = voteList.map((vote: any) => ({
      id: vote.votering_id,
      titel: vote.titel || 'Okänd votering',
      datum: vote.datum,
      typ: vote.typ,
      beteckning: vote.beteckning || '',
      utfall: vote.utfall || 'Okänt',
      ja: parseInt(vote.ja) || 0,
      nej: parseInt(vote.nej) || 0,
      frånvarande: parseInt(vote.franvarande) || 0,
      avstår: parseInt(vote.avstar) || 0
    }));

    return { votes, totalCount };
  } catch (error) {
    console.error('Error searching votes:', error);
    throw error;
  }
};

export const searchCalendarEvents = async (params: CalendarSearchParams): Promise<CalendarSearchResult> => {
  try {
    let url = `${API_BASE_URL}/kalender/?utformat=json`;
    
    if (params.fromDate) {
      url += `&from=${params.fromDate}`;
    }
    if (params.toDate) {
      url += `&tom=${params.toDate}`;
    }
    if (params.org && params.org.length > 0) {
      url += `&org=${params.org.join(',')}`;
    }
    if (params.akt && params.akt.length > 0) {
      url += `&akt=${params.akt.join(',')}`;
    }
    if (params.pageSize) {
      url += `&size=${params.pageSize}`;
    }
    if (params.page) {
      url += `&p=${params.page}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to search calendar events: ${response.status}`);
    }

    const data = await response.json();
    const eventList = data.kalender?.event || [];
    const totalCount = parseInt(data.kalender?.['@hits'], 10) || 0;

    // Flatten the nested structure
    const events: RiksdagCalendarEvent[] = eventList.map((eventResponse: RiksdagCalendarEventResponse) => ({
      id: eventResponse.event.id,
      datum: eventResponse.event.datum,
      tid: eventResponse.event.tid,
      typ: eventResponse.event.typ,
      titel: eventResponse.event.titel,
      undertitel: eventResponse.event.undertitel,
      organ: eventResponse.event.organ,
      beskrivning: eventResponse.event.beskrivning,
      url: eventResponse.event.url,
      summary: eventResponse.event.titel, // Use titel as summary
      aktivitet: eventResponse.event.typ, // Use typ as aktivitet
      plats: '', // Default empty, not in API response
      description: eventResponse.event.beskrivning
    }));

    return { events, totalCount };
  } catch (error) {
    console.error('Error searching calendar events:', error);
    throw error;
  }
};

export const searchSpeeches = async (params: SpeechSearchParams): Promise<SpeechSearchResult> => {
  try {
    let url = `${API_BASE_URL}/anforandefilter/?utformat=json`;
    
    if (params.intressentId) {
      url += `&iid=${params.intressentId}`;
    }
    if (params.rm) {
      url += `&rm=${params.rm}`;
    }
    if (params.anftyp) {
      url += `&anftyp=${params.anftyp}`;
    }
    if (params.party) {
      url += `&parti=${params.party}`;
    }
    if (params.date) {
      url += `&from=${params.date}`;
    }
    if (params.systemDate) {
      url += `&systemdate=${params.systemDate}`;
    }
    if (params.pageSize) {
      url += `&size=${params.pageSize}`;
    }
    if (params.page) {
      url += `&p=${params.page}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to search speeches: ${response.status}`);
    }

    const data = await response.json();
    const speechList = data.anforanden?.anforande || [];
    const totalCount = parseInt(data.anforanden?.['@hits'], 10) || 0;

    // Flatten the nested structure
    const speeches: RiksdagSpeech[] = speechList.map((speechResponse: RiksdagSpeechResponse) => ({
      anforande_id: speechResponse.anforande.anforande_id,
      dok_id: speechResponse.anforande.dok_id,
      anforande_nummer: speechResponse.anforande.anforande_id, // Use anforande_id as nummer
      anforande_url_html: `https://data.riksdagen.se/anforande/${speechResponse.anforande.anforande_id}/html`,
      anforandetext: speechResponse.anforande.anforandetext,
      anforandedatum: speechResponse.anforande.anforandedatum,
      anforandeperspektiv: speechResponse.anforande.anforandeperspektiv,
      anforandetyp: speechResponse.anforande.anforandetyp,
      intressent_id: speechResponse.anforande.intressent_id,
      replik: speechResponse.anforande.replik,
      rm: speechResponse.anforande.rm,
      sekvensnummer: speechResponse.anforande.sekvensnummer,
      source: speechResponse.anforande.source,
      talare: speechResponse.anforande.talare,
      titel: speechResponse.anforande.titel,
      undertitel: speechResponse.anforande.undertitel,
      rel_dok_id: speechResponse.anforande.rel_dok_id,
      rel_dok_rm: speechResponse.anforande.rel_dok_rm,
      rel_dok_titel: speechResponse.anforande.rel_dok_titel,
      rel_dok_subtitel: speechResponse.anforande.rel_dok_subtitel,
      rel_dok_dokument_url_html: speechResponse.anforande.rel_dok_dokument_url_html,
      rel_dok_dokument_url_text: speechResponse.anforande.rel_dok_dokument_url_text,
      kammaraktivitet: speechResponse.anforande.kammaraktivitet,
      anf_klockslag: speechResponse.anforande.anf_klockslag,
      anf_sekunder: speechResponse.anforande.anf_sekunder,
      avsnittsrubrik: speechResponse.anforande.titel || 'Okänt ämne', // Use titel as avsnittsrubrik
      dok_titel: speechResponse.anforande.rel_dok_titel,
      parti: '', // Will be populated from member data
      protokoll_url_www: speechResponse.anforande.rel_dok_dokument_url_html || ''
    }));

    return { speeches, totalCount };
  } catch (error) {
    console.error('Error searching speeches:', error);
    throw error;
  }
};

export const fetchMembers = async (
  page: number = 1,
  pageSize: number = 20,
  status: 'current' | 'all' | 'former' = 'current'
): Promise<{ members: RiksdagMember[]; totalCount: number }> => {
  try {
    let url = `${API_BASE_URL}/personlista/?utformat=json&size=${pageSize}&p=${page}`;
    if (status === 'current') {
      url += '&rdlstatus=aktiv';
    } else if (status === 'former') {
      url += '&rdlstatus=f.d.';
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch members: ${response.status}`);
    }
    const data: RiksdagSearchResult = await response.json();
    const members = data.personlista?.person || [];
    const totalCount = parseInt(data.personlista['@hits'], 10) || 0;

    return { members, totalCount };
  } catch (error) {
    console.error('Error fetching members:', error);
    throw error;
  }
};

export const fetchMemberSuggestions = async (query: string): Promise<RiksdagMember[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/personlista/?utformat=json&fnamn=${query}&enamn=${query}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch member suggestions: ${response.status}`);
    }
    const data: RiksdagSearchResult = await response.json();
    return data.personlista?.person || [];
  } catch (error) {
    console.error('Error fetching member suggestions:', error);
    return [];
  }
};

export const fetchMemberDocuments = async (memberId: string): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/dokumentlista/?sok=${memberId}&doktyp=mot,prop,ip,fr,frs&utformat=json&sort=datum&sortorder=desc`);
    if (!response.ok) {
      throw new Error(`Failed to fetch member documents: ${response.status}`);
    }
    const data = await response.json();
    return data.dokumentlista?.dokument || [];
  } catch (error) {
    console.error('Error fetching member documents:', error);
    return [];
  }
};

export const fetchMemberSpeeches = async (memberId: string): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/anforandefilter/?iid=${memberId}&utformat=json&sort=datum&sortorder=desc&from=2022-09-26`);
    if (!response.ok) {
      throw new Error(`Failed to fetch member speeches: ${response.status}`);
    }
    const data = await response.json();
    return data.anforanden?.anforande || [];
  } catch (error) {
    console.error('Error fetching member speeches:', error);
    return [];
  }
};

export const fetchMemberCalendarEvents = async (memberId: string): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ Kalender/?iid=${memberId}&utformat=json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch member calendar events: ${response.status}`);
    }
    const data = await response.json();
    return data.kalender?.event || [];
  } catch (error) {
    console.error('Error fetching member calendar events:', error);
    return [];
  }
};

export const fetchMemberDetails = async (intressent_id: string): Promise<RiksdagMemberDetailsWithBiography> => {
  try {
    const response = await fetch(`https://data.riksdagen.se/person/${intressent_id}?utformat=json`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch member details: ${response.status}`);
    }

    const data = await response.json();
    const person = data.person?.personlista?.person;
    
    if (!person) {
      throw new Error('No person data found');
    }

    console.log(`Fetched details for member ${intressent_id}:`, person);

    // Extract assignments
    const assignments = person.personuppdrag?.uppdrag || [];
    const mappedAssignments = assignments.map((assignment: any) => ({
      organ_kod: assignment.organ_kod,
      roll: assignment.roll_kod,
      status: assignment.status || 'Aktiv',
      from: assignment.from,
      tom: assignment.tom,
      typ: assignment.typ,
      ordning: assignment.ordningsnummer,
      uppgift: assignment.uppgift || getCommitteeName(assignment.organ_kod)
    }));

    // Extract biography information
    const personuppgift = person.personuppgift?.uppgift || [];
    const biographyData = personuppgift
      .filter((item: any) => item.typ === 'biografi')
      .map((item: any) => ({
        kod: item.kod,
        uppgift: item.uppgift,
        typ: item.typ,
        intressent_id: item.intressent_id,
        hangar_id: item.hangar_id
      }));

    // Extract email from personuppgift
    const emailData = personuppgift.find((item: any) => item.typ === 'eadress');
    const email = emailData?.uppgift?.replace('[på]', '@') || null;

    console.log(`Biography data for ${intressent_id}:`, biographyData);

    return {
      assignments: mappedAssignments,
      email: email,
      biography: biographyData
    };
  } catch (error) {
    console.error(`Error fetching member details for ${intressent_id}:`, error);
    return { assignments: [], email: null, biography: [] };
  }
};

export const fetchAllCommittees = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/organlista/?utformat=json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch committees: ${response.status}`);
    }
    const data = await response.json();
    const organs = data.organlista?.organ || [];
    // Extract organ codes (e.g., "AU", "FiU")
    return organs.map((organ: any) => organ.kod);
  } catch (error) {
    console.error('Error fetching committees:', error);
    return [];
  }
};

export const fetchMembersWithCommittees = async (
  page: number = 1,
  pageSize: number = 20,
  status: 'current' | 'all' | 'former' = 'current',
  committeeCode: string
): Promise<{ members: RiksdagMemberDetails[]; totalCount: number }> => {
  try {
    let url = `${API_BASE_URL}/personlista/?utformat=json&size=${pageSize}&p=${page}&org=${committeeCode}`;
    if (status === 'current') {
      url += '&rdlstatus=aktiv';
    } else if (status === 'former') {
      url += '&rdlstatus=f.d.';
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch members by committee: ${response.status}`);
    }

    const data = await response.json();
    const members = data.personlista?.person || [];
    const totalCount = parseInt(data.personlista['@hits'], 10) || 0;

    // Fetch additional details for each member
    const detailedMembers = await Promise.all(
      members.map(async (member: RiksdagMember) => {
        try {
          const detailsResponse = await fetch(`${API_BASE_URL}/person/${member.intressent_id}?utformat=json`);
          if (!detailsResponse.ok) {
            console.warn(`Failed to fetch details for member ${member.intressent_id}: ${detailsResponse.status}`);
            return { ...member, assignments: [], email: null };
          }
          const detailsData = await detailsResponse.json();
          const person = detailsData.person?.personlista?.person;

          // Extract assignments
          const assignments = person.personuppdrag?.uppdrag || [];
          const mappedAssignments = assignments.map((assignment: any) => ({
            organ_kod: assignment.organ_kod,
            roll: assignment.roll_kod,
            status: assignment.status || 'Aktiv',
            from: assignment.from,
            tom: assignment.tom,
            typ: assignment.typ,
            ordning: assignment.ordningsnummer,
            uppgift: assignment.uppgift || getCommitteeName(assignment.organ_kod)
          }));

          // Extract email from personuppgift
          const personuppgift = person.personuppgift?.uppgift || [];
          const emailData = personuppgift.find((item: any) => item.typ === 'eadress');
          const email = emailData?.uppgift?.replace('[på]', '@') || null;

          return { ...member, assignments: mappedAssignments, email: email };
        } catch (detailsError) {
          console.error(`Error fetching details for member ${member.intressent_id}:`, detailsError);
          return { ...member, assignments: [], email: null };
        }
      })
    );

    return { members: detailedMembers, totalCount };
  } catch (error) {
    console.error('Error fetching members by committee:', error);
    throw error;
  }
};

export const isValidCommitteeCode = (code: string): boolean => {
  return Object.keys(COMMITTEE_MAPPING).includes(code);
};

export const getMemberCommitteeAssignments = async (memberId: string): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/utskottsforslag/?iid=${memberId}&utformat=json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch committee assignments: ${response.status}`);
    }
    const data: RiksdagCommitteeAssignments = await response.json();
    return data.utskottsforslag?.forslag || [];
  } catch (error) {
    console.error('Error fetching committee assignments:', error);
    return [];
  }
};

export const getCommitteeName = (code: string): string => {
  return COMMITTEE_MAPPING[code] || code;
};

export const COMMITTEE_MAPPING: { [key: string]: string } = {
  "AU": "Arbetsmarknadsutskottet",
  "CU": "Civilutskottet",
  "FiU": "Finansutskottet",
  "FöU": "Försvarsutskottet",
  "JuU": "Justitieutskottet",
  "KU": "Konstitutionsutskottet",
  "KrU": "Kulturutskottet",
  "MjU": "Miljö- och jordbruksutskottet",
  "NU": "Näringsutskottet",
  "SkU": "Skatteutskottet",
  "SfU": "Socialförsäkringsutskottet",
  "SoU": "Socialutskottet",
  "TU": "Trafikutskottet",
  "UbU": "Utbildningsutskottet",
  "UU": "Utrikesutskottet",
  "CKrU": "Sammansatta civil- och kulturutskottet",
  "UFöU": "Sammansatta utrikes- och försvarsutskottet",
  "eun": "EU-nämnden",
  "Europol": "Delegationen till den gemensamma parlamentariska kontrollgruppen för Europol",
  "DN": "Domarnämnden",
  "KD": "Krigsdelegationen",
  "LR": "Ledamotsrådet",
  "NR": "Nordiska rådets svenska delegation",
  "NL": "Nämnden för lön till riksdagens ombudsmän och riksrevisorn",
  "NSÖ": "Nämnden för prövning av statsråds och vissa andra befattningshavares övergångsrestriktioner",
  "PN": "Partibidragsnämnden",
  "RB": "Riksbanksfullmäktige",
  "RAN": "Riksdagens ansvarsnämnd",
  "RAR": "Riksdagens arvodesnämnd",
  "CPAR": "Riksdagens delegation till Arktiska parlamentarikerkonferensen",
  "PA-UfM": "Riksdagens delegation till den parlamentariska församlingen för Unionen för Medelhavet",
  "ER": "Riksdagens delegation till Europarådets parlamentariska församling",
  "IPU": "Riksdagens delegation till Interparlamentariska unionen",
  "NATO": "Riksdagens delegation till Natos parlamentariska församling",
  "OSSE": "Riksdagens delegation till OSSE:s parlamentariska församling",
  "BSPC": "Riksdagens delegation till parlamentariska Östersjökonferensen",
  "JO": "Riksdagens ombudsmän",
  "DEM": "Riksdagens styrgrupp för det bilaterala demokratifrämjande samarbetet",
  "ÖN": "Riksdagens överklagandenämnd",
  "RS": "Riksdagsstyrelsen",
  "RR": "Riksrevisionen",
  "RRPR": "Riksrevisionens parlamentariska råd",
  "SN": "Statsrådsarvodesnämnden",
  "RJ": "Styrelsen för Stiftelsen Riksbankens Jubileumsfond",
  "UN": "Utrikesnämnden",
  "VB": "Valberedningen",
  "VPN": "Valprövningsnämnden",
};
