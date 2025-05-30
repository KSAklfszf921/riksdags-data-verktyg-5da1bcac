
import { Member } from '../types/member';
import { partyInfo } from '../data/mockMembers';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { MapPin, Star, Users, Building2, Briefcase } from 'lucide-react';
import { getCommitteeName } from '../hooks/useMembers';

interface MemberCardProps {
  member: Member;
  onClick: () => void;
}

const MemberCard = ({ member, onClick }: MemberCardProps) => {
  const party = partyInfo[member.party];

  // Get current active assignments with improved filtering
  const currentDate = new Date();
  const activeAssignments = member.assignments?.filter(assignment => {
    // Parse end date more carefully
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
          endDate = null;
        }
      }
    }
    
    // Assignment is active if no end date or end date is in the future
    const isActive = !endDate || endDate > currentDate;
    
    // Filter out chamber assignments (Kammaren/kam)
    const isNotChamber = assignment.organ_kod !== 'Kammaren' && 
                        assignment.organ_kod !== 'kam' && 
                        !assignment.organ_kod.toLowerCase().includes('kammar');
    
    // Include committee and important assignments
    const isCommitteeOrImportant = assignment.typ === 'uppdrag' || 
                                  assignment.typ === 'Riksdagsorgan' || 
                                  assignment.typ === 'Departement';
    
    return isActive && isNotChamber && isCommitteeOrImportant;
  }) || [];

  console.log(`MemberCard for ${member.firstName} ${member.lastName}: ${activeAssignments.length} active assignments`);

  // Get primary role (prioritize committee leadership roles)
  const getPriorityRole = (assignment: any) => {
    if (assignment.roll === 'Ordförande') return 1;
    if (assignment.roll === 'Vice ordförande') return 2;
    if (assignment.roll === 'Ledamot') return 3;
    if (assignment.roll === 'Suppleant') return 4;
    return 5;
  };

  // Sort assignments by priority
  const sortedAssignments = activeAssignments.sort((a, b) => 
    getPriorityRole(a) - getPriorityRole(b)
  );

  const primaryRole = sortedAssignments[0];

  // Display up to 2 most important assignments
  const displayAssignments = sortedAssignments.slice(0, 2);

  return (
    <Card 
      className="hover:shadow-lg transition-shadow duration-200 cursor-pointer hover:border-blue-300"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          <Avatar className="w-16 h-16">
            <AvatarImage src={member.imageUrl} alt={`${member.firstName} ${member.lastName}`} />
            <AvatarFallback className="text-lg">
              {member.firstName.charAt(0)}{member.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 truncate">
              {member.firstName} {member.lastName}
            </CardTitle>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={`${party?.color || 'bg-gray-500'} text-white text-xs`}>
                {party?.name || member.party}
              </Badge>
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-xs text-gray-600">{member.activityScore.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span className="truncate">{member.constituency}</span>
        </div>

        {/* Display active assignments */}
        {displayAssignments.map((assignment, index) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <Building2 className="w-4 h-4 text-blue-600" />
            <div className="flex-1 min-w-0">
              <span className="font-medium text-blue-800 truncate block">
                {assignment.uppgift || getCommitteeName(assignment.organ_kod)}
              </span>
              <span className="text-xs text-gray-600">
                {assignment.roll}
              </span>
            </div>
          </div>
        ))}

        {activeAssignments.length > 2 && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span className="text-xs">
              +{activeAssignments.length - 2} andra uppdrag
            </span>
          </div>
        )}

        {activeAssignments.length === 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Building2 className="w-4 h-4" />
            <span className="text-xs italic">
              Inga aktiva utskottsuppdrag
            </span>
          </div>
        )}

        {member.profession && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Briefcase className="w-4 h-4" />
            <span className="text-xs truncate">{member.profession}</span>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 pt-2 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{member.motions || 0}</div>
            <div className="text-xs text-gray-500">Motioner</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{member.speeches.length}</div>
            <div className="text-xs text-gray-500">Anföranden</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-orange-600">{member.interpellations || 0}</div>
            <div className="text-xs text-gray-500">Interpellationer</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">{member.writtenQuestions || 0}</div>
            <div className="text-xs text-gray-500">Skriftliga frågor</div>
          </div>
        </div>

        {/* Debug info - show active assignments count */}
        <div className="text-xs text-gray-400 border-t pt-2">
          {activeAssignments.length} aktiva uppdrag | Utskott: {member.committees.map(code => getCommitteeName(code)).join(', ') || 'Inga'}
        </div>
      </CardContent>
    </Card>
  );
};

export default MemberCard;
