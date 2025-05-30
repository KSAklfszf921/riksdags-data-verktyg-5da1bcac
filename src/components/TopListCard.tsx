
import { TopListMember } from '../hooks/useTopListsData';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { partyInfo } from '../data/mockMembers';

interface TopListCardProps {
  title: string;
  members: TopListMember[];
  icon: React.ReactNode;
  unit: string;
  loading?: boolean;
}

const TopListCard = ({ title, members, icon, unit, loading }: TopListCardProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {icon}
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mt-1"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-12"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return 'text-yellow-600 font-bold'; // Guld
      case 1: return 'text-gray-500 font-bold'; // Silver
      case 2: return 'text-amber-600 font-bold'; // Brons
      default: return 'text-gray-700';
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}.`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-lg">
          {icon}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member, index) => {
            const party = partyInfo[member.party];
            return (
              <div key={member.id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                <div className={`text-lg w-8 text-center ${getRankColor(index)}`}>
                  {getRankIcon(index)}
                </div>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={member.imageUrl} alt={member.name} />
                  <AvatarFallback className="text-xs">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{member.name}</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={`${party?.color || 'bg-gray-500'} text-white text-xs`}>
                      {member.party}
                    </Badge>
                    <span className="text-xs text-gray-500 truncate">{member.constituency}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-blue-600">{member.count}</div>
                  <div className="text-xs text-gray-500">{unit}</div>
                </div>
              </div>
            );
          })}
        </div>
        {members.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            Ingen data tillgänglig
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopListCard;
