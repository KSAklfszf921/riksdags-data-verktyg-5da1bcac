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
  MessageSquare,
  Database,
  Network
} from 'lucide-react';
import { fetchAllMembers } from '../services/riksdagApi';
import { LanguageAnalysisService } from '../services/languageAnalysisService';
import { enhancedDocumentTextFetcher } from '../services/enhancedDocumentTextFetcher';

interface MemberContent {
  speeches: Array<{ id: string; text: string; title: string; date: string }>;
  documents: Array<{ id: string; text: string; title: string; date: string; type: string }>;
  extractionDetails: {
    speechesAttempted: number;
    documentsAttempted: number;
    extractionMethods: string[];
    failedExtractions: Array<{ id: string; reason: string }>;
  };
}

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
  extractionDetails: string[];
  lastResumePoint?: string;
  currentBatchStartTime?: Date;
}

interface ResumeState {
  lastProcessedIndex: number;
  memberIds: string[];
  startTime: Date;
  statistics: {
    successful: number;
    errors: number;
    skipped: number;
  };
}

const LanguageAnalysisBatchProcessor = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [shouldStop, setShouldStop] = useState(false);
  const [resumeState, setResumeState] = useState<ResumeState | null>(null);
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
    textsExtracted: 0,
    extractionDetails: []
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

  const waitForUnpause = async () => {
    while (isPaused && !shouldStop) {
      console.log('Batch processor paused, waiting...');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const saveResumeState = (state: ResumeState) => {
    try {
      localStorage.setItem('batchAnalysisResumeState', JSON.stringify(state));
      setResumeState(state);
      console.log('Resume state saved:', state);
    } catch (error) {
      console.error('Failed to save resume state:', error);
    }
  };

  const loadResumeState = (): ResumeState | null => {
    try {
      const saved = localStorage.getItem('batchAnalysisResumeState');
      if (saved) {
        const state = JSON.parse(saved);
        // Check if state is recent (within 24 hours)
        const stateAge = Date.now() - new Date(state.startTime).getTime();
        if (stateAge < 24 * 60 * 60 * 1000) {
          return state;
        }
      }
    } catch (error) {
      console.error('Failed to load resume state:', error);
    }
    return null;
  };

  const clearResumeState = () => {
    localStorage.removeItem('batchAnalysisResumeState');
    setResumeState(null);
  };

  // Improved member filtering with better debugging
  const filterActiveMembers = async (allMembers: any[]): Promise<any[]> => {
    console.log(`=== IMPROVED MEMBER FILTERING ===`);
    console.log(`Initial member count: ${allMembers.length}`);
    
    updateProgress({
      currentStep: 'Förbättrad filtrering av aktiva ledamöter',
      currentSubStep: 'Analyserar medlemsstatus...'
    });

    // More permissive filtering for testing
    const activeMembers = allMembers.filter(member => {
      const hasValidId = member.intressent_id && member.intressent_id.length > 0;
      const hasValidName = member.tilltalsnamn && member.efternamn;
      const hasValidParty = member.parti && member.parti.length > 0;
      const isNotExplicitlyInactive = member.status !== 'Avgått';

      const isActive = hasValidId && hasValidName && hasValidParty && isNotExplicitlyInactive;

      if (!isActive) {
        console.log(`Filtered out: ${member.tilltalsnamn} ${member.efternamn} - Missing: ${!hasValidId ? 'ID ' : ''}${!hasValidName ? 'Name ' : ''}${!hasValidParty ? 'Party ' : ''}${member.status === 'Avgått' ? 'Inactive' : ''}`);
      }

      return isActive;
    });

    console.log(`Active members after improved filtering: ${activeMembers.length}`);
    console.log(`Filtered out: ${allMembers.length - activeMembers.length} members`);

    // Sample first few members for debugging
    console.log('Sample active members:', activeMembers.slice(0, 3).map(m => ({
      name: `${m.tilltalsnamn} ${m.efternamn}`,
      party: m.parti,
      id: m.intressent_id,
      status: m.status
    })));

    updateProgress({
      currentSubStep: `Hittade ${activeMembers.length} aktiva ledamöter (förbättrad filtrering)`
    });

    return activeMembers;
  };

  const startBatchAnalysis = async (resumeFromState?: ResumeState) => {
    console.log('=== STARTING IMPROVED BATCH ANALYSIS v6.0 ===');
    setIsRunning(true);
    setIsPaused(false);
    setShouldStop(false);
    
    let batchStartTime: Date;
    let completed = 0;
    let successful = 0;
    let errors = 0;
    let skipped = 0;
    let errorMessages: string[] = [];
    let startIndex = 0;
    let allMembers: any[] = [];

    try {
      if (resumeFromState) {
        console.log('=== RESUMING FROM PREVIOUS STATE ===');
        batchStartTime = new Date(resumeFromState.startTime);
        startIndex = resumeFromState.lastProcessedIndex + 1;
        successful = resumeFromState.statistics.successful;
        errors = resumeFromState.statistics.errors;
        skipped = resumeFromState.statistics.skipped;
        completed = startIndex;

        // Recreate member list from IDs
        updateProgress({
          currentStep: 'Återupptar analys från tidigare session',
          currentSubStep: 'Hämtar medlemsdata...'
        });

        const fetchedMembers = await fetchAllMembers();
        allMembers = await filterActiveMembers(fetchedMembers);
        
        updateProgress({
          totalCount: allMembers.length,
          completedCount: completed,
          successCount: successful,
          errorCount: errors,
          skippedCount: skipped,
          currentStep: `Återupptar från medlem ${startIndex + 1}/${allMembers.length}`,
          currentSubStep: `Tidigare resultat: ${successful} lyckade, ${errors} fel, ${skipped} hoppade över`
        });
      } else {
        console.log('=== STARTING FRESH ANALYSIS ===');
        batchStartTime = new Date();
        setStartTime(batchStartTime);
        
        updateProgress({
          currentStep: 'Hämtar alla ledamöter från Riksdagen',
          currentSubStep: 'Ansluter till Riksdagens API...',
          currentBatchStartTime: batchStartTime
        });

        const fetchedMembers = await fetchAllMembers();
        allMembers = await filterActiveMembers(fetchedMembers);
        
        if (!allMembers || allMembers.length === 0) {
          throw new Error('Inga aktiva ledamöter kunde hämtas från API:et');
        }

        updateProgress({
          totalCount: allMembers.length,
          currentStep: 'Aktiva ledamöter identifierade med förbättrad filtrering',
          currentSubStep: `${allMembers.length} aktiva ledamöter att analysera`
        });
      }

      console.log(`=== PROCESSING MEMBERS: Starting from ${startIndex}, total ${allMembers.length} ===`);

      // Process members with improved error handling
      for (let i = startIndex; i < allMembers.length; i++) {
        // Check for pause or stop
        if (shouldStop) {
          console.log('❌ Batch processing stopped by user');
          break;
        }

        await waitForUnpause();
        
        if (shouldStop) {
          console.log('❌ Batch processing stopped during pause');
          break;
        }

        const member = allMembers[i];
        const memberName = `${member.tilltalsnamn} ${member.efternamn}`;
        
        console.log(`\n--- Processing member ${i + 1}/${allMembers.length}: ${memberName} (${member.parti}) ---`);
        
        updateProgress({
          currentMember: memberName,
          currentMemberId: member.intressent_id,
          currentStep: `Analyserar ledamot ${i + 1}/${allMembers.length}`,
          currentSubStep: `Förbereder förbättrad analys av ${memberName} (${member.parti})`,
          estimatedTimeLeft: calculateEstimatedTime(completed, allMembers.length, batchStartTime),
          speechesFound: 0,
          documentsFound: 0,
          textsExtracted: 0,
          extractionDetails: []
        });

        // Save resume state every 5 members
        if (i % 5 === 0) {
          saveResumeState({
            lastProcessedIndex: i - 1,
            memberIds: allMembers.map(m => m.intressent_id),
            startTime: batchStartTime,
            statistics: { successful, errors, skipped }
          });
        }

        try {
          // More lenient duplicate check - only skip if analyzed in last 1 day
          console.log(`Checking existing analyses for ${memberName}...`);
          updateProgress({
            currentSubStep: 'Kontrollerar befintliga analyser (förbättrad logik)...'
          });

          const existingAnalyses = await LanguageAnalysisService.getAnalysisByMember(member.intressent_id);
          const hasRecentAnalysis = existingAnalyses.some(analysis => {
            const analysisDate = new Date(analysis.analysis_date);
            const daysSince = (Date.now() - analysisDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysSince < 1; // Only skip if analyzed within 1 day
          });

          if (hasRecentAnalysis) {
            console.log(`⏭️ Skipping ${memberName} - recent analysis exists (within 1 day)`);
            skipped++;
            updateProgress({
              skippedCount: skipped,
              currentSubStep: `Hoppade över ${memberName} (analyserad inom senaste dagen)`
            });
          } else {
            console.log(`📋 Processing ${memberName} - no recent analysis found`);
            
            updateProgress({
              currentSubStep: 'Förbättrad textextraktion pågår...'
            });

            console.log(`Improved content fetching for ${memberName}...`);
            
            // Use improved simplified enhanced text fetcher
            const contentPromise = enhancedDocumentTextFetcher.fetchMemberContentWithDetails(
              member.intressent_id,
              memberName,
              (fetchProgress) => {
                console.log(`Improved fetch progress for ${memberName}: ${fetchProgress.currentStep}`);
                updateProgress({
                  currentSubStep: fetchProgress.currentStep,
                  speechesFound: fetchProgress.speechesProcessed || 0,
                  documentsFound: fetchProgress.documentsProcessed || 0,
                  extractionDetails: fetchProgress.details || []
                });
              }
            );

            // Reduced timeout for faster batch processing
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Improved timeout: Content fetching exceeded 30 seconds')), 30000)
            );

            const content = await Promise.race([contentPromise, timeoutPromise]);
            
            console.log(`✓ Improved content fetched for ${memberName}:`, {
              speeches: content.speeches.length,
              documents: content.documents.length,
              extractionDetails: content.extractionDetails
            });

            updateProgress({
              speechesFound: content.speeches.length,
              documentsFound: content.documents.length,
              textsExtracted: content.speeches.length + content.documents.length,
              currentSubStep: `Förbättrad extraktion: ${content.speeches.length} anföranden, ${content.documents.length} dokument`,
              extractionDetails: [
                `Anföranden försökt: ${content.extractionDetails.speechesAttempted}`,
                `Dokument försökt: ${content.extractionDetails.documentsAttempted}`,
                `Metoder använda: ${content.extractionDetails.extractionMethods.join(', ')}`,
                `Misslyckade: ${content.extractionDetails.failedExtractions.length}`
              ]
            });

            // More lenient validation - proceed if we have any text
            const totalTexts = content.speeches.length + content.documents.length;
            if (totalTexts === 0) {
              const errorDetails = content.extractionDetails.failedExtractions.slice(0, 3).map(f => f.reason).join('; ');
              console.warn(`⚠️ No text extracted for ${memberName}, but continuing: ${errorDetails}`);
              
              // Instead of throwing error, mark as skipped but continue
              skipped++;
              updateProgress({
                skippedCount: skipped,
                currentSubStep: `Ingen text för ${memberName} - fortsätter med nästa`
              });
            } else {
              console.log(`Starting improved language analysis for ${memberName} with ${totalTexts} texts...`);

              updateProgress({
                currentSubStep: 'Förbättrad AI-språkanalys...'
              });

              const analyzedCount = await LanguageAnalysisService.analyzeMemberLanguageWithAPI(
                member.intressent_id,
                memberName
              );
              
              if (analyzedCount > 0) {
                successful++;
                console.log(`✅ Improved successful analysis of ${memberName}: ${analyzedCount} documents analyzed`);
                updateProgress({
                  successCount: successful,
                  currentSubStep: `Förbättrad analys slutförd för ${memberName} (${analyzedCount} dokument)`
                });
              } else {
                console.warn(`⚠️ No documents analyzed for ${memberName} despite ${totalTexts} extracted texts`);
                skipped++;
                updateProgress({
                  skippedCount: skipped,
                  currentSubStep: `Ingen analys möjlig för ${memberName} - fortsätter`
                });
              }
            }
          }
        } catch (error) {
          errors++;
          const errorMsg = `${memberName}: ${error instanceof Error ? error.message : 'Okänt fel'}`;
          errorMessages.push(errorMsg);
          console.error(`❌ Improved error analyzing ${memberName}:`, error);
          
          updateProgress({
            errorCount: errors,
            errors: [...errorMessages].slice(-10),
            currentSubStep: `Förbättrat fel vid analys av ${memberName}: ${error instanceof Error ? error.message : 'Okänt fel'}`
          });
        }

        completed++;
        updateProgress({
          completedCount: completed,
          estimatedTimeLeft: calculateEstimatedTime(completed, allMembers.length, batchStartTime)
        });

        console.log(`Improved member ${i + 1}/${allMembers.length} processed. Stats: ${successful} successful, ${errors} errors, ${skipped} skipped`);

        // Shorter pause for faster batch processing
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Clear resume state on successful completion
      if (!shouldStop && completed >= allMembers.length) {
        clearResumeState();
      }

      const finalMessage = shouldStop ? 
        `Förbättrad batch-analys stoppad: ${successful} lyckade, ${errors} fel, ${skipped} hoppade över` :
        `Förbättrad batch-analys slutförd: ${successful} lyckade, ${errors} fel, ${skipped} hoppade över`;

      console.log(`=== ${finalMessage.toUpperCase()} ===`);

      updateProgress({
        currentStep: finalMessage,
        currentSubStep: shouldStop ? 'Processen stoppades, resume-tillstånd sparat' : 'Alla ledamöter bearbetade med förbättrad metod',
        currentMember: '',
        estimatedTimeLeft: shouldStop ? 'Stoppad (kan återupptas)' : 'Klar'
      });

    } catch (error) {
      console.error('❌ Critical improved error in batch analysis:', error);
      
      // Save resume state on critical error
      if (completed > 0) {
        saveResumeState({
          lastProcessedIndex: completed - 1,
          memberIds: allMembers.map(m => m.intressent_id),
          startTime: batchStartTime!,
          statistics: { successful, errors, skipped }
        });
      }

      updateProgress({
        currentStep: `Kritiskt förbättrat fel: ${error instanceof Error ? error.message : 'Okänt fel'}`,
        currentSubStep: 'Batch-processen avbröts, tillstånd sparat för återupptagning',
        errors: [...progress.errors, `Kritiskt fel: ${error instanceof Error ? error.message : 'Okänt fel'}`]
      });
    } finally {
      console.log('=== IMPROVED BATCH ANALYSIS FINISHED ===');
      setIsRunning(false);
      setIsPaused(false);
      setShouldStop(false);
    }
  };

  const pauseAnalysis = () => {
    console.log('⏸️ Enhanced user requested pause');
    setIsPaused(true);
    updateProgress({
      currentSubStep: 'Förbättrad analys pausad av användare (tillstånd sparas)'
    });
  };

  const resumeAnalysis = () => {
    console.log('▶️ Enhanced user requested resume');
    setIsPaused(false);
    updateProgress({
      currentSubStep: 'Återupptar förbättrad analys...'
    });
  };

  const stopAnalysis = () => {
    console.log('⏹️ Enhanced user requested stop');
    setShouldStop(true);
    setIsPaused(false);
    updateProgress({
      currentStep: 'Stoppar förbättrad analys...',
      currentSubStep: 'Sparar tillstånd för möjlig återupptagning'
    });
  };

  const resetAnalysis = () => {
    console.log('🔄 Enhanced user requested reset');
    clearResumeState();
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
      textsExtracted: 0,
      extractionDetails: []
    });
    setStartTime(null);
  };

  const resumeFromSavedState = () => {
    const saved = loadResumeState();
    if (saved) {
      startBatchAnalysis(saved);
    }
  };

  // Load resume state on component mount
  useEffect(() => {
    const saved = loadResumeState();
    if (saved) {
      setResumeState(saved);
    }
  }, []);

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
            <span>Improved Batch-språkanalys</span>
            <Badge className="bg-blue-100 text-blue-800">
              <Zap className="w-3 h-3 mr-1" />
              v6.0
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
              <span className="font-medium">Improved Batch-analys v6.0 med optimerade funktioner:</span>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>🔧 Förenklad och robust textextraktion med endast 2 pålitliga metoder</li>
                <li>👥 Förbättrad medlemsfiltrering som är mer tillåtande men säker</li>
                <li>⚡ Snabbare bearbetning med kortare timeouts (30s) och pauser</li>
                <li>🎯 Lägre tröskelvärden för textvalidering - mer inkluderande</li>
                <li>📊 Fortsätter även när vissa medlemmar misslyckas</li>
                <li>🔍 Förbättrad felrapportering med tydligare debugging</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {resumeState && (
          <Alert className="border-blue-200 bg-blue-50">
            <Database className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <span className="font-medium">Tidigare session hittad:</span>
                <p className="text-sm">
                  Startad: {new Date(resumeState.startTime).toLocaleString('sv-SE')} | 
                  Processed: {resumeState.lastProcessedIndex + 1} av {resumeState.memberIds.length} | 
                  Stats: {resumeState.statistics.successful} lyckade, {resumeState.statistics.errors} fel
                </p>
                <div className="flex space-x-2">
                  <Button onClick={resumeFromSavedState} size="sm" className="flex items-center space-x-1">
                    <Play className="w-3 h-3" />
                    <span>Fortsätt från tidigare</span>
                  </Button>
                  <Button onClick={clearResumeState} variant="outline" size="sm">
                    Rensa sparad session
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center space-x-4">
          {!isRunning ? (
            <Button
              onClick={() => startBatchAnalysis()}
              className="flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Starta Improved batch-analys v6.0</span>
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
                <span className="text-sm font-medium">Improved Totalt framsteg</span>
                <span className="text-sm text-gray-600">
                  {progress.completedCount}/{progress.totalCount}
                </span>
              </div>
              <Progress value={getProgressPercentage()} className="h-3" />
            </div>

            {progress.currentStep && (
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">{progress.currentStep}</span>
              </div>
            )}

            {progress.currentSubStep && (
              <div className="flex items-center space-x-2 ml-6">
                <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                <span className="text-sm text-gray-600">{progress.currentSubStep}</span>
              </div>
            )}

            {progress.currentMember && (
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Aktuell ledamot: <strong>{progress.currentMember}</strong></span>
              </div>
            )}

            {(progress.speechesFound > 0 || progress.documentsFound > 0) && (
              <div className="grid grid-cols-3 gap-4 p-3 bg-green-50 rounded-lg">
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
                  <span className="text-sm">Extraherade: <strong>{progress.textsExtracted}</strong></span>
                </div>
              </div>
            )}

            {progress.extractionDetails.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center">
                  <Network className="w-4 h-4 mr-1" />
                  Improved Extraktion detaljer:
                </h4>
                <div className="space-y-1">
                  {progress.extractionDetails.map((detail, index) => (
                    <div key={index} className="text-xs text-blue-600">• {detail}</div>
                  ))}
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
                <h4 className="text-sm font-medium text-red-700">Improved senaste fel:</h4>
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
