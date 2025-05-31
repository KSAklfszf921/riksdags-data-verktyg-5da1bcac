
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Users, 
  BarChart3, 
  FileText, 
  Trophy, 
  BookOpen, 
  MessageSquare, 
  Target 
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import LanguageAnalysisIntegration from "@/components/LanguageAnalysisIntegration";
import LanguageAnalysisBatchRunner from "@/components/LanguageAnalysisBatchRunner";
import { LanguageAnalysisService } from "@/services/languageAnalysisService";
import { useQuery } from "@tanstack/react-query";

const SprakAnalys = () => {
  const [activeTab, setActiveTab] = useState("overview");

  // Hämta toppresultat för översikt
  const { data: topPerformers, isLoading: topLoading } = useQuery({
    queryKey: ['top-language-performers'],
    queryFn: () => LanguageAnalysisService.getTopPerformers('overall_score', 10),
    staleTime: 5 * 60 * 1000, // 5 minuter
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Språkanalys"
          description="Avancerad analys av riksdagsledamöters språkbruk i anföranden och skriftliga frågor"
          icon={<Brain className="w-6 h-6 text-white" />}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
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

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">AI-driven</p>
                      <p className="text-sm text-gray-600">Språkanalys</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">4</p>
                      <p className="text-sm text-gray-600">Analysområden</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Users className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">349</p>
                      <p className="text-sm text-gray-600">Ledamöter</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-8 h-8 text-orange-600" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">1-100</p>
                      <p className="text-sm text-gray-600">Poängskala</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Om språkanalysen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Vår avancerade språkanalys utvärderar riksdagsledamöters kommunikativa färdigheter genom att analysera 
                  deras anföranden och skriftliga frågor. Systemet bedömer fyra huvudområden:
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
                          Bedömer meningslängd, ordlängd, användning av komplexa ord och passiva konstruktioner.
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
                          Mäter variationen i ordval och användningen av unika ord i relation till total textmängd.
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
                          Analyserar användning av frågor, utropstecken och formella språkmarkörer.
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
                          Utvärderar textorganisation, styckeindelning och balans i meningsbyggnad.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {topPerformers && topPerformers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5" />
                    <span>Toppresultat (Senaste analyser)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topPerformers.slice(0, 5).map((result, index) => (
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
                            <p className="text-sm text-gray-600">
                              {result.document_type === 'speech' ? 'Anförande' : 'Skriftlig fråga'} • 
                              {new Date(result.analysis_date).toLocaleDateString('sv-SE')}
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
                <p className="text-gray-600 mb-4">
                  Här visas detaljerade resultat och statistik från genomförda språkanalyser.
                  Denna sektion kommer att utökas med interaktiva grafer och jämförelser.
                </p>
                
                {topPerformers && topPerformers.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Alla toppresultat</h3>
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
