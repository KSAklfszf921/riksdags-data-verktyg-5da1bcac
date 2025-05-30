
export interface RiksdagCalendarEvent {
  id: string;
  datum: string;
  titel: string;
  typ: string;
  org: string;
  akt?: string;
  tid?: string;
  plats?: string;
  beskrivning?: string;
  status?: string;
}

export interface RiksdagCalendarResponse {
  kalender: {
    händelse: RiksdagCalendarEvent[];
  };
}

export type CalendarFormat = 'json' | 'xml' | 'csv' | 'jsonp' | 'icalendar';
export type SortOrder = 'c' | 'r'; // c = chronological, r = reverse
export type SortDirection = 'asc' | 'desc';

export interface CalendarSearchParams {
  utformat?: CalendarFormat;
  sz?: number; // max 500
  sort?: SortOrder;
  sortorder?: SortDirection;
  rm?: string; // riksmöte, e.g. "2023/24"
  from?: string; // YYYY-MM-DD
  tom?: string; // YYYY-MM-DD
  typ?: string; // event type
  org?: string; // organ
  akt?: string; // activity
}

const BASE_URL = 'https://data.riksdagen.se';

export const fetchCalendarEvents = async (params: CalendarSearchParams = {}): Promise<RiksdagCalendarEvent[]> => {
  console.log('Fetching calendar events with params:', params);
  
  const defaultParams: CalendarSearchParams = {
    utformat: 'json',
    sz: 100,
    sort: 'c',
    sortorder: 'asc',
    ...params
  };

  const queryParams = new URLSearchParams();
  
  Object.entries(defaultParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value.toString());
    }
  });

  const url = `${BASE_URL}/kalender/?${queryParams.toString()}`;
  console.log('Calendar API URL:', url);

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: RiksdagCalendarResponse = await response.json();
    
    if (!data.kalender || !data.kalender.händelse) {
      console.log('No events found in response');
      return [];
    }

    return Array.isArray(data.kalender.händelse) 
      ? data.kalender.händelse 
      : [data.kalender.händelse];
      
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw new Error(`Failed to fetch calendar events: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const fetchThisWeekEvents = async (): Promise<RiksdagCalendarEvent[]> => {
  console.log('Fetching this week events');
  
  try {
    const response = await fetch(`${BASE_URL}/sv/riksdagen-denna-vecka?utformat=json`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: RiksdagCalendarResponse = await response.json();
    
    if (!data.kalender || !data.kalender.händelse) {
      return [];
    }

    return Array.isArray(data.kalender.händelse) 
      ? data.kalender.händelse 
      : [data.kalender.händelse];
      
  } catch (error) {
    console.error('Error fetching this week events:', error);
    throw error;
  }
};

export const fetchNextWeekEvents = async (): Promise<RiksdagCalendarEvent[]> => {
  console.log('Fetching next week events');
  
  try {
    const response = await fetch(`${BASE_URL}/sv/riksdagen-nasta-vecka?utformat=json`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: RiksdagCalendarResponse = await response.json();
    
    if (!data.kalender || !data.kalender.händelse) {
      return [];
    }

    return Array.isArray(data.kalender.händelse) 
      ? data.kalender.händelse 
      : [data.kalender.händelse];
      
  } catch (error) {
    console.error('Error fetching next week events:', error);
    throw error;
  }
};

// Event type definitions from the technical instruction
export const EVENT_TYPES = {
  debatt: 'Debatt',
  beslut: 'Beslut', 
  sammantrade: 'Sammanträde',
  besök: 'Besök',
  seminarium: 'Seminarium',
  presskonferens: 'Presskonferens',
  session: 'Session',
  'öppen konferens': 'Öppen konferens',
  'öppen utfrågning': 'Öppen utfrågning',
  'öppet besök': 'Öppet besök',
  'öppet sammanträde': 'Öppet sammanträde',
  'öppet samråd': 'Öppet samråd',
  'öppet seminarium': 'Öppet seminarium',
  'öppet hus': 'Öppet hus'
} as const;

// Organ definitions from the technical instruction
export const ORGANS = {
  kamm: 'Kammaren',
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
  CKrU: 'Krigsdelegationen',
  UFöU: 'Försvarsutskottet',
  eun: 'EU-nämnden'
} as const;

// Activity definitions from the technical instruction
export const ACTIVITIES = {
  // Kammaren
  ad: 'Aktuell debatt',
  al: 'Allmänpolitisk debatt',
  af: 'Anmälan om partiföreträdare',
  av: 'Avslutning',
  at: 'Avtackning',
  vo: 'Beslut',
  bl: 'Bordläggning',
  bd: 'Bordläggningsdebatt',
  bp: 'Bordläggningsplenum',
  bu: 'Budgetdebatt',
  ap: 'Debatt om förslag',
  dv: 'Debatt om vårpropositionen',
  fs: 'Frågestund',
  ha: 'Hälsningsanförande',
  hh: 'Högtidlighållande',
  ar: 'Information från regeringen',
  in: 'Inledning',
  ip: 'Interpellationsdebat',
  pa: 'Parentation',
  pd: 'Partiledardebatt',
  rf: 'Regeringsförklaring',
  rd: 'Remissdebatt',
  ro: 'Riksmötets öppnande',
  sf: 'Statsministerns frågestund',
  sd: 'Särskild debatt',
  up: 'Upprop',
  ud: 'Utrikespolitisk debatt',
  va: 'Val',
  // Utskott/EU-nämnden
  pk: 'Presskonferens',
  ss: 'Session',
  are: 'Återrapportering från europeiska rådets möte',
  ko: 'Öppen konferens',
  ou: 'Öppen utfrågning',
  be: 'Öppet besök',
  st: 'Öppet sammanträde',
  os: 'Öppet samråd',
  se: 'Öppet seminarium',
  // Övriga
  ib: 'Inkommande besök',
  re: 'Resa',
  tl: 'Träffa ledamöter',
  ur: 'Ungdomens riksdag',
  ub: 'Utgående besök',
  vi: 'Visning',
  oh: 'Öppet hus'
} as const;

// Utility functions
export const formatEventDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

export const formatEventTime = (timeString?: string): string => {
  if (!timeString) return '';
  
  try {
    if (timeString.includes('T')) {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return timeString;
      
      return date.toLocaleTimeString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return timeString;
    }
  } catch {
    return timeString;
  }
};

export const getEventTypeName = (typ: string): string => {
  return EVENT_TYPES[typ as keyof typeof EVENT_TYPES] || typ;
};

export const getOrganName = (org: string): string => {
  return ORGANS[org as keyof typeof ORGANS] || org;
};

export const getActivityName = (akt: string): string => {
  return ACTIVITIES[akt as keyof typeof ACTIVITIES] || akt;
};
