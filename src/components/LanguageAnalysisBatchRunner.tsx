
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  Brain,
  Users,
  BarChart3,
  Clock
} from 'lucide-react';
import { LanguageAnalysisService } from '../services/languageAnalysisService';
import { supabase } from "@/integrations/supabase/client";

const LanguageAnalysisBatchRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentMember, setCurrentMember] = useState<string>('');
  const [completedMembers, setCompletedMembers] = useState<string[]>([]);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState<string>('');

  const startBatchAnalysis = async () => {
    setIsRunning(true);
    setProgress(0);
    setCompletedMembers([]);
    setErrorMessages([]);
    setStartTime(new Date());
    setCurrentMember('Förbereder analys...');

    try {
      // Simulera batch-analys med manuell hantering för bättre kontroll
      const { data: members, error } = await supabase
        .from('member_data')
        .select('member_id, first_name, last_name')
        .eq('is_active', true)
        .limit(100);

      if (error) {
        throw new Error(`Fel vid hämtning av ledamöter: ${error.message}`);
      }

      const totalMembers = members?.length || 0;
      console.log(`Startar språkanalys för ${totalMembers} aktiva ledamöter`);

      for (let i = 0; i < totalMembers; i++) {
        if (!isRunning) break; // Möjlighet att stoppa

        const member = members[i];
        const memberName = `${member.first_name} ${member.last_name}`;
        
        setCurrentMember(`Analyserar ${memberName}...`);
        
        try {
          await LanguageAnalysisService.analyzeMemberLanguage(member.member_id, memberName);
          
          setCompletedMembers(prev => [...prev, memberName]);
          setProgress(((i + 1) / totalMembers) * 100);
          
          // Beräkna återstående tid
          if (startTime) {
            const elapsed = new Date().getTime() - startTime.getTime();
            const avgTimePerMember = elapsed / (i + 1);
            const remainingMembers = totalMembers - (i + 1);
            const estimatedRemaining = remainingMembers * avgTimePerMember;
            
            const minutes = Math.floor(estimatedRemaining / 60000);
            const seconds = Math.floor((estimatedRemaining % 60000) / 1000);
            setEstimatedTimeLeft(`${minutes}m ${seconds}s`);
          }
          
          // Kort paus mellan ledamöter för att inte överbelasta systemet
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (memberError: any) {
          console.error(`Fel vid analys av ${memberName}:`, memberError);
          setErrorMessages(prev => [...prev, `${memberName}: ${memberError.message}`]);
        }
      }

      setCurrentMember('Analys slutförd!');
      setEstimatedTimeLeft('');
      
    } catch (error: any) {
      console.error('Fel vid batch-analys:', error);
      setErrorMessages(prev => [...prev, `Allmänt fel: ${error.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const stopBatchAnalysis = () => {
    setIsRunning(false);
    setCurrentMember('Analys stoppad av användare');
  };

  const resetBatchAnalysis = () => {
    setProgress(0);
    setCurrentMember('');
    setCompletedMembers([]);
    setErrorMessages([]);
    setStartTime(null);
    setEstimatedTimeLeft('');
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
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Denna process analyserar språket i anföranden och skriftliga frågor för alla aktiva riksdagsledamöter. 
              Analysen kan ta flera minuter att slutföra beroende på mängden data.
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
          </div>

          {(progress > 0 || isRunning) && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Framsteg</span>
                  <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {currentMember && (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">{currentMember}</span>
                </div>
              )}

              {estimatedTimeLeft && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">Uppskattat återstående tid: {estimatedTimeLeft}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {completedMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Slutförda analyser ({completedMembers.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {completedMembers.map((memberName, index) => (
                <Badge key={index} variant="outline" className="text-green-700 border-green-300">
                  {memberName}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {errorMessages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span>Fel ({errorMessages.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {errorMessages.map((error, index) => (
                <Alert key={index} className="border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-700">
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
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Vad analyseras:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Anföranden i riksdagen (de senaste 20 per ledamot)</li>
              <li>• Skriftliga frågor (de senaste 10 per ledamot)</li>
              <li>• Endast text längre än 100 tecken (anföranden) eller 50 tecken (frågor)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Analysparametrar:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Språkkomplexitet (meningslängd, ordlängd, komplexa ord)</li>
              <li>• Ordförrådsrikedom (unika ord, variation)</li>
              <li>• Retoriska element (frågor, utropstecken, formella markörer)</li>
              <li>• Strukturell tydlighet (meningsbalans, styckeindelning)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Resultat:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Poäng 1-100 för varje kategori</li>
              <li>• Språknivå: Mycket låg, Låg, Medel, Hög, Mycket hög</li>
              <li>• Detaljerade metriker för varje dokument</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LanguageAnalysisBatchRunner;
