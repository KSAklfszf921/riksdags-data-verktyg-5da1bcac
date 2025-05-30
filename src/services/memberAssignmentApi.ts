
import { RiksdagMemberDetails, MemberAssignment } from '../types/member';

const BASE_URL = 'https://data.riksdagen.se';

export interface RiksdagAssignment {
  '@organ_kod': string;
  '@roll_kod': string;
  '@status': string;
  '@typ': string;
  '@from': string;
  '@tom': string;
  '@ordning': string;
  '#text': string;
}

export interface RiksdagAssignmentResponse {
  uppdrag: {
    '@antal': string;
    '@sida': string;
    '@traeffar': string;
    uppdragspost?: RiksdagAssignment | RiksdagAssignment[];
  };
}

export const fetchMemberAssignments = async (intressentId: string): Promise<MemberAssignment[]> => {
  try {
    console.log(`Fetching assignments for member: ${intressentId}`);
    
    const response = await fetch(
      `${BASE_URL}/uppdrag/?iid=${intressentId}&utformat=json`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`Assignment API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: RiksdagAssignmentResponse = await response.json();
    
    if (!data.uppdrag || !data.uppdrag.uppdragspost) {
      console.log(`No assignments found for member: ${intressentId}`);
      return [];
    }

    // Handle both single assignment and array of assignments
    const assignments = Array.isArray(data.uppdrag.uppdragspost) 
      ? data.uppdrag.uppdragspost 
      : [data.uppdrag.uppdragspost];

    console.log(`Found ${assignments.length} assignments for member: ${intressentId}`);

    return assignments.map(assignment => ({
      organ_kod: assignment['@organ_kod'] || '',
      roll: assignment['@roll_kod'] || '',
      status: assignment['@status'] || '',
      from: assignment['@from'] || '',
      tom: assignment['@tom'] || '',
      typ: assignment['@typ'] || '',
      ordning: assignment['@ordning'] || '',
      uppgift: assignment['#text'] || assignment['@organ_kod'] || ''
    }));

  } catch (error) {
    console.error('Error fetching member assignments:', error);
    return [];
  }
};

// Enhanced function to get current committee assignments
export const getCurrentCommitteeAssignments = async (intressentId: string): Promise<string[]> => {
  try {
    const assignments = await fetchMemberAssignments(intressentId);
    const currentDate = new Date();
    
    const currentCommittees = assignments
      .filter(assignment => {
        // Filter for committee assignments (exclude chamber and other non-committee roles)
        const isCommittee = assignment.typ === 'utskott' || 
                           assignment.typ === 'Riksdagsnämnd' ||
                           (!assignment.typ && assignment.organ_kod && 
                            assignment.organ_kod !== 'kam' && 
                            assignment.organ_kod !== 'Kammaren' &&
                            !assignment.organ_kod.toLowerCase().includes('kammar'));
        
        // Check if assignment is current (no end date or end date is in future)
        const isCurrent = !assignment.tom || new Date(assignment.tom) > currentDate;
        
        return isCommittee && isCurrent;
      })
      .map(assignment => assignment.organ_kod)
      .filter(Boolean); // Remove empty values

    console.log(`Current committees for ${intressentId}:`, currentCommittees);
    return [...new Set(currentCommittees)]; // Remove duplicates
    
  } catch (error) {
    console.error('Error getting current committee assignments:', error);
    return [];
  }
};

export const getEnhancedMemberDetails = async (intressentId: string): Promise<RiksdagMemberDetails | null> => {
  try {
    console.log(`Fetching enhanced details for member: ${intressentId}`);
    
    // Fetch both member details and assignments in parallel
    const [assignmentsResponse] = await Promise.all([
      fetchMemberAssignments(intressentId)
    ]);

    if (assignmentsResponse.length === 0) {
      console.log(`No enhanced details found for member: ${intressentId}`);
      return null;
    }

    // Generate email based on member ID (we would need name for proper generation)
    const email = `member.${intressentId}@riksdagen.se`;

    return {
      intressent_id: intressentId,
      tilltalsnamn: '', // Will be filled by calling function
      efternamn: '', // Will be filled by calling function
      parti: '', // Will be filled by calling function
      valkrets: '', // Will be filled by calling function
      kon: '', // Will be filled by calling function
      fodd_ar: '', // Will be filled by calling function
      bild_url_80: '',
      bild_url_192: '',
      bild_url_max: '',
      email,
      assignments: assignmentsResponse
    };

  } catch (error) {
    console.error('Error fetching enhanced member details:', error);
    return null;
  }
};
