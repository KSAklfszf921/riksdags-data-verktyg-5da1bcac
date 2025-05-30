
import { Member } from '../types/member';
import { partyInfo } from '../data/mockMembers';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { MapPin, Star } from 'lucide-react';

interface MemberCardProps {
  member: Member;
  onClick: () => void;
}

const MemberCard = ({ member, onClick }: MemberCardProps) => {
  const party = partyInfo[member.party];

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={member.imageUrl} alt={`${member.firstName} ${member.lastName}`} />
            <AvatarFallback>
              {member.firstName.charAt(0)}{member.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {member.firstName} {member.lastName}
              </h3>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm text-gray-600">{member.activityScore}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 mb-2">
              <Badge className={`${party.color} text-white`}>
                {party.name}
              </Badge>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-3 h-3 mr-1" />
                {member.constituency}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">{member.profession}</p>
            
            <div className="text-xs text-gray-500">
              {member.committees.length} utskott • {member.speeches.length} anföranden • {member.votes.length} röster
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MemberCard;
