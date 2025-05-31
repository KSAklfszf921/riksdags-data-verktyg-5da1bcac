
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Newspaper, Download, Database, RefreshCw, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useToast } from './ui/use-toast';

interface NewsStats {
  total: number;
  recent: number;
  lastUpdate: string | null;
}

const NewsManagementTool = () => {
  const [loading, setLoading] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [stats, setStats] = useState<NewsStats>({ total: 0, recent: 0, lastUpdate: null });
  const [results, setResults] = useState<any[]>([]);
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

  // Manual fetch for specific member
  const fetchMemberNews = async () => {
    if (!memberName.trim()) {
      toast({
        title: "Namn saknas",
        description: "Ange ett medlemsnamn för att hämta nyheter",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // First, find the member in the database
      const { data: members, error: memberError } = await supabase
        .from('member_data')
        .select('member_id, first_name, last_name')
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

      // If multiple matches, use the first one
      const member = members[0];
      const fullName = `${member.first_name} ${member.last_name}`;

      // Fetch news using the edge function
      const { data, error } = await supabase.functions.invoke('fetch-member-news', {
        body: { 
          memberName: fullName, 
          memberId: member.member_id, 
          manualFetch: true 
        }
      });

      if (error) throw error;

      setResults(data.newsItems || []);
      
      if (data.stored && data.stored > 0) {
        toast({
          title: "Nyheter hämtade",
          description: `${data.stored} nya artiklar sparades för ${fullName}`,
        });
      } else {
        toast({
          title: "Hämtning slutförd",
          description: `Inga nya artiklar hittades för ${fullName}`,
        });
      }

      // Refresh stats
      await fetchStats();

    } catch (error) {
      console.error('Error fetching member news:', error);
      toast({
        title: "Fel vid hämtning",
        description: error instanceof Error ? error.message : "Okänt fel uppstod",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Batch fetch for all members
  const batchFetchNews = async () => {
    setLoading(true);
    try {
      // Get all active members
      const { data: members, error: memberError } = await supabase
        .from('member_data')
        .select('member_id, first_name, last_name')
        .eq('is_active', true)
        .limit(10); // Limit to prevent timeout

      if (memberError) throw memberError;

      if (!members || members.length === 0) {
        toast({
          title: "Inga medlemmar",
          description: "Kunde inte hitta några aktiva medlemmar",
          variant: "destructive",
        });
        return;
      }

      let totalStored = 0;
      const batchResults = [];

      for (const member of members) {
        try {
          const fullName = `${member.first_name} ${member.last_name}`;
          
          const { data, error } = await supabase.functions.invoke('fetch-member-news', {
            body: { 
              memberName: fullName, 
              memberId: member.member_id, 
              manualFetch: true 
            }
          });

          if (!error && data.stored) {
            totalStored += data.stored;
            batchResults.push({
              name: fullName,
              stored: data.stored,
              items: data.newsItems?.length || 0
            });
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`Error fetching news for ${member.first_name} ${member.last_name}:`, error);
        }
      }

      setResults(batchResults);
      
      toast({
        title: "Batch-hämtning slutförd",
        description: `${totalStored} nya artiklar sparades totalt`,
      });

      // Refresh stats
      await fetchStats();

    } catch (error) {
      console.error('Error in batch fetch:', error);
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
            <span>Nyhetshantering</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {/* Manual fetch tools */}
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Ange medlemsnamn (förnamn eller efternamn)"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchMemberNews()}
                disabled={loading}
              />
              <Button
                onClick={fetchMemberNews}
                disabled={loading || !memberName.trim()}
                className="flex items-center space-x-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Hämta för medlem</span>
              </Button>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={batchFetchNews}
                disabled={loading}
                variant="outline"
                className="flex items-center space-x-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>Batch-hämtning (10 medlemmar)</span>
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

          {/* Results */}
          {results.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Senaste resultat</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">
                      {result.name || `Resultat ${index + 1}`}
                    </span>
                    <div className="flex space-x-2">
                      {result.stored !== undefined && (
                        <Badge variant={result.stored > 0 ? "default" : "secondary"}>
                          {result.stored} sparade
                        </Badge>
                      )}
                      {result.items !== undefined && (
                        <Badge variant="outline">
                          {result.items} artiklar
                        </Badge>
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
