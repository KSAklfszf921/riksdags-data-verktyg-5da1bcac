
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Download, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

const CalendarDataManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState<{
    events_processed?: number;
    errors?: number;
    duration_ms?: number;
  } | null>(null);

  const triggerCalendarSync = async () => {
    console.log('Triggering calendar data sync...');
    setIsLoading(true);
    setStatus('idle');
    setMessage('');
    setStats(null);

    try {
      console.log('Calling fetch-calendar-data edge function...');
      
      const { data, error } = await supabase.functions.invoke('fetch-calendar-data', {
        body: { 
          manual_trigger: true,
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Edge function error: ${error.message}`);
      }

      console.log('Edge function response:', data);

      if (data?.success) {
        setStatus('success');
        setMessage('Kalenderdatan har hämtats och sparats framgångsrikt!');
        setStats(data.stats || {});
      } else {
        setStatus('error');
        setMessage(data?.error || 'Okänt fel uppstod vid datahämtning');
      }

    } catch (err) {
      console.error('Error triggering calendar sync:', err);
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Kunde inte hämta kalenderdata');
    } finally {
      setIsLoading(false);
    }
  };

  const checkDatabaseStatus = async () => {
    console.log('Checking calendar database status...');
    setIsLoading(true);
    
    try {
      const { count, error } = await supabase
        .from('calendar_data')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Database check error:', error);
        setStatus('error');
        setMessage(`Databasfel: ${error.message}`);
      } else {
        setStatus('success');
        setMessage(`Databasen innehåller ${count || 0} kalenderhändelser`);
      }
    } catch (err) {
      console.error('Error checking database:', err);
      setStatus('error');
      setMessage('Kunde inte kontrollera databasstatus');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5" />
          <span>Kalenderdatahantering</span>
        </CardTitle>
        <CardDescription>
          Hantera hämtning och synkronisering av kalenderdata från Riksdagens API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={triggerCalendarSync} 
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Hämta kalenderdata</span>
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
              <RefreshCw className="w-4 h-4" />
            )}
            <span>Kontrollera databas</span>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Händelser processade</span>
              <Badge variant="secondary">{stats.events_processed || 0}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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

        <div className="text-sm text-gray-600">
          <p><strong>Instruktioner:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Klicka på "Hämta kalenderdata" för att manuellt trigga datahämtning från Riksdagens API</li>
            <li>Använd "Kontrollera databas" för att se hur många händelser som finns lagrade</li>
            <li>Edge-funktionen kommer att hämta data från flera olika API-endpoints</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarDataManager;
