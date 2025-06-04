
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  Brain, 
  BookOpen, 
  Target,
  FileText,
  Calendar,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { LanguageAnalysisService, MemberLanguageSummary, LanguageAnalysisResult, DataValidationResult } from '../services/languageAnalysisService';

interface SimpleMemberLanguageAnalysisProps {
  memberId: string;
  memberName: string;
}

const SimpleMemberLanguageAnalysis = ({ memberId, memberName }: SimpleMemberLanguageAnalysisProps) => {
  const [summary, setSummary] = useState<MemberLanguageSummary | null>(null);
  const [analyses, setAnalyses] = useState<LanguageAnalysisResult[]>([]);
  const [validation, setValidation] = useState<DataValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [memberId]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log(`Loading data for ${memberName} (${memberId})`);
      
      const [summaryData, analysesData, validationData] = await Promise.all([
        LanguageAnalysisService.getMemberLanguageSummary(memberId),
        LanguageAnalysisService.getAnalysisByMember(memberId),
        LanguageAnalysisService.validateDataAvailability(memberId, memberName)
      ]);
      
      setSummary(summaryData);
      setAnalyses(analysesData);
      setValidation(validationData);
      
      console.log('Data loaded:', { summaryData, analysesData: analysesData.length, validationData });
    } catch (error) {
      console.error('Error loading data:', error);
      setAnalysisStatus(`Fel vid laddning: ${error instanceof Error ? error.message : 'Okänt fel'}`);
    } finally {
      setLoading(false);
    }
  };

  const startAnalysis = async () => {
    setAnalyzing(true);
    setAnalysisStatus('Startar språkanalys...');
    
    try {
      console.log(`Starting analysis for ${memberName}`);
      const result = await LanguageAnalysisService.analyzeMemberLanguage(memberId, memberName);
      
      if (result > 0) {
        setAnalysisStatus(`Analys slutförd! ${result} dokument analyserade.`);
        await loadData(); // Reload to show new results
      } else {
        setAnalysisStatus('Ingen analys genomförd - inga lämpliga dokument hittades.');
      }
    } catch (error) {
      console.error('Error in analysis:', error);
      setAnalysisStatus(`Fel vid analys: ${error instanceof Error ? error.message : 'Okänt fel'}`);
    } finally {
      setAnalyzing(false);
      setTimeout(() => setAnalysisStatus(''), 5000);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Laddar språkanalysdata...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data Validation Card */}
      {validation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Tillgänglig Data</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{validation.speeches_available}</div>
                <div className="text-sm text-gray-600">Anföranden totalt</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{validation.speeches_with_text}</div>
                <div className="text-sm text-gray-600">Analyserbara anföranden</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{validation.documents_available}</div>
                <div className="text-sm text-gray-600">Dokument totalt</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{validation.total_analyzable}</div>
                <div className="text-sm text-gray-600">Totalt analyserbara</div>
              </div>
            </div>
            
            {validation.total_analyzable > 0 ? (
              <div className="flex items-center space-x-2 text-green-700 bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-5 h-5" />
                <span>Data tillgänglig för språkanalys</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-red-700 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span>Ingen data tillgänglig för analys</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analysis Control Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Språkanalys</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analysisStatus && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-blue-700 text-sm">{analysisStatus}</p>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {summary ? `${summary.total_analyses} analyser genomförda` : 'Ingen analys genomförd ännu'}
              </p>
              {analyses.length > 0 && (
                <p className="text-xs text-gray-500">
                  Senaste: {new Date(analyses[0].analysis_date).toLocaleDateString('sv-SE')}
                </p>
              )}
            </div>
            
            <Button
              onClick={startAnalysis}
              disabled={analyzing || !validation?.total_analyzable}
              className="flex items-center space-x-2"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyserar...</span>
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" />
                  <span>Starta analys</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Språkanalys - Översikt</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={LanguageAnalysisService.getLanguageLevel(summary.overall_average).color}>
                  {LanguageAnalysisService.getLanguageLevel(summary.overall_average).level}
                </Badge>
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
                <div className="text-2xl font-bold text-orange-600">{summary.document_count}</div>
                <div className="text-sm text-gray-600">Dokument</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.total_words.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Totalt ord</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.total_analyses}</div>
                <div className="text-sm text-gray-600">Analyser</div>
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
                  <Brain className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Retoriska element</span>
                </div>
                <span className="text-sm font-bold">{summary.rhetorical_average}/100</span>
              </div>
              <Progress value={summary.rhetorical_average} className="h-2" />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium">Strukturell tydlighet</span>
                </div>
                <span className="text-sm font-bold">{summary.clarity_average}/100</span>
              </div>
              <Progress value={summary.clarity_average} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Analyses */}
      {analyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Senaste analyser</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyses.slice(0, 5).map((analysis) => (
                <div key={analysis.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {analysis.document_title}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(analysis.analysis_date).toLocaleDateString('sv-SE')}</span>
                        </span>
                        <span>{analysis.word_count} ord</span>
                        <span className="capitalize">{analysis.document_type === 'speech' ? 'Anförande' : 'Dokument'}</span>
                      </div>
                    </div>
                    <Badge className={LanguageAnalysisService.getLanguageLevel(analysis.overall_score).color}>
                      {analysis.overall_score}/100
                    </Badge>
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SimpleMemberLanguageAnalysis;
