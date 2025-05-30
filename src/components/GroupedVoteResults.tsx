
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

  console.log('GroupedVoteResults received votes:', votes.length);
  console.log('Sample votes:', votes.slice(0, 3));

  // Group votes by beteckning and riksmöte
  const groupedVotes = votes.reduce((groups: { [key: string]: VoteGroup }, vote) => {
    const groupKey = `${vote.beteckning || 'Okänd'}-${vote.rm || 'Okänt'}`;
    
    if (!groups[groupKey]) {
      groups[groupKey] = {
        beteckning: vote.beteckning || 'Okänd beteckning',
        riksmote: vote.rm || 'Okänt riksmöte',
        avser: vote.avser || 'Ingen beskrivning tillgänglig',
        votes: [],
        voteStats: { ja: 0, nej: 0, avstar: 0, franvarande: 0 }
      };
    }
    
    groups[groupKey].votes.push(vote);
    
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
    }
    
    return groups;
  }, {});

  const groupsArray = Object.values(groupedVotes);

  console.log('Final groups count:', groupsArray.length);

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

  const getVoteBadgeStyle = (vote: string) => {
    switch (vote) {
      case 'Ja':
        return { backgroundColor: '#10B981', color: 'white' };
      case 'Nej':
        return { backgroundColor: '#EF4444', color: 'white' };
      case 'Avstår':
        return { backgroundColor: '#F59E0B', color: 'white' };
      case 'Frånvarande':
        return { backgroundColor: '#6B7280', color: 'white' };
      default:
        return { backgroundColor: '#6B7280', color: 'white' };
    }
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
          <span>Voteringsresultat per beslutspunkt</span>
          <Badge variant="secondary">{totalCount} röster i {groupsArray.length} voteringar</Badge>
        </CardTitle>
        <CardDescription>
          Klicka på en votering för att se detaljerade röstresultat i tabellform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {groupsArray.map((group, index) => {
            const groupKey = `${group.beteckning}-${group.riksmote}`;
            const isExpanded = expandedGroups.has(groupKey);
            
            return (
              <Collapsible key={`${groupKey}-${index}`} open={isExpanded} onOpenChange={() => toggleGroup(groupKey)}>
                <CollapsibleTrigger asChild>
                  <div className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium mb-2 text-gray-900">
                          {group.beteckning} - Riksmöte {group.riksmote}
                        </h3>
                        <p className="text-sm mb-3 text-gray-600">
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
                  <div className="border rounded-lg bg-white">
                    <div className="p-4">
                      <h4 className="font-medium mb-3 text-gray-900">
                        Detaljerade röstresultat - {group.beteckning}
                      </h4>
                      <div className="max-h-96 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Ledamot</TableHead>
                              <TableHead>Parti</TableHead>
                              <TableHead>Valkrets</TableHead>
                              <TableHead>Röst</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.votes
                              .sort((a, b) => (a.namn || '').localeCompare(b.namn || ''))
                              .map((vote, voteIndex) => (
                                <TableRow key={`vote-${index}-${voteIndex}`} className="hover:bg-gray-50">
                                  <TableCell className="font-medium">
                                    {vote.namn || 'Okänt namn'}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center space-x-2">
                                      <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: getPartyColor(vote.parti || '') }}
                                      ></div>
                                      <span>{vote.parti || 'Okänt parti'}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm text-gray-600">
                                    {vote.valkrets || 'Okänd valkrets'}
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant="secondary"
                                      style={getVoteBadgeStyle(vote.rost || 'Okänd')}
                                    >
                                      {vote.rost || 'Okänd'}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
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
