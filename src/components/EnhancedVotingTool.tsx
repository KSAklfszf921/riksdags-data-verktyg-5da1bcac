
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { 
  Vote, 
  RefreshCw, 
  Search, 
  Database, 
  Users, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Filter
} from "lucide-react";

interface VoteEntry {
  id: string;
  vote_id: string;
  beteckning: string | null;
  punkt: string | null;
  rm: string | null;
  avser: string | null;
  systemdatum: string | null;
  vote_results: any;
  vote_statistics: any;
  party_breakdown: any;
  constituency_breakdown: any;
  created_at: string;
  updated_at: string;
}

interface MemberVoteProfile {
  member_id: string;
  name: string;
  party: string;
  recent_votes: number;
  vote_participation: number;
  last_vote_date: string | null;
}

const EnhancedVotingTool: React.FC = () => {
  const [recentVotes, setRecentVotes] = useState<VoteEntry[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<MemberVoteProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParty, setSelectedParty] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('recent');

  // Load recent votes on component mount
  useEffect(() => {
    loadRecentVotes();
    loadMemberVoteProfiles();
  }, []);

  const loadRecentVotes = async () => {
    try {
      setLoading(true);
      console.log('Loading recent votes...');
      
      const { data, error } = await supabase
        .from('vote_data')
        .select('*')
        .order('systemdatum', { ascending: false })
        .limit(10);

      if (error) {
        throw error;
      }

      console.log('Recent votes loaded:', data?.length || 0);
      setRecentVotes(data || []);
      
    } catch (err) {
      console.error('Error loading recent votes:', err);
      setError(err instanceof Error ? err.message : 'Fel vid laddning av röstdata');
    } finally {
      setLoading(false);
    }
  };

  const loadMemberVoteProfiles = async () => {
    try {
      console.log('Loading member vote profiles...');
      
      // Get all members and their vote participation
      const { data: members, error: membersError } = await supabase
        .from('enhanced_member_profiles')
        .select('member_id, first_name, last_name, party')
        .eq('is_active', true);

      if (membersError) {
        throw membersError;
      }

      const profiles: MemberVoteProfile[] = [];
      
      for (const member of members || []) {
        // Count recent votes for this member (simplified - in real implementation would join vote results)
        const recentVotesCount = Math.floor(Math.random() * 50); // Placeholder
        const participation = Math.floor(Math.random() * 100); // Placeholder
        
        profiles.push({
          member_id: member.member_id,
          name: `${member.first_name} ${member.last_name}`,
          party: member.party,
          recent_votes: recentVotesCount,
          vote_participation: participation,
          last_vote_date: new Date().toISOString() // Placeholder
        });
      }

      setMemberProfiles(profiles.slice(0, 20)); // Show top 20
      console.log('Member vote profiles loaded:', profiles.length);
      
    } catch (err) {
      console.error('Error loading member vote profiles:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadRecentVotes(),
      loadMemberVoteProfiles()
    ]);
    setRefreshing(false);
  };

  const syncVoteData = async () => {
    try {
      setRefreshing(true);
      console.log('Starting vote data sync...');
      
      // This would call the comprehensive sync function
      const { data, error } = await supabase.functions.invoke('fetch-comprehensive-data', {
        body: { 
          types: ['votes'], 
          forceRefresh: true,
          limit: 100 
        }
      });

      if (error) {
        throw error;
      }

      console.log('Vote data sync completed:', data);
      await loadRecentVotes();
      
    } catch (err) {
      console.error('Error syncing vote data:', err);
      setError(err instanceof Error ? err.message : 'Fel vid synkronisering av röstdata');
    } finally {
      setRefreshing(false);
    }
  };

  const filteredMemberProfiles = memberProfiles.filter(profile => {
    const matchesSearch = profile.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesParty = !selectedParty || profile.party === selectedParty;
    return matchesSearch && matchesParty;
  });

  const parties = [...new Set(memberProfiles.map(p => p.party))].sort();

  const formatVoteResults = (voteResults: any) => {
    if (!voteResults) return 'Inga resultat';
    
    // Extract basic vote counts if available
    if (typeof voteResults === 'object' && voteResults.summary) {
      return `Ja: ${voteResults.summary.ja || 0}, Nej: ${voteResults.summary.nej || 0}`;
    }
    
    return 'Resultat tillgängliga';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Laddar voteringsdata...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Vote className="w-5 h-5" />
              <span>Förbättrat voteringsverktyg</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Uppdatera
              </Button>
              <Button onClick={syncVoteData} disabled={refreshing} size="sm">
                <Database className="w-4 h-4 mr-2" />
                Synkronisera data
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Automatisk visning av senaste voteringar och koppling till ledamotsprofiler
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert className="bg-red-50 border-red-200 mb-4">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{recentVotes.length}</div>
              <div className="text-sm text-gray-600">Senaste voteringar</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{memberProfiles.length}</div>
              <div className="text-sm text-gray-600">Aktiva ledamöter</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{parties.length}</div>
              <div className="text-sm text-gray-600">Representerade partier</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(memberProfiles.reduce((sum, p) => sum + p.vote_participation, 0) / memberProfiles.length) || 0}%
              </div>
              <div className="text-sm text-gray-600">Genomsnittlig närvaro</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recent" className="flex items-center space-x-2">
            <Vote className="w-4 h-4" />
            <span>Senaste voteringar</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Ledamöter & röster</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Analys</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>10 senaste voteringar</CardTitle>
              <CardDescription>
                Automatiskt uppdaterade voteringsresultat från Riksdagens API
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentVotes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Vote className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Inga voteringar hittades</p>
                  <Button onClick={syncVoteData} className="mt-4">
                    <Database className="w-4 h-4 mr-2" />
                    Synkronisera voteringsdata
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentVotes.map((vote) => (
                    <div key={vote.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {vote.beteckning || 'Okänd beteckning'}
                            {vote.punkt && ` - Punkt ${vote.punkt}`}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {vote.avser || 'Ingen beskrivning tillgänglig'}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Riksmöte: {vote.rm || 'Okänt'}</span>
                            {vote.systemdatum && (
                              <span>Datum: {new Date(vote.systemdatum).toLocaleDateString('sv-SE')}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <Badge variant="outline">
                            {formatVoteResults(vote.vote_results)}
                          </Badge>
                          <div className="text-xs text-gray-500 mt-1">
                            ID: {vote.vote_id}
                          </div>
                        </div>
                      </div>
                      
                      {vote.party_breakdown && (
                        <div className="text-sm">
                          <span className="text-gray-600">Partifördelning: </span>
                          <span className="text-gray-800">Tillgänglig</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Ledamöter och röstningsaktivitet</CardTitle>
              <CardDescription>
                Koppling mellan ledamotsprofiler och voteringsdata
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="search">Sök ledamot</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Namn..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="party">Filtrera på parti</Label>
                  <select
                    id="party"
                    value={selectedParty}
                    onChange={(e) => setSelectedParty(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Alla partier</option>
                    {parties.map(party => (
                      <option key={party} value={party}>{party}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Member Profiles */}
              <div className="space-y-3">
                {filteredMemberProfiles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Inga ledamöter hittades</p>
                  </div>
                ) : (
                  filteredMemberProfiles.map((profile) => (
                    <div key={profile.member_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <span className="font-medium">{profile.name}</span>
                          <Badge variant="outline">{profile.party}</Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span>Senaste röster: {profile.recent_votes}</span>
                          <span className="mx-2">•</span>
                          <span>Närvaro: {profile.vote_participation}%</span>
                          {profile.last_vote_date && (
                            <>
                              <span className="mx-2">•</span>
                              <span>Senast: {new Date(profile.last_vote_date).toLocaleDateString('sv-SE')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {profile.vote_participation >= 80 ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : profile.vote_participation >= 60 ? (
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Voteringsanalys</CardTitle>
              <CardDescription>
                Statistik och trender för voteringsdata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Analysverktyg kommer att implementeras här</p>
                <p className="text-sm mt-2">Inkluderar trender, partianalys och röstmönster</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedVotingTool;
