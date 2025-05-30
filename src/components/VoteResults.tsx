
import { Badge } from "@/components/ui/badge";
import { RiksdagVote } from "../services/riksdagApi";
import { partyInfo } from "../data/mockMembers";

interface VoteResultsProps {
  votes: RiksdagVote[];
  maxDisplay?: number;
}

const VoteResults = ({ votes, maxDisplay = 20 }: VoteResultsProps) => {
  const getPartyColor = (party: string) => {
    return partyInfo[party]?.color || '#6B7280';
  };

  return (
    <div className="space-y-2">
      {votes.slice(0, maxDisplay).map((vote, index) => (
        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
          <div>
            <span className="font-medium">{vote.namn}</span>
            <span className="text-gray-500 ml-2">
              ({vote.parti}) - {vote.valkrets}
            </span>
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
                             getPartyColor(vote.parti),
              color: 'white'
            }}
          >
            {vote.rost}
          </Badge>
        </div>
      ))}
      {votes.length > maxDisplay && (
        <p className="text-center text-gray-500 text-sm">
          Visar {maxDisplay} av {votes.length} röster
        </p>
      )}
    </div>
  );
};

export default VoteResults;
