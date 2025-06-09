
import { Member } from '../types/member';
import { partyInfo } from '../data/mockMembers';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { MapPin, Star, Users, Building2, Briefcase, ChevronRight } from 'lucide-react';
import { getCommitteeName } from '../hooks/useMembers';
import { useResponsive } from '../hooks/use-responsive';

interface MemberCardProps {
  member: Member;
  onClick: () => void;
}

const MemberCard = ({ member, onClick }: MemberCardProps) => {
  const { isMobile, isTablet } = useResponsive();
  const party = partyInfo[member.party];

  // Safe access to assignments with null check and default values
  const assignments = member.assignments || [];

  // Improved active assignment filtering
  const currentDate = new Date();
  const activeAssignments = assignments.filter(assignment => {
    if (!assignment) return false;
    
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
    
    // Improved filtering - exclude chamber assignments and focus on committees
    const isNotChamber = assignment.organ_kod !== 'Kammaren' && 
                        assignment.organ_kod !== 'kam' && 
                        !assignment.organ_kod.toLowerCase().includes('kammar');
    
    // Include committee and important assignments only
    const isCommitteeOrImportant = assignment.typ === 'uppdrag' || 
                                  assignment.typ === 'Riksdagsorgan' || 
                                  assignment.typ === 'Departement';
    
    return isActive && isNotChamber && isCommitteeOrImportant;
  });

  // Get priority role (prioritize committee leadership roles)
  const getPriorityRole = (assignment: any) => {
    if (!assignment || !assignment.roll) return 5;
    const roll = assignment.roll.toLowerCase();
    if (roll.includes('ordförande')) return 1;
    if (roll.includes('vice')) return 2;
    if (roll.includes('ledamot')) return 3;
    if (roll.includes('suppleant')) return 4;
    return 5;
  };

  // Sort assignments by priority (leadership roles first)
  const sortedAssignments = activeAssignments.sort((a, b) => 
    getPriorityRole(a) - getPriorityRole(b)
  );

  // Display up to 2 most important assignments
  const displayAssignments = sortedAssignments.slice(0, isMobile ? 1 : 2);

  // Safe access to arrays with default values
  const speeches = member.speeches || [];
  const committees = member.committees || [];
  const motions = member.motions || 0;
  const interpellations = member.interpellations || 0;
  const writtenQuestions = member.writtenQuestions || 0;

  if (isMobile) {
    return (
      <Card 
        className="hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300 active:scale-95"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="w-12 h-12 flex-shrink-0">
              <AvatarImage src={member.imageUrl} alt={`${member.firstName} ${member.lastName}`} />
              <AvatarFallback className="text-sm font-medium">
                {member.firstName.charAt(0)}{member.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate text-sm">
                {member.firstName} {member.lastName}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={`${party?.color || 'bg-gray-500'} text-white text-xs`}>
                  {party?.name || member.party}
                </Badge>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{member.constituency}</span>
            </div>

            {displayAssignments.length > 0 && displayAssignments[0] && (
              <div className="flex items-start space-x-2 text-xs">
                <Building2 className="w-3 h-3 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-blue-800 truncate block">
                    {displayAssignments[0].uppgift || getCommitteeName(displayAssignments[0].organ_kod)}
                  </span>
                  <span className="text-gray-600 capitalize">
                    {displayAssignments[0].roll?.toLowerCase() || ''}
                  </span>
                </div>
              </div>
            )}

            {activeAssignments.length > 1 && (
              <div className="text-xs text-gray-500">
                +{activeAssignments.length - 1} andra uppdrag
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1 mt-3 pt-3 border-t">
            <div className="text-center">
              <div className="text-sm font-semibold text-blue-600">{motions}</div>
              <div className="text-xs text-gray-500">Mot.</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-green-600">{speeches.length}</div>
              <div className="text-xs text-gray-500">Anf.</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-orange-600">{interpellations}</div>
              <div className="text-xs text-gray-500">Int.</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-purple-600">{writtenQuestions}</div>
              <div className="text-xs text-gray-500">Fr.</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Tablet and desktop view
  return (
    <Card 
      className="hover:shadow-lg transition-shadow duration-200 cursor-pointer hover:border-blue-300"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          <Avatar className={`${isTablet ? 'w-14 h-14' : 'w-16 h-16'}`}>
            <AvatarImage src={member.imageUrl} alt={`${member.firstName} ${member.lastName}`} />
            <AvatarFallback className="text-lg">
              {member.firstName.charAt(0)}{member.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className={`${isTablet ? 'text-base' : 'text-lg'} font-semibold text-gray-900 truncate`}>
              {member.firstName} {member.lastName}
            </CardTitle>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={`${party?.color || 'bg-gray-500'} text-white text-xs`}>
                {party?.name || member.party}
              </Badge>
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-xs text-gray-600">{(member.activityScore || 0).toFixed(1)}</span>
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

        {displayAssignments.map((assignment, index) => {
          if (!assignment) return null;
          return (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <Building2 className="w-4 h-4 text-blue-600" />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-blue-800 truncate block">
                  {assignment.uppgift || getCommitteeName(assignment.organ_kod)}
                </span>
                <span className="text-xs text-gray-600 capitalize">
                  {assignment.roll?.toLowerCase() || ''}
                </span>
              </div>
            </div>
          );
        })}

        {activeAssignments.length > displayAssignments.length && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span className="text-xs">
              +{activeAssignments.length - displayAssignments.length} andra uppdrag
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
            <div className={`${isTablet ? 'text-base' : 'text-lg'} font-semibold text-blue-600`}>{motions}</div>
            <div className="text-xs text-gray-500">Motioner</div>
          </div>
          <div className="text-center">
            <div className={`${isTablet ? 'text-base' : 'text-lg'} font-semibold text-green-600`}>{speeches.length}</div>
            <div className="text-xs text-gray-500">Anföranden</div>
          </div>
          <div className="text-center">
            <div className={`${isTablet ? 'text-base' : 'text-lg'} font-semibold text-orange-600`}>{interpellations}</div>
            <div className="text-xs text-gray-500">Interpellationer</div>
          </div>
          <div className="text-center">
            <div className={`${isTablet ? 'text-base' : 'text-lg'} font-semibold text-purple-600`}>{writtenQuestions}</div>
            <div className="text-xs text-gray-500">Skriftliga frågor</div>
          </div>
        </div>

        {!isMobile && (
          <div className="text-xs text-gray-400 border-t pt-2">
            {activeAssignments.length} aktiva uppdrag | Komm. koder: {committees.join(', ') || 'Inga'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberCard;
