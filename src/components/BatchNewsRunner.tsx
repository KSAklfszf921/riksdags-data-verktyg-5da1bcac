
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Users,
  Rss
} from 'lucide-react';
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

  const getStatusColor = () => {
    switch (progress.status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'running':
        return 'bg-blue-500';
      case 'paused':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (progress.status) {
      case 'completed':
        return 'Slutförd';
      case 'error':
        return 'Fel';
      case 'running':
        return 'Körs';
      case 'paused':
        return 'Pausad';
      default:
        return 'Redo';
    }
  };

  const completionPercentage = progress.totalMembers > 0 
    ? Math.round((progress.processedMembers / progress.totalMembers) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Rss className="w-5 h-5" />
              <span>Batch RSS-hämtning</span>
            </div>
            <Badge className={getStatusColor()}>
              {getStatusText()}
            </Badge>
          </CardTitle>
          <CardDescription>
            Hämta RSS-nyheter för alla ledamöter i bakgrunden
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {progress.totalMembers}
              </div>
              <div className="text-sm text-gray-600">Totalt ledamöter</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {progress.processedMembers}
              </div>
              <div className="text-sm text-gray-600">Bearbetade</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {progress.successfulFetches}
              </div>
              <div className="text-sm text-gray-600">Lyckade</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {progress.failedFetches}
              </div>
              <div className="text-sm text-gray-600">Misslyckade</div>
            </div>
          </div>

          {/* Progress Bar */}
          {progress.totalMembers > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Framsteg</span>
                <span>{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-3" />
              {progress.currentMember && (
                <p className="text-sm text-gray-600">
                  Bearbetar: {progress.currentMember}
                </p>
              )}
            </div>
          )}

          {/* RSS Stats */}
          {(progress.totalRssItems > 0 || progress.currentBatchRssItems > 0) && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-xl font-bold text-indigo-600">
                  {progress.totalRssItems}
                </div>
                <div className="text-sm text-gray-600">Totala RSS-inlägg</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-orange-600">
                  {progress.currentBatchRssItems}
                </div>
                <div className="text-sm text-gray-600">Senaste batch</div>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={startBatchProcess}
              disabled={progress.status === 'running'}
              className="flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Starta batch</span>
            </Button>

            <Button
              variant="outline"
              onClick={stopBatchProcess}
              disabled={progress.status !== 'running'}
              className="flex items-center space-x-2"
            >
              <Pause className="w-4 h-4" />
              <span>Pausa</span>
            </Button>

            <Button
              variant="ghost"
              onClick={refreshStatus}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Uppdatera status</span>
            </Button>
          </div>

          {/* Status Information */}
          {progress.startTime && (
            <div className="text-sm text-gray-600">
              <p>Startad: {new Date(progress.startTime).toLocaleString('sv-SE')}</p>
              {lastUpdate && (
                <p>Senast uppdaterad: {lastUpdate.toLocaleString('sv-SE')}</p>
              )}
            </div>
          )}

          {/* Errors */}
          {progress.errors.length > 0 && (
            <Card className="border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-700 text-lg flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>Fel ({progress.errors.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {progress.errors.slice(-10).map((error, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{error.memberName}:</span>{' '}
                      <span className="text-red-600">{error.error}</span>
                    </div>
                  ))}
                  {progress.errors.length > 10 && (
                    <p className="text-xs text-gray-500">
                      ...och {progress.errors.length - 10} fler fel
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <div className="text-sm text-gray-600">
        <p><strong>Information:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Batch-processen hämtar RSS-nyheter för alla aktiva ledamöter</li>
          <li>Processen körs i bakgrunden och kan ta lång tid att slutföra</li>
          <li>Du kan pausa och återuppta processen när som helst</li>
          <li>Status uppdateras automatiskt under körning</li>
        </ul>
      </div>
    </div>
  );
};

export default BatchNewsRunner;
