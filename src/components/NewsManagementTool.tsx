
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Newspaper, Download, Database, RefreshCw, Loader2, CheckCircle, AlertCircle, Search, Users } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useToast } from './ui/use-toast';

interface NewsStats {
  total: number;
  recent: number;
  lastUpdate: string | null;
}

interface BatchResult {
  name: string;
  stored: number;
  items: number;
  error?: string;
}

const NewsManagementTool = () => {
  const [loading, setLoading] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [stats, setStats] = useState<NewsStats>({ total: 0, recent: 0, lastUpdate: null });
  const [results, setResults] = useState<any[]>([]);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [testMode, setTestMode] = useState(false);
  const { toast } = useToast();

  // Fetch current news statistics
  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('member_news')
        .select('created_at');

      if (error) throw error;

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const recent = data?.filter(item => new Date(item.created_at) > oneDayAgo).length || 0;
      const lastUpdate = data && data.length > 0 
        ? data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
        : null;

      setStats({
        total: data?.length || 0,
        recent,
        lastUpdate
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Test search with a single member
  const testMemberSearch = async () => {
    if (!memberName.trim()) {
      toast({
        title: "Namn saknas",
        description: "Ange ett medlemsnamn för att testa sökningen",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setTestMode(true);
    
    try {
      console.log('Testing search for:', memberName);
      
      // First, find the member in the database
      const { data: members, error: memberError } = await supabase
        .from('member_data')
        .select('member_id, first_name, last_name, party')
        .or(`first_name.ilike.%${memberName}%,last_name.ilike.%${memberName}%`)
        .limit(5);

      if (memberError) throw memberError;

      if (!members || members.length === 0) {
        toast({
          title: "Medlem hittades inte",
          description: "Kunde inte hitta någon medlem med det namnet",
          variant: "destructive",
        });
        return;
      }

      const member = members[0];
      const fullName = `${member.first_name} ${member.last_name}`;

      console.log('Found member:', fullName, 'Party:', member.party);

      // Test the enhanced search function
      const { data, error } = await supabase.functions.invoke('fetch-member-news', {
        body: { 
          memberName: fullName, 
          memberId: member.member_id, 
          manualFetch: true 
        }
      });

      if (error) throw error;

      console.log('Test results:', data);

      setResults(data.newsItems || []);
      
      toast({
        title: "Test slutförd",
        description: `Hittade ${data.newsItems?.length || 0} artiklar för ${fullName}. ${data.stored || 0} nya sparades.`,
      });

      // Refresh stats
      await fetchStats();

    } catch (error) {
      console.error('Error in test:', error);
      toast({
        title: "Test misslyckades",
        description: error instanceof Error ? error.message : "Okänt fel uppstod",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setTestMode(false);
    }
  };

  // Enhanced batch fetch with better error handling and progress tracking
  const enhancedBatchFetch = async () => {
    setLoading(true);
    setBatchResults([]);
    
    try {
      // Get active members from different parties for testing
      const { data: members, error: memberError } = await supabase
        .from('member_data')
        .select('member_id, first_name, last_name, party')
        .eq('is_active', true)
        .order('party')
        .limit(15); // Increased limit for better coverage

      if (memberError) throw memberError;

      if (!members || members.length === 0) {
        toast({
          title: "Inga medlemmar",
          description: "Kunde inte hitta några aktiva medlemmar",
          variant: "destructive",
        });
        return;
      }

      console.log(`Starting enhanced batch fetch for ${members.length} members`);

      let totalStored = 0;
      let totalProcessed = 0;
      const results: BatchResult[] = [];

      for (const member of members) {
        try {
          const fullName = `${member.first_name} ${member.last_name}`;
          console.log(`Processing ${totalProcessed + 1}/${members.length}: ${fullName} (${member.party})`);
          
          const { data, error } = await supabase.functions.invoke('fetch-member-news', {
            body: { 
              memberName: fullName, 
              memberId: member.member_id, 
              manualFetch: true 
            }
          });

          const result: BatchResult = {
            name: `${fullName} (${member.party})`,
            stored: data?.stored || 0,
            items: data?.newsItems?.length || 0,
          };

          if (error) {
            result.error = error.message;
            console.error(`Error for ${fullName}:`, error);
          } else {
            totalStored += data?.stored || 0;
            console.log(`✓ ${fullName}: ${data?.stored || 0} stored, ${data?.newsItems?.length || 0} found`);
          }

          results.push(result);
          setBatchResults([...results]); // Update UI progressively
          totalProcessed++;

          // Longer delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`Error processing ${member.first_name} ${member.last_name}:`, error);
          results.push({
            name: `${member.first_name} ${member.last_name} (${member.party})`,
            stored: 0,
            items: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      setBatchResults(results);
      
      toast({
        title: "Batch-hämtning slutförd",
        description: `${totalStored} nya artiklar sparades från ${totalProcessed} medlemmar`,
      });

      // Refresh stats
      await fetchStats();

    } catch (error) {
      console.error('Error in enhanced batch fetch:', error);
      toast({
        title: "Fel vid batch-hämtning",
        description: error instanceof Error ? error.message : "Okänt fel uppstod",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load stats on component mount
  React.useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Newspaper className="w-5 h-5" />
            <span>Förbättrad Nyhetshantering</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-800">Totalt artiklar</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{stats.recent}</div>
              <div className="text-sm text-green-800">Senaste 24h</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-sm font-medium text-purple-600">
                {stats.lastUpdate ? 'Senast uppdaterad' : 'Ingen data'}
              </div>
              <div className="text-xs text-purple-800">
                {stats.lastUpdate 
                  ? new Date(stats.lastUpdate).toLocaleDateString('sv-SE')
                  : 'N/A'
                }
              </div>
            </div>
          </div>

          {/* Test Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Testa sökning för enskild medlem
            </h3>
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Ange medlemsnamn (t.ex. 'Andersson' eller 'Stefan')"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && testMemberSearch()}
                disabled={loading}
              />
              <Button
                onClick={testMemberSearch}
                disabled={loading || !memberName.trim()}
                className="flex items-center space-x-2"
              >
                {loading && testMode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Testa</span>
              </Button>
            </div>
          </div>

          {/* Batch Operations */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Batch-operationer
            </h3>
            <div className="flex space-x-2">
              <Button
                onClick={enhancedBatchFetch}
                disabled={loading}
                variant="outline"
                className="flex items-center space-x-2"
              >
                {loading && !testMode ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>Förbättrad batch-hämtning (15 medlemmar)</span>
              </Button>
              <Button
                onClick={fetchStats}
                disabled={loading}
                variant="ghost"
                className="flex items-center space-x-2"
              >
                <Database className="w-4 h-4" />
                <span>Uppdatera statistik</span>
              </Button>
            </div>
          </div>

          {/* Test Results */}
          {results.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">Testresultat (senaste sökning)</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{result.title}</span>
                    <div className="text-xs text-gray-500">
                      {new Date(result.pubDate).toLocaleDateString('sv-SE')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Batch Results */}
          {batchResults.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">Batch-resultat</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {batchResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <span className="text-sm font-medium">{result.name}</span>
                      {result.error && (
                        <div className="text-xs text-red-600 mt-1">{result.error}</div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant={result.stored > 0 ? "default" : "secondary"}>
                        {result.stored} sparade
                      </Badge>
                      <Badge variant="outline">
                        {result.items} hittade
                      </Badge>
                      {result.error ? (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsManagementTool;
