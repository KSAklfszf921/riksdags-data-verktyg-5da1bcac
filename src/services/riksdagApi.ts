import { retryFetch, type FetchOptions } from '@/utils/fetchUtils'; // Utility for retries
import { logDebug, logInfo, logWarn, logError } from '@/utils/logger'; // Centralized logging

// Environment variable for base URL
const BASE_URL = process.env.RIKSDAGEN_API_URL || 'https://data.riksdagen.se';
const DEFAULT_PAGE_SIZE = 100; // Consistent default page size
const MAX_RETRIES = 3; // For 500–599 errors
const RETRY_DELAY_MS = 1000; // Base delay for retries

// Custom error class
class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Committee codes and mapping
const VALID_COMMITTEE_CODES = [
  'AU', 'CU', 'FiU', 'FöU', 'JuU', 'KU', 'KrU', 'MjU', 'NU', 'SkU', 'SfU',
  'SoU', 'TU', 'UbU', 'UU', 'UFöU', 'EUN', 'SäU',
];

const COMMITTEE_MAPPING: { [key: string]: string } = {
  AU: 'Arbetsmarknadsutskottet',
  CU: 'Civilutskottet',
  FiU: 'Finansutskottet',
  FöU: 'Försvarsutskottet',
  JuU: 'Justitieutskottet',
  KU: 'Konstitutionsutskottet',
  KrU: 'Kulturutskottet',
  MjU: 'Miljö- och jordbruksutskottet',
  NU: 'Näringsutskottet',
  SkU: 'Skatteutskottet',
  SfU: 'Socialförsäkringsutskottet',
  SoU: 'Socialutskottet',
  TU: 'Trafikutskottet',
  UbU: 'Utbildningsutskottet',
  UU: 'Utrikesutskottet',
  UFöU: 'Sammansatta utrikes- och försvarsutskottet',
  EUN: 'EU-nämnden',
  SäU: 'Säkerhetsutskottet',
};

// Interfaces (refined to match API schema, removed unused fields)
export interface RiksdagMember {
  intressent_id: string;
  tilltalsnamn: string;
  efternamn: string;
  parti: string;
  valkrets: string;
  status: string;
  kon: string;
  fodd: string; // Consolidated fodd_ar and fodd_datum
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
  fodd: string;
  yrke?: string;
  bild_url_80?: string;
  bild_url_192?: string;
  bild_url_max?: string;
  assignments: RiksdagMemberAssignment[];
  email: string;
}

export interface RiksdagPersonResponse {
  personlista: {
    person: RiksdagMember[];
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
  dokument_url_text?: string;
  dokument_url_html?: string;
  dokumentstatus?: string;
  publicerad?: string;
  rm?: string;
  nummer?: string;
  subtyp?: string;
  doktyp?: string;
}

export interface RiksdagDocumentResponse {
  dokumentlista: {
    dokument: RiksdagDocument[];
    '@hits'?: string;
  };
}

export interface RiksdagSpeech {
  anforande_id: string;
  intressent_id: string;
  rel_dok_id: string;
  parti: string;
  anforandedatum: string;
  anforandetext: string;
  anforandetyp: string;
  kammaraktivitet: string;
  anforande_nummer: string;
  talare: string;
  rel_dok_titel?: string;
  anforande_url_html?: string;
}

export interface RiksdagSpeechResponse {
  anforandelista: {
    anforande: RiksdagSpeech[];
    '@hits'?: string;
  };
}

export interface RiksdagVote {
  votering_id: string;
  rm: string;
  beteckning: string;
  punkt: string;
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
  sort?: 'rel' | 'datum' | 'systemdatum';
  sortorder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface SpeechSearchParams {
  rm?: string;
  anftyp?: 'Nej' | '';
  date?: string;
  systemDate?: string;
  party?: string;
  intressentId?: string;
  page?: number;
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
  page?: number;
  pageSize?: number;
}

export interface CalendarSearchParams {
  org?: string[];
  akt?: string[];
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

// Utility functions
const buildUrl = (endpoint: string, params: Record<string, string | number | string[] | undefined> = {}): string => {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.append('utformat', 'json');
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((v) => url.searchParams.append(key, encodeURIComponent(v)));
    } else {
      url.searchParams.append(key, encodeURIComponent(value.toString()));
    }
  });
  return url.toString();
};

const fetchWithPagination = async <T>(
  endpoint: string,
  params: Record<string, string | number | string[] | undefined>,
  extractArray: (data: any) => T[],
  extractHits: (data: any) => string
): Promise<{ items: T[]; totalCount: number }> => {
  let allItems: T[] = [];
  let page = params.page ? Number(params.page) : 1;
  const pageSize = params.pageSize ? Number(params.pageSize) : DEFAULT_PAGE_SIZE;
  let totalCount = 0;

  while (true) {
    const pageParams = { ...params, p: page, sz: pageSize };
    const url = buildUrl(endpoint, pageParams);
    logDebug(`Fetching page ${page} from ${url}`);

    try {
      const response = await retryFetch(url, { retries: MAX_RETRIES, delay: RETRY_DELAY_MS });
      if (!response.ok) {
        throw new ApiError(`HTTP error: ${response.status}`, response.status);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new ApiError('Invalid response: Expected JSON', 500);
      }

      const data = await response.json();
      if (!data || typeof data !== 'object') {
        throw new ApiError('Invalid JSON structure', 500);
      }

      const items = extractArray(data);
      totalCount = parseInt(extractHits(data) || '0', 10);
      allItems = allItems.concat(items);

      logInfo(`Fetched ${items.length} items on page ${page}, total so far: ${allItems.length}/${totalCount}`);

      if (items.length < pageSize || allItems.length >= totalCount) {
        break;
      }
      page++;
    } catch (error) {
      logError(`Error fetching page ${page} from ${endpoint}:`, error);
      throw error instanceof ApiError ? error : new ApiError('Failed to fetch data', 500);
    }
  }

  return { items: allItems, totalCount };
};

const generateEmail = (firstName: string, lastName: string): string => {
  const cleanFirst = firstName.toLowerCase().replace(/ä/g, 'a').replace(/å/g, 'a').replace(/ö/g, 'o').replace(/\s+/g, '-');
  const cleanLast = lastName.toLowerCase().replace(/ä/g, 'a').replace(/å/g, 'a').replace(/ö/g, 'o');
  return `${cleanFirst}.${cleanLast}@riksdagen.se`;
};

const filterActiveAssignments = (rawAssignments: any[]): RiksdagMemberAssignment[] => {
  const currentDate = new Date();
  return rawAssignments
    .filter((assignment) => {
      if (!assignment?.organ_kod || !VALID_COMMITTEE_CODES.includes(assignment.organ_kod)) {
        return false;
      }
      if (assignment.tom && assignment.tom.trim()) {
        try {
          const endDate = new Date(assignment.tom);
          return !isNaN(endDate.getTime()) && endDate > currentDate;
        } catch {
          return true;
        }
      }
      return true;
    })
    .map((assignment) => ({
      organ_kod: assignment.organ_kod,
      roll: assignment.roll_kod || assignment.roll || 'ledamot',
      status: assignment.status || 'aktiv',
      from: assignment.from || '',
      tom: assignment.tom || '',
      typ: assignment.typ || 'uppdrag',
      ordning: assignment.ordningsnummer || assignment.ordning,
      uppgift: COMMITTEE_MAPPING[assignment.organ_kod] || assignment.organ_kod,
    }));
};

// API Functions
export const fetchMemberDetails = async (intressentId: string): Promise<RiksdagMemberDetails | null> => {
  const url = buildUrl('personlista', { iid: intressentId });
  logDebug(`Fetching member details: ${url}`);

  try {
    const response = await retryFetch(url, { retries: MAX_RETRIES, delay: RETRY_DELAY_MS });
    if (response.status === 404) {
      logWarn(`Member not found: ${intressentId}`);
      return null;
    }
    if (!response.ok) {
      throw new ApiError(`HTTP error: ${response.status}`, response.status);
    }

    const data = await response.json();
    if (!data?.personlista?.person?.length) {
      logWarn(`No person data found for ${intressentId}`);
      return null;
    }

    const person = data.personlista.person[0];
    const rawAssignments = person.personuppdrag?.uppdrag
      ? Array.isArray(person.personuppdrag.uppdrag)
        ? person.personuppdrag.uppdrag
        : [person.personuppdrag.uppdrag]
      : [];

    const assignments = filterActiveAssignments(rawAssignments);

    return {
      intressent_id: person.intressent_id,
      tilltalsnamn: person.tilltalsnamn,
      efternamn: person.efternamn,
      parti: person.parti,
      valkrets: person.valkrets,
      kon: person.kon,
      fodd: person.fodd,
      yrke: person.personuppgift?.uppgift?.find((u: any) => u.kod === 'yrke')?.uppgift,
      bild_url_80: person.bild_url_80,
      bild_url_192: person.bild_url_192,
      bild_url_max: person.bild_url_max,
      assignments,
      email: generateEmail(person.tilltalsnamn, person.efternamn),
    };
  } catch (error) {
    logError(`Error fetching member details for ${intressentId}:`, error);
    throw error instanceof ApiError ? error : new ApiError('Failed to fetch member details', 500);
  }
};

export const fetchMembers = async (
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE,
  status: 'current' | 'all' | 'former' = 'current'
): Promise<{ members: RiksdagMember[]; totalCount: number }> => {
  const params = { p: page, sz: pageSize, rdlstatus: status === 'current' ? 'tjanstgorande' : undefined };
  return fetchWithPagination(
    'personlista',
    params,
    (data) => {
      if (!data?.personlista?.person) {
        throw new ApiError('Invalid personlista schema', 500);
      }
      return data.personlista.person;
    },
    (data) => data?.personlista?.['@hits'] || '0'
  );
};

export const fetchAllMembers = async (): Promise<RiksdagMember[]> => {
  const { items } = await fetchMembers(1, 1000, 'current');
  return items;
};

export const searchDocuments = async (params: DocumentSearchParams): Promise<{ documents: RiksdagDocument[]; totalCount: number }> => {
  return fetchWithPagination(
    'dokumentlista',
    { ...params, p: params.page, sz: params.pageSize || DEFAULT_PAGE_SIZE },
    (data) => {
      if (!data?.dokumentlista?.dokument) {
        throw new ApiError('Invalid dokumentlista schema', 500);
      }
      return data.dokumentlista.dokument;
    },
    (data) => data?.dokumentlista?.['@hits'] || '0'
  );
};

export const searchSpeeches = async (params: SpeechSearchParams): Promise<{ speeches: RiksdagSpeech[]; totalCount: number }> => {
  return fetchWithPagination(
    'anforandelista',
    { ...params, p: params.page, sz: params.pageSize || DEFAULT_PAGE_SIZE },
    (data) => {
      if (!data?.anforandelista?.anforande) {
        throw new ApiError('Invalid anforandelista schema', 500);
      }
      return data.anforandelista.anforande;
    },
    (data) => data?.anforandelista?.['@hits'] || '0'
  );
};

export const searchVotes = async (params: VoteSearchParams): Promise<{ votes: RiksdagVote[]; totalCount: number }> => {
  return fetchWithPagination(
    'voteringlista',
    { ...params, p: params.page, sz: params.pageSize || DEFAULT_PAGE_SIZE },
    (data) => {
      if (!data?.voteringlista?.votering) {
        throw new ApiError('Invalid voteringlista schema', 500);
      }
      return data.voteringlista.votering;
    },
    (data) => data?.voteringlista?.['@hits'] || '0'
  );
};

export const searchCalendarEvents = async (params: CalendarSearchParams): Promise<{ events: RiksdagCalendarEvent[]; totalCount: number }> => {
  return fetchWithPagination(
    'kalender',
    { ...params, p: params.page, sz: params.pageSize || DEFAULT_PAGE_SIZE },
    (data) => {
      if (!data?.kalenderlista?.kalender) {
        throw new ApiError('Invalid kalenderlista schema', 500);
      }
      return data.kalenderlista.kalender;
    },
    (data) => data?.kalenderlista?.['@hits'] || '0'
  );
};

export const fetchDocumentText = async (documentId: string, documentType?: string): Promise<string | null> => {
  const url = buildUrl(`dokument/${documentId}.txt`);
  logDebug(`Fetching document text: ${url}`);

  try {
    const response = await retryFetch(url, { retries: MAX_RETRIES, delay: RETRY_DELAY_MS });
    if (!response.ok) {
      const htmlUrl = buildUrl(`dokument/${documentId}.html`);
      const htmlResponse = await retryFetch(htmlUrl, { retries: MAX_RETRIES, delay: RETRY_DELAY_MS });
      if (!htmlResponse.ok) {
        logWarn(`Failed to fetch document text for ${documentId}: ${response.status}`);
        return null;
      }
      const htmlText = await htmlResponse.text();
      const textContent = htmlText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      logInfo(`Fetched HTML document text for ${documentId}: ${textContent.length} characters`);
      return textContent;
    }

    const textContent = await response.text();
    logInfo(`Fetched document text for ${documentId}: ${textContent.length} characters`);
    return textContent;
  } catch (error) {
    logError(`Error fetching document text for ${documentId}:`, error);
    return null;
  }
};

export const fetchSpeechText = async (speechId: string): Promise<string | null> => {
  const url = buildUrl('anforandelista', { anforande_id: speechId });
  logDebug(`Fetching speech text: ${url}`);

  try {
    const response = await retryFetch(url, { retries: MAX_RETRIES, delay: RETRY_DELAY_MS });
    if (!response.ok) {
      logWarn(`Failed to fetch speech for ${speechId}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data?.anforandelista?.anforande?.[0]?.anforandetext) {
      logWarn(`No speech text found for ${speechId}`);
      return null;
    }

    const text = data.anforandelista.anforande[0].anforandetext;
    logInfo(`Fetched speech text for ${speechId}: ${text.length} characters`);
    return text;
  } catch (error) {
    logError(`Error fetching speech text for ${speechId}:`, error);
    return null;
  }
};

export const fetchDocumentTextBatch = async (
  documents: { id: string; type?: string }[]
): Promise<Map<string, string>> => {
  const textMap = new Map<string, string>();
  const batchSize = 3;

  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    logInfo(`Processing document batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documents.length / batchSize)}`);

    const batchPromises = batch.map(async (doc) => {
      const text = await fetchDocumentText(doc.id, doc.type);
      return { id: doc.id, text };
    });

    const results = await Promise.allSettled(batchPromises);
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.text && result.value.text.length > 100) {
        textMap.set(result.value.id, result.value.text);
      }
    });

    if (i + batchSize < documents.length) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  logInfo(`Batch fetching completed: ${textMap.size}/${documents.length} documents with text`);
  return textMap;
};

export const fetchMemberContentForAnalysis = async (
  memberId: string,
  limit: number = 25
): Promise<{
  speeches: Array<{ id: string; text: string; title: string; date: string }>;
  documents: Array<{ id: string; text: string; title: string; date: string; type: string }>;
}> => {
  try {
    logInfo(`Fetching content for analysis: member ${memberId}`);
    const speechParams: SpeechSearchParams = { intressentId: memberId, pageSize: Math.min(limit, 50) };
    const documentParams: DocumentSearchParams = {
      intressentId: memberId,
      pageSize: Math.min(limit, 50),
      sort: 'datum',
      sortorder: 'desc',
    };

    const [speechResult, documentResult] = await Promise.all([
      searchSpeeches(speechParams),
      searchDocuments(documentParams),
    ]);

    const speechResults = speechResult.speeches
      .slice(0, Math.floor(limit * 0.6))
      .filter((s) => s.anforandetext && s.anforandetext.length > 200)
      .map((s) => ({
        id: s.anforande_id,
        text: s.anforandetext,
        title: s.rel_dok_titel || 'Anförande',
        date: s.anforandedatum,
      }));

    const relevantDocs = documentResult.documents
      .filter((doc) => ['fr', 'mot', 'ip'].includes(doc.typ?.toLowerCase() || ''))
      .slice(0, Math.floor(limit * 0.4));

    const documentResults: Array<{ id: string; text: string; title: string; date: string; type: string }> = [];
    for (const doc of relevantDocs) {
      const text = await fetchDocumentText(doc.id, doc.typ);
      if (text && text.length > 150) {
        documentResults.push({
          id: doc.id,
          text,
          title: doc.titel || 'Dokument',
          date: doc.datum,
          type: doc.typ || 'unknown',
        });
      }
    }

    logInfo(`Fetched content for ${memberId}: ${speechResults.length} speeches, ${documentResults.length} documents`);
    return { speeches: speechResults, documents: documentResults };
  } catch (error) {
    logError(`Error fetching member content for analysis:`, error);
    return { speeches: [], documents: [] };
  }
};

export const fetchMemberSuggestions = async (query: string): Promise<RiksdagMember[]> => {
  if (query.length < 1) return [];
  const url = buildUrl('personlista', { fnamn: query });
  logDebug(`Fetching member suggestions: ${url}`);

  try {
    const response = await retryFetch(url, { retries: MAX_RETRIES, delay: RETRY_DELAY_MS });
    if (!response.ok) {
      throw new ApiError('Failed to fetch member suggestions', response.status);
    }
    const data = await response.json();
    if (!data?.personlista?.person) {
      logWarn(`No suggestions found for query: ${query}`);
      return [];
    }
    return data.personlista.person;
  } catch (error) {
    logError(`Error fetching member suggestions for ${query}:`, error);
    return [];
  }
};

export const fetchMembersWithCommittees = async (
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE,
  status: 'current' | 'all' | 'former' = 'current',
  committee?: string
): Promise<{ members: RiksdagMemberDetails[]; totalCount: number }> => {
  try {
    logInfo(`Fetching members with committees: page=${page}, status=${status}, committee=${committee}`);
    const { members, totalCount } = await fetchMembers(1, 1000, status);

    const batchSize = 5;
    const detailedMembers: RiksdagMemberDetails[] = [];

    for (let i = 0; i < members.length; i += batchSize) {
      const batch = members.slice(i, i + batchSize);
      logDebug(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(members.length / batchSize)}`);

      const batchDetails = await Promise.allSettled(batch.map((m) => fetchMemberDetails(m.intressent_id)));
      batchDetails.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          detailedMembers.push(result.value);
        } else {
          const member = batch[index];
          logWarn(`Failed to fetch details for ${member.tilltalsnamn} ${member.efternamn}`);
          detailedMembers.push({
            intressent_id: member.intressent_id,
            tilltalsnamn: member.tilltalsnamn,
            efternamn: member.efternamn,
            parti: member.parti,
            valkrets: member.valkrets,
            kon: member.kon,
            fodd: member.fodd,
            bild_url_80: member.bild_url_80,
            bild_url_192: member.bild_url_192,
            bild_url_max: member.bild_url_max,
            assignments: [],
            email: generateEmail(member.tilltalsnamn, member.efternamn),
          });
        }
      });

      if (i + batchSize < members.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    let filteredMembers = detailedMembers;
    if (committee && committee !== 'all' && VALID_COMMITTEE_CODES.includes(committee)) {
      filteredMembers = detailedMembers.filter((m) => m.assignments.some((a) => a.organ_kod === committee));
      logInfo(`Filtered to ${filteredMembers.length} members for committee ${committee}`);
    }

    const startIndex = (page - 1) * pageSize;
    const paginatedMembers = filteredMembers.slice(startIndex, startIndex + pageSize);

    return { members: paginatedMembers, totalCount: filteredMembers.length };
  } catch (error) {
    logError('Error fetching members with committees:', error);
    return { members: [], totalCount: 0 };
  }
};

export const fetchAllCommittees = async (): Promise<string[]> => {
  logInfo(`Returning ${Object.values(COMMITTEE_MAPPING).length} committees`);
  return Object.values(COMMITTEE_MAPPING);
};

export const fetchMemberDocuments = async (
  intressentId: string,
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<RiksdagDocument[]> => {
  try {
    logInfo(`Fetching documents for member: ${intressentId}`);
    const { documents } = await searchDocuments({ intressentId, page, pageSize, sort: 'datum', sortorder: 'desc' });
    return documents.map((doc) => ({ ...doc, intressent_id: intressentId }));
  } catch (error) {
    logError(`Error fetching documents for member ${intressentId}:`, error);
    return [];
  }
};

export const fetchMemberSpeeches = async (
  intressentId: string,
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<RiksdagSpeech[]> => {
  try {
    logInfo(`Fetching speeches for member: ${intressentId}`);
    const { speeches } = await searchSpeeches({ intressentId, page, pageSize });
    return speeches;
  } catch (error) {
    logError(`Error fetching speeches for member ${intressentId}:`, error);
    return [];
  }
};

export const fetchMemberVotes = async (
  intressentId: string,
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<RiksdagVote[]> => {
  try {
    logInfo(`Fetching votes for member: ${intressentId}`);
    const { votes } = await searchVotes({ intressentId, page, pageSize });
    return votes;
  } catch (error) {
    logError(`Error fetching votes for member ${intressentId}:`, error);
    return [];
  }
};

export const fetchMemberCalendarEvents = async (
  intressentId: string,
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<RiksdagCalendarEvent[]> => {
  logInfo(`Calendar events not member-specific for ${intressentId}`);
  return [];
};

export const getMemberCommitteeAssignments = async (intressentId: string): Promise<RiksdagMemberAssignment[]> => {
  const memberDetails = await fetchMemberDetails(intressentId);
  return memberDetails?.assignments || [];
};

export const isValidCommitteeCode = (code: string): boolean => {
  return VALID_COMMITTEE_CODES.includes(code);
};

export { COMMITTEE_MAPPING, VALID_COMMITTEE_CODES };