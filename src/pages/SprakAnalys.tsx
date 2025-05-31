
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Users, 
  BarChart3, 
  FileText, 
  Trophy, 
  BookOpen, 
  MessageSquare, 
  Target,
  TrendingUp,
  Database,
  Activity,
  RefreshCw
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import LanguageAnalysisIntegration from "@/components/LanguageAnalysisIntegration";
import LanguageAnalysisBatchRunner from "@/components/LanguageAnalysisBatchRunner";
import { LanguageAnalysisService } from "@/services/languageAnalysisService";
import { useQuery } from "@tanstack/react-query";

const SprakAnalys = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [statistics, setStatistics] = useState<{
    totalAnalyses: number;
    totalMembers: number;
    averageScore: number;
    lastWeekAnalyses: number;
  } | null>(null);

  // Hämta toppresultat för översikt
  const { data: topPerformers, isLoading: topLoading, refetch: refetchTop } = useQuery({
    queryKey: ['top-language-performers'],
    queryFn: () => LanguageAnalysisService.getTopPerformers('overall_score', 15),
    staleTime: 2 * 60 * 1000, // 2 minuter
  });

  // Hämta statistik
  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const stats = await LanguageAnalysisService.getAnalysisStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Fel vid hämtning av statistik:', error);
    }
  };

  const refreshData = async () => {
    await Promise.all([
      loadStatistics(),
      refetchTop()
    ]);
  };

  const getCategoryTopPerformers = (category: string) => {
    if (!topPerformers) return [];
    
    const sorted = [...topPerformers].sort((a, b) => {
      switch (category) {
        case 'complexity':
          return b.language_complexity_score - a.language_complexity_score;
        case 'vocabulary':
          return b.vocabulary_richness_score - a.vocabulary_richness_score;
        case 'rhetorical':
          return b.rhetorical_elements_score - a.rhetorical_elements_score;
        case 'clarity':
          return b.structural_clarity_score - a.structural_clarity_score;
        default:
          return b.overall_score - a.overall_score;
      }
    });
    
    return sorted.slice(0, 5);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Språkanalys"
          description="Avancerad AI-driven analys av riksdagsledamöters språkbruk i anföranden och skriftliga frågor"
          icon={<Brain className="w-6 h-6 text-white" />}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-fit grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Översikt</span>
              </TabsTrigger>
              <TabsTrigger value="batch" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Batch-analys</span>
              </TabsTrigger>
              <TabsTrigger value="individual" className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Individuell analys</span>
              </TabsTrigger>
              <TabsTrigger value="results" className="flex items-center space-x-2">
                <Trophy className="w-4 h-4" />
                <span>Resultat</span>
              </TabsTrigger>
            </TabsList>

            <Button
              onClick={refreshData}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Uppdatera data</span>
            </Button>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {statistics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Database className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{statistics.totalAnalyses}</p>
                        <p className="text-sm text-gray-600">Totala analyser</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Users className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{statistics.totalMembers}</p>
                        <p className="text-sm text-gray-600">Analyserade ledamöter</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-8 h-8 text-purple-600" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{statistics.averageScore}/100</p>
                        <p className="text-sm text-gray-600">Genomsnittlig poäng</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-8 h-8 text-orange-600" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{statistics.lastWeekAnalyses}</p>
                        <p className="text-sm text-gray-600">Senaste veckan</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Om språkanalysen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Vår avancerade AI-drivna språkanalys utvärderar riksdagsledamöters kommunikativa färdigheter genom 
                  att analysera deras anföranden och skriftliga frågor. Systemet använder moderna språkteknologier för 
                  att bedöma fyra huvudområden med hög precision:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Brain className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Språkkomplexitet</h4>
                        <p className="text-sm text-gray-600">
                          Analyserar meningslängd, ordlängd, komplexa ord, passiva konstruktioner och syntaktisk variation.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Ordförrådsrikedom</h4>
                        <p className="text-sm text-gray-600">
                          Mäter variationen i ordval, användningen av unika ord och lexikal mångfald i relation till textlängd.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Retoriska element</h4>
                        <p className="text-sm text-gray-600">
                          Utvärderar användning av frågor, utropstecken, formella språkmarkörer och tekniska termer.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Strukturell tydlighet</h4>
                        <p className="text-sm text-gray-600">
                          Bedömer textorganisation, styckeindelning, meningsbalans och övergripande läsbarhet.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {topPerformers && topPerformers.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Trophy className="w-5 h-5" />
                      <span>Bästa totalresultat</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getCategoryTopPerformers('overall').map((result, index) => (
                        <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                              index === 0 ? 'bg-yellow-500' :
                              index === 1 ? 'bg-gray-400' :
                              index === 2 ? 'bg-amber-600' :
                              'bg-blue-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{result.member_name}</p>
                              <p className="text-xs text-gray-600">
                                {result.document_type === 'speech' ? 'Anförande' : 'Skriftlig fråga'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">{result.overall_score}/100</div>
                            <div className="text-xs text-gray-500">
                              {LanguageAnalysisService.getLanguageLevel(result.overall_score).level}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="w-5 h-5" />
                      <span>Bästa ordförråd</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getCategoryTopPerformers('vocabulary').map((result, index) => (
                        <div key={result.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                              index === 0 ? 'bg-green-600' :
                              index === 1 ? 'bg-green-500' :
                              index === 2 ? 'bg-green-400' :
                              'bg-green-300'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{result.member_name}</p>
                              <p className="text-xs text-gray-600">
                                {result.document_type === 'speech' ? 'Anförande' : 'Skriftlig fråga'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">{result.vocabulary_richness_score}/100</div>
                            <div className="text-xs text-gray-500">Ordförråd</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="batch">
            <LanguageAnalysisBatchRunner />
          </TabsContent>

          <TabsContent value="individual">
            <LanguageAnalysisIntegration />
          </TabsContent>

          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>Analysresultat och statistik</CardTitle>
              </CardHeader>
              <CardContent>
                {topPerformers && topPerformers.length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center space-x-2">
                            <Brain className="w-4 h-4" />
                            <span>Komplexitet</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            {getCategoryTopPerformers('complexity').slice(0, 3).map((result, index) => (
                              <div key={result.id} className="flex items-center justify-between text-sm">
                                <span className="truncate">{result.member_name.split(' ')[0]}</span>
                                <span className="font-bold text-blue-600">{result.language_complexity_score}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center space-x-2">
                            <BookOpen className="w-4 h-4" />
                            <span>Ordförråd</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            {getCategoryTopPerformers('vocabulary').slice(0, 3).map((result, index) => (
                              <div key={result.id} className="flex items-center justify-between text-sm">
                                <span className="truncate">{result.member_name.split(' ')[0]}</span>
                                <span className="font-bold text-green-600">{result.vocabulary_richness_score}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center space-x-2">
                            <MessageSquare className="w-4 h-4" />
                            <span>Retorik</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            {getCategoryTopPerformers('rhetorical').slice(0, 3).map((result, index) => (
                              <div key={result.id} className="flex items-center justify-between text-sm">
                                <span className="truncate">{result.member_name.split(' ')[0]}</span>
                                <span className="font-bold text-purple-600">{result.rhetorical_elements_score}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center space-x-2">
                            <Target className="w-4 h-4" />
                            <span>Tydlighet</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            {getCategoryTopPerformers('clarity').slice(0, 3).map((result, index) => (
                              <div key={result.id} className="flex items-center justify-between text-sm">
                                <span className="truncate">{result.member_name.split(' ')[0]}</span>
                                <span className="font-bold text-orange-600">{result.structural_clarity_score}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Alla toppresultat</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4">
                          {topPerformers.map((result, index) => (
                            <div key={result.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{result.member_name}</h4>
                                <Badge className={LanguageAnalysisService.getLanguageLevel(result.overall_score).color}>
                                  {result.overall_score}/100
                                </Badge>
                              </div>
                              <div className="grid grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Komplexitet:</span>
                                  <div className="font-medium">{result.language_complexity_score}/100</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Ordförråd:</span>
                                  <div className="font-medium">{result.vocabulary_richness_score}/100</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Retorik:</span>
                                  <div className="font-medium">{result.rhetorical_elements_score}/100</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Tydlighet:</span>
                                  <div className="font-medium">{result.structural_clarity_score}/100</div>
                                </div>
                              </div>
                              <div className="mt-2 text-xs text-gray-500">
                                {result.document_type === 'speech' ? 'Anförande' : 'Skriftlig fråga'} • 
                                {result.word_count} ord • 
                                {new Date(result.analysis_date).toLocaleDateString('sv-SE')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Inga analysresultat tillgängliga ännu.</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Använd batch-analysen för att analysera alla aktiva ledamöter.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SprakAnalys;
