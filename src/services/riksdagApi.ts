// Updated Riksdag API service to comply with technical guide
const BASE_URL = 'https://data.riksdagen.se';

// Add proper error handling for common API issues
export class RiksdagApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'RiksdagApiError';
  }
}

const handleApiResponse = async (response: Response) => {
  if (response.status === 413) {
    throw new RiksdagApiError('För stort svar - begränsa tidsintervall eller dela upp anropet', 413);
  }
  if (response.status === 404) {
    throw new RiksdagApiError('Data hittades inte - kontrollera ID eller om publicering ägt rum', 404);
  }
  if (response.status === 400) {
    throw new RiksdagApiError('Ogiltiga parametrar - kontrollera datumformat eller värden', 400);
  }
  if (!response.ok) {
    throw new RiksdagApiError(`API-fel: ${response.status}`, response.status);
  }
  return response;
};

export interface DocumentSearchParams {
  searchTerm?: string;
  doktyp?: string;
  rm?: string;
  fromDate?: string;
  toDate?: string;
  org?: string;
  iid?: string;
  bet?: string;
  parti?: string[];
  sort?: string;
  sortorder?: 'asc' | 'desc';
  p?: number; // Use 'p' for pagination instead of 'sz'
}

export interface RiksdagDocument {
  id: string;
  titel: string;
  subtitel?: string;
  typ: string;
  datum: string;
  dokument_url_html?: string;
  dokument_url_text?: string;
  summary?: string;
  beteckning?: string;
  organ?: string;
  rm?: string;
  hangar_id?: string;
}

export interface RiksdagMember {
  intressent_id: string;
  tilltalsnamn: string;
  efternamn: string;
  parti: string;
  valkrets: string;
  kon: string;
  fodd_ar: string;
  hangar_guid: string;
  status: string;
  datum_fran: string;
  datum_tom: string;
  fodd_datum: string;
  bild_url_80?: string;
  bild_url_192?: string;
  bild_url_max?: string;
}

export interface RiksdagMemberDetails extends RiksdagMember {
  email?: string;
  assignments: Array<{
    organ_kod: string;
    roll: string;
    status: string;
    from: string;
    tom: string;
    typ: string;
    ordning: number;
    uppgift: string;
  }>;
}

// Committee mapping with correct codes
export const COMMITTEE_MAPPING: { [code: string]: string } = {
  'AU': 'Arbetsmarknadsutskottet',
  'BoU': 'Bostadsutskottet', 
  'CU': 'Civilutskottet',
  'EU': 'EES-utskottet',
  'eun': 'EU-nämnden',
  'FiU': 'Finansutskottet',
  'FöU': 'Försvarsutskottet',
  'JoU': 'Jordbruksutskottet',
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
  'UFöU': 'Sammansatta utrikes- och försvarsutskottet'
};

export const isValidCommitteeCode = (code: string): boolean => {
  return Object.keys(COMMITTEE_MAPPING).includes(code);
};

// Updated search documents function following the technical guide
export const searchDocuments = async (params: DocumentSearchParams): Promise<{
  documents: RiksdagDocument[];
  totalCount: number;
}> => {
  console.log('🔍 Searching documents with params:', params);
  
  const searchParams = new URLSearchParams();
  
  // Always use JSON format as recommended
  searchParams.append('utformat', 'json');
  
  // Use proper pagination with 'p' parameter instead of 'sz'
  if (params.p) {
    searchParams.append('p', params.p.toString());
  } else {
    searchParams.append('p', '1');
  }
  
  // Add other parameters following the guide
  if (params.doktyp) searchParams.append('doktyp', params.doktyp);
  if (params.rm) searchParams.append('rm', params.rm);
  if (params.fromDate) searchParams.append('from', params.fromDate);
  if (params.toDate) searchParams.append('tom', params.toDate);
  if (params.org) searchParams.append('organ', params.org);
  if (params.bet) searchParams.append('bet', params.bet);
  if (params.sort) searchParams.append('sort', params.sort);
  if (params.sortorder) searchParams.append('sortorder', params.sortorder);
  
  // Use 'sok' parameter for search terms and parties as recommended
  if (params.searchTerm) {
    searchParams.append('sok', params.searchTerm);
  }
  
  // For parties, use 'sok' with party name instead of 'parti' parameter
  if (params.parti && params.parti.length > 0) {
    const partySearch = params.parti.join(' OR ');
    if (params.searchTerm) {
      searchParams.set('sok', `${params.searchTerm} AND (${partySearch})`);
    } else {
      searchParams.append('sok', partySearch);
    }
  }
  
  // For member ID, add to search
  if (params.iid) {
    searchParams.append('iid', params.iid);
  }

  const url = `${BASE_URL}/dokumentlista/?${searchParams.toString()}`;
  console.log('📡 API URL:', url);

  try {
    const response = await fetch(url);
    await handleApiResponse(response);
    const data = await response.json();
    
    if (!data.dokumentlista) {
      console.warn('⚠️ No dokumentlista in response');
      return { documents: [], totalCount: 0 };
    }

    let documents: any[] = [];
    if (data.dokumentlista.dokument) {
      documents = Array.isArray(data.dokumentlista.dokument) 
        ? data.dokumentlista.dokument 
        : [data.dokumentlista.dokument];
    }

    const mappedDocuments: RiksdagDocument[] = documents.map(doc => ({
      id: doc.dok_id || doc.id,
      titel: doc.titel || '',
      subtitel: doc.subtitel,
      typ: doc.doktyp || doc.typ,
      datum: doc.datum || doc.publicerad || doc.systemdatum,
      dokument_url_html: doc.dokument_url_html,
      dokument_url_text: doc.dokument_url_text,
      summary: doc.summary || doc.notis,
      beteckning: doc.beteckning,
      organ: doc.organ,
      rm: doc.rm,
      hangar_id: doc.hangar_id
    }));

    const totalCount = parseInt(data.dokumentlista['@hits']) || documents.length;
    
    console.log(`✅ Found ${mappedDocuments.length} documents (total: ${totalCount})`);
    return { documents: mappedDocuments, totalCount };
    
  } catch (error) {
    console.error('❌ Error searching documents:', error);
    if (error instanceof RiksdagApiError) {
      throw error;
    }
    throw new RiksdagApiError('Kunde inte söka dokument');
  }
};

// Updated member fetching functions
export const fetchMembers = async (
  page: number = 1,
  pageSize: number = 20,
  status: 'current' | 'all' | 'former' = 'current'
): Promise<{ members: RiksdagMember[]; totalCount: number }> => {
  const searchParams = new URLSearchParams();
  searchParams.append('utformat', 'json');
  searchParams.append('p', page.toString());
  
  // Use proper status filtering
  if (status === 'current') {
    searchParams.append('rdlstatus', 'tjanst');
  } else if (status === 'former') {
    searchParams.append('rdlstatus', 'fordom');
  }
  
  const url = `${BASE_URL}/personlista/?${searchParams.toString()}`;
  
  try {
    const response = await fetch(url);
    await handleApiResponse(response);
    const data = await response.json();
    
    if (!data.personlista || !data.personlista.person) {
      return { members: [], totalCount: 0 };
    }

    const persons = Array.isArray(data.personlista.person) 
      ? data.personlista.person 
      : [data.personlista.person];

    const totalCount = parseInt(data.personlista['@hits']) || persons.length;
    
    return { members: persons, totalCount };
  } catch (error) {
    console.error('❌ Error fetching members:', error);
    if (error instanceof RiksdagApiError) {
      throw error;
    }
    throw new RiksdagApiError('Kunde inte hämta ledamöter');
  }
};

export const fetchMemberDetails = async (memberId: string): Promise<RiksdagMemberDetails | null> => {
  if (!memberId) return null;
  
  // Use correct endpoint structure as per guide
  const url = `${BASE_URL}/person/${memberId}?utformat=json`;
  
  try {
    const response = await fetch(url);
    await handleApiResponse(response);
    const data = await response.json();
    
    if (!data.person) {
      return null;
    }

    const person = data.person;
    const assignments = person.personuppdrag?.uppdrag || [];
    
    return {
      ...person,
      assignments: Array.isArray(assignments) ? assignments : [assignments]
    };
  } catch (error) {
    console.error(`❌ Error fetching member details for ${memberId}:`, error);
    return null;
  }
};

export const fetchMemberSuggestions = async (query: string): Promise<RiksdagMember[]> => {
  if (!query || query.length < 2) return [];
  
  const searchParams = new URLSearchParams();
  searchParams.append('utformat', 'json');
  searchParams.append('sok', query); // Use 'sok' parameter as recommended
  searchParams.append('p', '1');
  
  const url = `${BASE_URL}/personlista/?${searchParams.toString()}`;
  
  try {
    const response = await fetch(url);
    await handleApiResponse(response);
    const data = await response.json();
    
    if (!data.personlista?.person) return [];
    
    const persons = Array.isArray(data.personlista.person) 
      ? data.personlista.person 
      : [data.personlista.person];
    
    return persons.slice(0, 10); // Limit suggestions
  } catch (error) {
    console.error('❌ Error fetching member suggestions:', error);
    return [];
  }
};

export const fetchMemberDocuments = async (memberId: string): Promise<any[]> => {
  const searchParams = new URLSearchParams();
  searchParams.append('utformat', 'json');
  searchParams.append('iid', memberId);
  searchParams.append('p', '1');
  
  const url = `${BASE_URL}/dokumentlista/?${searchParams.toString()}`;
  
  try {
    const response = await fetch(url);
    await handleApiResponse(response);
    const data = await response.json();
    
    if (!data.dokumentlista?.dokument) return [];
    
    const documents = Array.isArray(data.dokumentlista.dokument) 
      ? data.dokumentlista.dokument 
      : [data.dokumentlista.dokument];
    
    return documents;
  } catch (error) {
    console.error(`❌ Error fetching documents for member ${memberId}:`, error);
    return [];
  }
};

export const fetchMemberSpeeches = async (memberId: string): Promise<any[]> => {
  const searchParams = new URLSearchParams();
  searchParams.append('utformat', 'json');
  searchParams.append('iid', memberId);
  searchParams.append('p', '1');
  
  const url = `${BASE_URL}/anforandelista/?${searchParams.toString()}`;
  
  try {
    const response = await fetch(url);
    await handleApiResponse(response);
    const data = await response.json();
    
    if (!data.anforandelista?.anforande) return [];
    
    const speeches = Array.isArray(data.anforandelista.anforande) 
      ? data.anforandelista.anforande 
      : [data.anforandelista.anforande];
    
    return speeches;
  } catch (error) {
    console.error(`❌ Error fetching speeches for member ${memberId}:`, error);
    return [];
  }
};

export const fetchMemberCalendarEvents = async (memberId: string): Promise<any[]> => {
  // Note: Calendar events are not member-specific in the API
  // This is a placeholder that could be enhanced with filtering
  return [];
};

export const fetchAllMembers = async (): Promise<RiksdagMember[]> => {
  const allMembers: RiksdagMember[] = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    try {
      const result = await fetchMembers(page, 50, 'current');
      allMembers.push(...result.members);
      
      // Check if we have more pages
      hasMore = result.members.length === 50 && allMembers.length < result.totalCount;
      page++;
      
      // Add delay to avoid overwhelming the API
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error(`❌ Error fetching page ${page}:`, error);
      hasMore = false;
    }
  }
  
  return allMembers;
};

export const fetchMembersWithCommittees = async (
  page: number = 1,
  pageSize: number = 20,
  status: 'current' | 'all' | 'former' = 'current',
  committee?: string
): Promise<{ members: RiksdagMemberDetails[]; totalCount: number }> => {
  const searchParams = new URLSearchParams();
  searchParams.append('utformat', 'json');
  searchParams.append('p', page.toString());
  
  if (status === 'current') {
    searchParams.append('rdlstatus', 'tjanst');
  }
  
  if (committee) {
    searchParams.append('organ', committee);
  }
  
  const url = `${BASE_URL}/personlista/?${searchParams.toString()}`;
  
  try {
    const response = await fetch(url);
    await handleApiResponse(response);
    const data = await response.json();
    
    if (!data.personlista?.person) {
      return { members: [], totalCount: 0 };
    }
    
    const persons = Array.isArray(data.personlista.person) 
      ? data.personlista.person 
      : [data.personlista.person];
    
    // Fetch detailed info for each member
    const detailedMembers = await Promise.all(
      persons.map(async (person) => {
        const details = await fetchMemberDetails(person.intressent_id);
        return details || person;
      })
    );
    
    const totalCount = parseInt(data.personlista['@hits']) || persons.length;
    
    return { members: detailedMembers, totalCount };
  } catch (error) {
    console.error('❌ Error fetching members with committees:', error);
    if (error instanceof RiksdagApiError) {
      throw error;
    }
    throw new RiksdagApiError('Kunde inte hämta ledamöter');
  }
};

export const fetchAllCommittees = async (): Promise<string[]> => {
  return Object.keys(COMMITTEE_MAPPING);
};

export const getMemberCommitteeAssignments = async (memberId: string): Promise<string[]> => {
  const details = await fetchMemberDetails(memberId);
  if (!details?.assignments) return [];
  
  return details.assignments
    .filter(assignment => assignment.typ === 'uppdrag' && !assignment.tom)
    .map(assignment => assignment.organ_kod)
    .filter(code => isValidCommitteeCode(code));
};
