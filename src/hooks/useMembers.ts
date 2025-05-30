import { useState, useEffect } from 'react';
import { fetchMembers, fetchMemberSuggestions, fetchMemberDocuments, fetchMemberSpeeches, fetchMemberCalendarEvents, fetchMemberDetails, fetchAllCommittees, RiksdagMember, RiksdagMemberDetails, fetchMembersWithCommittees, isValidCommitteeCode, getMemberCommitteeAssignments } from '../services/riksdagApi';
import { Member } from '../types/member';

// Committee mapping from codes to full names
const COMMITTEE_MAPPING: { [key: string]: string } = {
  'AU': 'Arbetsmarknadsutskottet',
  'CU': 'Civilutskottet', 
  'FiU': 'Finansutskottet',
  'FöU': 'Försvarsutskottet',
  'JuU': 'Justitieutskottet',
  'KU': 'Konstitutionsutskottet',
  'KrU': 'Kulturutskottet',
  'MjU': 'Miljö- och jordbruksutskottet',
  'NU': 'Näringsutskottet',
  'SkU': 'Skatteutskottet',
  'SfU': 'Socialförsäkringsutskottet',
  'SoU': 'Socialutskottet',
  'TU': 'Trafikutskottet',
  'UbU': 'Utbildningsutskottet',
  'UU': 'Utrikesutskottet',
  'UFöU': 'Sammansatta utrikes- och försvarsutskottet',
  'eun': 'EU-nämnden'
};

// Reverse mapping from full names to codes
const COMMITTEE_CODE_MAPPING: { [key: string]: string } = Object.fromEntries(
  Object.entries(COMMITTEE_MAPPING).map(([code, name]) => [name, code])
);

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

  // Enhanced assignment processing with better committee filtering
  const currentDate = new Date();
  const assignments = memberDetails?.assignments || [];
  
  console.log(`Processing ${assignments.length} assignments for ${riksdagMember.efternamn}`);
  console.log(`Raw assignments for ${riksdagMember.efternamn}:`, assignments);
  
  // Filter active committee assignments with improved validation
  const activeCommitteeAssignments = assignments.filter(assignment => {
    // Parse dates more carefully
    let endDate: Date | null = null;
    if (assignment.tom) {
      const tomString = assignment.tom.toString().trim();
      if (tomString && tomString !== '') {
        try {
          if (tomString.includes('T')) {
            endDate = new Date(tomString);
          } else {
            endDate = new Date(tomString + 'T23:59:59');
          }
          
          if (isNaN(endDate.getTime())) {
            endDate = null;
          }
        } catch (e) {
          console.log(`Error parsing date for ${riksdagMember.efternamn}: ${tomString}`);
          endDate = null;
        }
      }
    }
    
    // Assignment is active if no end date or end date is in the future
    const isActive = !endDate || endDate > currentDate;
    
    // Only include committee assignments with validated organ codes
    const isCommitteeAssignment = assignment.typ === 'Utskott' || 
                                 assignment.typ === 'uppdrag' ||
                                 assignment.typ === 'Riksdagsorgan';
    
    const isValidCommittee = assignment.organ && (
      isValidCommitteeCode(assignment.organ) ||
      assignment.organ.toLowerCase().includes('utskott') ||
      assignment.organ.toLowerCase().includes('nämnd') ||
      COMMITTEE_MAPPING[assignment.organ]
    );
    
    const result = isActive && isCommitteeAssignment && isValidCommittee;
    
    console.log(`Assignment for ${riksdagMember.efternamn}: ${assignment.organ} (${assignment.roll}) - Active: ${isActive}, Committee: ${isCommitteeAssignment && isValidCommittee}, Final: ${result}`);
    
    return result;
  });

  // Extract current committees from active assignments and map to full names
  const currentCommittees = activeCommitteeAssignments.map(assignment => {
    const organ = assignment.organ;
    // Use uppgift if available, otherwise map code to full name, otherwise use organ as is
    let fullName = assignment.uppgift || COMMITTEE_MAPPING[organ] || organ;
    console.log(`Committee mapping for ${riksdagMember.efternamn}: ${organ} -> ${fullName}`);
    return fullName;
  });

  console.log(`Final active committee assignments for ${riksdagMember.efternamn}:`, activeCommitteeAssignments.map(a => `${a.organ} (${a.roll})`));
  console.log(`Current committees for ${riksdagMember.efternamn}:`, currentCommittees);

  return {
    id: riksdagMember.intressent_id,
    firstName: riksdagMember.tilltalsnamn,
    lastName: riksdagMember.efternamn,
    party: riksdagMember.parti,
    constituency: riksdagMember.valkrets,
    imageUrl,
    email: memberDetails?.email, // Don't generate potentially incorrect emails
    birthYear: parseInt(riksdagMember.fodd_ar) || 1970,
    profession: memberDetails?.yrke || 'Riksdagsledamot',
    committees: currentCommittees,
    speeches: mappedSpeeches,
    votes: [],
    proposals: [],
    documents: mappedDocuments,
    calendarEvents: [], // Calendar events removed to avoid API errors
    activityScore: Math.random() * 10,
    motions,
    interpellations,
    writtenQuestions,
    assignments: assignments
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
        
        // Always use the regular members API and then filter in frontend
        const result = await fetchMembers(page, pageSize, status);
        console.log(`Fetched ${result.members.length} members out of ${result.totalCount} total (before committee filtering)`);
        
        // Map members with full data including assignments
        const mappedMembers = await Promise.all(
          result.members.map(async member => {
            const memberDetails = await fetchMemberDetails(member.intressent_id);
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
            }, {
              ...memberDetails,
              assignments: memberDetails?.assignments || [],
              email: memberDetails?.email
            });
          })
        );

        console.log(`Mapped ${mappedMembers.length} members with assignments`);

        // Filter by committee in frontend if committee filter is applied
        let filteredMembers = mappedMembers;
        if (committee && committee !== 'all') {
          console.log(`Filtering members by committee: ${committee}`);
          
          filteredMembers = mappedMembers.filter(member => {
            // Check if member has the committee in their committees array (which now contains full names)
            const hasMatchingCommittee = member.committees.some(memberCommittee => {
              // Direct match with full committee name
              if (memberCommittee === committee) {
                return true;
              }
              
              // Check if the search committee is a code and member has the corresponding full name
              const fullCommitteeName = COMMITTEE_MAPPING[committee];
              if (fullCommitteeName && memberCommittee === fullCommitteeName) {
                return true;
              }
              
              // Check if the search committee is a full name and member has a matching code
              const committeeCode = COMMITTEE_CODE_MAPPING[committee];
              if (committeeCode && memberCommittee === COMMITTEE_MAPPING[committeeCode]) {
                return true;
              }
              
              // Partial matching as fallback
              return memberCommittee.toLowerCase().includes(committee.toLowerCase()) ||
                     committee.toLowerCase().includes(memberCommittee.toLowerCase());
            });
            
            if (hasMatchingCommittee) {
              console.log(`✓ Member ${member.firstName} ${member.lastName} matches committee ${committee} - Member committees: ${member.committees.join(', ')}`);
            }
            
            return hasMatchingCommittee;
          });
          
          console.log(`After committee filtering: ${filteredMembers.length} members match committee ${committee}`);
        }
        
        if (page === 1) {
          setMembers(filteredMembers);
        } else {
          setMembers(prev => [...prev, ...filteredMembers]);
        }
        
        setTotalCount(committee && committee !== 'all' ? filteredMembers.length : result.totalCount);
        setHasMore(page * pageSize < (committee && committee !== 'all' ? filteredMembers.length : result.totalCount));
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
