
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { CheckCircle, AlertCircle, Loader2, Clock } from 'lucide-react';
import { ProgressStep } from '../hooks/useProgressTracker';

interface LoadingProgressProps {
  steps: ProgressStep[];
  progress: number;
  title?: string;
}

const LoadingProgress = ({ steps, progress, title = "Laddar data..." }: LoadingProgressProps) => {
  const getStepIcon = (step: ProgressStep) => {
    if (step.error) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    if (step.completed) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    
    // Check if this is the current step (first incomplete step)
    const currentStepIndex = steps.findIndex(s => !s.completed && !s.error);
    const thisStepIndex = steps.findIndex(s => s.id === step.id);
    
    if (thisStepIndex === currentStepIndex) {
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    }
    
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const getStepStatus = (step: ProgressStep) => {
    if (step.error) return 'error';
    if (step.completed) return 'completed';
    
    const currentStepIndex = steps.findIndex(s => !s.completed && !s.error);
    const thisStepIndex = steps.findIndex(s => s.id === step.id);
    
    if (thisStepIndex === currentStepIndex) return 'active';
    return 'pending';
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        <Progress value={progress} className="h-2" />
        <div className="text-sm text-gray-600">{progress}% färdigt</div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step) => {
            const status = getStepStatus(step);
            return (
              <div key={step.id} className="flex items-center space-x-3">
                {getStepIcon(step)}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${
                    status === 'completed' ? 'text-green-700' :
                    status === 'active' ? 'text-blue-700' :
                    status === 'error' ? 'text-red-700' :
                    'text-gray-500'
                  }`}>
                    {step.label}
                  </div>
                  {step.error && (
                    <div className="text-xs text-red-600 mt-1">{step.error}</div>
                  )}
                </div>
                <Badge variant={
                  status === 'completed' ? 'default' :
                  status === 'active' ? 'secondary' :
                  status === 'error' ? 'destructive' :
                  'outline'
                }>
                  {status === 'completed' ? 'Klar' :
                   status === 'active' ? 'Pågår' :
                   status === 'error' ? 'Fel' :
                   'Väntar'}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default LoadingProgress;
