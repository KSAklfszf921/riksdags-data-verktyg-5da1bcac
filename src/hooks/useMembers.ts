
import { useState, useEffect } from 'react';
import { fetchMembers, fetchMemberSuggestions, fetchMemberDocuments, fetchMemberSpeeches, fetchMemberCalendarEvents, RiksdagMember } from '../services/riksdagApi';
import { Member } from '../types/member';

const mapRiksdagMemberToMember = async (riksdagMember: RiksdagMember): Promise<Member> => {
  // Use the real image URLs from Riksdag API when available
  let imageUrl = `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face`;
  
  if (riksdagMember.bild_url_192) {
    imageUrl = riksdagMember.bild_url_192;
  } else if (riksdagMember.bild_url_max) {
    imageUrl = riksdagMember.bild_url_max;
  } else if (riksdagMember.bild_url_80) {
    imageUrl = riksdagMember.bild_url_80;
  }

  // For performance, fetch limited data initially
  const [documents, speeches, calendarEvents] = await Promise.all([
    fetchMemberDocuments(riksdagMember.intressent_id).then(docs => docs.slice(0, 5)).catch(() => []),
    fetchMemberSpeeches(riksdagMember.intressent_id).then(speeches => speeches.slice(0, 5)).catch(() => []),
    fetchMemberCalendarEvents(riksdagMember.intressent_id).then(events => events.slice(0, 5)).catch(() => [])
  ]);

  const mappedDocuments = documents.map(doc => ({
    id: doc.id,
    title: doc.titel,
    type: doc.typ,
    date: doc.datum,
    beteckning: doc.beteckning,
    url: doc.dokument_url_html || doc.dokument_url_text
  }));

  const mappedSpeeches = speeches.map(speech => ({
    id: speech.anforande_id,
    title: speech.rel_dok_titel || speech.kammaraktivitet,
    date: speech.anforandedatum,
    debate: speech.kammaraktivitet,
    duration: speech.anf_sekunder ? Math.round(parseInt(speech.anf_sekunder) / 60) : 0,
    url: `https://data.riksdagen.se/anforande/${speech.anforande_id}`,
    type: speech.anforandetyp,
    text: speech.anforandetext ? speech.anforandetext.substring(0, 200) + '...' : '',
    time: speech.anf_klockslag
  }));

  const mappedCalendarEvents = calendarEvents.map(event => ({
    id: event.id,
    title: event.summary || event.aktivitet,
    date: event.datum,
    time: event.tid,
    location: event.plats,
    type: event.typ,
    organ: event.organ,
    description: event.description,
    url: event.url
  }));

  return {
    id: riksdagMember.intressent_id,
    firstName: riksdagMember.tilltalsnamn,
    lastName: riksdagMember.efternamn,
    party: riksdagMember.parti,
    constituency: riksdagMember.valkrets,
    imageUrl,
    email: `${riksdagMember.tilltalsnamn.toLowerCase()}.${riksdagMember.efternamn.toLowerCase()}@riksdag.se`,
    birthYear: parseInt(riksdagMember.fodd_ar) || 1970,
    profession: 'Riksdagsledamot',
    committees: [],
    speeches: mappedSpeeches,
    votes: [],
    proposals: [],
    documents: mappedDocuments,
    calendarEvents: mappedCalendarEvents,
    activityScore: Math.random() * 10
  };
};

export const useMembers = (
  page: number = 1,
  pageSize: number = 20,
  status: 'current' | 'all' | 'former' = 'current'
) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true);
        console.log(`Loading members: page=${page}, pageSize=${pageSize}, status=${status}`);
        
        const { members: riksdagMembers, totalCount: total } = await fetchMembers(page, pageSize, status);
        console.log(`Fetched ${riksdagMembers.length} members out of ${total} total`);
        
        // Map members with limited data for better performance
        const mappedMembers = await Promise.all(
          riksdagMembers.map(member => mapRiksdagMemberToMember(member))
        );
        
        if (page === 1) {
          setMembers(mappedMembers);
        } else {
          setMembers(prev => [...prev, ...mappedMembers]);
        }
        
        setTotalCount(total);
        setHasMore(page * pageSize < total);
        setError(null);
      } catch (err) {
        setError('Kunde inte ladda ledamöter');
        console.error('Error loading members:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [page, pageSize, status]);

  const loadMore = () => {
    if (!loading && hasMore) {
      return { page: page + 1, pageSize, status };
    }
    return null;
  };

  return { 
    members, 
    loading, 
    error, 
    totalCount, 
    hasMore, 
    loadMore 
  };
};

export const useMemberSuggestions = () => {
  const [suggestions, setSuggestions] = useState<RiksdagMember[]>([]);
  const [loading, setLoading] = useState(false);

  const searchMembers = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const results = await fetchMemberSuggestions(query);
      setSuggestions(results);
    } catch (error) {
      console.error('Error fetching member suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  return { suggestions, loading, searchMembers };
};
