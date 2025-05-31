
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  Brain,
  Users,
  BarChart3,
  Clock,
  Activity,
  TrendingUp,
  Database,
  Zap
} from 'lucide-react';
import { LanguageAnalysisService, BatchProgress } from '../services/languageAnalysisService';

const LanguageAnalysisBatchRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<BatchProgress>({
    currentMember: '',
    completedCount: 0,
    totalCount: 0,
    successCount: 0,
    errorCount: 0,
    estimatedTimeLeft: '',
    errors: []
  });
  const [batchResult, setBatchResult] = useState<{
    success: number;
    errors: number;
    details: string[];
  } | null>(null);
  const [statistics, setStatistics] = useState<{
    totalAnalyses: number;
    totalMembers: number;
    averageScore: number;
    lastWeekAnalyses: number;
  } | null>(null);

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

  const startBatchAnalysis = async () => {
    setIsRunning(true);
    setBatchResult(null);
    setProgress({
      currentMember: 'Förbereder analys...',
      completedCount: 0,
      totalCount: 0,
      successCount: 0,
      errorCount: 0,
      estimatedTimeLeft: '',
      errors: []
    });

    try {
      const result = await LanguageAnalysisService.batchAnalyzeMembers(
        (progressUpdate) => {
          setProgress(progressUpdate);
        },
        100 // Analysera upp till 100 ledamöter
      );

      setBatchResult(result);
      await loadStatistics(); // Uppdatera statistik efter analys
      
    } catch (error: any) {
      console.error('Fel vid batch-analys:', error);
      setBatchResult({
        success: progress.successCount,
        errors: progress.errorCount + 1,
        details: [...progress.errors, `Kritiskt fel: ${error.message}`]
      });
    } finally {
      setIsRunning(false);
    }
  };

  const stopBatchAnalysis = () => {
    setIsRunning(false);
    setProgress(prev => ({
      ...prev,
      currentMember: 'Analys stoppad av användare'
    }));
  };

  const resetBatchAnalysis = () => {
    setProgress({
      currentMember: '',
      completedCount: 0,
      totalCount: 0,
      successCount: 0,
      errorCount: 0,
      estimatedTimeLeft: '',
      errors: []
    });
    setBatchResult(null);
  };

  const getProgressPercentage = () => {
    if (progress.totalCount === 0) return 0;
    return (progress.completedCount / progress.totalCount) * 100;
  };

  const getSuccessRate = () => {
    if (progress.completedCount === 0) return 100;
    return Math.round((progress.successCount / progress.completedCount) * 100);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Batch-språkanalys för aktiva ledamöter</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{statistics.totalAnalyses}</div>
                <div className="text-sm text-blue-800">Totala analyser</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{statistics.totalMembers}</div>
                <div className="text-sm text-green-800">Analyserade ledamöter</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{statistics.averageScore}/100</div>
                <div className="text-sm text-purple-800">Genomsnittlig poäng</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{statistics.lastWeekAnalyses}</div>
                <div className="text-sm text-orange-800">Senaste veckan</div>
              </div>
            </div>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Denna process analyserar språket i anföranden och skriftliga frågor för alla aktiva riksdagsledamöter. 
              Analysen kan ta 15-30 minuter beroende på mängden data och hoppar över ledamöter med recenta analyser.
            </AlertDescription>
          </Alert>

          <div className="flex items-center space-x-4">
            <Button
              onClick={startBatchAnalysis}
              disabled={isRunning}
              className="flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Starta batch-analys</span>
            </Button>

            {isRunning && (
              <Button
                onClick={stopBatchAnalysis}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Pause className="w-4 h-4" />
                <span>Stoppa</span>
              </Button>
            )}

            <Button
              onClick={resetBatchAnalysis}
              variant="ghost"
              disabled={isRunning}
              className="flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Återställ</span>
            </Button>

            <Button
              onClick={loadStatistics}
              variant="outline"
              disabled={isRunning}
              className="flex items-center space-x-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Uppdatera statistik</span>
            </Button>
          </div>

          {(progress.totalCount > 0 || isRunning) && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Framsteg</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {progress.completedCount}/{progress.totalCount}
                    </span>
                    <span className="text-sm font-medium">
                      {Math.round(getProgressPercentage())}%
                    </span>
                  </div>
                </div>
                <Progress value={getProgressPercentage()} className="h-3" />
              </div>

              {progress.currentMember && (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">{progress.currentMember}</span>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Lyckade: {progress.successCount}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Fel: {progress.errorCount}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Framgång: {getSuccessRate()}%</span>
                </div>
                {progress.estimatedTimeLeft && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">Kvar: {progress.estimatedTimeLeft}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {batchResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Analysresultat</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{batchResult.success}</div>
                <div className="text-sm text-green-800">Lyckade analyser</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{batchResult.errors}</div>
                <div className="text-sm text-red-800">Fel uppstod</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((batchResult.success / (batchResult.success + batchResult.errors)) * 100)}%
                </div>
                <div className="text-sm text-blue-800">Framgångsgrad</div>
              </div>
            </div>

            {batchResult.details.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Feldetaljer:</h4>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {batchResult.details.slice(-20).map((error, index) => (
                    <Alert key={index} className="border-red-200 py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-700 text-sm">
                        {error}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {progress.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span>Aktuella fel ({progress.errors.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {progress.errors.map((error, index) => (
                <Alert key={index} className="border-red-200 py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-700 text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Information om analysen</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="what" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="what">Vad analyseras</TabsTrigger>
              <TabsTrigger value="how">Hur det fungerar</TabsTrigger>
              <TabsTrigger value="results">Resultat</TabsTrigger>
            </TabsList>
            
            <TabsContent value="what" className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Analyserade dokument:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Anföranden i riksdagen (de senaste 15 per ledamot)</li>
                  <li>• Skriftliga frågor (de senaste 8 per ledamot)</li>
                  <li>• Endast text längre än 150 tecken (anföranden) eller 80 tecken (frågor)</li>
                  <li>• Hoppar över ledamöter med analyser från senaste veckan</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="how" className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Analysparametrar:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Språkkomplexitet:</strong> Meningslängd, ordlängd, komplexa ord, passiv form</li>
                  <li>• <strong>Ordförrådsrikedom:</strong> Unika ord, variation, ordval</li>
                  <li>• <strong>Retoriska element:</strong> Frågor, utropstecken, formella markörer, tekniska termer</li>
                  <li>• <strong>Strukturell tydlighet:</strong> Meningsbalans, styckeindelning, läsbarhet</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Resultat och poängsystem:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Poäng 1-100 för varje kategori och totalt</li>
                  <li>• <strong>Mycket hög (85-100):</strong> Exceptionell språklig kvalitet</li>
                  <li>• <strong>Hög (70-84):</strong> Hög språklig kvalitet</li>
                  <li>• <strong>Medel (55-69):</strong> Genomsnittlig kvalitet</li>
                  <li>• <strong>Låg (40-54):</strong> Grundläggande kvalitet</li>
                  <li>• <strong>Mycket låg (1-39):</strong> Begränsad kvalitet</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LanguageAnalysisBatchRunner;
