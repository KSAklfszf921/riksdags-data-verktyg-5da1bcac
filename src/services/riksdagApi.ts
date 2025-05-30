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
}

export interface RiksdagDocument {
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

export interface RiksdagSpeech {
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

export interface RiksdagCalendarEvent {
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

export interface RiksdagMemberDetailsWithBiography extends RiksdagMemberDetails {
  biography?: RiksdagMemberBiography[];
}

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
