import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Loader2, RefreshCw, AlertCircle, CheckCircle, Database, Clock, TrendingUp, Filter, Activity, MapPin } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useResponsive } from "../hooks/use-responsive";
import EnhancedCalendar from '../components/EnhancedCalendar';
import { fetchCachedCalendarData, fetchRecentActivities, getCalendarDataFreshness, getEventTitle, getEventTypeDescription, formatEventTime, CachedCalendarData } from '../services/cachedCalendarApi';
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

  const formatActivityDate = (activity: CachedCalendarData) => {
    if (!activity.datum) return 'Okänt datum';
    
    try {
      const date = new Date(activity.datum);
      return date.toLocaleDateString('sv-SE', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric'
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
            <CardDescription className="text-green-700">
              De 5 senast tillagda händelserna i databasen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-green-700">Laddar senaste aktiviteter...</span>
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={activity.id || index} className="p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-green-800 text-base mb-1">
                          {getEventTitle(activity)}
                        </h4>
                        {getEventTypeDescription(activity) && (
                          <p className="text-sm text-green-600 mb-2">
                            {getEventTypeDescription(activity)}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-green-600">
                          {activity.datum && (
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              <span>{formatActivityDate(activity)}</span>
                            </div>
                          )}
                          {activity.tid && (
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              <span>{formatEventTime(activity.tid)}</span>
                            </div>
                          )}
                          {activity.plats && (
                            <div className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              <span className="truncate max-w-[200px]">{activity.plats}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-4">
                        {activity.organ && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                            {activity.organ}
                          </Badge>
                        )}
                        {activity.typ && (
                          <Badge variant="outline" className="text-xs">
                            {activity.typ}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {activity.summary && activity.summary !== getEventTitle(activity) && (
                      <div className="mt-2 p-2 bg-green-25 border border-green-100 rounded text-xs text-green-700">
                        <strong>Sammanfattning:</strong> {activity.summary}
                      </div>
                    )}
                    {activity.description && (
                      <div className="mt-2 p-2 bg-green-25 border border-green-100 rounded text-xs text-green-700">
                        <strong>Beskrivning:</strong> {activity.description.substring(0, 200)}{activity.description.length > 200 ? '...' : ''}
                      </div>
                    )}
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
