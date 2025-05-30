
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
  datum_fran: string;
  datum_tom: string;
  fodd_datum: string;
  bild_url_80?: string;
  bild_url_192?: string;
  bild_url_max?: string;
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
}

export interface RiksdagDocumentResponse {
  dokumentlista: {
    dokument: RiksdagDocument[];
    '@hits'?: string;
  };
}

export interface DocumentSearchParams {
  searchTerm?: string;
  docType?: string;
  fromDate?: string;
  toDate?: string;
  intressentId?: string;
  organ?: string;
  party?: string[];
  rm?: string;
  beteckning?: string;
  nummer?: string;
  tempbet?: string;
  sort?: 'rel' | 'datum' | 'systemdatum' | 'bet' | 'debattdag' | 'debattdagtid' | 'beslutsdag';
  sortOrder?: 'asc' | 'desc';
  pageSize?: number;
}

const BASE_URL = 'https://data.riksdagen.se';

export const fetchMemberSuggestions = async (query: string): Promise<RiksdagMember[]> => {
  if (query.length < 2) return [];
  
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

export const fetchMembers = async (
  page: number = 1,
  pageSize: number = 20,
  status: 'current' | 'all' | 'former' = 'current'
): Promise<{ members: RiksdagMember[]; totalCount: number }> => {
  let url = `${BASE_URL}/personlista/?utformat=json`;
  
  // Lägg till status filter
  switch (status) {
    case 'current':
      url += '&rdlstatus=tjanstgorande';
      break;
    case 'all':
      url += '&rdlstatus='; // Alla ledamöter
      break;
    case 'former':
      url += '&rdlstatus=tidigare';
      break;
  }
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Kunde inte hämta ledamöter');
    }
    const data: RiksdagPersonResponse = await response.json();
    const allMembers = data.personlista?.person || [];
    const totalCount = parseInt(data.personlista?.['@hits'] || '0');
    
    // Implementera klient-sidan paginering eftersom API:et inte stödjer det direkt
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedMembers = allMembers.slice(startIndex, endIndex);
    
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
    return data.personlista?.person || [];
  } catch (error) {
    console.error('Error fetching all members:', error);
    return [];
  }
};

export const searchDocuments = async (params: DocumentSearchParams): Promise<{documents: RiksdagDocument[], totalCount: number}> => {
  let url = `${BASE_URL}/dokumentlista/?utformat=json`;
  
  // Add page size
  if (params.pageSize) {
    url += `&sz=${params.pageSize}`;
  } else {
    url += '&sz=50';
  }
  
  // Add search parameters
  if (params.searchTerm) url += `&sok=${encodeURIComponent(params.searchTerm)}`;
  if (params.docType) url += `&typ=${params.docType}`;
  if (params.fromDate) url += `&from=${params.fromDate}`;
  if (params.toDate) url += `&tom=${params.toDate}`;
  if (params.intressentId) url += `&iid=${params.intressentId}`;
  if (params.organ) url += `&org=${params.organ}`;
  if (params.rm) url += `&rm=${params.rm}`;
  if (params.beteckning) url += `&bet=${encodeURIComponent(params.beteckning)}`;
  if (params.nummer) url += `&nr=${params.nummer}`;
  if (params.tempbet) url += `&tempbet=${params.tempbet}`;
  
  // Add party filters
  if (params.party && params.party.length > 0) {
    params.party.forEach(p => {
      url += `&parti=${p}`;
    });
  }
  
  // Add sorting
  if (params.sort) url += `&sort=${params.sort}`;
  if (params.sortOrder) url += `&sortorder=${params.sortOrder}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    const data: RiksdagDocumentResponse = await response.json();
    const documents = data.dokumentlista?.dokument || [];
    const totalCount = parseInt(data.dokumentlista?.['@hits'] || '0');
    
    return { documents, totalCount };
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
};

export const fetchMemberDocuments = async (intressentId: string): Promise<RiksdagDocument[]> => {
  const { documents } = await searchDocuments({
    intressentId,
    pageSize: 100,
    sort: 'datum',
    sortOrder: 'desc'
  });
  return documents;
};
