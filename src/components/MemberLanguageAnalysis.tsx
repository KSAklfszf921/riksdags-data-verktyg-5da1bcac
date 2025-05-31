import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  BarChart3, 
  Brain, 
  BookOpen, 
  MessageSquare, 
  Target,
  TrendingUp,
  FileText,
  Calendar,
  Award,
  Wifi,
  Database,
  AlertCircle
} from 'lucide-react';
import { LanguageAnalysisService, MemberLanguageSummary, LanguageAnalysisResult } from '../services/languageAnalysisService';

interface MemberLanguageAnalysisProps {
  memberId: string;
  memberName: string;
}

const MemberLanguageAnalysis = ({ memberId, memberName }: MemberLanguageAnalysisProps) => {
  const [summary, setSummary] = useState<MemberLanguageSummary | null>(null);
  const [detailedAnalyses, setDetailedAnalyses] = useState<LanguageAnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisMethod, setAnalysisMethod] = useState<'hybrid' | 'api-only'>('hybrid');
  const [analysisProgress, setAnalysisProgress] = useState<string>('');

  useEffect(() => {
    fetchLanguageData();
  }, [memberId]);

  const fetchLanguageData = async () => {
    setLoading(true);
    try {
      const [summaryData, analysesData] = await Promise.all([
        LanguageAnalysisService.getMemberLanguageSummary(memberId),
        LanguageAnalysisService.getAnalysisByMember(memberId)
      ]);
      
      setSummary(summaryData);
      setDetailedAnalyses(analysesData);
    } catch (error) {
      console.error('Error fetching language data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAnalysis = async () => {
    setAnalyzing(true);
    setAnalysisProgress('Förbereder analys...');
    
    try {
      if (analysisMethod === 'hybrid') {
        setAnalysisProgress('Försöker databas först, sedan Riksdagen API...');
        await LanguageAnalysisService.analyzeMemberLanguageEnhanced(memberId, memberName);
      } else {
        setAnalysisProgress('Hämtar text direkt från Riksdagen API...');
        await LanguageAnalysisService.analyzeMemberLanguageWithAPI(memberId, memberName);
      }
      
      setAnalysisProgress('Uppdaterar resultat...');
      await fetchLanguageData();
      setAnalysisProgress('Analys slutförd!');
    } catch (error) {
      console.error('Error starting analysis:', error);
      setAnalysisProgress(`Fel: ${error instanceof Error ? error.message : 'Okänt fel'}`);
    } finally {
      setAnalyzing(false);
      setTimeout(() => setAnalysisProgress(''), 3000);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'speech':
        return 'Anförande';
      case 'written_question':
        return 'Skriftlig fråga';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar språkanalys...</p>
        </CardContent>
      </Card>
    );
  }

  if (!summary && detailedAnalyses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Språkanalys</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Ingen språkanalys tillgänglig
          </h3>
          <p className="text-gray-600 mb-4">
            Ingen språkanalys har utförts för denna ledamot ännu.
          </p>
          
          {/* Analysis method selection */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-3">Välj analysmetod:</p>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="analysisMethod"
                  value="hybrid"
                  checked={analysisMethod === 'hybrid'}
                  onChange={(e) => setAnalysisMethod(e.target.value as 'hybrid')}
                  className="text-blue-600"
                />
                <Database className="w-4 h-4 text-gray-600" />
                <span className="text-sm">Hybrid (databas + API)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="analysisMethod"
                  value="api-only"
                  checked={analysisMethod === 'api-only'}
                  onChange={(e) => setAnalysisMethod(e.target.value as 'api-only')}
                  className="text-blue-600"
                />
                <Wifi className="w-4 h-4 text-green-600" />
                <span className="text-sm">Direkthämtning från Riksdagen API</span>
              </label>
            </div>
          </div>
          
          {analysisProgress && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 text-blue-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{analysisProgress}</span>
              </div>
            </div>
          )}
          
          <Button 
            onClick={startAnalysis} 
            disabled={analyzing}
            className="flex items-center space-x-2"
          >
            {analyzing ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Analyserar...</span>
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4" />
                <span>Starta språkanalys</span>
              </>
            )}
          </Button>
          
          <div className="mt-4 text-xs text-gray-500">
            <p>• Hybrid-metoden försöker hämta text från databasen först</p>
            <p>• API-metoden hämtar alltid ny text från Riksdagen</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5" />
                <span>Språkanalys - Översikt</span>
              </div>
              <div className="flex items-center space-x-2">
                {LanguageAnalysisService.getLanguageLevel(summary.overall_average).level && (
                  <Badge className={LanguageAnalysisService.getLanguageLevel(summary.overall_average).color}>
                    {LanguageAnalysisService.getLanguageLevel(summary.overall_average).level}
                  </Badge>
                )}
                <div className="text-2xl font-bold text-blue-600">
                  {summary.overall_average}/100
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{summary.speech_count}</div>
                <div className="text-sm text-gray-600">Anföranden</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{summary.question_count}</div>
                <div className="text-sm text-gray-600">Skriftliga frågor</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.total_words.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Totalt ord</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formatDate(summary.last_analysis)}</div>
                <div className="text-sm text-gray-600">Senaste analys</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Språkkomplexitet</span>
                </div>
                <span className="text-sm font-bold">{summary.complexity_average}/100</span>
              </div>
              <Progress value={summary.complexity_average} className="h-2" />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Ordförrådsrikedom</span>
                </div>
                <span className="text-sm font-bold">{summary.vocabulary_average}/100</span>
              </div>
              <Progress value={summary.vocabulary_average} className="h-2" />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Retoriska element</span>
                </div>
                <span className="text-sm font-bold">{summary.rhetorical_average}/100</span>
              </div>
              <Progress value={summary.rhetorical_average} className="h-2" />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium">Strukturell tydlighet</span>
                </div>
                <span className="text-sm font-bold">{summary.clarity_average}/100</span>
              </div>
              <Progress value={summary.clarity_average} className="h-2" />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Språknivå:</strong> {LanguageAnalysisService.getLanguageLevel(summary.overall_average).description}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {detailedAnalyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Detaljerad analys per dokument</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="speeches" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="speeches">
                  Anföranden ({detailedAnalyses.filter(a => a.document_type === 'speech').length})
                </TabsTrigger>
                <TabsTrigger value="questions">
                  Skriftliga frågor ({detailedAnalyses.filter(a => a.document_type === 'written_question').length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="speeches" className="space-y-4">
                {detailedAnalyses
                  .filter(a => a.document_type === 'speech')
                  .slice(0, 10)
                  .map((analysis, index) => (
                    <div key={analysis.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {analysis.document_title}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(analysis.analysis_date)}</span>
                            </span>
                            <span>{analysis.word_count} ord</span>
                            <span>{analysis.sentence_count} meningar</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={LanguageAnalysisService.getLanguageLevel(analysis.overall_score).color}>
                            {analysis.overall_score}/100
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Komplexitet:</span>
                          <div className="font-medium">{analysis.language_complexity_score}/100</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Ordförråd:</span>
                          <div className="font-medium">{analysis.vocabulary_richness_score}/100</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Retorik:</span>
                          <div className="font-medium">{analysis.rhetorical_elements_score}/100</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Tydlighet:</span>
                          <div className="font-medium">{analysis.structural_clarity_score}/100</div>
                        </div>
                      </div>
                    </div>
                  ))}
              </TabsContent>
              
              <TabsContent value="questions" className="space-y-4">
                {detailedAnalyses
                  .filter(a => a.document_type === 'written_question')
                  .slice(0, 10)
                  .map((analysis, index) => (
                    <div key={analysis.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {analysis.document_title}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(analysis.analysis_date)}</span>
                            </span>
                            <span>{analysis.word_count} ord</span>
                            <span>{analysis.sentence_count} meningar</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={LanguageAnalysisService.getLanguageLevel(analysis.overall_score).color}>
                            {analysis.overall_score}/100
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Komplexitet:</span>
                          <div className="font-medium">{analysis.language_complexity_score}/100</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Ordförråd:</span>
                          <div className="font-medium">{analysis.vocabulary_richness_score}/100</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Retorik:</span>
                          <div className="font-medium">{analysis.rhetorical_elements_score}/100</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Tydlighet:</span>
                          <div className="font-medium">{analysis.structural_clarity_score}/100</div>
                        </div>
                      </div>
                    </div>
                  ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MemberLanguageAnalysis;
