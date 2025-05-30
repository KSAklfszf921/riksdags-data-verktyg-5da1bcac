
import { Member } from '../types/member';
import { partyInfo } from '../data/mockMembers';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { MapPin, Users, MessageSquare, FileText, Building } from 'lucide-react';
import { getCommitteeName } from '../hooks/useMembers';

interface MemberCardProps {
  member: Member;
  onClick: () => void;
}

const MemberCard = ({ member, onClick }: MemberCardProps) => {
  const party = partyInfo[member.party];

  // Filter current assignments
  const currentDate = new Date();
  const activeAssignments = member.assignments?.filter(assignment => {
    const endDate = assignment.tom ? new Date(assignment.tom) : null;
    return !endDate || endDate > currentDate;
  }) || [];

  // Get committee assignments specifically
  const committeeAssignments = activeAssignments.filter(assignment => 
    assignment.typ === 'utskott' || 
    assignment.typ === 'Riksdagsnämnd' ||
    (!assignment.typ && assignment.organ_kod && 
     assignment.organ_kod !== 'kam' && 
     assignment.organ_kod !== 'Kammaren' &&
     !assignment.organ_kod.toLowerCase().includes('kammar'))
  );

  console.log(`MemberCard for ${member.firstName} ${member.lastName}: ${activeAssignments.length} active assignments`, activeAssignments.map(a => a.organ_kod));

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 hover:scale-[1.02]"
      style={{ borderLeftColor: party?.color || '#6B7280' }}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="w-16 h-16 ring-2 ring-white shadow-md">
            <AvatarImage src={member.imageUrl} alt={`${member.firstName} ${member.lastName}`} />
            <AvatarFallback className="text-lg font-medium">
              {member.firstName.charAt(0)}{member.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {member.firstName} {member.lastName}
            </h3>
            
            <div className="flex items-center space-x-2 mt-1">
              <Badge 
                className="text-white text-xs"
                style={{ backgroundColor: party?.color || '#6B7280' }}
              >
                {party?.name || member.party}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-1 mt-2 text-sm text-gray-600">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{member.constituency}</span>
            </div>

            {/* Committee assignments */}
            {committeeAssignments.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center space-x-1 mb-2">
                  <Building className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-500">Utskott & uppdrag:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {committeeAssignments.slice(0, 3).map((assignment, index) => (
                    <Badge 
                      key={index}
                      variant="outline" 
                      className="text-xs"
                      title={`${assignment.uppgift || assignment.organ_kod} - ${assignment.roll}`}
                    >
                      {assignment.organ_kod}
                      {assignment.roll && assignment.roll !== 'Ledamot' && (
                        <span className="ml-1 text-orange-600">({assignment.roll})</span>
                      )}
                    </Badge>
                  ))}
                  {committeeAssignments.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{committeeAssignments.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {/* Activity statistics */}
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="bg-blue-50 px-2 py-1 rounded">
                <div className="flex items-center justify-center space-x-1">
                  <MessageSquare className="w-3 h-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-600">{member.speeches.length}</span>
                </div>
                <div className="text-xs text-blue-800">Anföranden</div>
              </div>
              
              <div className="bg-green-50 px-2 py-1 rounded">
                <div className="flex items-center justify-center space-x-1">
                  <FileText className="w-3 h-3 text-green-600" />
                  <span className="text-xs font-medium text-green-600">{member.motions || 0}</span>
                </div>
                <div className="text-xs text-green-800">Motioner</div>
              </div>
              
              <div className="bg-purple-50 px-2 py-1 rounded">
                <div className="flex items-center justify-center space-x-1">
                  <Users className="w-3 h-3 text-purple-600" />
                  <span className="text-xs font-medium text-purple-600">{activeAssignments.length}</span>
                </div>
                <div className="text-xs text-purple-800">Uppdrag</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MemberCard;
