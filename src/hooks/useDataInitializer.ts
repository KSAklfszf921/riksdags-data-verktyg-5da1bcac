
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InitializationProgress {
  currentStep: string;
  completed: number;
  total: number;
  errors: string[];
  warnings: string[];
  successes: string[];
}

export const useDataInitializer = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [progress, setProgress] = useState<InitializationProgress>({
    currentStep: '',
    completed: 0,
    total: 0,
    errors: [],
    warnings: [],
    successes: []
  });
  const { toast } = useToast();

  const updateProgress = (step: string, completed: number, total: number, result?: { type: 'error' | 'warning' | 'success', message: string }) => {
    setProgress(prev => {
      const newProgress = {
        currentStep: step,
        completed,
        total,
        errors: [...prev.errors],
        warnings: [...prev.warnings],
        successes: [...prev.successes]
      };

      if (result) {
        switch (result.type) {
          case 'error':
            newProgress.errors.push(result.message);
            break;
          case 'warning':
            newProgress.warnings.push(result.message);
            break;
          case 'success':
            newProgress.successes.push(result.message);
            break;
        }
      }

      return newProgress;
    });
  };

  const initializeDataWithRetry = async (types: string[], description: string) => {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🚀 ${description} (försök ${attempt}/${maxRetries})`);
        
        const { data, error } = await supabase.functions.invoke('fetch-comprehensive-data', {
          body: { 
            types, 
            forceRefresh: true,
            manual_trigger: true,
            timeout: 300000 // 5 minuter
          }
        });

        if (error) {
          throw new Error(`${description} fel: ${error.message}`);
        }

        console.log(`✅ ${description} slutförd:`, data);
        return { success: true, data, attempt };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Okänt fel');
        console.error(`❌ ${description} misslyckades (försök ${attempt}):`, lastError);
        
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Väntar ${waitTime/1000}s innan nästa försök...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError || new Error(`${description} misslyckades efter ${maxRetries} försök`);
  };

  const initializeAllData = useCallback(async () => {
    setIsInitializing(true);
    setProgress({ 
      currentStep: '', 
      completed: 0, 
      total: 5, 
      errors: [], 
      warnings: [], 
      successes: [] 
    });

    try {
      console.log('🚀 Startar omfattande datainitialisering...');

      // Steg 1: Rensa hängande processer först
      updateProgress('Rensar hängande processer...', 0, 5);
      try {
        const { data: hangingProcesses } = await supabase
          .from('automated_sync_status')
          .select('*')
          .eq('status', 'running')
          .lt('started_at', new Date(Date.now() - 30 * 60 * 1000).toISOString());

        if (hangingProcesses && hangingProcesses.length > 0) {
          await supabase
            .from('automated_sync_status')
            .update({
              status: 'failed',
              completed_at: new Date().toISOString(),
              error_message: 'Rensad som hängande process'
            })
            .eq('status', 'running')
            .lt('started_at', new Date(Date.now() - 30 * 60 * 1000).toISOString());
          
          updateProgress('Processrensning slutförd', 1, 5, { 
            type: 'success', 
            message: `Rensade ${hangingProcesses.length} hängande processer` 
          });
        } else {
          updateProgress('Processrensning slutförd', 1, 5, { 
            type: 'success', 
            message: 'Inga hängande processer hittades' 
          });
        }
      } catch (error) {
        updateProgress('Processrensning med varningar', 1, 5, { 
          type: 'warning', 
          message: `Processrensning: ${error instanceof Error ? error.message : 'Okänt fel'}` 
        });
      }

      // Steg 2: Medlemsdata
      updateProgress('Initialiserar medlemsdata...', 1, 5);
      try {
        const memberResult = await initializeDataWithRetry(['members'], 'Medlemsdata');
        updateProgress('Medlemsdata initialiserad', 2, 5, { 
          type: 'success', 
          message: `Medlemsdata: ${memberResult.data?.stats?.members_processed || 'Okänt antal'} medlemmar bearbetade` 
        });
      } catch (error) {
        updateProgress('Medlemsdata misslyckades', 2, 5, { 
          type: 'error', 
          message: `Medlemsdata: ${error instanceof Error ? error.message : 'Okänt fel'}` 
        });
      }

      // Steg 3: Dokumentdata
      updateProgress('Initialiserar dokumentdata...', 2, 5);
      try {
        const docResult = await initializeDataWithRetry(['documents'], 'Dokumentdata');
        updateProgress('Dokumentdata initialiserad', 3, 5, { 
          type: 'success', 
          message: `Dokumentdata: ${docResult.data?.stats?.documents_stored || 'Okänt antal'} dokument lagrade` 
        });
      } catch (error) {
        updateProgress('Dokumentdata misslyckades', 3, 5, { 
          type: 'error', 
          message: `Dokumentdata: ${error instanceof Error ? error.message : 'Okänt fel'}` 
        });
      }

      // Steg 4: Röstningsdata  
      updateProgress('Initialiserar röstningsdata...', 3, 5);
      try {
        const voteResult = await initializeDataWithRetry(['votes'], 'Röstningsdata');
        updateProgress('Röstningsdata initialiserad', 4, 5, { 
          type: 'success', 
          message: `Röstningsdata: ${voteResult.data?.stats?.votes_processed || 'Okänt antal'} röstningar bearbetade` 
        });
      } catch (error) {
        updateProgress('Röstningsdata misslyckades', 4, 5, { 
          type: 'error', 
          message: `Röstningsdata: ${error instanceof Error ? error.message : 'Okänt fel'}` 
        });
      }

      // Steg 5: Kalenderdata
      updateProgress('Initialiserar kalenderdata...', 4, 5);
      try {
        const { data: calResult, error: calError } = await supabase.functions.invoke('fetch-calendar-data', {
          body: { 
            manual_trigger: true,
            forceRefresh: true,
            timeout: 180000 // 3 minuter
          }
        });

        if (calError) {
          throw new Error(`Kalenderdata fel: ${calError.message}`);
        }

        console.log('✅ Kalenderdata initialiserad:', calResult);
        updateProgress('Kalenderdata initialiserad', 5, 5, { 
          type: 'success', 
          message: `Kalenderdata: ${calResult?.stats?.calendar_events_stored || 'Okänt antal'} kalenderhändelser lagrade` 
        });
      } catch (error) {
        updateProgress('Kalenderdata misslyckades', 5, 5, { 
          type: 'error', 
          message: `Kalenderdata: ${error instanceof Error ? error.message : 'Okänt fel'}` 
        });
      }

      updateProgress('Datainitialisering slutförd', 5, 5);
      
      // Summera resultat
      const { errors, warnings, successes } = progress;
      if (errors.length === 0) {
        toast({
          title: "Datainitialisering slutförd",
          description: `Alla ${successes.length} datatyper initialiserade framgångsrikt`,
        });
      } else if (successes.length > 0) {
        toast({
          title: "Datainitialisering delvis slutförd",
          description: `${successes.length} av 4 datatyper initialiserade. ${errors.length} fel, ${warnings.length} varningar.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Datainitialisering misslyckades",
          description: `Inga datatyper kunde initialiseras. ${errors.length} fel.`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ Omfattande datainitialisering misslyckades:', error);
      updateProgress('Kritiskt fel', 5, 5, { 
        type: 'error', 
        message: `Systemfel: ${error instanceof Error ? error.message : 'Okänt fel'}` 
      });
      toast({
        title: "Kritiskt initialiseringsfel",
        description: "Kunde inte starta datainitialisering",
        variant: "destructive"
      });
    } finally {
      setIsInitializing(false);
    }
  }, [toast]);

  const initializeMemberData = useCallback(async () => {
    setIsInitializing(true);
    try {
      const result = await initializeDataWithRetry(['members'], 'Medlemsdata');
      toast({
        title: "Medlemsdata initialiserad",
        description: `Medlemsdata har hämtats och lagrats (försök ${result.attempt})`,
      });
    } catch (error) {
      console.error('Error initializing member data:', error);
      toast({
        title: "Fel vid initialisering av medlemsdata",
        description: error instanceof Error ? error.message : 'Okänt fel',
        variant: "destructive"
      });
    } finally {
      setIsInitializing(false);
    }
  }, [toast]);

  const initializeVoteData = useCallback(async () => {
    setIsInitializing(true);
    try {
      const result = await initializeDataWithRetry(['votes'], 'Röstningsdata');
      toast({
        title: "Röstningsdata initialiserad",
        description: `Röstningsdata har hämtats och lagrats (försök ${result.attempt})`,
      });
    } catch (error) {
      console.error('Error initializing vote data:', error);
      toast({
        title: "Fel vid initialisering av röstningsdata",
        description: error instanceof Error ? error.message : 'Okänt fel',
        variant: "destructive"
      });
    } finally {
      setIsInitializing(false);
    }
  }, [toast]);

  return {
    initializeAllData,
    initializeMemberData,
    initializeVoteData,
    isInitializing,
    progress
  };
};
