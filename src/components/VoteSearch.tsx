
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, Filter, Download, BarChart3 } from "lucide-react";
import { searchVotes, VoteSearchParams, RiksdagVote } from "../services/riksdagApi";
import { Badge } from "@/components/ui/badge";
import { partyInfo } from "../data/mockMembers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const VoteSearch = () => {
  const [searchParams, setSearchParams] = useState<VoteSearchParams>({});
  const [votes, setVotes] = useState<RiksdagVote[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

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

      {votes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Voteringsresultat</span>
              <Badge variant="secondary">{totalCount} träffar</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {votes.slice(0, 50).map((vote, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {vote.beteckning} - Punkt {vote.punkt}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>{vote.namn}</strong> ({vote.parti}) - {vote.valkrets}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Riksmöte: {vote.rm} | {vote.avser}
                      </p>
                    </div>
                    <div className="ml-4">
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
                  </div>
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
