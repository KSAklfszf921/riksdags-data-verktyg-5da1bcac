
import { TopListMember } from '../hooks/useTopListsData';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { partyInfo } from '../data/mockMembers';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import { useState } from 'react';

interface TopListCardProps {
  title: string;
  members: TopListMember[];
  icon: React.ReactNode;
  unit: string;
  loading?: boolean;
}

const TopListCard = ({ title, members, icon, unit, loading }: TopListCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const displayMembers = isExpanded ? members : members.slice(0, 5);
  const hasMoreMembers = members.length > 5;

  const exportData = () => {
    const csvContent = [
      ['Rank', 'Name', 'Party', 'Constituency', 'Count'].join(','),
      ...members.map((member, index) => [
        index + 1,
        `"${member.name}"`,
        member.party,
        `"${member.constituency}"`,
        member.count
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {icon}
              <span>{title}</span>
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="flex space-x-2">
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="h-5 bg-gray-200 rounded w-8"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return 'text-yellow-600 font-bold'; // Gold
      case 1: return 'text-gray-500 font-bold'; // Silver
      case 2: return 'text-amber-600 font-bold'; // Bronze
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
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center space-x-2">
            {icon}
            <span className="text-base sm:text-lg">{title}</span>
          </div>
          <Button
            onClick={exportData}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Exportera till CSV"
          >
            <Download className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayMembers.map((member, index) => {
            const party = partyInfo[member.party];
            const actualIndex = isExpanded ? index : index; // Keep original index for ranking
            
            return (
              <div key={member.id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 transition-colors">
                <div className={`text-sm sm:text-lg w-6 sm:w-8 text-center flex-shrink-0 ${getRankColor(actualIndex)}`}>
                  {getRankIcon(actualIndex)}
                </div>
                <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                  <AvatarImage src={member.imageUrl} alt={member.name} />
                  <AvatarFallback className="text-xs">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs sm:text-sm truncate">{member.name}</div>
                  <div className="flex items-center space-x-1 sm:space-x-2 mt-1">
                    <Badge className={`${party?.color || 'bg-gray-500'} text-white text-xs px-1 py-0`}>
                      {member.party}
                    </Badge>
                    <span className="text-xs text-gray-500 truncate hidden sm:inline">{member.constituency}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-sm sm:text-lg text-blue-600">{member.count}</div>
                  <div className="text-xs text-gray-500 hidden sm:block">{unit}</div>
                </div>
              </div>
            );
          })}
        </div>
        
        {hasMoreMembers && (
          <div className="mt-4 text-center">
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Visa färre</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Visa alla ({members.length})</span>
                </>
              )}
            </Button>
          </div>
        )}
        
        {members.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            <p className="text-sm">Ingen data tillgänglig</p>
            <p className="text-xs text-gray-400 mt-1">Prova att välja ett annat riksdagsår</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopListCard;
