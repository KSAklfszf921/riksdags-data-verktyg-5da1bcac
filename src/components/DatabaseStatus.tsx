
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock 
} from 'lucide-react';
import { SupabaseDataService } from '../services/supabaseDataService';

interface TableStatus {
  table: string;
  recordCount: number;
  lastUpdate: string | null;
  hoursOld: number | null;
  isStale: boolean;
  error?: string;
}

const DatabaseStatus = () => {
  const [status, setStatus] = useState<TableStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const tableLabels: { [key: string]: string } = {
    'party_data': 'Partidata',
    'member_data': 'Medlemsdata',
    'document_data': 'Dokumentdata',
    'speech_data': 'Anförandedata',
    'vote_data': 'Voteringsdata',
    'calendar_data': 'Kalenderdata'
  };

  const loadStatus = async () => {
    try {
      setLoading(true);
      const statusData = await SupabaseDataService.getDataStatus();
      setStatus(statusData);
    } catch (error) {
      console.error('Error loading database status:', error);
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

  const getStatusColor = (item: TableStatus) => {
    if (item.error) return 'destructive';
    if (item.isStale) return 'secondary';
    return 'default';
  };

  const getStatusIcon = (item: TableStatus) => {
    if (item.error) return AlertCircle;
    if (item.isStale) return Clock;
    return CheckCircle;
  };

  const overallHealth = () => {
    const totalTables = status.length;
    const healthyTables = status.filter(s => !s.isStale && !s.error).length;
    return Math.round((healthyTables / totalTables) * 100);
  };

  const totalRecords = status.reduce((sum, item) => sum + item.recordCount, 0);

  useEffect(() => {
    loadStatus();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="w-5 h-5" />
          <span>Databasstatus</span>
          <Badge variant={healthPercentage > 80 ? 'default' : healthPercentage > 60 ? 'secondary' : 'destructive'}>
            {healthPercentage}% Hälsosam
          </Badge>
        </CardTitle>
        <CardDescription>
          Översikt över alla databastabeller och deras innehåll
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-2">
              <span>Övergripande systemhälsa</span>
              <span>{healthPercentage}%</span>
            </div>
            <Progress value={healthPercentage} className="h-2" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalRecords.toLocaleString()}</div>
            <div className="text-gray-600">Totala poster</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {status.filter(s => !s.isStale && !s.error).length}
            </div>
            <div className="text-gray-600">Aktuella tabeller</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {status.filter(s => s.isStale).length}
            </div>
            <div className="text-gray-600">Föråldrade</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {status.filter(s => s.error).length}
            </div>
            <div className="text-gray-600">Fel</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {status.map((item) => {
            const StatusIcon = getStatusIcon(item);
            
            return (
              <div
                key={item.table}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Database className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium">
                      {tableLabels[item.table] || item.table}
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.recordCount.toLocaleString()} poster
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatLastUpdated(item.lastUpdate)}
                    </div>
                  </div>
                </div>
                <Badge variant={getStatusColor(item)} className="text-xs">
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {item.error ? 'Fel' : item.isStale ? 'Föråldrad' : 'Aktuell'}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseStatus;
