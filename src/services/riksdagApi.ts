
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
}

export interface RiksdagDocumentResponse {
  dokumentlista: {
    dokument: RiksdagDocument[];
  };
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

export const searchDocuments = async (
  docType?: string,
  fromDate?: string,
  toDate?: string,
  intressentId?: string
): Promise<RiksdagDocument[]> => {
  let url = `${BASE_URL}/dokumentlista/?sz=50&utformat=json`;
  
  if (docType) url += `&typ=${docType}`;
  if (fromDate) url += `&from=${fromDate}`;
  if (toDate) url += `&tom=${toDate}`;
  if (intressentId) url += `&iid=${intressentId}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    const data: RiksdagDocumentResponse = await response.json();
    return data.dokumentlista?.dokument || [];
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
};
