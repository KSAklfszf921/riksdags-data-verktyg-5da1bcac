
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Loader2, Play, Square, RefreshCw, Users, Info } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { Alert, AlertDescription } from './ui/alert';
import { BatchProgressDisplay } from './batch/BatchProgressDisplay';
import { BatchStatistics } from './batch/BatchStatistics';
import { BatchControls } from './batch/BatchControls';
import { BatchErrorList } from './batch/BatchErrorList';
import { useBatchProgress } from '../hooks/useBatchProgress';

const BatchNewsRunner = () => {
  const {
    progress,
    isPolling,
    lastUpdate,
    startBatchProcess,
    stopBatchProcess,
    refreshStatus
  } = useBatchProgress();

  const progressPercentage = progress.totalMembers > 0 
    ? Math.round((progress.processedMembers / progress.totalMembers) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Batch RSS Feed Hämtare (Chunked)</span>
            <Badge variant="outline" className={`text-white ${getBadgeColor(progress.status)}`}>
              {getBadgeIcon(progress.status)}
              <span className="ml-1 capitalize">{progress.status}</span>
            </Badge>
          </div>
          <BatchControls
            status={progress.status}
            onStart={startBatchProcess}
            onStop={stopBatchProcess}
            onRefresh={refreshStatus}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chunked Processing Info */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-1">
              <span className="font-medium">Chunked Processing:</span> Bearbetar 5 ledamöter åt gången för att undvika timeouts.
              <br />
              <span className="text-sm">Processen fortsätter automatiskt mellan chunks tills alla ledamöter är bearbetade.</span>
            </div>
          </AlertDescription>
        </Alert>

        <BatchProgressDisplay
          progress={progress}
          progressPercentage={progressPercentage}
          lastUpdate={lastUpdate}
        />
        
        <BatchStatistics progress={progress} />
        
        {progress.errors.length > 0 && (
          <BatchErrorList errors={progress.errors} />
        )}
      </CardContent>
    </Card>
  );
};

const getBadgeColor = (status: string) => {
  switch (status) {
    case 'running': return 'bg-blue-500';
    case 'completed': return 'bg-green-500';
    case 'paused': return 'bg-yellow-500';
    case 'error': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getBadgeIcon = (status: string) => {
  switch (status) {
    case 'running': return <Loader2 className="w-4 h-4 animate-spin" />;
    case 'completed': return <Play className="w-4 h-4" />;
    case 'paused': return <Square className="w-4 h-4" />;
    case 'error': return <Square className="w-4 h-4" />;
    default: return <Square className="w-4 h-4" />;
  }
};

export default BatchNewsRunner;
