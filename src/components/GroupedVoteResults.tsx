
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { RiksdagVote } from "../services/riksdagApi";
import { partyInfo } from "../data/mockMembers";

interface VoteGroup {
  beteckning: string;
  riksmote: string;
  avser: string;
  votes: RiksdagVote[];
  voteStats: {
    ja: number;
    nej: number;
    avstar: number;
    franvarande: number;
  };
  proposalPoints: Set<string>; // Track unique proposal points
}

interface GroupedVoteResultsProps {
  votes: RiksdagVote[];
  totalCount: number;
}

const GroupedVoteResults = ({ votes, totalCount }: GroupedVoteResultsProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  console.log('GroupedVoteResults received votes:', votes.length);
  console.log('Sample votes:', votes.slice(0, 3));

  // Group votes by beteckning and riksmöte - improved grouping logic
  const groupedVotes = votes.reduce((groups: { [key: string]: VoteGroup }, vote) => {
    // Create a unique key for each voting session
    const groupKey = `${vote.beteckning || 'Okänd'}-${vote.rm || 'Okänt'}`;
    
    console.log('Processing vote:', {
      beteckning: vote.beteckning,
      rm: vote.rm,
      punkt: vote.punkt,
      groupKey,
      avser: vote.avser
    });
    
    if (!groups[groupKey]) {
      groups[groupKey] = {
        beteckning: vote.beteckning || 'Okänd beteckning',
        riksmote: vote.rm || 'Okänt riksmöte',
        avser: vote.avser || 'Ingen beskrivning tillgänglig',
        votes: [],
        voteStats: { ja: 0, nej: 0, avstar: 0, franvarande: 0 },
        proposalPoints: new Set()
      };
    }
    
    groups[groupKey].votes.push(vote);
    
    // Add proposal point to the set if it exists
    if (vote.punkt) {
      groups[groupKey].proposalPoints.add(vote.punkt);
    }
    
    // Update vote statistics
    const rostLower = (vote.rost || '').toLowerCase();
    switch (rostLower) {
      case 'ja':
        groups[groupKey].voteStats.ja++;
        break;
      case 'nej':
        groups[groupKey].voteStats.nej++;
        break;
      case 'avstår':
        groups[groupKey].voteStats.avstar++;
        break;
      case 'frånvarande':
        groups[groupKey].voteStats.franvarande++;
        break;
      default:
        console.log('Unknown vote type:', vote.rost);
    }
    
    return groups;
  }, {});

  const groupsArray = Object.values(groupedVotes);
  console.log('Created groups:', groupsArray.length);
  console.log('Groups summary:', groupsArray.map(g => ({
    key: `${g.beteckning}-${g.riksmote}`,
    voteCount: g.votes.length,
    beteckning: g.beteckning,
    riksmote: g.riksmote,
    proposalPoints: Array.from(g.proposalPoints)
  })));

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  if (groupsArray.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-600">Inga voteringsresultat att visa</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Grupperade voteringsresultat</span>
          <Badge variant="secondary">{totalCount} träffar i {groupsArray.length} voteringar</Badge>
        </CardTitle>
        <CardDescription>
          Voteringar grupperade efter beteckning och riksmöte. Visar {votes.length} individuella röster.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {groupsArray.map((group) => {
            const groupKey = `${group.beteckning}-${group.riksmote}`;
            const isExpanded = expandedGroups.has(groupKey);
            const proposalPointsArray = Array.from(group.proposalPoints).sort();
            
            return (
              <Collapsible key={groupKey} open={isExpanded} onOpenChange={() => toggleGroup(groupKey)}>
                <CollapsibleTrigger asChild>
                  <div className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-2">
                          {group.beteckning} - Riksmöte {group.riksmote}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {group.avser}
                        </p>
                        
                        {/* Proposal points info */}
                        {proposalPointsArray.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-700">
                              <strong>Förslagspunkter:</strong> {proposalPointsArray.join(', ')} 
                              <span className="text-gray-500 ml-1">
                                ({proposalPointsArray.length} {proposalPointsArray.length === 1 ? 'punkt' : 'punkter'})
                              </span>
                            </p>
                          </div>
                        )}
                        
                        {/* Vote statistics */}
                        <div className="flex space-x-4 text-sm">
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span>Ja: {group.voteStats.ja}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span>Nej: {group.voteStats.nej}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span>Avstår: {group.voteStats.avstar}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                            <span>Frånvarande: {group.voteStats.franvarande}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {group.votes.length} ledamöter
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-2">
                  <div className="border rounded-lg bg-gray-50">
                    <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                      {group.votes.map((vote, index) => (
                        <div key={`${vote.intressent_id || index}-${vote.votering_id || index}`} className="flex items-center justify-between bg-white p-3 rounded border">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {vote.namn || 'Okänt namn'} ({vote.parti || 'Okänt parti'})
                            </p>
                            <p className="text-xs text-gray-500">
                              {vote.valkrets || 'Okänd valkrets'}
                              {vote.punkt && (
                                <span className="ml-2">• Punkt {vote.punkt}</span>
                              )}
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
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupedVoteResults;
