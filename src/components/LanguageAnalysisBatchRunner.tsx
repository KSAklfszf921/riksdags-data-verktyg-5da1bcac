
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Brain,
  Users,
  BarChart3,
  TrendingUp,
  Database,
  Zap,
  Shield,
  RefreshCw
} from 'lucide-react';
import { LanguageAnalysisService } from '../services/languageAnalysisService';
import DataValidationDashboard from './DataValidationDashboard';
import LanguageAnalysisBatchProcessor from './LanguageAnalysisBatchProcessor';

const LanguageAnalysisBatchRunner = () => {
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Språkanalys - Översikt och kontroll</span>
            <Badge className="bg-green-100 text-green-800">
              <Zap className="w-3 h-3 mr-1" />
              v3.0
            </Badge>
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

          <Alert className="border-blue-200">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <span className="font-medium">Enhanced språkanalys v3.0 innehåller:</span>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Kraftigt förbättrad textbearbetning och validering</li>
                  <li>Intelligent batch-processor för alla 349 ledamöter</li>
                  <li>Realtids framstegsrapportering med pausning/återupptagning</li>
                  <li>Automatisk hopping över ledamöter med ny analys</li>
                  <li>Robust felhantering som fortsätter vid problem</li>
                  <li>Enhanced datavalidering före analys startas</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          <div className="flex items-center space-x-4">
            <Button
              onClick={loadStatistics}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Uppdatera statistik</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="batch" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="batch">Batch-processor</TabsTrigger>
          <TabsTrigger value="validation">Datavalidering</TabsTrigger>
          <TabsTrigger value="info">Information</TabsTrigger>
        </TabsList>

        <TabsContent value="batch" className="space-y-4">
          <LanguageAnalysisBatchProcessor />
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <DataValidationDashboard />
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Enhanced Språkanalys v3.0</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="what" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="what">Vad analyseras</TabsTrigger>
                  <TabsTrigger value="how">Hur det fungerar</TabsTrigger>
                  <TabsTrigger value="improvements">Förbättringar</TabsTrigger>
                  <TabsTrigger value="results">Resultat</TabsTrigger>
                </TabsList>
                
                <TabsContent value="what" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Analyserade dokument:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Anföranden i riksdagen (upp till 15 per ledamot, kvalitetsfiltrerade)</li>
                      <li>• Skriftliga frågor (upp till 10 per ledamot, enhanced validering)</li>
                      <li>• Enhanced textvalidering: minst 100 tecken för anföranden, 150 för dokument</li>
                      <li>• Automatisk textbearbetning som tar bort HTML/XML och rengör innehåll</li>
                      <li>• Intelligent hopping över ledamöter med analyser från senaste veckan</li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="how" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Enhanced analysprocess:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• <strong>Avancerad textrensning:</strong> Kraftfull HTML/XML-borttagning, URL och entitetsfiltrering</li>
                      <li>• <strong>Intelligent validering:</strong> Kontrollerar ordantal, språkinnehåll och meningsfull text</li>
                      <li>• <strong>Robust batch-processing:</strong> Går igenom alla 349 ledamöter systematiskt</li>
                      <li>• <strong>Realtids feedback:</strong> Visar aktuell ledamot, framsteg och tidsuppskattning</li>
                      <li>• <strong>Smart hopping:</strong> Undviker dubbelarbete genom att hoppa över nya analyser</li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="improvements" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Nya förbättringar i v3.0:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• <strong>Kraftigt förbättrad textbearbetning:</strong> Avancerad rensning och validering</li>
                      <li>• <strong>Komplett batch-processor:</strong> Hanterar alla 349 ledamöter automatiskt</li>
                      <li>• <strong>Realtids framstegsrapportering:</strong> Live-uppdateringar med tidsuppskattning</li>
                      <li>• <strong>Pausning och återupptagning:</strong> Kontroll över batch-processen</li>
                      <li>• <strong>Intelligent hopping:</strong> Undviker onödig omanalys av nya resultat</li>
                      <li>• <strong>Enhanced felhantering:</strong> Fortsätter vid fel istället för att stoppa</li>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LanguageAnalysisBatchRunner;
