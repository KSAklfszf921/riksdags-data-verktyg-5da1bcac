
export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  party: string;
  constituency: string;
  imageUrl: string;
  email: string; // Now required since all members have email addresses
  phone?: string;
  birthYear: number;
  profession: string;
  committees: string[]; // Committee codes (e.g. "AU", "SoU") for efficient filtering
  speeches: Speech[];
  votes: Vote[];
  proposals: Proposal[];
  activityScore: number;
  documents?: RiksdagDocumentSummary[];
  calendarEvents?: CalendarEvent[];
  motions?: number;
  interpellations?: number;
  writtenQuestions?: number;
  assignments?: MemberAssignment[];
}

export interface MemberAssignment {
  organ_kod: string; // Changed from organ to organ_kod to match API
  roll: string;
  status: string;
  from: string;
  tom: string;
  typ: string; // Removed type restriction to handle 'uppdrag'
  ordning?: string;
  uppgift: string; // Committee full name
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

// Add missing interface that was referenced but not defined
export interface RiksdagMemberDetailsWithBiography {
  intressent_id: string;
  tilltalsnamn: string;
  efternamn: string;
  parti: string;
  valkrets: string;
  kon: string;
  fodd_ar: string;
  yrke?: string;
  bild_url_80?: string;
  bild_url_192?: string;
  bild_url_max?: string;
  assignments: MemberAssignment[];
  email: string;
  biography?: string;
}
