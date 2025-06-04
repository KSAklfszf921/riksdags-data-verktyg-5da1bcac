
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InitializationProgress {
  currentStep: string;
  completed: number;
  total: number;
  errors: string[];
}

export const useDataInitializer = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [progress, setProgress] = useState<InitializationProgress>({
    currentStep: '',
    completed: 0,
    total: 0,
    errors: []
  });
  const { toast } = useToast();

  const updateProgress = (step: string, completed: number, total: number, error?: string) => {
    setProgress(prev => ({
      currentStep: step,
      completed,
      total,
      errors: error ? [...prev.errors, error] : prev.errors
    }));
  };

  const initializeAllData = useCallback(async () => {
    setIsInitializing(true);
    setProgress({ currentStep: '', completed: 0, total: 4, errors: [] });

    try {
      console.log('🚀 Starting comprehensive data initialization...');

      // Step 1: Initialize member data
      updateProgress('Initialiserar medlemsdata...', 0, 4);
      try {
        const { data: memberResult, error: memberError } = await supabase.functions.invoke('fetch-comprehensive-data', {
          body: { 
            types: ['members'], 
            forceRefresh: true,
            manual_trigger: true
          }
        });

        if (memberError) throw new Error(`Member sync error: ${memberError.message}`);
        console.log('✅ Member data initialization completed:', memberResult);
        updateProgress('Medlemsdata initialiserad', 1, 4);
      } catch (error) {
        const errorMsg = `Medlemsdata fel: ${error instanceof Error ? error.message : 'Okänt fel'}`;
        console.error('❌ Member data initialization failed:', error);
        updateProgress('Medlemsdata misslyckades', 1, 4, errorMsg);
      }

      // Step 2: Initialize document data
      updateProgress('Initialiserar dokumentdata...', 1, 4);
      try {
        const { data: docResult, error: docError } = await supabase.functions.invoke('fetch-comprehensive-data', {
          body: { 
            types: ['documents'], 
            forceRefresh: true,
            manual_trigger: true
          }
        });

        if (docError) throw new Error(`Document sync error: ${docError.message}`);
        console.log('✅ Document data initialization completed:', docResult);
        updateProgress('Dokumentdata initialiserad', 2, 4);
      } catch (error) {
        const errorMsg = `Dokumentdata fel: ${error instanceof Error ? error.message : 'Okänt fel'}`;
        console.error('❌ Document data initialization failed:', error);
        updateProgress('Dokumentdata misslyckades', 2, 4, errorMsg);
      }

      // Step 3: Initialize vote data
      updateProgress('Initialiserar röstningsdata...', 2, 4);
      try {
        const { data: voteResult, error: voteError } = await supabase.functions.invoke('fetch-comprehensive-data', {
          body: { 
            types: ['votes'], 
            forceRefresh: true,
            manual_trigger: true
          }
        });

        if (voteError) throw new Error(`Vote sync error: ${voteError.message}`);
        console.log('✅ Vote data initialization completed:', voteResult);
        updateProgress('Röstningsdata initialiserad', 3, 4);
      } catch (error) {
        const errorMsg = `Röstningsdata fel: ${error instanceof Error ? error.message : 'Okänt fel'}`;
        console.error('❌ Vote data initialization failed:', error);
        updateProgress('Röstningsdata misslyckades', 3, 4, errorMsg);
      }

      // Step 4: Initialize calendar data
      updateProgress('Initialiserar kalenderdata...', 3, 4);
      try {
        const { data: calResult, error: calError } = await supabase.functions.invoke('fetch-calendar-data', {
          body: { 
            manual_trigger: true,
            forceRefresh: true
          }
        });

        if (calError) throw new Error(`Calendar sync error: ${calError.message}`);
        console.log('✅ Calendar data initialization completed:', calResult);
        updateProgress('Kalenderdata initialiserad', 4, 4);
      } catch (error) {
        const errorMsg = `Kalenderdata fel: ${error instanceof Error ? error.message : 'Okänt fel'}`;
        console.error('❌ Calendar data initialization failed:', error);
        updateProgress('Kalenderdata misslyckades', 4, 4, errorMsg);
      }

      updateProgress('All data initialization completed', 4, 4);
      
      if (progress.errors.length === 0) {
        toast({
          title: "Datainitialisering slutförd",
          description: "All data har initialiserats framgångsrikt",
        });
      } else {
        toast({
          title: "Datainitialisering delvis slutförd",
          description: `${4 - progress.errors.length} av 4 datatyper initialiserade framgångsrikt`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ Comprehensive data initialization failed:', error);
      toast({
        title: "Initialiseringsfel",
        description: "Kunde inte initiera data",
        variant: "destructive"
      });
    } finally {
      setIsInitializing(false);
    }
  }, [toast, progress.errors.length]);

  const initializeMemberData = useCallback(async () => {
    setIsInitializing(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-comprehensive-data', {
        body: { types: ['members'], forceRefresh: true }
      });

      if (error) throw error;

      toast({
        title: "Medlemsdata initialiserad",
        description: "Medlemsdata har hämtats och lagrats",
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
      const { data, error } = await supabase.functions.invoke('fetch-comprehensive-data', {
        body: { types: ['votes'], forceRefresh: true }
      });

      if (error) throw error;

      toast({
        title: "Röstningsdata initialiserad",
        description: "Röstningsdata har hämtats och lagrats",
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
