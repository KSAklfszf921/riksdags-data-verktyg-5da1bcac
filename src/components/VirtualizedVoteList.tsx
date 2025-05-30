
import React, { useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { RiksdagVote } from '../services/riksdagApi';

interface VirtualizedVoteListProps {
  votes: RiksdagVote[];
  maxHeight?: number;
}

const VirtualizedVoteList = ({ votes, maxHeight = 400 }: VirtualizedVoteListProps) => {
  const [visibleStart, setVisibleStart] = React.useState(0);
  const [visibleEnd, setVisibleEnd] = React.useState(20);
  
  const itemHeight = 60; // Approximate height of each vote item
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  const visibleVotes = useMemo(() => {
    return votes.slice(visibleStart, visibleEnd);
  }, [votes, visibleStart, visibleEnd]);
  
  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const containerHeight = e.currentTarget.clientHeight;
    
    const newVisibleStart = Math.floor(scrollTop / itemHeight);
    const newVisibleEnd = Math.min(
      votes.length,
      newVisibleStart + Math.ceil(containerHeight / itemHeight) + 5 // Buffer
    );
    
    setVisibleStart(newVisibleStart);
    setVisibleEnd(newVisibleEnd);
  }, [votes.length, itemHeight]);
  
  if (votes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Inga röster att visa
      </div>
    );
  }
  
  return (
    <div
      ref={containerRef}
      className="overflow-auto border rounded-lg"
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
            const voteKey = `${vote.intressent_id || `unknown-${actualIndex}`}-${vote.votering_id || 'no-voting'}-${vote.beteckning || 'no-bet'}`;
            
            return (
              <div
                key={voteKey}
                className="flex items-center justify-between p-3 border-b bg-white hover:bg-gray-50"
                style={{ height: itemHeight }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {vote.namn || 'Okänt namn'} ({vote.parti || 'Okänt parti'})
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {vote.valkrets || 'Okänd valkrets'} • {vote.beteckning || 'Okänd beteckning'}
                    {vote.punkt && ` - Punkt ${vote.punkt}`}
                  </p>
                </div>
                <Badge 
                  variant={
                    vote.rost === 'Ja' ? 'default' : 
                    vote.rost === 'Nej' ? 'destructive' : 
                    'secondary'
                  }
                  style={{
                    backgroundColor: vote.rost === 'Ja' ? '#10B981' : 
                                   vote.rost === 'Nej' ? '#EF4444' : 
                                   vote.rost === 'Avstår' ? '#F59E0B' :
                                   '#6B7280',
                    color: 'white'
                  }}
                >
                  {vote.rost || 'Okänd'}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VirtualizedVoteList;
