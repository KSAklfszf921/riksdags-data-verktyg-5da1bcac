
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Calendar, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Database
} from 'lucide-react';
import { DatabaseService, type RefreshResult } from '../services/databaseService';

const CalendarDataManager = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshResult, setRefreshResult] = useState<RefreshResult | null>(null);

  const handleRefreshCalendar = async () => {
    try {
      setRefreshing(true);
      setRefreshResult(null);
      console.log('Startar kalenderuppdatering...');
      
      const result = await DatabaseService.refreshCalendarData();
      setRefreshResult(result);
      setLastRefresh(new Date());
      
      if (result.success) {
        console.log('Kalenderuppdatering slutförd framgångsrikt');
      } else {
        console.error('Kalenderuppdatering misslyckades:', result.errors);
      }
    } catch (error) {
      console.error('Fel under kalenderuppdatering:', error);
      setRefreshResult({
        success: false,
        message: `Kalenderuppdatering misslyckades: ${error instanceof Error ? error.message : 'Okänt fel'}`
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Kalenderdata</span>
          </CardTitle>
          <CardDescription>
            Hämta och uppdatera kalenderdata från Riksdagens API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleRefreshCalendar}
              disabled={refreshing}
              className="flex items-center space-x-2"
            >
              {refreshing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              <span>
                {refreshing ? 'Uppdaterar kalender...' : 'Uppdatera Kalenderdata'}
              </span>
            </Button>
          </div>

          {lastRefresh && (
            <p className="text-sm text-gray-600 mt-3">
              Senaste uppdatering: {lastRefresh.toLocaleString('sv-SE')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Refresh Result */}
      {refreshResult && (
        <Card>
          <CardContent className="pt-6">
            <div className={`flex items-start space-x-3 ${refreshResult.success ? 'text-green-700' : 'text-red-700'}`}>
              {refreshResult.success ? (
                <CheckCircle className="w-5 h-5 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium">{refreshResult.message}</p>
                {refreshResult.duration && (
                  <p className="text-sm opacity-75">Tid: {refreshResult.duration}ms</p>
                )}
                {refreshResult.errors && refreshResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Fel som uppstod:</p>
                    <ul className="text-sm list-disc list-inside">
                      {refreshResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-gray-600">
        <p><strong>Instruktioner:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Klicka på "Uppdatera Kalenderdata" för att hämta senaste kalenderdata från Riksdagens API</li>
          <li>Kalenderdata inkluderar kommande sammanträden, utskottsmöten och andra parlamentariska aktiviteter</li>
          <li>Data hämtas och lagras automatiskt i Supabase-databasen</li>
        </ul>
      </div>
    </div>
  );
};

export default CalendarDataManager;
