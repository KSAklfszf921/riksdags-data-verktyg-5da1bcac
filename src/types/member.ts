
export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  party: string;
  constituency: string;
  imageUrl: string;
  email?: string;
  phone?: string;
  birthYear: number;
  profession: string;
  committees: string[];
  speeches: Speech[];
  votes: Vote[];
  proposals: Proposal[];
  activityScore: number;
  documents?: RiksdagDocumentSummary[];
  calendarEvents?: CalendarEvent[];
}

export interface Speech {
  id: string;
  title: string;
  date: string;
  debate: string;
  duration: number;
  url: string;
  type?: string;
  text?: string;
  time?: string;
}

export interface Vote {
  id: string;
  proposition: string;
  date: string;
  vote: 'Ja' | 'Nej' | 'Avstår' | 'Frånvarande';
  debate: string;
}

export interface Proposal {
  id: string;
  title: string;
  date: string;
  type: string;
  status: 'Antagen' | 'Avvisad' | 'Under behandling';
  url: string;
}

export interface RiksdagDocumentSummary {
  id: string;
  title: string;
  type: string;
  date: string;
  beteckning: string;
  url?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  type: string;
  organ: string;
  description?: string;
  url?: string;
}

export interface PartyInfo {
  name: string;
  color: string;
  fullName: string;
}
