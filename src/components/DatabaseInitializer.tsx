
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { 
  DatabaseService,
  type TableStatus,
  type RefreshResult
} from '../services/databaseService';
import DatabaseStatus from './DatabaseStatus';

const DatabaseInitializer = () => {
  const [dataStatus, setDataStatus] = useState<TableStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshResult, setRefreshResult] = useState<RefreshResult | null>(null);

  const loadDataStatus = async () => {
    try {
      setLoading(true);
      console.log('Laddar datastatus...');
      const status = await DatabaseService.getDataStatus();
      setDataStatus(status);
      console.log('Datastatus laddad:', status);
    } catch (error) {
      console.error('Fel vid laddning av datastatus:', error);
      setDataStatus([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeAll = async () => {
    try {
      setInitializing(true);
      setRefreshResult(null);
      console.log('Startar databasinitiering...');
      
      const result = await DatabaseService.initializeAllDatabases();
      setRefreshResult(result);
      setLastRefresh(new Date());
      
      if (result.success) {
        console.log('Databasinitiering slutförd framgångsrikt');
        setTimeout(() => loadDataStatus(), 2000);
      } else {
        console.error('Databasinitiering misslyckades:', result.errors);
      }
    } catch (error) {
      console.error('Fel under initiering:', error);
      setRefreshResult({
        success: false,
        message: `Initiering misslyckades: ${error instanceof Error ? error.message : 'Okänt fel'}`
      });
    } finally {
      setInitializing(false);
    }
  };

  const handleRefreshAll = async () => {
    try {
      setRefreshing(true);
      setRefreshResult(null);
      console.log('Startar omfattande datauppdatering...');
      
      const result = await DatabaseService.refreshAllData();
      setRefreshResult(result);
      setLastRefresh(new Date());
      
      if (result.success) {
        console.log('Datauppdatering slutförd framgångsrikt');
        setTimeout(() => loadDataStatus(), 2000);
      } else {
        console.error('Datauppdatering misslyckades:', result.errors);
      }
    } catch (error) {
      console.error('Fel under uppdatering:', error);
      setRefreshResult({
        success: false,
        message: `Uppdatering misslyckades: ${error instanceof Error ? error.message : 'Okänt fel'}`
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDataStatus();
    
    // Auto-refresh status every 5 minutes
    const interval = setInterval(loadDataStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Database Status Component */}
      <DatabaseStatus />

      {/* API Status Alert */}
      {refreshResult?.apiStatus && (
        <Alert className={refreshResult.apiStatus.available ? "border-green-500" : "border-yellow-500"}>
          <div className="flex items-center space-x-2">
            {refreshResult.apiStatus.available ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-yellow-600" />
            )}
            <AlertDescription>
              {refreshResult.apiStatus.available ? (
                <span className="text-green-800">
                  ✅ Riksdagens API är tillgängligt - riktig data används
                </span>
              ) : (
                <span className="text-yellow-800">
                  ⚠️ Riksdagens API är inte tillgängligt - testdata används för demonstration
                </span>
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Databasåtgärder</CardTitle>
          <CardDescription>
            Initiera databaser och hämta data från Riksdagens API (eller testdata om API:t inte är tillgängligt)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleInitializeAll}
              disabled={initializing || refreshing}
              className="flex items-center space-x-2"
            >
              {initializing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              <span>
                {initializing ? 'Initierar...' : 'Initiera Alla Databaser'}
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={handleRefreshAll}
              disabled={initializing || refreshing}
              className="flex items-center space-x-2"
            >
              {refreshing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>
                {refreshing ? 'Uppdaterar...' : 'Uppdatera All Data'}
              </span>
            </Button>

            <Button
              variant="ghost"
              onClick={loadDataStatus}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <Database className="w-4 h-4" />
              <span>Kontrollera Status</span>
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
                <div className="whitespace-pre-line">
                  <p className="font-medium">{refreshResult.message}</p>
                </div>
                {refreshResult.duration && (
                  <p className="text-sm opacity-75 mt-1">Tid: {refreshResult.duration}ms</p>
                )}
                {refreshResult.stats && (
                  <div className="text-sm opacity-75 mt-2">
                    <p>Bearbetade data:</p>
                    <ul className="list-disc list-inside ml-4">
                      {refreshResult.stats.parties_processed > 0 && (
                        <li>{refreshResult.stats.parties_processed} partier</li>
                      )}
                      {refreshResult.stats.members_processed > 0 && (
                        <li>{refreshResult.stats.members_processed} ledamöter</li>
                      )}
                      {refreshResult.stats.documents_processed > 0 && (
                        <li>{refreshResult.stats.documents_processed} dokument</li>
                      )}
                    </ul>
                  </div>
                )}
                {refreshResult.errors && refreshResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Information:</p>
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
          <li>Klicka på "Initiera Alla Databaser" för att skapa och fylla alla databastabeller</li>
          <li>Systemet försöker hämta riktig data från Riksdagens API först</li>
          <li>Om API:t inte är tillgängligt används testdata för demonstration</li>
          <li>Databasstatus uppdateras automatiskt var 5:e minut</li>
          <li>
            <span className="inline-flex items-center space-x-1">
              <Wifi className="w-3 h-3 text-green-600" />
              <span>= API tillgängligt</span>
            </span>
            <span className="mx-2">|</span>
            <span className="inline-flex items-center space-x-1">
              <WifiOff className="w-3 h-3 text-yellow-600" />
              <span>= API otillgängligt (testdata)</span>
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DatabaseInitializer;
