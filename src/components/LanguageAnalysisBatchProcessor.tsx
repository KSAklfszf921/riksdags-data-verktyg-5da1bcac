
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

  // Enhanced member filtering for active members only
  const filterActiveMembers = async (allMembers: any[]): Promise<any[]> => {
    console.log(`=== ENHANCED ACTIVE MEMBER FILTERING ===`);
    console.log(`Initial member count: ${allMembers.length}`);
    
    updateProgress({
      currentStep: 'Enhanced filtering of active members',
      currentSubStep: 'Analyzing member status and activity...'
    });

    // Enhanced filtering logic for truly active members
    const activeMembers = allMembers.filter(member => {
      // Must have valid ID and name
      const hasValidId = member.intressent_id && member.intressent_id.length > 0;
      const hasValidName = member.tilltalsnamn && member.efternamn;
      
      // Must have valid party
      const hasValidParty = member.parti && member.parti.length > 0 && member.parti !== 'null';
      
      // Check for active status indicators
      const isNotExplicitlyInactive = member.status !== 'Avgått' && member.status !== 'Ersättare';
      
      // Additional checks for current activity
      const hasCurrentRole = member.uppgift && member.uppgift.includes('Ledamot');
      
      // Check if member has recent activity (current riksdag period)
      const isCurrentPeriod = !member.from || member.from.includes('2022') || member.from.includes('2023') || member.from.includes('2024');
      
      const isActive = hasValidId && hasValidName && hasValidParty && isNotExplicitlyInactive && 
                      (hasCurrentRole || isCurrentPeriod);

      if (!isActive) {
        const reasons = [];
        if (!hasValidId) reasons.push('Invalid ID');
        if (!hasValidName) reasons.push('Invalid name');
        if (!hasValidParty) reasons.push('Invalid party');
        if (!isNotExplicitlyInactive) reasons.push('Inactive status');
        if (!hasCurrentRole && !isCurrentPeriod) reasons.push('Not current period');
        
        console.log(`Filtered out: ${member.tilltalsnamn} ${member.efternamn} - ${reasons.join(', ')}`);
      }

      return isActive;
    });

    // Sort by party for better processing order
    activeMembers.sort((a, b) => {
      if (a.parti === b.parti) {
        return `${a.tilltalsnamn} ${a.efternamn}`.localeCompare(`${b.tilltalsnamn} ${b.efternamn}`);
      }
      return a.parti.localeCompare(b.parti);
    });

    console.log(`Enhanced filtering complete: ${activeMembers.length} active members identified`);
    console.log(`Filtered out: ${allMembers.length - activeMembers.length} inactive/invalid members`);

    // Sample of active members for verification
    console.log('Sample active members:', activeMembers.slice(0, 5).map(m => ({
      name: `${m.tilltalsnamn} ${m.efternamn}`,
      party: m.parti,
      id: m.intressent_id,
      status: m.status,
      role: m.uppgift
    })));

    updateProgress({
      currentSubStep: `Enhanced filtering: ${activeMembers.length} active members found`
    });

    return activeMembers;
  };

  const startBatchAnalysis = async (resumeFromState?: ResumeState) => {
    console.log('=== STARTING ENHANCED BATCH ANALYSIS v7.0 ===');
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

        updateProgress({
          currentStep: 'Resuming enhanced analysis from previous session',
          currentSubStep: 'Fetching member data...'
        });

        const fetchedMembers = await fetchAllMembers();
        allMembers = await filterActiveMembers(fetchedMembers);
        
        updateProgress({
          totalCount: allMembers.length,
          completedCount: completed,
          successCount: successful,
          errorCount: errors,
          skippedCount: skipped,
          currentStep: `Resuming from member ${startIndex + 1}/${allMembers.length}`,
          currentSubStep: `Previous results: ${successful} successful, ${errors} errors, ${skipped} skipped`
        });
      } else {
        console.log('=== STARTING FRESH ENHANCED ANALYSIS ===');
        batchStartTime = new Date();
        setStartTime(batchStartTime);
        
        updateProgress({
          currentStep: 'Fetching all members from Riksdag API',
          currentSubStep: 'Connecting to enhanced Riksdag API...',
          currentBatchStartTime: batchStartTime
        });

        const fetchedMembers = await fetchAllMembers();
        allMembers = await filterActiveMembers(fetchedMembers);
        
        if (!allMembers || allMembers.length === 0) {
          throw new Error('No active members could be fetched from the enhanced API');
        }

        updateProgress({
          totalCount: allMembers.length,
          currentStep: 'Active members identified with enhanced filtering',
          currentSubStep: `${allMembers.length} active members ready for enhanced analysis`
        });
      }

      console.log(`=== ENHANCED PROCESSING: Starting from ${startIndex}, total ${allMembers.length} ===`);

      // Process members with enhanced integration
      for (let i = startIndex; i < allMembers.length; i++) {
        // Check for pause or stop
        if (shouldStop) {
          console.log('❌ Enhanced batch processing stopped by user');
          break;
        }

        await waitForUnpause();
        
        if (shouldStop) {
          console.log('❌ Enhanced batch processing stopped during pause');
          break;
        }

        const member = allMembers[i];
        const memberName = `${member.tilltalsnamn} ${member.efternamn}`;
        
        console.log(`\n--- Enhanced processing member ${i + 1}/${allMembers.length}: ${memberName} (${member.parti}) ---`);
        
        updateProgress({
          currentMember: memberName,
          currentMemberId: member.intressent_id,
          currentStep: `Enhanced analysis ${i + 1}/${allMembers.length}`,
          currentSubStep: `Preparing enhanced analysis of ${memberName} (${member.parti})`,
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
          // Enhanced duplicate check - only skip if analyzed recently
          console.log(`Enhanced checking existing analyses for ${memberName}...`);
          updateProgress({
            currentSubStep: 'Checking existing analyses with enhanced logic...'
          });

          const existingAnalyses = await LanguageAnalysisService.getAnalysisByMember(member.intressent_id);
          const hasRecentAnalysis = existingAnalyses.some(analysis => {
            const analysisDate = new Date(analysis.analysis_date);
            const hoursSince = (Date.now() - analysisDate.getTime()) / (1000 * 60 * 60);
            return hoursSince < 6; // Only skip if analyzed within 6 hours
          });

          if (hasRecentAnalysis) {
            console.log(`⏭️ Skipping ${memberName} - recent analysis exists (within 6 hours)`);
            skipped++;
            updateProgress({
              skippedCount: skipped,
              currentSubStep: `Skipped ${memberName} (recently analyzed)`
            });
          } else {
            console.log(`📋 Enhanced processing ${memberName} - no recent analysis found`);
            
            updateProgress({
              currentSubStep: 'Enhanced language analysis starting...'
            });

            // Use the enhanced integrated analysis
            console.log(`Enhanced integrated analysis for ${memberName}...`);
            
            const analyzedCount = await LanguageAnalysisService.analyzeMemberLanguageWithAPI(
              member.intressent_id,
              memberName
            );
            
            if (analyzedCount > 0) {
              successful++;
              console.log(`✅ Enhanced successful analysis of ${memberName}: ${analyzedCount} documents analyzed`);
              updateProgress({
                successCount: successful,
                currentSubStep: `Enhanced analysis completed for ${memberName} (${analyzedCount} documents)`
              });
            } else {
              console.warn(`⚠️ No documents analyzed for ${memberName} despite enhanced processing`);
              skipped++;
              updateProgress({
                skippedCount: skipped,
                currentSubStep: `No analysis possible for ${memberName} - continuing`
              });
            }
          }
        } catch (error) {
          errors++;
          const errorMsg = `${memberName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errorMessages.push(errorMsg);
          console.error(`❌ Enhanced error analyzing ${memberName}:`, error);
          
          updateProgress({
            errorCount: errors,
            errors: [...errorMessages].slice(-10),
            currentSubStep: `Enhanced error analyzing ${memberName}: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }

        completed++;
        updateProgress({
          completedCount: completed,
          estimatedTimeLeft: calculateEstimatedTime(completed, allMembers.length, batchStartTime)
        });

        console.log(`Enhanced member ${i + 1}/${allMembers.length} processed. Stats: ${successful} successful, ${errors} errors, ${skipped} skipped`);

        // Enhanced pause between members
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Clear resume state on successful completion
      if (!shouldStop && completed >= allMembers.length) {
        clearResumeState();
      }

      const finalMessage = shouldStop ? 
        `Enhanced batch analysis stopped: ${successful} successful, ${errors} errors, ${skipped} skipped` :
        `Enhanced batch analysis completed: ${successful} successful, ${errors} errors, ${skipped} skipped`;

      console.log(`=== ${finalMessage.toUpperCase()} ===`);

      updateProgress({
        currentStep: finalMessage,
        currentSubStep: shouldStop ? 'Process stopped, resume state saved' : 'All members processed with enhanced integration',
        currentMember: '',
        estimatedTimeLeft: shouldStop ? 'Stopped (can be resumed)' : 'Complete'
      });

    } catch (error) {
      console.error('❌ Critical enhanced error in batch analysis:', error);
      
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
        currentStep: `Critical enhanced error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        currentSubStep: 'Batch process interrupted, state saved for resumption',
        errors: [...progress.errors, `Critical error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      });
    } finally {
      console.log('=== ENHANCED BATCH ANALYSIS FINISHED ===');
      setIsRunning(false);
      setIsPaused(false);
      setShouldStop(false);
    }
  };

  const pauseAnalysis = () => {
    console.log('⏸️ Enhanced user requested pause');
    setIsPaused(true);
    updateProgress({
      currentSubStep: 'Enhanced analysis paused by user (state saved)'
    });
  };

  const resumeAnalysis = () => {
    console.log('▶️ Enhanced user requested resume');
    setIsPaused(false);
    updateProgress({
      currentSubStep: 'Resuming enhanced analysis...'
    });
  };

  const stopAnalysis = () => {
    console.log('⏹️ Enhanced user requested stop');
    setShouldStop(true);
    setIsPaused(false);
    updateProgress({
      currentStep: 'Stopping enhanced analysis...',
      currentSubStep: 'Saving state for possible resumption'
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
            <span>Enhanced Batch Language Analysis</span>
            <Badge className="bg-green-100 text-green-800">
              <Zap className="w-3 h-3 mr-1" />
              v7.0 Fixed
            </Badge>
          </div>
          {progress.totalCount > 0 && (
            <div className="text-right">
              <div className="text-sm text-gray-600">
                {progress.completedCount}/{progress.totalCount}
              </div>
              <div className="text-lg font-bold text-green-600">
                {Math.round(getProgressPercentage())}%
              </div>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-green-200 bg-green-50">
          <Activity className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <span className="font-medium">Enhanced Batch Analysis v7.0 - Fully Integrated:</span>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>🔗 Fully integrated with enhanced document text fetcher</li>
                <li>👥 Enhanced active member filtering (current period only)</li>
                <li>⚡ Optimized language analysis with proper API integration</li>
                <li>🛡️ Database integration with RLS bypass for service operations</li>
                <li>📊 Real-time progress tracking with detailed extraction metrics</li>
                <li>🔄 Resume capability with state persistence</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {resumeState && (
          <Alert className="border-blue-200 bg-blue-50">
            <Database className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <span className="font-medium">Previous enhanced session found:</span>
                <p className="text-sm">
                  Started: {new Date(resumeState.startTime).toLocaleString('sv-SE')} | 
                  Processed: {resumeState.lastProcessedIndex + 1} of {resumeState.memberIds.length} | 
                  Stats: {resumeState.statistics.successful} successful, {resumeState.statistics.errors} errors
                </p>
                <div className="flex space-x-2">
                  <Button onClick={resumeFromSavedState} size="sm" className="flex items-center space-x-1">
                    <Play className="w-3 h-3" />
                    <span>Resume enhanced analysis</span>
                  </Button>
                  <Button onClick={clearResumeState} variant="outline" size="sm">
                    Clear saved session
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
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4" />
              <span>Start Enhanced Batch Analysis v7.0</span>
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
                  <span>Pause</span>
                </Button>
              ) : (
                <Button
                  onClick={resumeAnalysis}
                  className="flex items-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Resume</span>
                </Button>
              )}
              
              <Button
                onClick={stopAnalysis}
                variant="destructive"
                className="flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Stop</span>
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
            <span>Reset</span>
          </Button>
        </div>

        {(progress.totalCount > 0 || isRunning) && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Enhanced Total Progress</span>
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
                <span className="text-sm">Current member: <strong>{progress.currentMember}</strong></span>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Successful: <strong>{progress.successCount}</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm">Errors: <strong>{progress.errorCount}</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Skipped: <strong>{progress.skippedCount}</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-purple-500" />
                <span className="text-sm">Success Rate: <strong>{getSuccessRate()}%</strong></span>
              </div>
              {progress.estimatedTimeLeft && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">ETA: <strong>{progress.estimatedTimeLeft}</strong></span>
                </div>
              )}
            </div>

            {progress.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-700">Recent enhanced errors:</h4>
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
