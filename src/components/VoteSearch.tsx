import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, Filter, Download, BarChart3, ChevronDown, ChevronRight } from "lucide-react";
import { searchVotes, VoteSearchParams, RiksdagVote } from "../services/riksdagApi";
import { Badge } from "@/components/ui/badge";
import { partyInfo } from "../data/mockMembers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface GroupedVotes {
  [beteckning: string]: {
    [punkt: string]: RiksdagVote[];
  };
}

const VoteSearch = () => {
  const [searchParams, setSearchParams] = useState<VoteSearchParams>({});
  const [votes, setVotes] = useState<RiksdagVote[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [expandedBeteckningar, setExpandedBeteckningar] = useState<string[]>([]);
  const [expandedPunkter, setExpandedPunkter] = useState<string[]>([]);

  const riksmoten = [
    '2024/25', '2023/24', '2022/23', '2021/22', '2020/21', '2019/20', '2018/19',
    '2017/18', '2016/17', '2015/16', '2014/15', '2013/14', '2012/13', '2011/12',
    '2010/11', '2009/10', '2008/09', '2007/08', '2006/07', '2005/06', '2004/05',
    '2003/04', '2002/03'
  ];

  const parties = ['C', 'FP', 'L', 'KD', 'MP', 'M', 'S', 'SD', 'V', '-'];

  const valkretsar = [
    'Blekinge län', 'Dalarnas län', 'Gotlands län', 'Gävleborgs län',
    'Göteborgs kommun', 'Hallands län', 'Jämtlands län', 'Jönköpings län',
    'Kalmar län', 'Kronobergs län', 'Malmö kommun', 'Norrbottens län',
    'Skåne läns norra och östra', 'Skåne läns södra', 'Skåne läns västra',
    'Stockholms kommun', 'Stockholms län', 'Södermanlands län', 'Uppsala län',
    'Värmlands län', 'Västerbottens län', 'Västernorrlands län', 'Västmanlands län',
    'Västra Götalands läns norra', 'Västra Götalands läns södra',
    'Västra Götalands läns västra', 'Västra Götalands läns östra',
    'Örebro län', 'Östergötlands län'
  ];

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await searchVotes(searchParams);
      setVotes(result.votes);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError('Kunde inte hämta voteringsdata');
      console.error('Error searching votes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRmChange = (rm: string, checked: boolean) => {
    const currentRm = searchParams.rm || [];
    if (checked) {
      setSearchParams({
        ...searchParams,
        rm: [...currentRm, rm]
      });
    } else {
      setSearchParams({
        ...searchParams,
        rm: currentRm.filter(r => r !== rm)
      });
    }
  };

  const handlePartyChange = (party: string, checked: boolean) => {
    const currentParties = searchParams.party || [];
    if (checked) {
      setSearchParams({
        ...searchParams,
        party: [...currentParties, party]
      });
    } else {
      setSearchParams({
        ...searchParams,
        party: currentParties.filter(p => p !== party)
      });
    }
  };

  const getPartyName = (party: string) => {
    return partyInfo[party]?.fullName || party;
  };

  const getPartyColor = (party: string) => {
    return partyInfo[party]?.color || '#6B7280';
  };

  const groupVotesByBeteckningAndPunkt = (votes: RiksdagVote[]): GroupedVotes => {
    return votes.reduce((acc, vote) => {
      if (!acc[vote.beteckning]) {
        acc[vote.beteckning] = {};
      }
      if (!acc[vote.beteckning][vote.punkt]) {
        acc[vote.beteckning][vote.punkt] = [];
      }
      acc[vote.beteckning][vote.punkt].push(vote);
      return acc;
    }, {} as GroupedVotes);
  };

  const toggleBeteckning = (beteckning: string) => {
    setExpandedBeteckningar(prev => 
      prev.includes(beteckning) 
        ? prev.filter(b => b !== beteckning)
        : [...prev, beteckning]
    );
  };

  const togglePunkt = (punktKey: string) => {
    setExpandedPunkter(prev => 
      prev.includes(punktKey) 
        ? prev.filter(p => p !== punktKey)
        : [...prev, punktKey]
    );
  };

  const getRostStats = (votes: RiksdagVote[]) => {
    const stats = votes.reduce((acc, vote) => {
      acc[vote.rost] = (acc[vote.rost] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return stats;
  };

  const groupedVotes = groupVotesByBeteckningAndPunkt(votes);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Sök voteringar</span>
          </CardTitle>
          <CardDescription>
            Filtrera och sök bland riksdagens voteringar med avancerade kriterier
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Grundläggande</TabsTrigger>
              <TabsTrigger value="advanced">Avancerat</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="beteckning">Beteckning</Label>
                  <Input
                    id="beteckning"
                    placeholder="ex. AU1"
                    value={searchParams.beteckning || ''}
                    onChange={(e) => setSearchParams({
                      ...searchParams,
                      beteckning: e.target.value
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="punkt">Förslagspunkt</Label>
                  <Input
                    id="punkt"
                    placeholder="ex. 2"
                    value={searchParams.punkt || ''}
                    onChange={(e) => setSearchParams({
                      ...searchParams,
                      punkt: e.target.value
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="valkrets">Valkrets</Label>
                  <Select 
                    value={searchParams.valkrets || 'all'} 
                    onValueChange={(value) => setSearchParams({
                      ...searchParams,
                      valkrets: value === 'all' ? undefined : value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj valkrets" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alla valkretsar</SelectItem>
                      {valkretsar.map((valkrets) => (
                        <SelectItem key={valkrets} value={valkrets}>
                          {valkrets}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="rost">Röst</Label>
                  <Select 
                    value={searchParams.rost || 'all'} 
                    onValueChange={(value) => setSearchParams({
                      ...searchParams,
                      rost: value === 'all' ? undefined : value as any
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Alla röster" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alla</SelectItem>
                      <SelectItem value="Ja">Ja</SelectItem>
                      <SelectItem value="Nej">Nej</SelectItem>
                      <SelectItem value="Avstår">Avstår</SelectItem>
                      <SelectItem value="Frånvarande">Frånvarande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div>
                <Label>Riksmöte</Label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-2">
                  {riksmoten.slice(0, 12).map((rm) => (
                    <div key={rm} className="flex items-center space-x-2">
                      <Checkbox
                        id={`rm-${rm}`}
                        checked={searchParams.rm?.includes(rm) || false}
                        onCheckedChange={(checked) => handleRmChange(rm, checked as boolean)}
                      />
                      <Label htmlFor={`rm-${rm}`} className="text-sm">
                        {rm}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Parti</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {parties.map((party) => (
                    <div key={party} className="flex items-center space-x-2">
                      <Checkbox
                        id={`party-${party}`}
                        checked={searchParams.party?.includes(party) || false}
                        onCheckedChange={(checked) => handlePartyChange(party, checked as boolean)}
                      />
                      <Label htmlFor={`party-${party}`} className="text-sm">
                        {getPartyName(party)} ({party})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="gruppering">Gruppering</Label>
                <Select 
                  value={searchParams.gruppering || 'none'} 
                  onValueChange={(value) => setSearchParams({
                    ...searchParams,
                    gruppering: value === 'none' ? undefined : value as any
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ingen gruppering" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ingen gruppering</SelectItem>
                    <SelectItem value="iid">Ledamot - ID</SelectItem>
                    <SelectItem value="namn">Ledamot - namn</SelectItem>
                    <SelectItem value="parti">Parti</SelectItem>
                    <SelectItem value="valkrets">Valkrets</SelectItem>
                    <SelectItem value="rm">Riksmöte</SelectItem>
                    <SelectItem value="votering_id">Votering (ID)</SelectItem>
                    <SelectItem value="bet">Votering (bet + punkt)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex space-x-2">
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Sök voteringar
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setSearchParams({})}
            >
              Rensa filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {Object.keys(groupedVotes).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Voteringsresultat</span>
              <Badge variant="secondary">{totalCount} träffar</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(groupedVotes).map(([beteckning, punkter]) => (
                <div key={beteckning} className="border rounded-lg">
                  <Collapsible 
                    open={expandedBeteckningar.includes(beteckning)}
                    onOpenChange={() => toggleBeteckning(beteckning)}
                  >
                    <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        {expandedBeteckningar.includes(beteckning) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <h3 className="text-lg font-semibold text-gray-900">
                          {beteckning}
                        </h3>
                      </div>
                      <Badge variant="secondary">
                        {Object.keys(punkter).length} punkt{Object.keys(punkter).length !== 1 ? 'er' : ''}
                      </Badge>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="px-4 pb-4">
                      <Accordion type="multiple" className="w-full">
                        <AccordionItem value="texter">
                          <AccordionTrigger>
                            <span className="flex items-center space-x-2">
                              <span>Öppna texter för {beteckning}</span>
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded">
                              <p>Texter och bakgrund för {beteckning} visas här...</p>
                              <p className="mt-2">Riksmöte: {Object.values(punkter)[0]?.[0]?.rm}</p>
                              <p>Typ: {Object.values(punkter)[0]?.[0]?.avser}</p>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="beslut">
                          <AccordionTrigger>
                            <span className="flex items-center space-x-2">
                              <span>Beslut ({Object.keys(punkter).length} punkt{Object.keys(punkter).length !== 1 ? 'er' : ''})</span>
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3">
                              {Object.entries(punkter).map(([punkt, punktVotes]) => {
                                const punktKey = `${beteckning}-${punkt}`;
                                const rostStats = getRostStats(punktVotes);
                                
                                return (
                                  <div key={punktKey} className="border rounded-lg">
                                    <Collapsible 
                                      open={expandedPunkter.includes(punktKey)}
                                      onOpenChange={() => togglePunkt(punktKey)}
                                    >
                                      <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center space-x-2">
                                          {expandedPunkter.includes(punktKey) ? (
                                            <ChevronDown className="w-4 h-4" />
                                          ) : (
                                            <ChevronRight className="w-4 h-4" />
                                          )}
                                          <span className="font-medium">Punkt {punkt}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <div className="flex space-x-1">
                                            {Object.entries(rostStats).map(([rost, count]) => (
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
                                        </div>
                                      </CollapsibleTrigger>
                                      
                                      <CollapsibleContent className="px-3 pb-3">
                                        <Accordion type="multiple" className="w-full">
                                          <AccordionItem value="info">
                                            <AccordionTrigger className="text-sm">
                                              Öppna punktinformation
                                            </AccordionTrigger>
                                            <AccordionContent>
                                              <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                                                <p>Information om punkt {punkt} i {beteckning}</p>
                                                <p className="mt-1">Antal röster: {punktVotes.length}</p>
                                              </div>
                                            </AccordionContent>
                                          </AccordionItem>
                                          
                                          <AccordionItem value="resultat">
                                            <AccordionTrigger className="text-sm">
                                              Voteringsresultat
                                            </AccordionTrigger>
                                            <AccordionContent>
                                              <div className="space-y-2">
                                                {punktVotes.slice(0, 20).map((vote, index) => (
                                                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                                    <div>
                                                      <span className="font-medium">{vote.namn}</span>
                                                      <span className="text-gray-500 ml-2">({vote.parti}) - {vote.valkrets}</span>
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
                                                                       '#6B7280',
                                                        color: 'white'
                                                      }}
                                                    >
                                                      {vote.rost}
                                                    </Badge>
                                                  </div>
                                                ))}
                                                {punktVotes.length > 20 && (
                                                  <p className="text-center text-gray-500 text-sm">
                                                    Visar 20 av {punktVotes.length} röster
                                                  </p>
                                                )}
                                              </div>
                                            </AccordionContent>
                                          </AccordionItem>
                                        </Accordion>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  </div>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}
            </div>
            
            {votes.length < totalCount && (
              <p className="text-center text-gray-500 mt-4">
                Visar {votes.length} av {totalCount} voteringar
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VoteSearch;
