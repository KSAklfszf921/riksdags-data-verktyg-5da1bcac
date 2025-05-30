
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { searchVotes, VoteSearchParams, RiksdagVote } from "../services/riksdagApi";
import { Badge } from "@/components/ui/badge";
import VoteSearchFilters from "./VoteSearchFilters";
import VotingDesignation from "./VotingDesignation";

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

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Searching with params:', searchParams);
      const result = await searchVotes({
        ...searchParams,
        pageSize: 100 // Increase page size to get more comprehensive results
      });
      console.log('Search result:', result);
      setVotes(result.votes);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError('Kunde inte hämta voteringsdata. Kontrollera dina sökkriterier.');
      console.error('Error searching votes:', err);
    } finally {
      setLoading(false);
    }
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
          <VoteSearchFilters 
            searchParams={searchParams}
            onParamsChange={setSearchParams}
          />

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
            <p className="text-sm text-gray-500 mt-2">
              Försök med andra sökkriterier eller kontrollera att API:et är tillgängligt.
            </p>
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
            <CardDescription>
              Klicka på beteckningar och punkter för att se detaljerade voteringsresultat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(groupedVotes).map(([beteckning, punkter]) => (
                <VotingDesignation
                  key={beteckning}
                  beteckning={beteckning}
                  punkter={punkter}
                />
              ))}
            </div>
            
            {votes.length < totalCount && (
              <p className="text-center text-gray-500 mt-4">
                Visar {votes.length} av {totalCount} voteringar. Använd mer specifika filter för att begränsa resultaten.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {votes.length === 0 && !loading && !error && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">
              Inga voteringar hittades. Försök med andra sökkriterier.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VoteSearch;
