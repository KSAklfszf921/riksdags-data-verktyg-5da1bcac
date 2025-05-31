
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
  Zap
} from 'lucide-react';
import { fetchAllMembers } from '../services/riksdagApi';
import { LanguageAnalysisService } from '../services/languageAnalysisService';

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
    currentStep: ''
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
      updateProgress({
        currentStep: 'Hämtar alla aktiva ledamöter...',
        currentMember: '',
        completedCount: 0,
        successCount: 0,
        errorCount: 0,
        skippedCount: 0,
        errors: []
      });

      // Fetch all active members
      const allMembers = await fetchAllMembers();
      console.log(`Found ${allMembers.length} active members`);
      
      updateProgress({
        totalCount: allMembers.length,
        currentStep: 'Startar analys av ledamöter...'
      });

      let completed = 0;
      let successful = 0;
      let errors = 0;
      let skipped = 0;
      const errorMessages: string[] = [];

      // Process members one by one
      for (const member of allMembers) {
        // Check if paused
        while (isPaused && isRunning) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!isRunning) break; // Stopped

        const memberName = `${member.tilltalsnamn} ${member.efternamn}`;
        
        updateProgress({
          currentMember: memberName,
          currentMemberId: member.intressent_id,
          currentStep: `Analyserar ${memberName}...`,
          estimatedTimeLeft: calculateEstimatedTime(completed, allMembers.length, batchStartTime)
        });

        try {
          // Check if member already has recent analysis
          const existingAnalyses = await LanguageAnalysisService.getAnalysisByMember(member.intressent_id);
          const hasRecentAnalysis = existingAnalyses.some(analysis => {
            const analysisDate = new Date(analysis.analysis_date);
            const daysSince = (Date.now() - analysisDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysSince < 7; // Skip if analyzed within last 7 days
          });

          if (hasRecentAnalysis) {
            console.log(`Skipping ${memberName} - recent analysis exists`);
            skipped++;
            updateProgress({
              skippedCount: skipped,
              currentStep: `Hoppar över ${memberName} (ny analys finns)`
            });
          } else {
            // Perform analysis
            await LanguageAnalysisService.analyzeMemberLanguageWithAPI(
              member.intressent_id,
              memberName
            );
            
            successful++;
            console.log(`Successfully analyzed ${memberName}`);
            updateProgress({
              successCount: successful,
              currentStep: `Slutförd analys av ${memberName}`
            });
          }
        } catch (error) {
          errors++;
          const errorMsg = `${memberName}: ${error instanceof Error ? error.message : 'Okänt fel'}`;
          errorMessages.push(errorMsg);
          console.error(`Error analyzing ${memberName}:`, error);
          
          updateProgress({
            errorCount: errors,
            errors: [...errorMessages].slice(-10), // Keep last 10 errors
            currentStep: `Fel vid analys av ${memberName}`
          });
        }

        completed++;
        updateProgress({
          completedCount: completed,
          estimatedTimeLeft: calculateEstimatedTime(completed, allMembers.length, batchStartTime)
        });

        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      updateProgress({
        currentStep: `Batch-analys slutförd: ${successful} lyckade, ${errors} fel, ${skipped} hoppade över`,
        currentMember: '',
        estimatedTimeLeft: 'Klar'
      });

    } catch (error) {
      console.error('Batch analysis failed:', error);
      updateProgress({
        currentStep: `Kritiskt fel: ${error instanceof Error ? error.message : 'Okänt fel'}`,
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
      currentStep: 'Analys pausad...'
    });
  };

  const resumeAnalysis = () => {
    setIsPaused(false);
    updateProgress({
      currentStep: 'Återupptar analys...'
    });
  };

  const stopAnalysis = () => {
    setIsRunning(false);
    setIsPaused(false);
    updateProgress({
      currentStep: 'Analys stoppad av användare'
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
      currentStep: ''
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
            <span>Batch-språkanalys för alla ledamöter</span>
            <Badge className="bg-blue-100 text-blue-800">
              <Zap className="w-3 h-3 mr-1" />
              Enhanced v3.0
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
              <span className="font-medium">Enhanced Batch-analys v3.0:</span>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Förbättrad textvalidering och rensning</li>
                <li>Intelligent hopping över ledamöter med ny analys</li>
                <li>Realtids framstegsrapportering med tidsuppskattning</li>
                <li>Robust felhantering som fortsätter vid problem</li>
                <li>Pausning och återupptagning av batch-processen</li>
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
              <span>Starta batch-analys (alla {progress.totalCount || '349'} ledamöter)</span>
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
                <span className="text-sm font-medium">Framsteg</span>
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

            {progress.currentMember && (
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-green-500" />
                <span className="text-sm">Aktuell ledamot: <strong>{progress.currentMember}</strong></span>
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
