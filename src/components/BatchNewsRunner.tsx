import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Loader2, Play, Square, RefreshCw, Users, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { Alert, AlertDescription } from './ui/alert';

interface BatchProgress {
  totalMembers: number;
  processedMembers: number;
  successfulFetches: number;
  failedFetches: number;
  currentMember: string;
  status: 'idle' | 'running' | 'completed' | 'paused' | 'error';
  startTime: string;
  estimatedCompletion?: string;
  errors: Array<{ memberName: string; error: string }>;
  totalRssItems: number;
  currentBatchRssItems: number;
}

const BatchNewsRunner = () => {
  const [progress, setProgress] = useState<BatchProgress>({
    totalMembers: 0,
    processedMembers: 0,
    successfulFetches: 0,
    failedFetches: 0,
    currentMember: '',
    status: 'idle',
    startTime: '',
    errors: [],
    totalRssItems: 0,
    currentBatchRssItems: 0
  });
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Poll for progress updates more frequently for better responsiveness
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isPolling && progress.status === 'running') {
      intervalId = setInterval(async () => {
        try {
          const { data, error } = await supabase.functions.invoke('fetch-all-members-news', {
            body: { action: 'status' }
          });

          if (error) {
            console.error('Error polling progress:', error);
            return;
          }

          if (data?.progress) {
            setProgress(data.progress);
            setLastUpdate(new Date());

            // Stop polling if completed or error
            if (data.progress.status === 'completed' || data.progress.status === 'error') {
              setIsPolling(false);
            }
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 1000); // Poll every 1 second for more responsive updates
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPolling, progress.status]);

  const startBatchProcess = async () => {
    try {
      setIsPolling(true);
      
      const { data, error } = await supabase.functions.invoke('fetch-all-members-news', {
        body: { action: 'start' }
      });

      if (error) {
        throw error;
      }

      if (data?.progress) {
        setProgress(data.progress);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error starting batch process:', error);
      setIsPolling(false);
      setProgress(prev => ({
        ...prev,
        status: 'error',
        errors: [...prev.errors, { memberName: 'System', error: error instanceof Error ? error.message : 'Unknown error' }]
      }));
    }
  };

  const stopBatchProcess = async () => {
    try {
      const { error } = await supabase.functions.invoke('fetch-all-members-news', {
        body: { action: 'stop' }
      });

      if (error) {
        throw error;
      }

      setIsPolling(false);
      setProgress(prev => ({ ...prev, status: 'paused' }));
    } catch (error) {
      console.error('Error stopping batch process:', error);
    }
  };

  const refreshStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-all-members-news', {
        body: { action: 'status' }
      });

      if (error) {
        throw error;
      }

      if (data?.progress) {
        setProgress(data.progress);
        setLastUpdate(new Date());
        
        // Start polling if it's running
        if (data.progress.status === 'running') {
          setIsPolling(true);
        }
      }
    } catch (error) {
      console.error('Error refreshing status:', error);
    }
  };

  const progressPercentage = progress.totalMembers > 0 
    ? Math.round((progress.processedMembers / progress.totalMembers) * 100)
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'paused': return <Square className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDuration = (startTime: string) => {
    if (!startTime) return '';
    const start = new Date(startTime);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>En-i-taget RSS Feed Hämtare</span>
            <Badge variant="outline" className={`text-white ${getStatusColor(progress.status)}`}>
              {getStatusIcon(progress.status)}
              <span className="ml-1 capitalize">{progress.status}</span>
            </Badge>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshStatus}
              disabled={progress.status === 'running'}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            {progress.status === 'running' ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={stopBatchProcess}
              >
                <Square className="w-4 h-4 mr-1" />
                Stoppa
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={startBatchProcess}
                disabled={progress.status === 'running'}
              >
                <Play className="w-4 h-4 mr-1" />
                Starta
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Live Progress Section */}
        {progress.totalMembers > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Framsteg: {progress.processedMembers} / {progress.totalMembers} ledamöter</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
            
            {progress.currentMember && progress.status === 'running' && (
              <div className="text-sm text-gray-600 animate-pulse">
                <span className="font-medium">Bearbetar just nu:</span> {progress.currentMember}
              </div>
            )}

            {/* Live RSS Items Counter */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-1">
                RSS-objekt Live-räkning
              </div>
              <div className="flex justify-between text-sm text-blue-700">
                <span>Totalt hämtade: <span className="font-bold">{progress.totalRssItems}</span></span>
                {progress.status === 'running' && progress.currentBatchRssItems > 0 && (
                  <span className="animate-pulse">Senaste batch: <span className="font-bold">{progress.currentBatchRssItems}</span></span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{progress.totalMembers}</div>
            <div className="text-sm text-blue-700">Totalt ledamöter</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{progress.successfulFetches}</div>
            <div className="text-sm text-green-700">Lyckade</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{progress.failedFetches}</div>
            <div className="text-sm text-red-700">Misslyckade</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{progress.totalRssItems}</div>
            <div className="text-sm text-purple-700">RSS-objekt</div>
          </div>
        </div>

        {/* Timing Information */}
        {progress.startTime && (
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Varaktighet:</span> {formatDuration(progress.startTime)}
            </div>
            {progress.estimatedCompletion && progress.status === 'running' && (
              <div>
                <span className="font-medium">Beräknad slutförd:</span> {progress.estimatedCompletion}
              </div>
            )}
            {lastUpdate && (
              <div>
                <span className="font-medium">Senast uppdaterad:</span> {lastUpdate.toLocaleTimeString('sv-SE')}
              </div>
            )}
          </div>
        )}

        {/* Status Information */}
        {progress.status === 'idle' && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Klicka "Starta" för att börja hämta RSS-feeds för alla aktiva riksdagsledamöter. 
              Processen kör en ledamot i taget med 2-sekunders fördröjning mellan varje för att respektera hastighetsbegränsningar.
            </AlertDescription>
          </Alert>
        )}

        {progress.status === 'completed' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Batch-bearbetning slutförd! Bearbetade {progress.totalMembers} ledamöter 
              med {progress.successfulFetches} lyckade hämtningar, {progress.failedFetches} misslyckanden 
              och totalt {progress.totalRssItems} RSS-objekt hämtade.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Summary */}
        {progress.errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-red-600">Senaste fel ({progress.errors.length})</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {progress.errors.slice(-5).map((error, index) => (
                <div key={index} className="text-sm bg-red-50 p-2 rounded border border-red-200">
                  <span className="font-medium">{error.memberName}:</span> {error.error}
                </div>
              ))}
              {progress.errors.length > 5 && (
                <div className="text-xs text-gray-500 text-center">
                  ... och {progress.errors.length - 5} fler fel
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BatchNewsRunner;
