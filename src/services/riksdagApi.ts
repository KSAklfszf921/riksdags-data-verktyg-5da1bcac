
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
}

export interface RiksdagSpeechResponse {
  anforandelista: {
    anforande: RiksdagSpeech[];
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

export interface SpeechSearchParams {
  rm?: string;
  anftyp?: 'Nej' | '';
  date?: string;
  systemDate?: string;
  party?: string;
  intressentId?: string;
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
  
  // Lägg till status filter - förbättrad för att säkerställa korrekt filtrering
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
    let allMembers = data.personlista?.person || [];
    
    // Extra filtrering för nuvarande ledamöter - kontrollera datum_tom
    if (status === 'current') {
      const currentDate = new Date();
      allMembers = allMembers.filter(member => {
        // Om datum_tom är tomt eller i framtiden, är ledamoten nuvarande
        if (!member.datum_tom || member.datum_tom.trim() === '') {
          return true;
        }
        const endDate = new Date(member.datum_tom);
        return endDate > currentDate;
      });
    }
    
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
    let members = data.personlista?.person || [];
    
    // Extra filtrering för nuvarande ledamöter
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

export const searchSpeeches = async (params: SpeechSearchParams): Promise<{speeches: RiksdagSpeech[], totalCount: number}> => {
  let url = `${BASE_URL}/anforandelista/?utformat=json`;
  
  // Add page size
  if (params.pageSize) {
    url += `&sz=${params.pageSize}`;
  } else {
    url += '&sz=50';
  }
  
  // Add search parameters
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

export const fetchMemberDocuments = async (intressentId: string): Promise<RiksdagDocument[]> => {
  const { documents } = await searchDocuments({
    intressentId,
    pageSize: 100,
    sort: 'datum',
    sortOrder: 'desc'
  });
  return documents;
};

export const fetchMemberSpeeches = async (intressentId: string): Promise<RiksdagSpeech[]> => {
  const { speeches } = await searchSpeeches({
    intressentId,
    pageSize: 100
  });
  return speeches;
};
