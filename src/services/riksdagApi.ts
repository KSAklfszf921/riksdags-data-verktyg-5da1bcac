export interface RiksdagMember {
  id: string;
  intressent_id: string;
  fnamn: string;
  enamn: string;
  tilltalsnamn: string;
  efternamn: string;
  parti: string;
  valkrets: string;
  kon: string;
  fodd?: string;
  fodd_ar?: string;
  bild_url?: string;
  bild_url_80?: string;
  bild_url_192?: string;
  bild_url_max?: string;
  uppdrag?: Array<{
    roll: string;
    organ: string;
  }>;
  assignments?: Array<{
    roll: string;
    organ: string;
    organ_kod?: string;
    status: string;
    from: string;
    tom: string;
    typ: string;
    ordning?: string;
    uppgift: string;
  }>;
}

export interface RiksdagMemberDetails extends RiksdagMember {
  email: string;
  fodd_ar?: string;
  assignments?: Array<{
    roll: string;
    organ: string;
    organ_kod?: string;
    status: string;
    from: string;
    tom: string;
    typ: string;
    ordning?: string;
    uppgift: string;
  }>;
}

export interface RiksdagPersonResponse {
  personlista: {
    person: RiksdagMember[];
    '@antal_total': string;
  };
}

export interface RiksdagDocument {
  id: string;
  titel: string;
  undertitel?: string;
  doktyp: string;
  typ: string;
  datum: string;
  beteckning?: string;
  publicerad?: string;
  organ?: string;
  fil_url?: string;
  dokument_url_html?: string;
  dokument_url_text?: string;
}

export interface RiksdagDocumentResponse {
  dokumentlista: {
    dokument: RiksdagDocument[];
    '@antal': string;
    nasta_sida?: string;
  };
}

export interface RiksdagSpeech {
  id: string;
  anforande_id?: string;
  intressent_id?: string;
  rel_dok_id?: string;
  talare: string;
  namn?: string;
  parti: string;
  anforandetext: string;
  datum: string;
  anforandedatum?: string;
  anforande_nummer?: number;
  anforande_url_html?: string;
  dok_id?: string;
  avsnittsrubrik?: string;
  anforandetyp?: string;
  kammaraktivitet?: string;
  rel_dok_titel?: string;
  rel_dok_beteckning?: string;
  replik?: string;
  protokoll_url_www?: string;
}

export interface RiksdagSpeechResponse {
  anforandelista: {
    anforande: RiksdagSpeech[];
  };
}

export interface RiksdagVote {
  id: string;
  votering_id?: string;
  intressent_id?: string;
  namn?: string;
  parti?: string;
  valkrets?: string;
  datum: string;
  systemdatum?: string;
  beteckning?: string;
  rm?: string;
  avser?: string;
  punkt?: number | string;
  rost: string;
}

export interface RiksdagVoteResponse {
  voteringlista: {
    votering: RiksdagVote[];
  };
}

export interface DocumentSearchParams {
  doktyp?: string;
  sok?: string;
  searchTerm?: string;
  rm?: string;
  from?: string;
  tom?: string;
  fromDate?: string;
  toDate?: string;
  organ?: string;
  org?: string;
  bet?: string;
  p?: number;
  sort?: string;
  sortorder?: 'asc' | 'desc';
  iid?: string;
  sz?: number;
  utformat?: 'json' | 'xml';
}

export interface MemberSearchParams {
  iid?: string;
  fnamn?: string;
  enamn?: string;
  fodd?: string;
  kon?: 'K' | 'M';
  valkrets?: string;
  parti?: 'S' | 'M' | 'SD' | 'C' | 'V' | 'KD' | 'L' | 'MP';
  kategori?: string;
  organ?: string;
  p?: number;
  utformat?: 'json' | 'xml';
}

export interface SpeechSearchParams {
  rm?: string;
  sok?: string;
  parti?: 'S' | 'M' | 'SD' | 'C' | 'V' | 'KD' | 'L' | 'MP';
  party?: 'S' | 'M' | 'SD' | 'C' | 'V' | 'KD' | 'L' | 'MP';
  anforandetyp?: string;
  anfttyp?: string;
  anftyp?: string;
  talare?: string;
  intressent_id?: string;
  intressentId?: string;
  date?: string;
  systemDate?: string;
  pageSize?: number;
  p?: number;
  utformat?: 'json' | 'xml';
}

export interface VoteSearchParams {
  rm?: string[] | string;
  bet?: string;
  beteckning?: string;
  punkt?: string;
  valkrets?: string;
  rost?: 'Ja' | 'Nej' | 'Avstår' | 'Frånvarande';
  party?: string[];
  parti?: string;
  gruppering?: 'iid' | 'namn' | 'parti' | 'valkrets' | 'rm' | 'votering_id' | 'bet';
  p?: number;
  page?: number;
  pageSize?: number;
  sort?: string[] | string;
  utformat?: 'json' | 'xml';
}

const BASE_URL = 'https://data.riksdagen.se';

export const VALID_COMMITTEE_CODES = [
  'AU', 'CU', 'FiU', 'FöU', 'JuU', 'KU', 'KrU', 'MjU',
  'NU', 'SkU', 'SfU', 'SoU', 'TU', 'UbU', 'UU',
  'UFöU', 'EUN', 'SäU'
];

export const COMMITTEE_MAPPING: { [key: string]: string } = {
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
  SäU: 'Säkerhetsutskottet'
};

// Utility function for generating standardized emails
const generateEmail = (firstName: string, lastName: string): string => {
  const cleanFirst = firstName.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/ä/g, 'a')
    .replace(/å/g, 'a')
    .replace(/ö/g, 'o');
  const cleanLast = lastName.toLowerCase()
    .replace(/ä/g, 'a')
    .replace(/å/g, 'a')
    .replace(/ö/g, 'o');
  return `${cleanFirst}.${cleanLast}@riksdagen.se`;
};

// Enhanced API request with proper error handling
const makeApiRequest = async (endpoint: string, params: Record<string, any> = {}): Promise<any> => {
  const url = new URL(endpoint, BASE_URL);
  
  // Add default format to JSON
  if (!params.utformat) {
    params.utformat = 'json';
  }
  
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
        'User-Agent': 'Riksdag-Data-Client/2.0',
      },
    });

    if (!response.ok) {
      if (response.status === 413) {
        throw new Error('Response too large - use more specific filters or pagination');
      } else if (response.status === 400) {
        throw new Error('Invalid parameters - check parameter format and values');
      } else if (response.status === 404) {
        throw new Error('Resource not found');
      }
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected JSON response but got: ${contentType}`);
    }

    const data = await response.json();
    console.log(`API request successful: ${Object.keys(data).join(', ')}`);
    return data;
  } catch (error) {
    console.error(`API request failed for ${url.toString()}:`, error);
    throw error;
  }
};

export const fetchMembers = async (params: MemberSearchParams = {}): Promise<{ members: RiksdagMember[]; totalCount: number }> => {
  try {
    const data: RiksdagPersonResponse = await makeApiRequest('/personlista/', params);
    const members = data.personlista?.person || [];
    const totalCount = parseInt(data.personlista?.['@antal_total'] || '0');
    
    console.log(`Fetched ${members.length} members, total: ${totalCount}`);
    return { members, totalCount };
  } catch (error) {
    console.error('Error fetching members:', error);
    return { members: [], totalCount: 0 };
  }
};

export const fetchMemberDetails = async (memberId: string): Promise<RiksdagMemberDetails | null> => {
  try {
    console.log(`Fetching member details for: ${memberId}`);
    const data = await makeApiRequest(`/person/${memberId}/`);
    if (!data) {
      console.log(`No person found for ID: ${memberId}`);
      return null;
    }

    const person = data as RiksdagMemberDetails;

    return {
      ...person,
      email: generateEmail(person.fnamn, person.enamn)
    };
  } catch (error) {
    console.error(`Error fetching member details for ${memberId}:`, error);
    return null;
  }
};

export const searchDocuments = async (params: DocumentSearchParams): Promise<{ documents: RiksdagDocument[]; totalCount: number; nextPage?: string }> => {
  try {
    console.log('Searching documents with params:', params);
    const data: RiksdagDocumentResponse = await makeApiRequest('/dokumentlista/', params);
    
    const documents = data.dokumentlista?.dokument || [];
    const totalCount = parseInt(data.dokumentlista?.['@antal'] || '0');
    const nextPage = data.dokumentlista?.nasta_sida;
    
    console.log(`Found ${documents.length} documents, total: ${totalCount}`);
    return { documents, totalCount, nextPage };
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
};

export const fetchDocument = async (documentId: string): Promise<RiksdagDocument | null> => {
  try {
    console.log(`Fetching document: ${documentId}`);
    const data = await makeApiRequest(`/dokument/${documentId}/`);
    return data as RiksdagDocument;
  } catch (error) {
    console.error(`Error fetching document ${documentId}:`, error);
    return null;
  }
};

export const searchSpeeches = async (params: SpeechSearchParams): Promise<{ speeches: RiksdagSpeech[]; totalCount: number }> => {
  try {
    console.log('Searching speeches with params:', params);
    const data: RiksdagSpeechResponse = await makeApiRequest('/anforandelista/', params);
    
    const speeches = data.anforandelista?.anforande || [];
    const totalCount = speeches.length; // API doesn't provide total count for speeches
    
    console.log(`Found ${speeches.length} speeches`);
    return { speeches, totalCount };
  } catch (error) {
    console.error('Error searching speeches:', error);
    throw error;
  }
};

export const fetchSpeech = async (speechId: string): Promise<RiksdagSpeech | null> => {
  try {
    console.log(`Fetching speech: ${speechId}`);
    const data = await makeApiRequest(`/anforande/${speechId}/`);
    return data as RiksdagSpeech;
  } catch (error) {
    console.error(`Error fetching speech ${speechId}:`, error);
    return null;
  }
};

export const searchVotes = async (params: VoteSearchParams): Promise<{ votes: RiksdagVote[]; totalCount: number }> => {
  try {
    console.log('Searching votes with params:', params);
    const data: RiksdagVoteResponse = await makeApiRequest('/voteringlista/', params);
    
    const votes = data.voteringlista?.votering || [];
    const totalCount = votes.length; // API doesn't provide total count for votes
    
    console.log(`Found ${votes.length} votes`);
    return { votes, totalCount };
  } catch (error) {
    console.error('Error searching votes:', error);
    throw error;
  }
};

export const fetchVote = async (voteId: string, party?: string): Promise<RiksdagVote | null> => {
  try {
    console.log(`Fetching vote: ${voteId}${party ? ` for party: ${party}` : ''}`);
    const params = party ? { parti: party } : {};
    const data = await makeApiRequest(`/votering/${voteId}/`, params);
    return data as RiksdagVote;
  } catch (error) {
    console.error(`Error fetching vote ${voteId}:`, error);
    return null;
  }
};

// Add the missing functions that the document text fetchers need
export const fetchDocumentText = async (documentId: string): Promise<string | null> => {
  try {
    console.log(`Fetching document text for: ${documentId}`);
    const response = await fetch(`${BASE_URL}/dokument/${documentId}.txt`);
    
    if (!response.ok) {
      console.error(`Failed to fetch document text: ${response.status}`);
      return null;
    }
    
    const text = await response.text();
    return text;
  } catch (error) {
    console.error(`Error fetching document text for ${documentId}:`, error);
    return null;
  }
};

export const fetchSpeechText = async (speechId: string): Promise<string | null> => {
  try {
    console.log(`Fetching speech text for: ${speechId}`);
    const speech = await fetchSpeech(speechId);
    return speech?.anforandetext || null;
  } catch (error) {
    console.error(`Error fetching speech text for ${speechId}:`, error);
    return null;
  }
};

export const fetchMemberContentForAnalysis = async (
  memberId: string, 
  limit: number = 15
): Promise<{
  speeches: Array<{ id: string; text: string; title: string; date: string }>;
  documents: Array<{ id: string; text: string; title: string; date: string; type: string }>;
}> => {
  try {
    console.log(`Fetching content for analysis: member ${memberId}, limit ${limit}`);
    
    // Fetch member details first
    const member = await fetchMemberDetails(memberId);
    if (!member) {
      throw new Error(`Member not found: ${memberId}`);
    }
    
    // Fetch recent speeches
    const { speeches } = await searchSpeeches({
      intressent_id: memberId,
      pageSize: limit
    });
    
    // Fetch recent documents
    const { documents } = await searchDocuments({
      iid: memberId,
      sz: limit
    });
    
    // Transform speeches
    const speechData = speeches.map(speech => ({
      id: speech.id,
      text: speech.anforandetext || '',
      title: speech.avsnittsrubrik || 'Anförande',
      date: speech.datum
    }));
    
    // Transform documents (note: documents don't have text directly, need to fetch separately)
    const documentData = documents.map(doc => ({
      id: doc.id,
      text: '', // Will be filled by the text fetcher
      title: doc.titel,
      date: doc.datum,
      type: doc.typ
    }));
    
    console.log(`Content fetched for ${member.efternamn}: ${speechData.length} speeches, ${documentData.length} documents`);
    
    return {
      speeches: speechData,
      documents: documentData
    };
  } catch (error) {
    console.error(`Error fetching member content for analysis:`, error);
    return {
      speeches: [],
      documents: []
    };
  }
};

// Legacy compatibility functions
export const fetchAllMembers = async (): Promise<RiksdagMember[]> => {
  const { members } = await fetchMembers({ kategori: 'nuvarande' });
  return members;
};

export const fetchMemberSuggestions = async (query: string): Promise<RiksdagMember[]> => {
  if (query.length < 2) return [];
  
  const { members } = await fetchMembers({ 
    fnamn: query.includes(' ') ? query.split(' ')[0] : query,
    enamn: query.includes(' ') ? query.split(' ').slice(1).join(' ') : undefined
  });
  
  return members.slice(0, 10); // Limit suggestions
};

// Utility functions for backward compatibility
export const fetchMemberDocuments = async (memberId: string): Promise<RiksdagDocument[]> => {
  try {
    const { documents } = await searchDocuments({ iid: memberId });
    return documents;
  } catch (error) {
    console.error(`Error fetching documents for member ${memberId}:`, error);
    return [];
  }
};

export const fetchMemberSpeeches = async (memberId: string): Promise<RiksdagSpeech[]> => {
  try {
    const { speeches } = await searchSpeeches({ intressent_id: memberId });
    return speeches;
  } catch (error) {
    console.error(`Error fetching speeches for member ${memberId}:`, error);
    return [];
  }
};

export const fetchMemberVotes = async (memberId: string): Promise<RiksdagVote[]> => {
  try {
    // Note: The API doesn't support filtering votes by member ID directly
    // This would require fetching multiple votes and filtering client-side
    console.warn('Fetching votes by member ID is not directly supported by the API');
    return [];
  } catch (error) {
    console.error(`Error fetching votes for member ${memberId}:`, error);
    return [];
  }
};

// Export utility functions for validation
export const isValidParty = (party: string): party is 'S' | 'M' | 'SD' | 'C' | 'V' | 'KD' | 'L' | 'MP' => {
  return ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP'].includes(party);
};

export const isValidDocumentType = (docType: string): docType is 'mot' | 'prop' | 'bet' | 'sou' | 'ip' | 'sfs' => {
  return ['mot', 'prop', 'bet', 'sou', 'ip', 'sfs'].includes(docType);
};

export const isValidGender = (gender: string): gender is 'K' | 'M' => {
  return ['K', 'M'].includes(gender);
};

export const isValidCommitteeCode = (code: string): boolean => {
  return VALID_COMMITTEE_CODES.includes(code);
};

// Add the missing fetchMembersWithCommittees function
export const fetchMembersWithCommittees = async (
  page: number = 1, 
  pageSize: number = 100, 
  status: string = 'current'
): Promise<{ members: RiksdagMemberDetails[]; totalCount: number }> => {
  try {
    const params: MemberSearchParams = {
      p: page,
      utformat: 'json'
    };

    if (status === 'current') {
      params.kategori = 'nuvarande';
    }

    const { members, totalCount } = await fetchMembers(params);
    
    // Transform to RiksdagMemberDetails
    const detailedMembers: RiksdagMemberDetails[] = members.map(member => ({
      ...member,
      email: generateEmail(member.fnamn, member.enamn),
      assignments: member.assignments || []
    }));

    return { members: detailedMembers, totalCount };
  } catch (error) {
    console.error('Error fetching members with committees:', error);
    return { members: [], totalCount: 0 };
  }
};
