import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Loader2, RefreshCw, AlertCircle, CheckCircle, Database, Clock, TrendingUp, Filter, Activity } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useResponsive } from "../hooks/use-responsive";
import EnhancedCalendar from '../components/EnhancedCalendar';
import { fetchCachedCalendarData, fetchRecentActivities, getCalendarDataFreshness, getEventTitle, CachedCalendarData } from '../services/cachedCalendarApi';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';

const Kalender = () => {
  const { isMobile } = useResponsive();
  const { toast } = useToast();
  const [events, setEvents] = useState<CachedCalendarData[]>([]);
  const [recentActivities, setRecentActivities] = useState<CachedCalendarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [totalEvents, setTotalEvents] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = async (showLoadingState = true) => {
    if (showLoadingState) {
      setLoading(true);
    }
    setError(null);
    
    try {
      console.log('Loading calendar events and recent activities...');
      
      // Load recent events for calendar display
      const [recentEvents, latestActivities] = await Promise.all([
        fetchCachedCalendarData(50),
        fetchRecentActivities(5)
      ]);
      
      setEvents(recentEvents);
      setRecentActivities(latestActivities);
      console.log(`Loaded ${recentEvents.length} recent events and ${latestActivities.length} latest activities`);
      
      // Get total count
      const { count } = await supabase
        .from('calendar_data')
        .select('*', { count: 'exact', head: true });
      
      setTotalEvents(count || 0);
      console.log(`Database contains ${count || 0} calendar events`);
      
      // Check data freshness
      const { lastUpdated: freshness, isStale: staleStatus } = await getCalendarDataFreshness();
      setLastUpdated(freshness);
      setIsStale(staleStatus);
      
    } catch (err) {
      console.error('Error loading calendar events:', err);
      setError('Kunde inte ladda kalenderhändelser');
      toast({
        title: "Fel",
        description: "Kunde inte ladda kalenderhändelser",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    
    try {
      // Call the edge function to refresh calendar data
      const { data, error } = await supabase.functions.invoke('fetch-calendar-data');
      
      if (error) {
        console.error('Error refreshing calendar data:', error);
        throw error;
      }
      
      console.log('Calendar data refresh response:', data);
      
      // Reload the events after refresh
      await loadEvents(false);
      
      toast({
        title: "Data uppdaterad",
        description: `${data?.events_processed || 0} nya kalenderhändelser bearbetades`,
      });
      
    } catch (err) {
      console.error('Error refreshing data:', err);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera kalenderdata",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const formatLastUpdated = (dateString: string | null) => {
    if (!dateString) return 'Okänt';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 1) return 'Nyligen';
      if (diffHours < 24) return `${diffHours} timmar sedan`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Igår';
      return `${diffDays} dagar sedan`;
    } catch {
      return dateString;
    }
  };

  const formatActivityTitle = (activity: CachedCalendarData) => {
    return getEventTitle(activity);
  };

  const formatActivityTime = (activity: CachedCalendarData) => {
    if (!activity.datum) return '';
    
    try {
      const date = new Date(activity.datum);
      return date.toLocaleDateString('sv-SE', { 
        month: 'short', 
        day: 'numeric',
        hour: activity.tid ? '2-digit' : undefined,
        minute: activity.tid ? '2-digit' : undefined
      });
    } catch {
      return activity.datum;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 py-0' : 'px-4 sm:px-6 lg:px-8 py-8'}`}>
        <PageHeader
          title="Kalenderhändelser"
          description="Riksdagens kalenderhändelser, sammanträden och aktiviteter"
          icon={<Calendar className="w-6 h-6 text-white" />}
        />

        {/* Filter Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Filter className="w-5 h-5" />
              <span>Automatisk filtrering</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700 mb-2">
              Kalenderinslag som <strong>utskottsmöten</strong>, <strong>sammanträden</strong> och <strong>debatter</strong> 
              filtreras automatiskt bort från dokumentsökningen och visas istället här.
            </p>
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">Socialutskottets sammanträde</Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">Debatt med anledning av avlämnande</Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">Kammakt aktiviteter</Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">Utskottsmöten</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities Card */}
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <Activity className="w-5 h-5" />
              <span>Senaste aktiviteter</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-green-700">Laddar senaste aktiviteter...</span>
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={activity.id || index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                    <div className="flex-1">
                      <h4 className="font-medium text-green-800 truncate">
                        {getEventTitle(activity)}
                      </h4>
                      {activity.organ && (
                        <Badge variant="secondary" className="mt-1 text-xs bg-green-100 text-green-700">
                          {activity.organ}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-green-600 ml-4">
                      {formatActivityTime(activity)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-green-700 text-center py-4">
                Inga senaste aktiviteter tillgängliga
              </p>
            )}
          </CardContent>
        </Card>

        {/* Data Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Kalenderdata</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={refreshing}
                className="flex items-center space-x-2"
              >
                {refreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>Uppdatera</span>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Totalt antal händelser</p>
                  <p className="text-lg font-semibold">{totalEvents.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Senast uppdaterad</p>
                  <p className="text-lg font-semibold">{formatLastUpdated(lastUpdated)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {isStale ? (
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge variant={isStale ? "destructive" : "default"}>
                    {isStale ? "Behöver uppdateras" : "Aktuell"}
                  </Badge>
                </div>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="text-sm text-gray-600">
              <p className="mb-2">
                <strong>Automatisk uppdatering:</strong> Kalenderdata hämtas automatiskt varje timme från Riksdagens API.
              </p>
              <p>
                <strong>Manuell uppdatering:</strong> Klicka på "Uppdatera" ovan för att hämta senaste data omedelbart.
              </p>
            </div>
          </CardContent>
        </Card>

        {isStale && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Kalenderdata är mer än 24 timmar gammal. Klicka på "Uppdatera" för att hämta senaste data.
            </AlertDescription>
          </Alert>
        )}

        {/* Calendar Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Om kalenderhändelser</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-3">
              Den här sidan visar riksdagens kalenderhändelser, inklusive sammanträden, utskottsmöten och 
              andra aktiviteter som automatiskt filtreras bort från dokumentsökningen.
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <p><strong>Exempel på kalenderinslag som visas här:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• Socialutskottets sammanträde torsdag 2026-06-11 kl. 10:00</li>
                <li>• Debatt med anledning av vårpropositionens avlämnande</li>
                <li>• Kammakt aktiviteter och utskottsmöten</li>
                <li>• Hearings, konferenser och studiebesök</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <EnhancedCalendar events={events} loading={loading} />
      </div>
    </div>
  );
};

export default Kalender;
