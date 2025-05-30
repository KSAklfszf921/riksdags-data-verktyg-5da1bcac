
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

  // Enhanced assignment processing with better date handling and filtering
  const currentDate = new Date();
  const assignments = memberDetails?.assignments || [];
  
  console.log(`Processing ${assignments.length} assignments for ${riksdagMember.efternamn}`);
  
  // Filter active assignments with improved logic
  const activeAssignments = assignments.filter(assignment => {
    // Parse dates more carefully and handle various formats
    let endDate: Date | null = null;
    if (assignment.tom) {
      const tomString = assignment.tom.toString().trim();
      if (tomString && tomString !== '') {
        try {
          if (tomString.includes('T')) {
            endDate = new Date(tomString);
          } else {
            // Handle date-only strings, add end of day
            endDate = new Date(tomString + 'T23:59:59');
          }
          
          // Check if date is valid
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
    
    // Filter out chamber assignments and non-committee assignments
    const isNotChamber = assignment.organ !== 'Kammaren' && 
                        assignment.organ !== 'kam' && 
                        !assignment.organ.toLowerCase().includes('kammar');
    
    // Focus on committee and important assignments - be more inclusive
    const isCommitteeOrImportant = assignment.typ === 'uppdrag' || 
                                  assignment.typ === 'Riksdagsorgan' || 
                                  assignment.typ === 'Departement' ||
                                  assignment.organ.toLowerCase().includes('utskott') ||
                                  assignment.organ.toLowerCase().includes('nämnd') ||
                                  assignment.organ.toLowerCase().includes('delegation') ||
                                  assignment.organ.endsWith('U') || // Committee codes often end with 'U'
                                  assignment.organ.endsWith('u');
    
    const result = isActive && isNotChamber && isCommitteeOrImportant;
    
    if (isActive && isNotChamber) {
      console.log(`Assignment for ${riksdagMember.efternamn}: ${assignment.organ} (${assignment.roll}) - Active: ${result} - Type: ${assignment.typ} - End: ${assignment.tom || 'No end date'}`);
    }
    
    return result;
  });

  // Extract current committees from active assignments
  const currentCommittees = activeAssignments.map(assignment => assignment.organ);

  console.log(`Final active assignments for ${riksdagMember.efternamn}:`, activeAssignments.map(a => `${a.organ} (${a.roll})`));
  console.log(`Current committees for ${riksdagMember.efternamn}:`, currentCommittees);

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
        // The committee-specific API seems to have issues
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
            // Check if member has any active assignments matching the committee
            const hasMatchingCommittee = member.assignments?.some(assignment => {
              const currentDate = new Date();
              let endDate = null;
              
              // Parse end date
              if (assignment.tom) {
                try {
                  endDate = assignment.tom.includes('T') ? new Date(assignment.tom) : new Date(assignment.tom + 'T23:59:59');
                  if (isNaN(endDate.getTime())) {
                    endDate = null;
                  }
                } catch (e) {
                  endDate = null;
                }
              }
              
              // Check if assignment is active
              const isActive = !endDate || endDate > currentDate;
              
              // Enhanced committee matching logic
              if (isActive) {
                const organ = assignment.organ;
                const committeeSearch = committee.toLowerCase();
                const organLower = organ.toLowerCase();
                
                // Multiple matching strategies
                const matches = 
                  organ === committee || // Exact match
                  organLower === committeeSearch || // Case insensitive exact match
                  organLower.includes(committeeSearch) || // Contains search term
                  committeeSearch.includes(organLower) || // Search term contains organ
                  // Match common abbreviations
                  (committee === 'CU' && (organ === 'Civilutskottet' || organLower.includes('civil'))) ||
                  (committee === 'Civilutskottet' && (organ === 'CU' || organLower.includes('civil'))) ||
                  (committee === 'AU' && (organ === 'Arbetsmarknadsutskottet' || organLower.includes('arbetsmarknad'))) ||
                  (committee === 'FiU' && (organ === 'Finansutskottet' || organLower.includes('finans'))) ||
                  (committee === 'FöU' && (organ === 'Försvarsutskottet' || organLower.includes('försvar'))) ||
                  (committee === 'JuU' && (organ === 'Justitieutskottet' || organLower.includes('justitie'))) ||
                  (committee === 'KU' && (organ === 'Konstitutionsutskottet' || organLower.includes('konstitution'))) ||
                  (committee === 'KrU' && (organ === 'Kulturutskottet' || organLower.includes('kultur'))) ||
                  (committee === 'MjU' && (organ === 'Miljö- och jordbruksutskottet' || organLower.includes('miljö') || organLower.includes('jordbruk'))) ||
                  (committee === 'NU' && (organ === 'Näringsutskottet' || organLower.includes('näring'))) ||
                  (committee === 'SkU' && (organ === 'Skatteutskottet' || organLower.includes('skatt'))) ||
                  (committee === 'SfU' && (organ === 'Socialförsäkringsutskottet' || organLower.includes('socialförsäkring'))) ||
                  (committee === 'SoU' && (organ === 'Socialutskottet' || organLower.includes('social'))) ||
                  (committee === 'TU' && (organ === 'Trafikutskottet' || organLower.includes('trafik'))) ||
                  (committee === 'UbU' && (organ === 'Utbildningsutskottet' || organLower.includes('utbildning'))) ||
                  (committee === 'UU' && (organ === 'Utrikesutskottet' || organLower.includes('utrikes')));
                
                if (matches) {
                  console.log(`✓ Member ${member.firstName} ${member.lastName} matches committee ${committee} via assignment: ${organ} (${assignment.roll})`);
                }
                
                return matches;
              }
              
              return false;
            });
            
            return hasMatchingCommittee;
          });
          
          console.log(`After committee filtering: ${filteredMembers.length} members match committee ${committee}`);
          
          // Log some examples of filtered members
          filteredMembers.slice(0, 3).forEach(member => {
            console.log(`Filtered member: ${member.firstName} ${member.lastName} - Committees: ${member.committees.join(', ')}`);
          });
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
