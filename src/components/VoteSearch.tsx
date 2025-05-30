
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, Filter, Download, BarChart3, Zap } from "lucide-react";
import { searchVotes, VoteSearchParams, RiksdagVote } from "../services/riksdagApi";
import { optimizedVoteSearch, shouldUseOptimizedSearch, OptimizedVoteResult } from "../services/optimizedVoteApi";
import { Badge } from "@/components/ui/badge";
import { partyInfo } from "../data/mockMembers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GroupedVoteResults from "./GroupedVoteResults";
import { useToast } from "@/hooks/use-toast";

const VoteSearch = () => {
  const [searchParams, setSearchParams] = useState<VoteSearchParams>({});
  const [votes, setVotes] = useState<RiksdagVote[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [optimizedResult, setOptimizedResult] = useState<OptimizedVoteResult | null>(null);
  const [useOptimized, setUseOptimized] = useState(false);
  const { toast } = useToast();

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

  // Check if current params are suitable for optimized search
  useEffect(() => {
    const canUseOptimized = shouldUseOptimizedSearch(searchParams);
    setUseOptimized(canUseOptimized);
  }, [searchParams]);

  const handleSearch = async () => {
    // Basic validation
    if (!searchParams.beteckning && !searchParams.rm?.length && !searchParams.punkt && !searchParams.party?.length) {
      toast({
        title: "Sökkriterier saknas",
        description: "Ange minst ett sökkriterium för att söka voteringar.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError(null);
    setOptimizedResult(null);
    
    console.log('Starting vote search with params:', searchParams);
    console.log('Using optimized search:', useOptimized);
    
    try {
      if (useOptimized && searchParams.beteckning && searchParams.rm && searchParams.rm.length === 1) {
        // Use optimized search
        console.log('Using optimized search for:', searchParams.beteckning);
        
        const result = await optimizedVoteSearch({
          beteckningPattern: searchParams.beteckning,
          rm: searchParams.rm[0],
          limit: 5
        });
        
        setOptimizedResult(result);
        setVotes(result.votes);
        setTotalCount(result.totalCount);
        
        toast({
          title: "Optimerad sökning klar",
          description: `Hittade ${result.votes.length} röster från ${result.designations.length} beteckningar.`
        });
        
      } else {
        // Use regular search
        console.log('Using regular search');
        
        const result = await searchVotes(searchParams);
        console.log(`Regular search complete: ${result.votes.length} votes found`);
        
        setVotes(result.votes);
        setTotalCount(result.totalCount);
        
        toast({
          title: "Sökning klar",
          description: `Hittade ${result.votes.length} röster av totalt ${result.totalCount} träffar.`
        });
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kunde inte hämta voteringsdata';
      setError(errorMessage);
      console.error('Error searching votes:', err);
      
      toast({
        title: "Sökfel",
        description: errorMessage,
        variant: "destructive"
      });
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

  const handleExportResults = () => {
    if (votes.length === 0) {
      toast({
        title: "Ingen data att exportera",
        description: "Gör en sökning först för att kunna exportera resultat.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create CSV content
      const headers = ['Namn', 'Parti', 'Valkrets', 'Beteckning', 'Punkt', 'Röst', 'Riksmöte', 'Datum'];
      const csvContent = [
        headers.join(';'),
        ...votes.map(vote => [
          vote.namn || '',
          vote.parti || '',
          vote.valkrets || '',
          vote.beteckning || '',
          vote.punkt || '',
          vote.rost || '',
          vote.rm || '',
          vote.datum || ''
        ].join(';'))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `voteringsresultat_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export lyckades",
        description: `Exporterade ${votes.length} röster till CSV-fil.`
      });
    } catch (err) {
      console.error('Export error:', err);
      toast({
        title: "Exportfel",
        description: "Kunde inte exportera data. Försök igen.",
        variant: "destructive"
      });
    }
  };

  const getPartyName = (party: string) => {
    return partyInfo[party]?.fullName || party;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Sök voteringar</span>
            {useOptimized && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Zap className="w-3 h-3" />
                <span>Optimerad sökning</span>
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Filtrera och sök bland riksdagens voteringar med avancerade kriterier
            {useOptimized && (
              <div className="mt-2 text-sm text-blue-600">
                Optimerad sökning aktiverad: Hämtar senaste beteckningar först, sedan beslutspunkter och slutligen voteringsresultat
              </div>
            )}
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

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : useOptimized ? (
                <Zap className="w-4 h-4 mr-2" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              {useOptimized ? 'Optimerad sökning' : 'Sök voteringar'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setSearchParams({})}
            >
              Rensa filter
            </Button>
            
            {votes.length > 0 && (
              <Button 
                variant="outline" 
                onClick={handleExportResults}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exportera CSV</span>
              </Button>
            )}
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

      {optimizedResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Optimerade sökresultat</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{optimizedResult.designations.length}</div>
                <div className="text-sm text-gray-600">Beteckningar</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(optimizedResult.proposalPoints).flat().length}
                </div>
                <div className="text-sm text-gray-600">Beslutspunkter</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{optimizedResult.votes.length}</div>
                <div className="text-sm text-gray-600">Voteringsresultat</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Funna beteckningar och beslutspunkter:</h4>
              {optimizedResult.designations.map(designation => (
                <div key={designation} className="flex items-center space-x-2">
                  <Badge variant="outline">{designation}</Badge>
                  <span className="text-sm text-gray-600">
                    Punkter: {optimizedResult.proposalPoints[designation]?.join(', ') || 'Inga'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {votes.length > 0 && (
        <GroupedVoteResults votes={votes} totalCount={totalCount} />
      )}
    </div>
  );
};

export default VoteSearch;
