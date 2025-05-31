
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  Users,
  Activity,
  Clock,
  BarChart3,
  Zap,
  FileText,
  MessageSquare
} from 'lucide-react';
import { fetchAllMembers } from '../services/riksdagApi';
import { LanguageAnalysisService } from '../services/languageAnalysisService';
import { documentTextFetcher } from '../services/documentTextFetcher';

interface BatchProgress {
  currentMember: string;
  currentMemberId: string;
  completedCount: number;
  totalCount: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  estimatedTimeLeft: string;
  errors: string[];
  currentStep: string;
  currentSubStep: string;
  speechesFound: number;
  documentsFound: number;
  textsExtracted: number;
}

const LanguageAnalysisBatchProcessor = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState<BatchProgress>({
    currentMember: '',
    currentMemberId: '',
    completedCount: 0,
    totalCount: 0,
    successCount: 0,
    errorCount: 0,
    skippedCount: 0,
    estimatedTimeLeft: '',
    errors: [],
    currentStep: '',
    currentSubStep: '',
    speechesFound: 0,
    documentsFound: 0,
    textsExtracted: 0
  });
  const [startTime, setStartTime] = useState<Date | null>(null);

  const updateProgress = (updates: Partial<BatchProgress>) => {
    setProgress(prev => ({ ...prev, ...updates }));
  };

  const calculateEstimatedTime = (completed: number, total: number, startTime: Date): string => {
    if (completed === 0) return 'Beräknar...';
    
    const elapsed = (new Date().getTime() - startTime.getTime()) / 1000;
    const rate = completed / elapsed;
    const remaining = (total - completed) / rate;
    
    if (remaining < 60) return `${Math.round(remaining)}s`;
    if (remaining < 3600) return `${Math.round(remaining / 60)}min`;
    return `${Math.round(remaining / 3600)}h ${Math.round((remaining % 3600) / 60)}min`;
  };

  const startBatchAnalysis = async () => {
    setIsRunning(true);
    setIsPaused(false);
    const batchStartTime = new Date();
    setStartTime(batchStartTime);
    
    try {
      // Steg 1: Hämta alla aktiva ledamöter
      updateProgress({
        currentStep: 'Steg 1: Hämtar alla aktiva ledamöter från Riksdagen',
        currentSubStep: 'Ansluter till Riksdagens API...',
        currentMember: '',
        completedCount: 0,
        successCount: 0,
        errorCount: 0,
        skippedCount: 0,
        errors: []
      });

      const allMembers = await fetchAllMembers();
      console.log(`Hittade ${allMembers.length} aktiva ledamöter`);
      
      updateProgress({
        totalCount: allMembers.length,
        currentStep: 'Steg 1 slutförd: Alla ledamöter hämtade',
        currentSubStep: `${allMembers.length} aktiva ledamöter att analysera`
      });

      let completed = 0;
      let successful = 0;
      let errors = 0;
      let skipped = 0;
      const errorMessages: string[] = [];

      // Bearbeta ledamöter en i taget
      for (const member of allMembers) {
        // Kontrollera om pausad
        while (isPaused && isRunning) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!isRunning) break; // Stoppad

        const memberName = `${member.tilltalsnamn} ${member.efternamn}`;
        
        updateProgress({
          currentMember: memberName,
          currentMemberId: member.intressent_id,
          currentStep: `Steg 2: Analyserar ledamot ${completed + 1}/${allMembers.length}`,
          currentSubStep: `Förbereder analys av ${memberName} (${member.parti})`,
          estimatedTimeLeft: calculateEstimatedTime(completed, allMembers.length, batchStartTime),
          speechesFound: 0,
          documentsFound: 0,
          textsExtracted: 0
        });

        try {
          // Kontrollera om ledamot redan har ny analys
          updateProgress({
            currentSubStep: 'Kontrollerar befintliga analyser...'
          });

          const existingAnalyses = await LanguageAnalysisService.getAnalysisByMember(member.intressent_id);
          const hasRecentAnalysis = existingAnalyses.some(analysis => {
            const analysisDate = new Date(analysis.analysis_date);
            const daysSince = (Date.now() - analysisDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysSince < 7; // Hoppa över om analyserad senaste 7 dagarna
          });

          if (hasRecentAnalysis) {
            console.log(`Hoppar över ${memberName} - ny analys finns redan`);
            skipped++;
            updateProgress({
              skippedCount: skipped,
              currentSubStep: `Hoppade över ${memberName} (analyserad inom senaste veckan)`
            });
          } else {
            // Steg 3: Hämta anföranden och dokument
            updateProgress({
              currentSubStep: 'Steg 3: Hämtar senaste anföranden och dokument...'
            });

            // Använd den nya steg-för-steg metoden
            const content = await documentTextFetcher.fetchMemberContentStepByStep(
              member.intressent_id,
              memberName,
              (fetchProgress) => {
                updateProgress({
                  currentSubStep: fetchProgress.currentStep,
                  speechesFound: fetchProgress.completed > 30 ? 1 : 0, // Indikera framsteg
                  documentsFound: fetchProgress.completed > 50 ? 1 : 0
                });
              }
            );

            updateProgress({
              speechesFound: content.speeches.length,
              documentsFound: content.documents.length,
              textsExtracted: content.speeches.length + content.documents.length,
              currentSubStep: `Hittade ${content.speeches.length} anföranden och ${content.documents.length} dokument med text`
            });

            // Kontrollera att vi har tillräckligt med text för analys
            const totalTexts = content.speeches.length + content.documents.length;
            if (totalTexts === 0) {
              throw new Error('Ingen analyseras text hittades för denna ledamot');
            }

            // Steg 4: Utför språkanalys
            updateProgress({
              currentSubStep: 'Steg 4: Utför AI-språkanalys...'
            });

            await LanguageAnalysisService.analyzeMemberLanguageWithAPI(
              member.intressent_id,
              memberName
            );
            
            successful++;
            console.log(`Lyckad analys av ${memberName}: ${totalTexts} texter analyserade`);
            updateProgress({
              successCount: successful,
              currentSubStep: `Steg 5: Analys slutförd och sparad för ${memberName}`
            });
          }
        } catch (error) {
          errors++;
          const errorMsg = `${memberName}: ${error instanceof Error ? error.message : 'Okänt fel'}`;
          errorMessages.push(errorMsg);
          console.error(`Fel vid analys av ${memberName}:`, error);
          
          updateProgress({
            errorCount: errors,
            errors: [...errorMessages].slice(-10), // Behåll senaste 10 felen
            currentSubStep: `Fel vid analys av ${memberName}: ${error instanceof Error ? error.message : 'Okänt fel'}`
          });
        }

        completed++;
        updateProgress({
          completedCount: completed,
          estimatedTimeLeft: calculateEstimatedTime(completed, allMembers.length, batchStartTime)
        });

        // Kort paus mellan ledamöter för att undvika API-överbelastning
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      updateProgress({
        currentStep: `Batch-analys slutförd: ${successful} lyckade, ${errors} fel, ${skipped} hoppade över`,
        currentSubStep: 'Alla ledamöter bearbetade',
        currentMember: '',
        estimatedTimeLeft: 'Klar'
      });

    } catch (error) {
      console.error('Kritiskt fel i batch-analys:', error);
      updateProgress({
        currentStep: `Kritiskt fel: ${error instanceof Error ? error.message : 'Okänt fel'}`,
        currentSubStep: 'Batch-processen avbröts',
        errors: [...progress.errors, `Kritiskt fel: ${error instanceof Error ? error.message : 'Okänt fel'}`]
      });
    } finally {
      setIsRunning(false);
      setIsPaused(false);
    }
  };

  const pauseAnalysis = () => {
    setIsPaused(true);
    updateProgress({
      currentSubStep: 'Analys pausad av användare'
    });
  };

  const resumeAnalysis = () => {
    setIsPaused(false);
    updateProgress({
      currentSubStep: 'Återupptar analys...'
    });
  };

  const stopAnalysis = () => {
    setIsRunning(false);
    setIsPaused(false);
    updateProgress({
      currentStep: 'Analys stoppad av användare',
      currentSubStep: 'Batch-processen avbröts'
    });
  };

  const resetAnalysis = () => {
    setProgress({
      currentMember: '',
      currentMemberId: '',
      completedCount: 0,
      totalCount: 0,
      successCount: 0,
      errorCount: 0,
      skippedCount: 0,
      estimatedTimeLeft: '',
      errors: [],
      currentStep: '',
      currentSubStep: '',
      speechesFound: 0,
      documentsFound: 0,
      textsExtracted: 0
    });
    setStartTime(null);
  };

  const getProgressPercentage = () => {
    if (progress.totalCount === 0) return 0;
    return (progress.completedCount / progress.totalCount) * 100;
  };

  const getSuccessRate = () => {
    if (progress.completedCount === 0) return 100;
    return Math.round((progress.successCount / (progress.successCount + progress.errorCount)) * 100) || 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Enhanced Batch-språkanalys</span>
            <Badge className="bg-blue-100 text-blue-800">
              <Zap className="w-3 h-3 mr-1" />
              v4.0
            </Badge>
          </div>
          {progress.totalCount > 0 && (
            <div className="text-right">
              <div className="text-sm text-gray-600">
                {progress.completedCount}/{progress.totalCount}
              </div>
              <div className="text-lg font-bold text-blue-600">
                {Math.round(getProgressPercentage())}%
              </div>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-blue-200">
          <Activity className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <span className="font-medium">Enhanced Batch-analys v4.0 med förbättrad textextraktion:</span>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Steg-för-steg process enligt specifikation</li>
                <li>Kraftigt förbättrad textextraktion med flera fallback-metoder</li>
                <li>Detaljerad framstegsrapportering för varje steg</li>
                <li>Robust felhantering som fortsätter vid problem</li>
                <li>Realtidsvisning av hittade anföranden och dokument</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex items-center space-x-4">
          {!isRunning ? (
            <Button
              onClick={startBatchAnalysis}
              className="flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Starta enhanced batch-analys (alla {progress.totalCount || '349'} ledamöter)</span>
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              {!isPaused ? (
                <Button
                  onClick={pauseAnalysis}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pausa</span>
                </Button>
              ) : (
                <Button
                  onClick={resumeAnalysis}
                  className="flex items-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Fortsätt</span>
                </Button>
              )}
              
              <Button
                onClick={stopAnalysis}
                variant="destructive"
                className="flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Stoppa</span>
              </Button>
            </div>
          )}

          <Button
            onClick={resetAnalysis}
            variant="ghost"
            disabled={isRunning}
            className="flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Återställ</span>
          </Button>
        </div>

        {(progress.totalCount > 0 || isRunning) && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Totalt framsteg</span>
                <span className="text-sm text-gray-600">
                  {progress.completedCount}/{progress.totalCount}
                </span>
              </div>
              <Progress value={getProgressPercentage()} className="h-3" />
            </div>

            {progress.currentStep && (
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">{progress.currentStep}</span>
              </div>
            )}

            {progress.currentSubStep && (
              <div className="flex items-center space-x-2 ml-6">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-sm text-gray-600">{progress.currentSubStep}</span>
              </div>
            )}

            {progress.currentMember && (
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-green-500" />
                <span className="text-sm">Aktuell ledamot: <strong>{progress.currentMember}</strong></span>
              </div>
            )}

            {(progress.speechesFound > 0 || progress.documentsFound > 0) && (
              <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Anföranden: <strong>{progress.speechesFound}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Dokument: <strong>{progress.documentsFound}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">Texter: <strong>{progress.textsExtracted}</strong></span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Lyckade: <strong>{progress.successCount}</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm">Fel: <strong>{progress.errorCount}</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Hoppade över: <strong>{progress.skippedCount}</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-purple-500" />
                <span className="text-sm">Framgång: <strong>{getSuccessRate()}%</strong></span>
              </div>
              {progress.estimatedTimeLeft && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">Kvar: <strong>{progress.estimatedTimeLeft}</strong></span>
                </div>
              )}
            </div>

            {progress.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-700">Senaste fel:</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {progress.errors.slice(-5).map((error, index) => (
                    <Alert key={index} className="border-red-200 py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-700 text-xs">
                        {error}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LanguageAnalysisBatchProcessor;
