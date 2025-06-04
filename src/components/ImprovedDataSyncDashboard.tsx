
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlayCircle, PauseCircle, RefreshCw, Download } from "lucide-react";
import DuplicateFilter from './DuplicateFilter';
import ErrorHandler from './ErrorHandler';
import SyncHealthMonitor from './SyncHealthMonitor';
import SchemaOptimizer from './SchemaOptimizer';

interface SyncState {
  isRunning: boolean;
  progress: number;
  stage: string;
  recordsProcessed: number;
  totalRecords: number;
  duplicatesFound: number;
  duplicatesRemoved: number;
  errors: any[];
}

const ImprovedDataSyncDashboard: React.FC = () => {
  const [syncState, setSyncState] = useState<SyncState>({
    isRunning: false,
    progress: 0,
    stage: 'Ready',
    recordsProcessed: 0,
    totalRecords: 0,
    duplicatesFound: 0,
    duplicatesRemoved: 0,
    errors: []
  });

  const [optimizationSuggestions, setOptimizationSuggestions] = useState([
    {
      table: 'members',
      type: 'index' as const,
      description: 'Add composite index on (party, status) for faster filtering',
      impact: 'high' as const,
      implemented: false
    },
    {
      table: 'votes',
      type: 'partition' as const,
      description: 'Partition by date range for improved query performance',
      impact: 'medium' as const,
      implemented: false
    }
  ]);

  const startSync = () => {
    setSyncState(prev => ({ ...prev, isRunning: true, progress: 0, stage: 'Initializing' }));
    
    // Simulate sync process
    const interval = setInterval(() => {
      setSyncState(prev => {
        const newProgress = Math.min(prev.progress + Math.random() * 10, 100);
        const newDuplicates = prev.duplicatesFound + Math.floor(Math.random() * 3);
        
        let stage = 'Processing';
        if (newProgress > 80) stage = 'Finalizing';
        if (newProgress >= 100) stage = 'Complete';

        return {
          ...prev,
          progress: newProgress,
          stage,
          recordsProcessed: Math.floor((newProgress / 100) * 1000),
          totalRecords: 1000,
          duplicatesFound: newDuplicates,
          duplicatesRemoved: Math.floor(newDuplicates * 0.8),
          isRunning: newProgress < 100
        };
      });
    }, 1000);

    setTimeout(() => clearInterval(interval), 12000);
  };

  const stopSync = () => {
    setSyncState(prev => ({ ...prev, isRunning: false, stage: 'Stopped' }));
  };

  const handleRetryError = (errorId: string) => {
    setSyncState(prev => ({
      ...prev,
      errors: prev.errors.filter(error => error.id !== errorId)
    }));
  };

  const handleDismissError = (errorId: string) => {
    setSyncState(prev => ({
      ...prev,
      errors: prev.errors.filter(error => error.id !== errorId)
    }));
  };

  const handleImplementOptimization = (suggestion: any) => {
    setOptimizationSuggestions(prev =>
      prev.map(s => s === suggestion ? { ...s, implemented: true } : s)
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Improved Data Synchronization</span>
            <div className="flex gap-2">
              <Button
                onClick={syncState.isRunning ? stopSync : startSync}
                disabled={syncState.isRunning && syncState.progress >= 100}
                className="flex items-center gap-2"
              >
                {syncState.isRunning ? (
                  <>
                    <PauseCircle className="w-4 h-4" />
                    Stop Sync
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    Start Sync
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status: {syncState.stage}</span>
            <Badge variant={syncState.isRunning ? "default" : "secondary"}>
              {syncState.isRunning ? "Running" : "Idle"}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{syncState.progress.toFixed(1)}%</span>
            </div>
            <Progress value={syncState.progress} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Records Processed:</span>
              <span className="ml-2 font-medium">
                {syncState.recordsProcessed.toLocaleString()} / {syncState.totalRecords.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Duplicates Removed:</span>
              <span className="ml-2 font-medium">{syncState.duplicatesRemoved}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DuplicateFilter
          duplicatesFound={syncState.duplicatesFound}
          duplicatesRemoved={syncState.duplicatesRemoved}
          isActive={syncState.isRunning}
        />
        
        <SyncHealthMonitor isActive={syncState.isRunning} />
        
        <ErrorHandler
          errors={syncState.errors}
          onRetry={handleRetryError}
          onDismiss={handleDismissError}
          maxRetries={3}
        />
        
        <SchemaOptimizer
          suggestions={optimizationSuggestions}
          onImplement={handleImplementOptimization}
          isAnalyzing={syncState.isRunning}
        />
      </div>
    </div>
  );
};

export default ImprovedDataSyncDashboard;
