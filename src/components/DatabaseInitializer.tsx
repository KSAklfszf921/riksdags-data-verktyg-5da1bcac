
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  BarChart3,
  Calendar,
  FileText,
  Users,
  Megaphone,
  Vote,
  Newspaper,
  Loader2
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
import { Separator } from './ui/separator';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import MasterSyncTool from './MasterSyncTool';

const DatabaseInitializer = () => {
  const [activeTab, setActiveTab] = useState('status');
  const [dataStatus, setDataStatus] = useState<DataFreshnessStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshResult, setRefreshResult] = useState<RefreshResult | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);

  const dataTypeIcons = {
    'Party Data': Users,
    'Member Data': Users,
    'Vote Data': Vote,
    'Document Data': FileText,
    'Speech Data': Megaphone,
    'Calendar Data': Calendar,
    'Member News': Newspaper
  };

  const loadDataStatus = async () => {
    try {
      setLoading(true);
      const status = await getComprehensiveDataStatus();
      setDataStatus(status.freshnessStatus);
      setTotalRecords(status.totalRecords);
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
        // Reload status after successful initialization
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
        // Reload status after successful refresh
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

  const handleRefreshSpecific = async (dataType: string) => {
    try {
      setLoading(true);
      console.log(`Refreshing ${dataType}...`);
      
      const result = await refreshSpecificDataType(dataType);
      setRefreshResult(result);
      
      if (result.success) {
        console.log(`${dataType} refresh completed successfully`);
        // Reload status after successful refresh
        setTimeout(() => loadDataStatus(), 1000);
      }
    } catch (error) {
      console.error(`Error refreshing ${dataType}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastUpdated = (dateString: string | null): string => {
    if (!dateString) return 'Aldrig';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) {
        return `${diffDays} dag${diffDays > 1 ? 'ar' : ''} sedan`;
      } else if (diffHours > 0) {
        return `${diffHours} timm${diffHours > 1 ? 'ar' : 'e'} sedan`;
      } else {
        return 'Nyligen';
      }
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: DataFreshnessStatus) => {
    if (status.errorMessage) return 'destructive';
    if (status.isStale) return 'secondary';
    return 'default';
  };

  const getStatusIcon = (status: DataFreshnessStatus) => {
    if (status.errorMessage) return AlertCircle;
    if (status.isStale) return Clock;
    return CheckCircle;
  };

  const overallHealth = () => {
    const totalTypes = dataStatus.length;
    const healthyTypes = dataStatus.filter(s => !s.isStale && !s.errorMessage).length;
    return Math.round((healthyTypes / totalTypes) * 100);
  };

  useEffect(() => {
    loadDataStatus();
    
    // Auto-refresh status every 5 minutes
    const interval = setInterval(loadDataStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading && dataStatus.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Laddar databasstatus...</span>
        </CardContent>
      </Card>
    );
  }

  const healthPercentage = overallHealth();

  return (
    <div className="space-y-6">
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="status">Databasstatus</TabsTrigger>
          <TabsTrigger value="legacy">Legacy-verktyg</TabsTrigger>
          <TabsTrigger value="master">Master Sync</TabsTrigger>
        </TabsList>
        
        <TabsContent value="status">
          {/* Overview Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Supabase Database Status</span>
                <Badge variant={healthPercentage > 80 ? 'default' : healthPercentage > 60 ? 'secondary' : 'destructive'}>
                  {healthPercentage}% Hälsosam
                </Badge>
              </CardTitle>
              <CardDescription>
                {formatDataStatusMessage(dataStatus)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Övergripande systemhälsa</span>
                      <span>{healthPercentage}%</span>
                    </div>
                    <Progress 
                      value={healthPercentage} 
                      className="h-2"
                      indicatorColor={
                        healthPercentage > 80 ? "bg-green-500" : 
                        healthPercentage > 60 ? "bg-amber-500" : 
                        "bg-red-500"
                      }
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{totalRecords.toLocaleString()}</div>
                    <div className="text-gray-600">Totala poster</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {dataStatus.filter(s => !s.isStale && !s.errorMessage).length}
                    </div>
                    <div className="text-gray-600">Aktuella</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {dataStatus.filter(s => s.isStale).length}
                    </div>
                    <div className="text-gray-600">Föråldrade</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {dataStatus.filter(s => s.errorMessage).length}
                    </div>
                    <div className="text-gray-600">Fel</div>
                  </div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Rekommendation</AlertTitle>
                <AlertDescription>
                  Använd vår nya Master Sync Tool för bättre övervakning och kontroll av datasync-processer!
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('master')}
                      size="sm"
                    >
                      Gå till Master Sync Tool
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Detailed Status */}
          <Card>
            <CardHeader>
              <CardTitle>Detaljerad Datatyp Status</CardTitle>
              <CardDescription>
                Status för varje datatyp i systemet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dataStatus.map((status) => {
                  const IconComponent = dataTypeIcons[status.type as keyof typeof dataTypeIcons] || Database;
                  const StatusIcon = getStatusIcon(status);
                  
                  return (
                    <div
                      key={status.type}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className="w-5 h-5 text-gray-600" />
                        <div>
                          <div className="font-medium">{status.type}</div>
                          <div className="text-sm text-gray-600">
                            {status.recordCount?.toLocaleString() || 0} poster
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatLastUpdated(status.lastUpdated)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusColor(status)} className="text-xs">
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.errorMessage ? 'Fel' : status.isStale ? 'Föråldrad' : 'Aktuell'}
                        </Badge>
                        {status.type !== 'Member News' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRefreshSpecific(status.type.split(' ')[0])}
                            disabled={loading}
                          >
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legacy">
          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Legacy Databasåtgärder</CardTitle>
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
                  <BarChart3 className="w-4 h-4" />
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
        </TabsContent>
        
        <TabsContent value="master">
          <MasterSyncTool />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DatabaseInitializer;
