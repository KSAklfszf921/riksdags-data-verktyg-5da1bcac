
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings, 
  Database, 
  TestTube, 
  Calendar, 
  Clock, 
  Activity,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Loader2
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useResponsive } from "../hooks/use-responsive";
import CalendarTestRunner from '../components/CalendarTestRunner';
import EnhancedTestRunner from '../components/EnhancedTestRunner';
import VoteAnalysisTestRunner from '../components/VoteAnalysisTestRunner';
import DocumentAnalysisTestRunner from '../components/DocumentAnalysisTestRunner';
import SpeechAnalysisTestRunner from '../components/SpeechAnalysisTestRunner';
import MemberAnalysisTestRunner from '../components/MemberAnalysisTestRunner';
import LanguageAnalysisBatchRunner from '../components/LanguageAnalysisBatchRunner';
import NewsManagementTool from '../components/NewsManagementTool';
import DatabaseInitializer from '../components/DatabaseInitializer';
import CalendarDataManager from '../components/CalendarDataManager';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";

const Admin = () => {
  const { isMobile } = useResponsive();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = React.useState(false);
  const [cronJobs, setCronJobs] = React.useState<any[]>([]);
  const [loadingCronJobs, setLoadingCronJobs] = React.useState(true);

  const loadCronJobs = async () => {
    try {
      setLoadingCronJobs(true);
      
      // Query the cron.job table to get current cron jobs
      const { data, error } = await supabase
        .from('cron.job' as any)
        .select('*');
      
      if (error) {
        console.error('Error loading cron jobs:', error);
        setCronJobs([]);
      } else {
        setCronJobs(data || []);
      }
    } catch (err) {
      console.error('Error loading cron jobs:', err);
      setCronJobs([]);
    } finally {
      setLoadingCronJobs(false);
    }
  };

  React.useEffect(() => {
    loadCronJobs();
  }, []);

  const triggerManualSync = async (type: 'comprehensive' | 'calendar') => {
    setRefreshing(true);
    
    try {
      const functionName = type === 'comprehensive' ? 'fetch-party-data' : 'fetch-calendar-data';
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { manual_trigger: true, triggered_by: 'admin_panel' }
      });
      
      if (error) {
        console.error(`Error triggering ${type} sync:`, error);
        throw error;
      }
      
      console.log(`${type} sync response:`, data);
      
      toast({
        title: "Synkronisering startad",
        description: `${type === 'comprehensive' ? 'Komplett' : 'Kalender'} datasynkronisering har startats`,
      });
      
    } catch (err) {
      console.error(`Error triggering ${type} sync:`, err);
      toast({
        title: "Fel",
        description: `Kunde inte starta ${type === 'comprehensive' ? 'komplett' : 'kalender'} synkronisering`,
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 py-0' : 'px-4 sm:px-6 lg:px-8 py-8'}`}>
        <PageHeader
          title="Admin Panel"
          description="Hantera databaser, testa API:er och övervaka systemstatus"
          icon={<Settings className="w-6 h-6 text-white" />}
        />

        {/* Automated Sync Status */}
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <Clock className="w-5 h-5" />
              <span>Automatisk Datasynkronisering</span>
            </CardTitle>
            <CardDescription className="text-green-700">
              Systemet hämtar automatiskt data varje timme från Riksdagens API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-white rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-green-800">Komplett Datasynk</h4>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Varje timme :00
                  </Badge>
                </div>
                <p className="text-sm text-green-600 mb-3">
                  Hämtar partier, ledamöter, dokument, voteringar, anföranden och kalenderdata
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => triggerManualSync('comprehensive')}
                  disabled={refreshing}
                  className="w-full"
                >
                  {refreshing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Kör manuellt nu
                </Button>
              </div>

              <div className="p-4 bg-white rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-green-800">Kalenderdata Backup</h4>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Varje timme :30
                  </Badge>
                </div>
                <p className="text-sm text-green-600 mb-3">
                  Extra säkerhetssynkronisering för kritisk kalenderdata
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => triggerManualSync('calendar')}
                  disabled={refreshing}
                  className="w-full"
                >
                  {refreshing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Kör manuellt nu
                </Button>
              </div>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Automatisk datasynkronisering är aktiv. Cron-jobb körs varje timme för att hålla databasen uppdaterad.
                {cronJobs.length > 0 && ` ${cronJobs.length} aktiva cron-jobb är konfigurerade.`}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Cron Jobs Status */}
        {cronJobs.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Aktiva Cron-jobb</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCronJobs ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span>Laddar cron-jobb...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {cronJobs.map((job, index) => (
                    <div key={job.jobid || index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{job.jobname}</h4>
                          <p className="text-sm text-gray-600">Schedule: {job.schedule}</p>
                        </div>
                        <Badge variant={job.active ? "default" : "secondary"}>
                          {job.active ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Separator className="my-8" />

        {/* Database Management Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Database className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Databashantering</h2>
          </div>
          <div className="grid gap-6">
            <CalendarDataManager />
            <DatabaseInitializer />
          </div>
        </div>

        <Separator className="my-8" />

        {/* Testing Tools Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <TestTube className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Testverktyg</h2>
          </div>
          <div className="grid gap-6">
            <NewsManagementTool />
            <CalendarTestRunner />
            <EnhancedTestRunner />
            <VoteAnalysisTestRunner />
            <DocumentAnalysisTestRunner />
            <SpeechAnalysisTestRunner />
            <MemberAnalysisTestRunner />
            <LanguageAnalysisBatchRunner />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
