
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Newspaper, Download, Database, RefreshCw, Loader2, CheckCircle, AlertCircle, Search, Users, Play, Pause, Square, Clock, TrendingUp, BarChart3, Zap, Shield } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useToast } from './ui/use-toast';
import { continuousBatchProcessor, type BatchProgress } from '../services/continuousBatchProcessor';
import { enhancedRssFetcher } from '../services/enhancedRssFetcher';
import { databaseManager } from '../services/databaseManager';

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
  const [testMode, setTestMode] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const [maxMembers, setMaxMembers] = useState(50);
  const { toast } = useToast();
  const progressRef = useRef<BatchProgress | null>(null);

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

  // Test search with a single member using enhanced fetcher
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
      console.log('Testing enhanced search for:', memberName);
      
      // First, find the member in the database
      const { data: members, error: memberError } = await supabase
        .from('enhanced_member_profiles')
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

      // Use the enhanced RSS fetcher
      const result = await enhancedRssFetcher.fetchNewsForMember(fullName);

      if (result.success && result.items.length > 0) {
        setResults(result.items || []);
        
        // Store new items using database manager
        const dbStats = await databaseManager.storeNewsItems(member.member_id, fullName, result.items);
        
        toast({
          title: "Test slutförd",
          description: `Hittade ${result.items.length} artiklar för ${fullName}. ${dbStats.successfulInserts} nya sparades. Strategi: ${result.strategy}, Proxy: ${result.proxy}`,
        });
      } else {
        toast({
          title: "Inga artiklar hittades",
          description: result.error || "Kunde inte hitta några relevanta nyhetsartiklar",
          variant: "destructive",
        });
      }

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

  // Start continuous batch processing
  const startContinuousBatch = async () => {
    if (continuousBatchProcessor.getStatus().isRunning) {
      toast({
        title: "Batch-bearbetning pågår redan",
        description: "Vänta tills den nuvarande bearbetningen är klar",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setBatchProgress(null);
    
    try {
      await continuousBatchProcessor.startBatchProcessing({
        maxMembers,
        delayBetweenMembers: 3000,
        onProgress: (progress) => {
          setBatchProgress(progress);
          progressRef.current = progress;
          
          // Update stats periodically during processing
          if (progress.processed % 5 === 0) {
            fetchStats();
          }
        }
      });
      
      toast({
        title: "Kontinuerlig batch-bearbetning slutförd",
        description: `${progressRef.current?.successful || 0} medlemmar bearbetade framgångsrikt`,
      });
      
      await fetchStats();
      
    } catch (error) {
      console.error('Error in continuous batch:', error);
      toast({
        title: "Fel vid batch-bearbetning",
        description: error instanceof Error ? error.message : "Okänt fel uppstod",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Control batch processing
  const pauseBatch = () => {
    continuousBatchProcessor.pauseProcessing();
    toast({
      title: "Batch-bearbetning pausad",
      description: "Du kan återuppta bearbetningen när som helst",
    });
  };

  const resumeBatch = () => {
    continuousBatchProcessor.resumeProcessing();
    toast({
      title: "Batch-bearbetning återupptagen",
      description: "Bearbetningen fortsätter från där den pausades",
    });
  };

  const stopBatch = () => {
    continuousBatchProcessor.stopProcessing();
    setBatchProgress(null);
    setLoading(false);
    toast({
      title: "Batch-bearbetning stoppad",
      description: "Bearbetningen har avbrutits",
    });
  };

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Load stats on component mount
  useEffect(() => {
    fetchStats();
  }, []);

  const batchStatus = continuousBatchProcessor.getStatus();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Newspaper className="w-5 h-5" />
            <span>Förbättrad kontinuerlig nyhetshantering</span>
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
              Testa förbättrad sökning för enskild medlem
            </h3>
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Ange medlemsnamn (t.ex. 'Andersson' eller 'Stefan')"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && testMemberSearch()}
                disabled={loading || batchStatus.isRunning}
              />
              <Button
                onClick={testMemberSearch}
                disabled={loading || !memberName.trim() || batchStatus.isRunning}
                className="flex items-center space-x-2"
              >
                {loading && testMode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Testa</span>
              </Button>
            </div>
          </div>

          {/* Continuous Batch Operations */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Kontinuerlig batch-bearbetning
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <label htmlFor="maxMembers" className="text-sm font-medium">Max antal medlemmar:</label>
                <Input
                  id="maxMembers"
                  type="number"
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(parseInt(e.target.value) || 50)}
                  min="10"
                  max="200"
                  disabled={batchStatus.isRunning}
                  className="w-20"
                />
              </div>
              
              <div className="flex space-x-2">
                {!batchStatus.isRunning ? (
                  <Button
                    onClick={startContinuousBatch}
                    disabled={loading}
                    className="flex items-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Starta kontinuerlig bearbetning</span>
                  </Button>
                ) : (
                  <>
                    {!batchStatus.isPaused ? (
                      <Button
                        onClick={pauseBatch}
                        variant="outline"
                        className="flex items-center space-x-2"
                      >
                        <Pause className="w-4 h-4" />
                        <span>Pausa</span>
                      </Button>
                    ) : (
                      <Button
                        onClick={resumeBatch}
                        className="flex items-center space-x-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Återuppta</span>
                      </Button>
                    )}
                    <Button
                      onClick={stopBatch}
                      variant="destructive"
                      className="flex items-center space-x-2"
                    >
                      <Square className="w-4 h-4" />
                      <span>Stoppa</span>
                    </Button>
                  </>
                )}
                
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
          </div>

          {/* Enhanced Batch Progress */}
          {batchProgress && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Förbättrad batch-progress
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Bearbetar: {batchProgress.currentMemberName}
                  </span>
                  <Badge variant={
                    batchProgress.status === 'running' ? 'default' :
                    batchProgress.status === 'paused' ? 'secondary' :
                    batchProgress.status === 'completed' ? 'default' : 'destructive'
                  }>
                    {batchProgress.status === 'running' ? 'Pågår' :
                     batchProgress.status === 'paused' ? 'Pausad' :
                     batchProgress.status === 'completed' ? 'Slutförd' : 'Fel'}
                  </Badge>
                </div>
                
                <Progress 
                  value={(batchProgress.processed / batchProgress.totalMembers) * 100} 
                  className="w-full"
                />
                
                {/* Enhanced Statistics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">{batchProgress.processed}</div>
                    <div className="text-gray-600">Bearbetade</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-600">{batchProgress.successful}</div>
                    <div className="text-gray-600">Lyckade</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-orange-600">{batchProgress.newArticles}</div>
                    <div className="text-gray-600">Nya artiklar</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-purple-600">{batchProgress.detailedStats.totalFetched}</div>
                    <div className="text-gray-600">Totalt hämtade</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-red-600">{batchProgress.failed}</div>
                    <div className="text-gray-600">Misslyckade</div>
                  </div>
                </div>

                {/* Additional detailed statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="text-sm font-semibold mb-2 flex items-center">
                      <BarChart3 className="w-4 h-4 mr-1" />
                      Databasstatistik
                    </h4>
                    <div className="text-xs space-y-1">
                      <div>Dubbletter: {batchProgress.detailedStats.duplicatesSkipped}</div>
                      <div>Databasfel: {batchProgress.detailedStats.databaseErrors}</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="text-sm font-semibold mb-2 flex items-center">
                      <Zap className="w-4 h-4 mr-1" />
                      Mest använda strategier
                    </h4>
                    <div className="text-xs space-y-1">
                      {Object.entries(batchProgress.detailedStats.strategiesUsed)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 3)
                        .map(([strategy, count]) => (
                          <div key={strategy}>{strategy.split('(')[0]}: {count}</div>
                        ))}
                    </div>
                  </div>
                </div>
                
                {batchProgress.estimatedTimeRemaining && batchProgress.estimatedTimeRemaining > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Beräknad tid kvar: {formatTimeRemaining(batchProgress.estimatedTimeRemaining)}</span>
                  </div>
                )}
                
                {batchProgress.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2 text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Senaste fel:
                    </h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {batchProgress.errors.slice(-5).map((error, index) => (
                        <div key={index} className="text-xs bg-red-50 p-2 rounded">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {error.type}
                            </Badge>
                            <span className="font-medium">{error.memberName}:</span>
                          </div>
                          <div className="mt-1">{error.error}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsManagementTool;
