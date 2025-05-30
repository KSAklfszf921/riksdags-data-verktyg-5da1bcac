
import { useState, useCallback } from 'react';

export interface ProgressStep {
  id: string;
  label: string;
  completed: boolean;
  error?: string;
}

export const useProgressTracker = (initialSteps: Omit<ProgressStep, 'completed'>[]) => {
  const [steps, setSteps] = useState<ProgressStep[]>(
    initialSteps.map(step => ({ ...step, completed: false }))
  );

  const updateStep = useCallback((stepId: string, completed: boolean, error?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed, error } : step
    ));
  }, []);

  const resetSteps = useCallback(() => {
    setSteps(prev => prev.map(step => ({ ...step, completed: false, error: undefined })));
  }, []);

  const getProgress = useCallback(() => {
    const completedSteps = steps.filter(step => step.completed).length;
    return Math.round((completedSteps / steps.length) * 100);
  }, [steps]);

  return {
    steps,
    updateStep,
    resetSteps,
    progress: getProgress()
  };
};
