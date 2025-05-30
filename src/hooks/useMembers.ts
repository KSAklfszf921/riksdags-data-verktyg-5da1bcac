
import { useState, useEffect } from 'react';
import { fetchMembers, fetchMemberSuggestions, fetchMemberDocuments, fetchMemberSpeeches, fetchMemberCalendarEvents, fetchMemberDetails, fetchAllCommittees, RiksdagMember, RiksdagMemberDetails, fetchMembersWithCommittees } from '../services/riksdagApi';
import { Member } from '../types/member';

const mapRiksdagMemberToMember = async (riksdagMember: RiksdagMember, memberDetails?: RiksdagMemberDetails): Promise<Member> => {
  // Use the real image URLs from Riksdag API when available
  let imageUrl = `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face`;
  
  if (riksdagMember.bild_url_192) {
    imageUrl = riksdagMember.bild_url_192;
  } else if (riksdagMember.bild_url_max) {
    imageUrl = riksdagMember.bild_url_max;
  } else if (riksdagMember.bild_url_80) {
    imageUrl = riksdagMember.bild_url_80;
  }

  console.log(`Mapping member: ${riksdagMember.tilltalsnamn} ${riksdagMember.efternamn} (${riksdagMember.intressent_id})`);
  
  const [documents, speeches, calendarEvents] = await Promise.all([
    fetchMemberDocuments(riksdagMember.intressent_id).then(docs => docs.slice(0, 10)).catch(() => []),
    fetchMemberSpeeches(riksdagMember.intressent_id).then(speeches => speeches.slice(0, 10)).catch(() => []),
    fetchMemberCalendarEvents(riksdagMember.intressent_id).then(events => events.slice(0, 5)).catch(() => [])
  ]);

  console.log(`Member ${riksdagMember.efternamn}: ${documents.length} documents, ${speeches.length} speeches`);

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

  // Count specific document types for stats
  const motions = documents.filter(doc => doc.typ === 'mot').length;
  const interpellations = documents.filter(doc => doc.typ === 'ip').length;
  const writtenQuestions = documents.filter(doc => doc.typ === 'fr').length;

  console.log(`Document stats for ${riksdagMember.efternamn}: motions=${motions}, interpellations=${interpellations}, questions=${writtenQuestions}`);

  // Extract current committees from assignments
  const currentDate = new Date();
  const currentCommittees = memberDetails?.assignments
    ?.filter(assignment => {
      const endDate = assignment.tom ? new Date(assignment.tom) : null;
      return !endDate || endDate > currentDate;
    })
    ?.filter(assignment => assignment.organ !== 'Kammaren')
    ?.map(assignment => assignment.organ) || [];

  return {
    id: riksdagMember.intressent_id,
    firstName: riksdagMember.tilltalsnamn,
    lastName: riksdagMember.efternamn,
    party: riksdagMember.parti,
    constituency: riksdagMember.valkrets,
    imageUrl,
    email: memberDetails?.email || `${riksdagMember.tilltalsnamn.toLowerCase()}.${riksdagMember.efternamn.toLowerCase()}@riksdag.se`,
    birthYear: parseInt(riksdagMember.fodd_ar) || 1970,
    profession: memberDetails?.yrke || 'Riksdagsledamot',
    committees: currentCommittees,
    speeches: mappedSpeeches,
    votes: [],
    proposals: [],
    documents: mappedDocuments,
    calendarEvents: mappedCalendarEvents,
    activityScore: Math.random() * 10,
    motions,
    interpellations,
    writtenQuestions,
    assignments: memberDetails?.assignments || []
  };
};

export const useMembers = (
  page: number = 1,
  pageSize: number = 20,
  status: 'current' | 'all' | 'former' = 'current',
  committee?: string
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
        console.log(`Loading members: page=${page}, pageSize=${pageSize}, status=${status}, committee=${committee}`);
        
        let data;
        if (committee && committee !== 'all') {
          // Use committee-specific API when filtering by committee
          data = await fetchMembersWithCommittees(page, pageSize, status, committee);
          console.log(`Fetched ${data.members.length} members from committee ${committee} out of ${data.totalCount} total`);
        } else {
          // Use regular member API for general queries
          const result = await fetchMembers(page, pageSize, status);
          data = {
            members: await Promise.all(
              result.members.map(async member => {
                const memberDetails = await fetchMemberDetails(member.intressent_id);
                return {
                  intressent_id: member.intressent_id,
                  tilltalsnamn: member.tilltalsnamn,
                  efternamn: member.efternamn,
                  parti: member.parti,
                  valkrets: member.valkrets,
                  kon: member.kon,
                  fodd_ar: member.fodd_ar,
                  bild_url_80: member.bild_url_80,
                  bild_url_192: member.bild_url_192,
                  bild_url_max: member.bild_url_max,
                  assignments: memberDetails?.assignments || [],
                  email: memberDetails?.email
                };
              })
            ),
            totalCount: result.totalCount
          };
          console.log(`Fetched ${data.members.length} members out of ${data.totalCount} total`);
        }
        
        // Map members with full data
        const mappedMembers = await Promise.all(
          data.members.map(async member => {
            return mapRiksdagMemberToMember({
              intressent_id: member.intressent_id,
              tilltalsnamn: member.tilltalsnamn,
              efternamn: member.efternamn,
              parti: member.parti,
              valkrets: member.valkrets,
              kon: member.kon,
              fodd_ar: member.fodd_ar,
              hangar_guid: '',
              status: '',
              datum_fran: '',
              datum_tom: '',
              fodd_datum: '',
              bild_url_80: member.bild_url_80,
              bild_url_192: member.bild_url_192,
              bild_url_max: member.bild_url_max
            }, member);
          })
        );
        
        if (page === 1) {
          setMembers(mappedMembers);
        } else {
          setMembers(prev => [...prev, ...mappedMembers]);
        }
        
        setTotalCount(data.totalCount);
        setHasMore(page * pageSize < data.totalCount);
        setError(null);
      } catch (err) {
        setError('Kunde inte ladda ledamöter');
        console.error('Error loading members:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [page, pageSize, status, committee]);

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
    if (query.length < 1) {
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

export const useCommittees = () => {
  const [committees, setCommittees] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCommittees = async () => {
      setLoading(true);
      try {
        const committeeList = await fetchAllCommittees();
        setCommittees(committeeList);
      } catch (error) {
        console.error('Error loading committees:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCommittees();
  }, []);

  return { committees, loading };
};
