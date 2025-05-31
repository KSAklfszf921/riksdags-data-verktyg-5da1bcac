
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Loader2, Play, Square, RefreshCw, Rss, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { Alert, AlertDescription } from './ui/alert';

interface BatchJob {
  id: string;
  job_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string | null;
  completed_at: string | null;
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  error_details: any;
  config: any;
  created_at: string;
  updated_at: string;
}

const NewBatchRssRunner = () => {
  const [currentJob, setCurrentJob] = useState<BatchJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [recentJobs, setRecentJobs] = useState<BatchJob[]>([]);

  useEffect(() => {
    loadRecentJobs();
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isPolling && currentJob && currentJob.status === 'running') {
      intervalId = setInterval(async () => {
        await checkJobStatus();
      }, 2000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPolling, currentJob]);

  const loadRecentJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('feed_batch_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      // Type cast the data to ensure proper typing
      const typedJobs = (data || []).map(job => ({
        ...job,
        status: job.status as BatchJob['status']
      })) as BatchJob[];
      
      setRecentJobs(typedJobs);

      // Check if there's a currently running job
      const runningJob = typedJobs.find(job => job.status === 'running');
      if (runningJob) {
        setCurrentJob(runningJob);
        setIsPolling(true);
      }
    } catch (error) {
      console.error('Error loading recent jobs:', error);
    }
  };

  const checkJobStatus = async () => {
    if (!currentJob) return;

    try {
      const { data, error } = await supabase
        .from('feed_batch_jobs')
        .select('*')
        .eq('id', currentJob.id)
        .single();

      if (error) throw error;

      // Type cast the data to ensure proper typing
      const typedJob = {
        ...data,
        status: data.status as BatchJob['status']
      } as BatchJob;

      setCurrentJob(typedJob);
      setLastUpdate(new Date());

      if (typedJob.status === 'completed' || typedJob.status === 'failed' || typedJob.status === 'cancelled') {
        setIsPolling(false);
        loadRecentJobs();
      }
    } catch (error) {
      console.error('Error checking job status:', error);
    }
  };

  const startNewBatch = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('batch-rss-fetcher', {
        body: { action: 'start' }
      });

      if (error) throw error;

      if (data?.jobId) {
        await loadRecentJobs();
        const newJob = recentJobs.find(job => job.id === data.jobId);
        if (newJob) {
          setCurrentJob(newJob);
          setIsPolling(true);
        }
      }
    } catch (error) {
      console.error('Error starting batch job:', error);
    }
  };

  const cancelCurrentJob = async () => {
    if (!currentJob) return;

    try {
      const { error } = await supabase.functions.invoke('batch-rss-fetcher', {
        body: { action: 'cancel', jobId: currentJob.id }
      });

      if (error) throw error;

      setIsPolling(false);
      await checkJobStatus();
    } catch (error) {
      console.error('Error cancelling job:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'cancelled': return <Square className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDuration = (startTime: string | null, endTime: string | null) => {
    if (!startTime) return '';
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = end.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = currentJob && currentJob.total_items > 0 
    ? Math.round((currentJob.processed_items / currentJob.total_items) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Rss className="w-5 h-5" />
              <span>Ny Batch RSS Fetcher</span>
              {currentJob && (
                <Badge variant="outline" className={`text-white ${getStatusColor(currentJob.status)}`}>
                  {getStatusIcon(currentJob.status)}
                  <span className="ml-1 capitalize">{currentJob.status}</span>
                </Badge>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadRecentJobs}
                disabled={isPolling}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              {currentJob?.status === 'running' ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={cancelCurrentJob}
                >
                  <Square className="w-4 h-4 mr-1" />
                  Avbryt
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={startNewBatch}
                  disabled={currentJob?.status === 'running'}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Starta Batch
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentJob ? (
            <>
              {/* Progress Section */}
              {currentJob.total_items > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Framsteg: {currentJob.processed_items} / {currentJob.total_items} objekt</span>
                    <span className="font-medium">{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="w-full" />
                </div>
              )}

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{currentJob.total_items}</div>
                  <div className="text-sm text-blue-700">Totalt objekt</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{currentJob.successful_items}</div>
                  <div className="text-sm text-green-700">Lyckade</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{currentJob.failed_items}</div>
                  <div className="text-sm text-red-700">Misslyckade</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-600">{currentJob.processed_items}</div>
                  <div className="text-sm text-gray-700">Bearbetade</div>
                </div>
              </div>

              {/* Timing Information */}
              {currentJob.started_at && (
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Varaktighet:</span> {formatDuration(currentJob.started_at, currentJob.completed_at)}
                  </div>
                  <div>
                    <span className="font-medium">Startad:</span> {new Date(currentJob.started_at).toLocaleString('sv-SE')}
                  </div>
                  {currentJob.completed_at && (
                    <div>
                      <span className="font-medium">Avslutad:</span> {new Date(currentJob.completed_at).toLocaleString('sv-SE')}
                    </div>
                  )}
                  {lastUpdate && (
                    <div>
                      <span className="font-medium">Senaste uppdatering:</span> {lastUpdate.toLocaleTimeString('sv-SE')}
                    </div>
                  )}
                </div>
              )}

              {/* Error Details */}
              {currentJob.error_details && (
                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <div className="font-medium">Fel inträffade:</div>
                    <pre className="text-xs mt-1 overflow-x-auto">{JSON.stringify(currentJob.error_details, null, 2)}</pre>
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Inga aktiva jobb för närvarande. Klicka på "Starta Batch" för att börja hämta RSS feeds från alla aktiva källor.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      {recentJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Senaste jobb</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className={`text-white ${getStatusColor(job.status)}`}>
                      {getStatusIcon(job.status)}
                      <span className="ml-1 capitalize">{job.status}</span>
                    </Badge>
                    <div>
                      <div className="text-sm font-medium">
                        {job.processed_items}/{job.total_items} objekt bearbetade
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(job.created_at).toLocaleString('sv-SE')}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {job.started_at && formatDuration(job.started_at, job.completed_at)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NewBatchRssRunner;
