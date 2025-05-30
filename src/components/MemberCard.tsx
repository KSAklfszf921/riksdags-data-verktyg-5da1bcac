
import { Member } from '../types/member';
import { partyInfo } from '../data/mockMembers';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { MapPin, Star, Users, Building2, Briefcase } from 'lucide-react';

interface MemberCardProps {
  member: Member;
  onClick: () => void;
}

const MemberCard = ({ member, onClick }: MemberCardProps) => {
  const party = partyInfo[member.party];

  // Get current active assignments (excluding Kammaren and chamber assignments)
  const currentDate = new Date();
  const activeAssignments = member.assignments?.filter(assignment => {
    let endDate: Date | null = null;
    if (assignment.tom) {
      const tomString = assignment.tom.toString();
      if (tomString.includes('T')) {
        endDate = new Date(tomString);
      } else {
        endDate = new Date(tomString + 'T23:59:59');
      }
    }
    
    const isActive = !endDate || endDate > currentDate;
    const isNotChamber = assignment.organ !== 'Kammaren' && assignment.organ !== 'kam';
    const isCommitteeOrImportant = assignment.typ === 'uppdrag' || 
                                  assignment.typ === 'Riksdagsorgan' || 
                                  assignment.typ === 'Departement';
    
    return isActive && isNotChamber && isCommitteeOrImportant;
  }) || [];

  console.log(`MemberCard for ${member.firstName} ${member.lastName}: ${activeAssignments.length} active assignments`);

  // Get primary role (main committee assignment)
  const primaryRole = activeAssignments.find(assignment => 
    assignment.roll === 'Ledamot' || assignment.roll === 'Ordförande' || assignment.roll === 'Vice ordförande'
  ) || activeAssignments[0]; // Fallback to first assignment if no standard committee role

  const getPriorityRole = (assignment: any) => {
    if (assignment.roll === 'Ordförande') return 1;
    if (assignment.roll === 'Vice ordförande') return 2;
    if (assignment.roll === 'Ledamot') return 3;
    return 4;
  };

  // Sort assignments by priority
  const sortedAssignments = activeAssignments.sort((a, b) => 
    getPriorityRole(a) - getPriorityRole(b)
  );

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

        {primaryRole && (
          <div className="flex items-center space-x-2 text-sm">
            <Building2 className="w-4 h-4 text-blue-600" />
            <div className="flex-1 min-w-0">
              <span className="font-medium text-blue-800 truncate block">
                {primaryRole.organ}
              </span>
              <span className="text-xs text-gray-600">
                {primaryRole.roll}
              </span>
            </div>
          </div>
        )}

        {activeAssignments.length > 1 && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span className="text-xs">
              +{activeAssignments.length - 1} andra uppdrag
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
          {activeAssignments.length} aktiva uppdrag
        </div>
      </CardContent>
    </Card>
  );
};

export default MemberCard;
