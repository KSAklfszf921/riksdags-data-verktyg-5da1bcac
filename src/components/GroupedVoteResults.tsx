
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
}

interface GroupedVoteResultsProps {
  votes: RiksdagVote[];
  totalCount: number;
}

const GroupedVoteResults = ({ votes, totalCount }: GroupedVoteResultsProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Group votes by beteckning and riksmöte
  const groupedVotes = votes.reduce((groups: { [key: string]: VoteGroup }, vote) => {
    const groupKey = `${vote.beteckning}-${vote.rm}`;
    
    if (!groups[groupKey]) {
      groups[groupKey] = {
        beteckning: vote.beteckning,
        riksmote: vote.rm,
        avser: vote.avser,
        votes: [],
        voteStats: { ja: 0, nej: 0, avstar: 0, franvarande: 0 }
      };
    }
    
    groups[groupKey].votes.push(vote);
    
    // Update vote statistics
    switch (vote.rost) {
      case 'Ja':
        groups[groupKey].voteStats.ja++;
        break;
      case 'Nej':
        groups[groupKey].voteStats.nej++;
        break;
      case 'Avstår':
        groups[groupKey].voteStats.avstar++;
        break;
      case 'Frånvarande':
        groups[groupKey].voteStats.franvarande++;
        break;
    }
    
    return groups;
  }, {});

  const groupsArray = Object.values(groupedVotes);

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const getPartyColor = (party: string) => {
    return partyInfo[party]?.color || '#6B7280';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Grupperade voteringsresultat</span>
          <Badge variant="secondary">{totalCount} träffar i {groupsArray.length} voteringar</Badge>
        </CardTitle>
        <CardDescription>
          Voteringar grupperade efter beteckning och riksmöte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {groupsArray.map((group) => {
            const groupKey = `${group.beteckning}-${group.riksmote}`;
            const isExpanded = expandedGroups.has(groupKey);
            
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
                        <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {vote.namn} ({vote.parti})
                            </p>
                            <p className="text-xs text-gray-500">
                              {vote.valkrets}
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
                            {vote.rost}
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
