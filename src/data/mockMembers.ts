
import { Member, PartyInfo } from '../types/member';

export const partyInfo: Record<string, PartyInfo> = {
  'S': { name: 'S', color: 'bg-red-500', fullName: 'Socialdemokraterna' },
  'M': { name: 'M', color: 'bg-blue-500', fullName: 'Moderaterna' },
  'SD': { name: 'SD', color: 'bg-yellow-600', fullName: 'Sverigedemokraterna' },
  'C': { name: 'C', color: 'bg-green-500', fullName: 'Centerpartiet' },
  'V': { name: 'V', color: 'bg-red-700', fullName: 'Vänsterpartiet' },
  'KD': { name: 'KD', color: 'bg-blue-700', fullName: 'Kristdemokraterna' },
  'L': { name: 'L', color: 'bg-blue-400', fullName: 'Liberalerna' },
  'MP': { name: 'MP', color: 'bg-green-400', fullName: 'Miljöpartiet' }
};

export const mockMembers: Member[] = [
  {
    id: '1',
    firstName: 'Anna',
    lastName: 'Andersson',
    party: 'S',
    constituency: 'Stockholm',
    imageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=400&h=400&fit=crop&crop=face',
    email: 'anna.andersson@riksdag.se',
    phone: '08-786 40 00',
    birthYear: 1975,
    profession: 'Lärare',
    committees: ['Utbildningsutskottet', 'Kulturutskottet'],
    activityScore: 8.5,
    speeches: [
      {
        id: 's1',
        title: 'Om skolans resurser',
        date: '2024-03-15',
        debate: 'Utbildningspolitisk debatt',
        duration: 8,
        url: '#'
      },
      {
        id: 's2',
        title: 'Kulturens betydelse för samhället',
        date: '2024-02-20',
        debate: 'Kulturpolitisk debatt',
        duration: 6,
        url: '#'
      }
    ],
    votes: [
      {
        id: 'v1',
        proposition: 'Skolmatsatsning',
        date: '2024-03-20',
        vote: 'Ja',
        debate: 'Utbildningspolitisk debatt'
      },
      {
        id: 'v2',
        proposition: 'Kultursatsning',
        date: '2024-02-25',
        vote: 'Ja',
        debate: 'Kulturpolitisk debatt'
      }
    ],
    proposals: [
      {
        id: 'p1',
        title: 'Motion om förbättrade skolmåltider',
        date: '2024-01-15',
        type: 'Motion',
        status: 'Under behandling',
        url: '#'
      }
    ]
  },
  {
    id: '2',
    firstName: 'Erik',
    lastName: 'Eriksson',
    party: 'M',
    constituency: 'Göteborg',
    imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    email: 'erik.eriksson@riksdag.se',
    phone: '08-786 40 00',
    birthYear: 1968,
    profession: 'Företagare',
    committees: ['Näringsutskottet', 'Finansutskottet'],
    activityScore: 9.2,
    speeches: [
      {
        id: 's3',
        title: 'Företagsamhetens villkor',
        date: '2024-03-10',
        debate: 'Näringspolitisk debatt',
        duration: 12,
        url: '#'
      }
    ],
    votes: [
      {
        id: 'v3',
        proposition: 'Skattereform',
        date: '2024-03-18',
        vote: 'Ja',
        debate: 'Finanspolitisk debatt'
      }
    ],
    proposals: [
      {
        id: 'p2',
        title: 'Motion om förenklad företagsstart',
        date: '2024-02-01',
        type: 'Motion',
        status: 'Antagen',
        url: '#'
      }
    ]
  },
  {
    id: '3',
    firstName: 'Maria',
    lastName: 'Johansson',
    party: 'SD',
    constituency: 'Malmö',
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
    email: 'maria.johansson@riksdag.se',
    birthYear: 1982,
    profession: 'Polis',
    committees: ['Justitieutskottet', 'Försvarsutskottet'],
    activityScore: 7.8,
    speeches: [
      {
        id: 's4',
        title: 'Rättssäkerhet och trygghet',
        date: '2024-03-05',
        debate: 'Justitiepolitisk debatt',
        duration: 10,
        url: '#'
      }
    ],
    votes: [
      {
        id: 'v4',
        proposition: 'Straffskärpning',
        date: '2024-03-12',
        vote: 'Ja',
        debate: 'Justitiepolitisk debatt'
      }
    ],
    proposals: []
  },
  {
    id: '4',
    firstName: 'Lars',
    lastName: 'Larsson',
    party: 'C',
    constituency: 'Jämtland',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    email: 'lars.larsson@riksdag.se',
    birthYear: 1971,
    profession: 'Lantbrukare',
    committees: ['Miljö- och jordbruksutskottet'],
    activityScore: 8.1,
    speeches: [
      {
        id: 's5',
        title: 'Landsbygdens framtid',
        date: '2024-02-28',
        debate: 'Miljö- och jordbrukspolitisk debatt',
        duration: 9,
        url: '#'
      }
    ],
    votes: [
      {
        id: 'v5',
        proposition: 'Klimatåtgärder',
        date: '2024-03-08',
        vote: 'Ja',
        debate: 'Miljöpolitisk debatt'
      }
    ],
    proposals: [
      {
        id: 'p3',
        title: 'Motion om landsbygdsstöd',
        date: '2024-01-20',
        type: 'Motion',
        status: 'Under behandling',
        url: '#'
      }
    ]
  }
];
