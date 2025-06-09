
import React, { useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { RiksdagVote } from '../services/riksdagApi';

interface VirtualizedVoteListProps {
  votes: RiksdagVote[];
  maxHeight?: number;
}

const VirtualizedVoteList = ({ votes, maxHeight = 400 }: VirtualizedVoteListProps) => {
  const [visibleStart, setVisibleStart] = React.useState(0);
  const [visibleEnd, setVisibleEnd] = React.useState(20);
  
  const itemHeight = 60;
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  const visibleVotes = useMemo(() => {
    return votes.slice(visibleStart, visibleEnd);
  }, [votes, visibleStart, visibleEnd]);
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const containerHeight = e.currentTarget.clientHeight;
    
    const newVisibleStart = Math.max(0, Math.floor(scrollTop / itemHeight));
    const newVisibleEnd = Math.min(
      votes.length,
      newVisibleStart + Math.ceil(containerHeight / itemHeight) + 5 // Buffer for smooth scrolling
    );
    
    if (newVisibleStart !== visibleStart || newVisibleEnd !== visibleEnd) {
      setVisibleStart(newVisibleStart);
      setVisibleEnd(newVisibleEnd);
    }
  }, [votes.length, itemHeight, visibleStart, visibleEnd]);
  
  const getRostBadgeStyle = useCallback((rost: string) => {
    switch (rost?.toLowerCase()) {
      case 'ja':
        return { backgroundColor: '#10B981', color: 'white' };
      case 'nej':
        return { backgroundColor: '#EF4444', color: 'white' };
      case 'avstår':
        return { backgroundColor: '#F59E0B', color: 'white' };
      case 'frånvarande':
        return { backgroundColor: '#6B7280', color: 'white' };
      default:
        return { backgroundColor: '#9CA3AF', color: 'white' };
    }
  }, []);

  const getRostVariant = useCallback((rost: string) => {
    switch (rost?.toLowerCase()) {
      case 'ja':
        return 'default';
      case 'nej':
        return 'destructive';
      default:
        return 'secondary';
    }
  }, []);
  
  if (votes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
        <p className="text-lg font-medium">Inga röster att visa</p>
        <p className="text-sm mt-1">Prova att ändra dina sökkriterier</p>
      </div>
    );
  }
  
  return (
    <div
      ref={containerRef}
      className="overflow-auto border rounded-lg bg-white"
      style={{ maxHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: votes.length * itemHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: visibleStart * itemHeight,
            width: '100%'
          }}
        >
          {visibleVotes.map((vote, index) => {
            const actualIndex = visibleStart + index;
            // Improved key generation for better performance
            const voteKey = `${vote.votering_id || 'no-voting'}-${vote.intressent_id || 'no-member'}-${actualIndex}`;
            
            // Handle rost property which can be string or array
            const rostValue = typeof vote.rost === 'string' ? vote.rost : 'Okänd';
            
            return (
              <div
                key={voteKey}
                className="flex items-center justify-between p-3 border-b bg-white hover:bg-gray-50 transition-colors"
                style={{ height: itemHeight }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate text-gray-900">
                    <Link to={`/ledamoter?id=${vote.intressent_id}`} className="hover:underline">
                      {vote.namn || 'Okänt namn'}
                    </Link>
                    {vote.parti && (
                      <span className="text-gray-600 ml-1">({vote.parti})</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {vote.valkrets || 'Okänd valkrets'}
                    {vote.beteckning && (
                      <span> • {vote.beteckning}</span>
                    )}
                    {vote.punkt && (
                      <span> - Punkt {vote.punkt}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {vote.rm && (
                    <Badge variant="outline" className="text-xs">
                      {vote.rm}
                    </Badge>
                  )}
                  <Badge 
                    variant={getRostVariant(rostValue)}
                    style={getRostBadgeStyle(rostValue)}
                    className="min-w-[60px] text-center"
                  >
                    {rostValue}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VirtualizedVoteList;
