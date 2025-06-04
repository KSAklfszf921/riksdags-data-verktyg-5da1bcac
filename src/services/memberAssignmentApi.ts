
import { fetchMemberDetails } from './riksdagApi';
import { Member } from '../types/member';

export interface AssignmentStats {
  totalAssignments: number;
  currentAssignments: number;
  committees: string[];
  leadershipRoles: number;
}

export const getMemberAssignmentStats = async (memberId: string): Promise<AssignmentStats> => {
  try {
    const memberDetails = await fetchMemberDetails(memberId);
    
    if (!memberDetails || !memberDetails.assignments) {
      return {
        totalAssignments: 0,
        currentAssignments: 0,
        committees: [],
        leadershipRoles: 0
      };
    }

    const currentDate = new Date();
    const currentAssignments = memberDetails.assignments.filter(assignment => {
      let endDate: Date | null = null;
      if (assignment.tom) {
        const tomString = assignment.tom.toString().trim();
        if (tomString && tomString !== '') {
          try {
            endDate = tomString.includes('T') 
              ? new Date(tomString)
              : new Date(tomString + 'T23:59:59');
            if (isNaN(endDate.getTime())) {
              endDate = null;
            }
          } catch (e) {
            endDate = null;
          }
        }
      }
      return !endDate || endDate > currentDate;
    });

    const committees = [...new Set(currentAssignments
      .filter(a => a.organ_kod !== 'Kammaren' && a.organ_kod !== 'kam')
      .map(a => a.organ_kod))];

    const leadershipRoles = currentAssignments.filter(assignment => 
      assignment.roll === 'Ordförande' || 
      assignment.roll === 'Vice ordförande' ||
      assignment.roll === 'ordförande' ||
      assignment.roll === 'vice ordförande'
    ).length;

    return {
      totalAssignments: memberDetails.assignments.length,
      currentAssignments: currentAssignments.length,
      committees,
      leadershipRoles
    };
  } catch (error) {
    console.error('Error fetching member assignment stats:', error);
    return {
      totalAssignments: 0,
      currentAssignments: 0,
      committees: [],
      leadershipRoles: 0
    };
  }
};
