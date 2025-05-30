
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
}

export interface Speech {
  id: string;
  title: string;
  date: string;
  debate: string;
  duration: number;
  url: string;
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

export interface PartyInfo {
  name: string;
  color: string;
  fullName: string;
}
