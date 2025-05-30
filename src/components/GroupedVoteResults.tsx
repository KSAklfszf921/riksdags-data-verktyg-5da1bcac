
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
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
  const [expandedPoints, setExpandedPoints] = useState<Set<string>>(new Set());

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
      // Also close all points in this group
      const newExpandedPoints = new Set(expandedPoints);
      Array.from(newExpandedPoints).forEach(pointKey => {
        if (pointKey.startsWith(groupKey)) {
          newExpandedPoints.delete(pointKey);
        }
      });
      setExpandedPoints(newExpandedPoints);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const togglePoint = (pointKey: string) => {
    const newExpandedPoints = new Set(expandedPoints);
    if (newExpandedPoints.has(pointKey)) {
      newExpandedPoints.delete(pointKey);
    } else {
      newExpandedPoints.add(pointKey);
    }
    setExpandedPoints(newExpandedPoints);
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
            const isGroupExpanded = expandedGroups.has(groupKey);
            const proposalPointsArray = Array.from(group.proposalPoints).sort();
            
            // Group votes by proposal point for better display
            const votesByPoint = group.votes.reduce((acc, vote) => {
              const punkt = vote.punkt || 'Ingen punkt angiven';
              if (!acc[punkt]) {
                acc[punkt] = [];
              }
              acc[punkt].push(vote);
              return acc;
            }, {} as { [key: string]: RiksdagVote[] });
            
            return (
              <div key={groupKey} className="border rounded-lg">
                {/* Group Header */}
                <Collapsible open={isGroupExpanded} onOpenChange={() => toggleGroup(groupKey)}>
                  <CollapsibleTrigger asChild>
                    <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-2">
                            {group.beteckning} - Riksmöte {group.riksmote}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {group.avser}
                          </p>
                          
                          {/* Proposal points count */}
                          {proposalPointsArray.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm text-gray-700">
                                <strong>Beslutspunkter:</strong> 
                                <Badge variant="outline" className="ml-2">
                                  {proposalPointsArray.length} punkter
                                </Badge>
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
                          {isGroupExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="border-t bg-gray-50 p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Beslutspunkter</h4>
                      <div className="space-y-2">
                        {Object.entries(votesByPoint).map(([punkt, punktVotes]) => {
                          const pointKey = `${groupKey}-${punkt}`;
                          const isPointExpanded = expandedPoints.has(pointKey);
                          
                          // Calculate vote stats for this point
                          const pointStats = punktVotes.reduce((stats, vote) => {
                            const rostLower = (vote.rost || '').toLowerCase();
                            switch (rostLower) {
                              case 'ja':
                                stats.ja++;
                                break;
                              case 'nej':
                                stats.nej++;
                                break;
                              case 'avstår':
                                stats.avstar++;
                                break;
                              case 'frånvarande':
                                stats.franvarande++;
                                break;
                            }
                            return stats;
                          }, { ja: 0, nej: 0, avstar: 0, franvarande: 0 });
                          
                          return (
                            <div key={pointKey}>
                              {/* Point Header */}
                              <Collapsible open={isPointExpanded} onOpenChange={() => togglePoint(pointKey)}>
                                <CollapsibleTrigger asChild>
                                  <div className="bg-white p-3 rounded border cursor-pointer hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <Badge variant="secondary" className="text-xs">
                                            Beslutspunkt {punkt}
                                          </Badge>
                                          <span className="text-sm text-gray-600">
                                            ({punktVotes.length} röster)
                                          </span>
                                        </div>
                                        
                                        {/* Point vote statistics */}
                                        <div className="flex space-x-3 text-xs">
                                          <div className="flex items-center space-x-1">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span>Ja: {pointStats.ja}</span>
                                          </div>
                                          <div className="flex items-center space-x-1">
                                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                            <span>Nej: {pointStats.nej}</span>
                                          </div>
                                          <div className="flex items-center space-x-1">
                                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                            <span>Avstår: {pointStats.avstar}</span>
                                          </div>
                                          <div className="flex items-center space-x-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                            <span>Frånvarande: {pointStats.franvarande}</span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center">
                                        {isPointExpanded ? (
                                          <ChevronUp className="w-4 h-4" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CollapsibleTrigger>
                                
                                <CollapsibleContent className="mt-2">
                                  <div className="bg-gray-50 p-3 rounded border max-h-96 overflow-y-auto">
                                    <div className="space-y-2">
                                      {punktVotes.map((vote, index) => (
                                        <div key={`${vote.intressent_id || index}-${vote.votering_id || index}-${punkt}`} className="flex items-center justify-between bg-white p-3 rounded border">
                                          <div className="flex-1">
                                            <p className="font-medium text-sm">
                                              {vote.namn || 'Okänt namn'} ({vote.parti || 'Okänt parti'})
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              {vote.valkrets || 'Okänd valkrets'}
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
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupedVoteResults;
