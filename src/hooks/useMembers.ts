import { useState, useEffect } from 'react';
import { fetchMembers, fetchMemberSuggestions, fetchMemberDocuments, fetchMemberSpeeches, fetchMemberCalendarEvents, fetchMemberDetails, fetchAllCommittees, RiksdagMember, RiksdagMemberDetails, fetchMembersWithCommittees, isValidCommitteeCode, getMemberCommitteeAssignments, COMMITTEE_MAPPING } from '../services/riksdagApi';
import { fetchCachedMemberData, fetchMembersByCommittee, CachedMemberData, extractCommitteeAssignments, extractImageUrls } from '../services/cachedPartyApi';
import { Member } from '../types/member';

// Reverse mapping from full names to codes
const COMMITTEE_CODE_MAPPING: { [key: string]: string } = Object.fromEntries(
  Object.entries(COMMITTEE_MAPPING).map(([code, name]) => [name, code])
);

const USE_SUPABASE_MEMBERS = true;

const mapCachedMemberToMember = (cached: CachedMemberData): Member => {
  const images = extractImageUrls(cached.image_urls || {} as any);
  const defaultImg =
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face';
  const email = `${cached.first_name.toLowerCase()}.${cached.last_name.toLowerCase()}@riksdagen.se`;

  const activity = (cached.activity_data as any) || {};

  return {
    id: cached.member_id,
    firstName: cached.first_name,
    lastName: cached.last_name,
    party: cached.party,
    constituency: cached.constituency || '',
    imageUrl: images.large || images.medium || images.small || defaultImg,
    email,
    birthYear: cached.birth_year || 1970,
    profession: 'Riksdagsledamot',
    committees: cached.current_committees || [],
    speeches: [],
    votes: [],
    proposals: [],
    documents: [],
    calendarEvents: [],
    activityScore: activity.activity_score || 0,
    motions: activity.motions || 0,
    interpellations: activity.interpellations || 0,
    writtenQuestions: activity.written_questions || 0,
    assignments: extractCommitteeAssignments(cached.assignments || []) as any,
  };
};

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
  
  const [documents, speeches] = await Promise.all([
    fetchMemberDocuments(riksdagMember.intressent_id).then(docs => docs.slice(0, 10)).catch(() => []),
    fetchMemberSpeeches(riksdagMember.intressent_id).then(speeches => speeches.slice(0, 10)).catch(() => [])
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

  // Count specific document types for stats
  const motions = documents.filter(doc => doc.typ === 'mot').length;
  const interpellations = documents.filter(doc => doc.typ === 'ip').length;
  const writtenQuestions = documents.filter(doc => doc.typ === 'fr').length;

  console.log(`Document stats for ${riksdagMember.efternamn}: motions=${motions}, interpellations=${interpellations}, questions=${writtenQuestions}`);

  // Extract committee codes from member details assignments with improved filtering
  const currentCommitteeCodes = memberDetails?.assignments
    ?.filter(assignment => {
      // Only include committee assignments (exclude chamber assignments)
      return assignment.organ_kod !== 'Kammaren' && 
             assignment.organ_kod !== 'kam' && 
             !assignment.organ_kod.toLowerCase().includes('kammar');
    })
    ?.map(assignment => assignment.organ_kod) || [];
  
  console.log(`Committee codes for ${riksdagMember.efternamn}:`, currentCommitteeCodes);

  // Generate email address
  const generateEmail = (firstName: string, lastName: string) => {
    const cleanFirst = firstName.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/ä/g, 'a')
      .replace(/å/g, 'a')
      .replace(/ö/g, 'o');
    const cleanLast = lastName.toLowerCase()
      .replace(/ä/g, 'a')
      .replace(/å/g, 'a')
      .replace(/ö/g, 'o');
    return `${cleanFirst}.${cleanLast}@riksdagen.se`;
  };

  return {
    id: riksdagMember.intressent_id,
    firstName: riksdagMember.tilltalsnamn,
    lastName: riksdagMember.efternamn,
    party: riksdagMember.parti,
    constituency: riksdagMember.valkrets,
    imageUrl,
    email: memberDetails?.email || generateEmail(riksdagMember.tilltalsnamn, riksdagMember.efternamn),
    birthYear: parseInt(riksdagMember.fodd_ar) || 1970,
    profession: 'Riksdagsledamot',
    committees: currentCommitteeCodes,
    speeches: mappedSpeeches,
    votes: [],
    proposals: [],
    documents: mappedDocuments,
    calendarEvents: [],
    activityScore: Math.random() * 10,
    motions,
    interpellations,
    writtenQuestions,
    assignments: memberDetails?.assignments?.map(assignment => ({
      organ_kod: assignment.organ_kod,
      roll: assignment.roll,
      status: assignment.status,
      from: assignment.from,
      tom: assignment.tom,
      typ: assignment.typ,
      ordning: assignment.ordning,
      uppgift: assignment.uppgift
    })) || []
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
        
        if (USE_SUPABASE_MEMBERS) {
          try {
            if (committee && committee !== 'all') {
              const committeeCode = COMMITTEE_CODE_MAPPING[committee] || committee;
              const cached = await fetchMembersByCommittee(committeeCode);
              const mapped = cached.map(mapCachedMemberToMember);
              setMembers(page === 1 ? mapped : [...members, ...mapped]);
              setTotalCount(cached.length);
              setHasMore(false);
              setError(null);
              return;
            } else {
              const cached = await fetchCachedMemberData();
              const start = (page - 1) * pageSize;
              const pageData = cached.slice(start, start + pageSize);
              const mapped = pageData.map(mapCachedMemberToMember);
              setMembers(page === 1 ? mapped : [...members, ...mapped]);
              setTotalCount(cached.length);
              setHasMore(page * pageSize < cached.length);
              setError(null);
              return;
            }
          } catch (e) {
            console.error('Supabase member fetch failed, falling back to API', e);
          }
        }

        // Fallback to direct API
        let result;

        if (committee && committee !== 'all') {
          const committeeCode = COMMITTEE_CODE_MAPPING[committee] || committee;

          if (isValidCommitteeCode(committeeCode)) {
            console.log(`Using committee-specific API for: ${committeeCode}`);
            result = await fetchMembersWithCommittees(page, pageSize, status, committeeCode);

            const mappedMembers = await Promise.all(
              result.members.map(member =>
                mapRiksdagMemberToMember({
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
                }, member)
              )
            );

            if (page === 1) {
              setMembers(mappedMembers);
            } else {
              setMembers(prev => [...prev, ...mappedMembers]);
            }

            setTotalCount(result.totalCount);
            setHasMore(page * pageSize < result.totalCount);
          } else {
            console.log(`Invalid committee code: ${committeeCode}, showing no results`);
            setMembers([]);
            setTotalCount(0);
            setHasMore(false);
          }
        } else {
          console.log('Using regular members API');
          const memberResult = await fetchMembers(page, pageSize, status);

          const mappedMembers = await Promise.all(
            memberResult.members.map(async member => {
              const memberDetails = await fetchMemberDetails(member.intressent_id);
              return mapRiksdagMemberToMember(member, memberDetails);
            })
          );

          if (page === 1) {
            setMembers(mappedMembers);
          } else {
            setMembers(prev => [...prev, ...mappedMembers]);
          }

          setTotalCount(memberResult.totalCount);
          setHasMore(page * pageSize < memberResult.totalCount);
        }
        
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
        // Return committee names (not codes) for UI display
        const committeeNames = Object.values(COMMITTEE_MAPPING);
        setCommittees(committeeNames);
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

// Add new hook for committee-specific operations
export const useCommitteeMembers = (committeeCode: string) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCommitteeMembers = async () => {
      if (!committeeCode || !isValidCommitteeCode(committeeCode)) {
        setError('Ogiltig utskottskod');
        return;
      }

      setLoading(true);
      try {
        if (USE_SUPABASE_MEMBERS) {
          try {
            const cached = await fetchMembersByCommittee(committeeCode);
            const mapped = cached.map(mapCachedMemberToMember);
            setMembers(mapped);
            setError(null);
            return;
          } catch (e) {
            console.error('Supabase committee fetch failed', e);
          }
        }

        const result = await fetchMembersWithCommittees(1, 50, 'current', committeeCode);
        const mappedMembers = await Promise.all(
          result.members.map(member =>
            mapRiksdagMemberToMember({
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
            }, member)
          )
        );
        setMembers(mappedMembers);
        setError(null);
      } catch (err) {
        setError('Kunde inte ladda utskottsledamöter');
        console.error('Error loading committee members:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCommitteeMembers();
  }, [committeeCode]);

  return { members, loading, error };
};

// Utility function to get committee name from code
export const getCommitteeName = (code: string): string => {
  return COMMITTEE_MAPPING[code] || code;
};

// Utility function to get committee code from name
export const getCommitteeCode = (name: string): string => {
  return COMMITTEE_CODE_MAPPING[name] || name;
};
