
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle
} from 'lucide-react';
import { 
  initializeAllDatabases,
  refreshAllData,
  refreshSpecificDataType,
  getComprehensiveDataStatus,
  formatDataStatusMessage,
  type DataFreshnessStatus,
  type RefreshResult
} from '../services/dataRefreshService';
import DatabaseStatus from './DatabaseStatus';

const DatabaseInitializer = () => {
  const [dataStatus, setDataStatus] = useState<DataFreshnessStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshResult, setRefreshResult] = useState<RefreshResult | null>(null);

  const loadDataStatus = async () => {
    try {
      setLoading(true);
      const status = await getComprehensiveDataStatus();
      setDataStatus(status.freshnessStatus);
      console.log('Data status loaded:', status);
    } catch (error) {
      console.error('Error loading data status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeAll = async () => {
    try {
      setInitializing(true);
      setRefreshResult(null);
      console.log('Starting database initialization...');
      
      const result = await initializeAllDatabases();
      setRefreshResult(result);
      setLastRefresh(new Date());
      
      if (result.success) {
        console.log('Database initialization completed successfully');
        setTimeout(() => loadDataStatus(), 2000);
      } else {
        console.error('Database initialization failed:', result.errors);
      }
    } catch (error) {
      console.error('Error during initialization:', error);
      setRefreshResult({
        success: false,
        message: `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setInitializing(false);
    }
  };

  const handleRefreshAll = async () => {
    try {
      setRefreshing(true);
      setRefreshResult(null);
      console.log('Starting comprehensive data refresh...');
      
      const result = await refreshAllData();
      setRefreshResult(result);
      setLastRefresh(new Date());
      
      if (result.success) {
        console.log('Data refresh completed successfully');
        setTimeout(() => loadDataStatus(), 2000);
      } else {
        console.error('Data refresh failed:', result.errors);
      }
    } catch (error) {
      console.error('Error during refresh:', error);
      setRefreshResult({
        success: false,
        message: `Refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Databasåtgärder</CardTitle>
          <CardDescription>
            Initiera databaser och hämta all tillgänglig data från Riksdagens API
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
                <p className="font-medium">{refreshResult.message}</p>
                {refreshResult.duration && (
                  <p className="text-sm opacity-75">Tid: {refreshResult.duration}ms</p>
                )}
                {refreshResult.stats && (
                  <p className="text-sm opacity-75 mt-1">
                    Statistik: {JSON.stringify(refreshResult.stats, null, 2)}
                  </p>
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
          <li>Klicka på "Initiera Alla Databaser" för att skapa och fylla alla databastabeller</li>
          <li>Använd "Uppdatera All Data" för att hämta den senaste datan från Riksdagens API</li>
          <li>Edge-funktioner hämtar data från flera olika API-endpoints enligt teknisk specifikation</li>
          <li>Databasstatus uppdateras automatiskt var 5:e minut</li>
        </ul>
      </div>
    </div>
  );
};

export default DatabaseInitializer;
