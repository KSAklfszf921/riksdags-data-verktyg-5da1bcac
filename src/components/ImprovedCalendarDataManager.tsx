
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Calendar, Download, AlertCircle, CheckCircle, RefreshCw, Database, Clock } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { enhancedCalendarApi } from '@/services/enhancedCalendarApi';

const ImprovedCalendarDataManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [dbStatus, setDbStatus] = useState<{count: number, lastUpdate: string} | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('');
  const [stats, setStats] = useState<{
    events_fetched?: number;
    events_stored?: number;
    errors?: number;
    duration_ms?: number;
  } | null>(null);

  const triggerEnhancedCalendarSync = async () => {
    console.log('Starting enhanced calendar data sync...');
    setIsLoading(true);
    setStatus('idle');
    setMessage('');
    setStats(null);
    setProgress(0);

    const startTime = Date.now();

    try {
      setCurrentOperation('Initialiserar API-anrop...');
      setProgress(10);

      // Fetch events using enhanced API with rate limiting
      setCurrentOperation('Hämtar kalenderhändelser med förbättrad rate limiting...');
      setProgress(30);
      
      const events = await enhancedCalendarApi.fetchCalendarEvents();
      
      setCurrentOperation(`Bearbetar ${events.length} händelser...`);
      setProgress(60);

      // Store events in database
      setCurrentOperation('Sparar händelser i databasen...');
      setProgress(80);
      
      const stored = await enhancedCalendarApi.storeEventsInDatabase(events);
      
      setCurrentOperation('Slutför synkronisering...');
      setProgress(100);

      const duration = Date.now() - startTime;
      
      setStats({
        events_fetched: events.length,
        events_stored: stored,
        errors: events.length - stored,
        duration_ms: duration
      });

      setStatus('success');
      setMessage(`Kalenderdatan har hämtats och sparats framgångsrikt! ${stored}/${events.length} händelser sparade.`);
      
      // Refresh database status
      await checkDatabaseStatus();

    } catch (err) {
      console.error('Error in enhanced calendar sync:', err);
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Okänt fel uppstod vid datahämtning');
    } finally {
      setIsLoading(false);
      setCurrentOperation('');
      setProgress(0);
    }
  };

  const triggerEdgeFunctionSync = async () => {
    console.log('Triggering edge function calendar sync...');
    setIsLoading(true);
    setStatus('idle');
    setMessage('');
    setStats(null);

    try {
      setCurrentOperation('Anropar edge function...');
      
      const { data, error } = await supabase.functions.invoke('fetch-calendar-data', {
        body: { 
          manual_trigger: true,
          enhanced_mode: true,
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Edge function error: ${error.message}`);
      }

      if (data?.success) {
        setStatus('success');
        setMessage('Edge function har kört framgångsrikt!');
        setStats(data.stats || {});
        await checkDatabaseStatus();
      } else {
        setStatus('error');
        setMessage(data?.error || 'Okänt fel från edge function');
      }

    } catch (err) {
      console.error('Error triggering edge function:', err);
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Kunde inte anropa edge function');
    } finally {
      setIsLoading(false);
      setCurrentOperation('');
    }
  };

  const checkDatabaseStatus = async () => {
    try {
      const { count, error } = await supabase
        .from('calendar_data')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Database check error:', error);
        setStatus('error');
        setMessage(`Databasfel: ${error.message}`);
      } else {
        const { data: latestData } = await supabase
          .from('calendar_data')
          .select('updated_at')
          .order('updated_at', { ascending: false })
          .limit(1);

        const lastUpdate = latestData?.[0]?.updated_at || 'Aldrig';
        
        setDbStatus({
          count: count || 0,
          lastUpdate: lastUpdate
        });
        
        if (status === 'idle') {
          setStatus('success');
          setMessage(`Databasen innehåller ${count || 0} kalenderhändelser`);
        }
      }
    } catch (err) {
      console.error('Error checking database:', err);
      setStatus('error');
      setMessage('Kunde inte kontrollera databasstatus');
    }
  };

  const clearDatabase = async () => {
    if (!confirm('Är du säker på att du vill rensa alla kalenderhändelser?')) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('calendar_data')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        setStatus('error');
        setMessage(`Fel vid rensning: ${error.message}`);
      } else {
        setStatus('success');
        setMessage('Databasen har rensats');
        setDbStatus({ count: 0, lastUpdate: 'Aldrig' });
      }
    } catch (err) {
      setStatus('error');
      setMessage('Kunde inte rensa databasen');
    } finally {
      setIsLoading(false);
    }
  };

  // Check database status on component mount
  React.useEffect(() => {
    checkDatabaseStatus();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5" />
          <span>Förbättrad Kalenderdatahantering</span>
        </CardTitle>
        <CardDescription>
          Hantera hämtning och synkronisering av kalenderdata med förbättrad rate limiting och felhantering
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Database Status */}
        {dbStatus && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium flex items-center space-x-2 mb-2">
              <Database className="w-4 h-4" />
              <span>Databasstatus</span>
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Antal händelser:</span>
                <Badge variant="secondary" className="ml-2">{dbStatus.count}</Badge>
              </div>
              <div>
                <span className="text-gray-600">Senast uppdaterad:</span>
                <span className="ml-2">{dbStatus.lastUpdate !== 'Aldrig' ? new Date(dbStatus.lastUpdate).toLocaleString('sv-SE') : 'Aldrig'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Progress indicator */}
        {isLoading && progress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{currentOperation}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={triggerEnhancedCalendarSync} 
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Förbättrad API-hämtning</span>
          </Button>

          <Button 
            variant="outline"
            onClick={triggerEdgeFunctionSync} 
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>Edge Function</span>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={checkDatabaseStatus} 
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            <span>Kontrollera databas</span>
          </Button>

          <Button 
            variant="destructive" 
            onClick={clearDatabase} 
            disabled={isLoading || !dbStatus || dbStatus.count === 0}
            className="flex items-center space-x-2"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Rensa databas</span>
          </Button>
        </div>

        {status !== 'idle' && (
          <Alert variant={status === 'error' ? 'destructive' : 'default'}>
            {status === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">Händelser hämtade</span>
              <Badge variant="secondary">{stats.events_fetched || 0}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium">Händelser sparade</span>
              <Badge variant="secondary">{stats.events_stored || 0}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium">Fel</span>
              <Badge variant={stats.errors ? 'destructive' : 'secondary'}>
                {stats.errors || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Tid (ms)</span>
              <Badge variant="outline">{stats.duration_ms || 0}</Badge>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
          <p><strong>Förbättringar:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Intelligent rate limiting (max 10 förfrågningar per minut)</li>
            <li>Exponentiell backoff vid fel med jitter</li>
            <li>Automatisk återförsök med förbättrad felhantering</li>
            <li>Batch-processing för databasoperationer</li>
            <li>Mock data som fallback vid API-fel</li>
            <li>Detaljerad progress-rapportering</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImprovedCalendarDataManager;
