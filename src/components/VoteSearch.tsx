
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
  // Set initial search params to AU10
  const [searchParams, setSearchParams] = useState<VoteSearchParams>({
    beteckning: "AU10"
  });
  const [votes, setVotes] = useState<RiksdagVote[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    console.log('=== STARTING VOTE SEARCH ===');
    console.log('Search params:', JSON.stringify(searchParams, null, 2));
    
    setLoading(true);
    setError(null);
    setVotes([]);
    setTotalCount(0);
    
    try {
      // Check if we have any search parameters
      const hasSearchParams = Object.keys(searchParams).some(key => {
        const value = searchParams[key as keyof VoteSearchParams];
        return value !== undefined && value !== '' && 
               (!Array.isArray(value) || value.length > 0);
      });

      if (!hasSearchParams) {
        console.log('No search parameters provided, using AU10 as default');
        // If no search params, search for AU10
        searchParams.beteckning = 'AU10';
      }

      console.log('Final search params being sent:', searchParams);
      
      const result = await searchVotes({
        ...searchParams,
        pageSize: 100
      });
      
      console.log('=== SEARCH RESULT ===');
      console.log('Votes returned:', result.votes.length);
      console.log('Total count:', result.totalCount);
      console.log('First few votes:', result.votes.slice(0, 3));
      
      if (result.votes.length === 0) {
        setError('Inga voteringar hittades med de angivna sökparamtrarna. Prova att ändra eller ta bort några filter.');
      } else {
        setVotes(result.votes);
        setTotalCount(result.totalCount);
        setError(null);
      }
    } catch (err) {
      console.error('=== SEARCH ERROR ===');
      console.error('Error details:', err);
      console.error('Error message:', err instanceof Error ? err.message : 'Unknown error');
      
      setError(`Kunde inte hämta voteringsdata: ${err instanceof Error ? err.message : 'Okänt fel'}`);
      setVotes([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      console.log('=== SEARCH COMPLETED ===');
    }
  };

  const groupVotesByBeteckningAndPunkt = (votes: RiksdagVote[]): GroupedVotes => {
    console.log('Grouping votes:', votes.length);
    const grouped = votes.reduce((acc, vote) => {
      if (!acc[vote.beteckning]) {
        acc[vote.beteckning] = {};
      }
      if (!acc[vote.beteckning][vote.punkt]) {
        acc[vote.beteckning][vote.punkt] = [];
      }
      acc[vote.beteckning][vote.punkt].push(vote);
      return acc;
    }, {} as GroupedVotes);
    
    console.log('Grouped result:', Object.keys(grouped).length, 'beteckningar');
    return grouped;
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
              onClick={() => {
                console.log('Clearing search filters');
                setSearchParams({ beteckning: "AU10" });
                setVotes([]);
                setTotalCount(0);
                setError(null);
              }}
            >
              Rensa filter
            </Button>
          </div>

          {/* Debug information in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
              <p>Debug: Aktiva sökparametrar</p>
              <pre>{JSON.stringify(searchParams, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-red-600 mb-2">{error}</p>
            <p className="text-sm text-gray-500">
              Förslag: Prova att söka på riksmöte "2024/25" eller en specifik beteckning som "AU1".
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
            <p className="text-gray-500 mb-2">
              Inga voteringar hittades. 
            </p>
            <p className="text-sm text-gray-400">
              Klicka på "Sök voteringar" för att visa senaste voteringar eller ange specifika sökkriterier.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VoteSearch;
