
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Loader2, RefreshCw, AlertCircle, CheckCircle, Database, Clock, TrendingUp } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useResponsive } from "../hooks/use-responsive";
import EnhancedCalendar from '../components/EnhancedCalendar';
import { fetchCachedCalendarData, getCalendarDataFreshness, CachedCalendarData } from '../services/cachedCalendarApi';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';

const Kalender = () => {
  const { isMobile } = useResponsive();
  const { toast } = useToast();
  const [events, setEvents] = useState<CachedCalendarData[]>([]);
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
      console.log('Loading recent events...');
      const recentEvents = await fetchCachedCalendarData(50); // Get 50 recent events
      setEvents(recentEvents);
      console.log(`Loaded ${recentEvents.length} recent events`);
      
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
        description: `${data?.stored || 0} nya kalenderhändelser sparades`,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 py-0' : 'px-4 sm:px-6 lg:px-8 py-8'}`}>
        <PageHeader
          title="Kalenderhändelser"
          description="Riksdagens kalenderhändelser, sammanträden och aktiviteter"
          icon={<Calendar className="w-6 h-6 text-white" />}
        />

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

        {/* Calendar Note */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Om kalenderhändelser</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Den här sidan visar riksdagens kalenderhändelser, inklusive sammanträden, utskottsmöten och 
              andra aktiviteter. Kalenderinslag filtreras automatiskt bort från dokumentsökningen och visas 
              istället här för bättre organisation.
            </p>
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
