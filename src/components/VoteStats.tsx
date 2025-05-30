
import { Badge } from "@/components/ui/badge";
import { RiksdagVote } from "../services/riksdagApi";

interface VoteStatsProps {
  votes: RiksdagVote[];
}

const VoteStats = ({ votes }: VoteStatsProps) => {
  const stats = votes.reduce((acc, vote) => {
    acc[vote.rost] = (acc[vote.rost] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex space-x-1">
      {Object.entries(stats).map(([rost, count]) => (
        <Badge 
          key={rost}
          variant={
            rost === 'Ja' ? 'default' : 
            rost === 'Nej' ? 'destructive' : 
            'secondary'
          }
          className="text-xs"
        >
          {rost}: {count}
        </Badge>
      ))}
    </div>
  );
};

export default VoteStats;
