import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Calendar, Clock, MapPin, Download, AlertCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  fetchCachedCalendarData, 
  fetchUpcomingEvents, 
  fetchEventsByOrgan, 
  fetchEventsByType,
  fetchEventsByDateRange,
  searchEvents,
  formatEventDate,
  formatEventTime,
  type CachedCalendarData 
} from "../services/cachedCalendarApi";
import RiksdagCalendarView from "./RiksdagCalendarView";
import { supabase } from '@/integrations/supabase/client';

const RiksdagCalendarSearch = () => {
  const [events, setEvents] = useState<CachedCalendarData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [databaseEmpty, setDatabaseEmpty] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form state
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedOrgan, setSelectedOrgan] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Get unique values for dropdowns
  const uniqueOrgans = [...new Set(events.map(event => event.organ).filter(Boolean))];
  const uniqueTypes = [...new Set(events.map(event => event.typ).filter(Boolean))];

  useEffect(() => {
    loadRecentEvents();
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      const { count, error } = await supabase
        .from('calendar_data')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Database check error:', error);
        return false;
      }

      const isEmpty = (count || 0) === 0;
      setDatabaseEmpty(isEmpty);
      
      if (isEmpty) {
        console.log('Database is empty, need to fetch data first');
      } else {
        console.log(`Database contains ${count} calendar events`);
      }
      
      return !isEmpty;
    } catch (err) {
      console.error('Error checking database status:', err);
      return false;
    }
  };

  const refreshCalendarData = async () => {
    console.log('Refreshing calendar data from API...');
    setIsRefreshing(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('fetch-calendar-data', {
        body: { 
          manual_trigger: true,
          refresh: true,
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        throw new Error(`Kunde inte hämta data: ${error.message}`);
      }

      if (data?.success) {
        console.log('Data refresh successful:', data.stats);
        // Reload events after successful refresh
        await loadRecentEvents();
        setDatabaseEmpty(false);
      } else {
        throw new Error(data?.error || 'Okänt fel vid datahämtning');
      }
    } catch (err) {
      console.error('Error refreshing calendar data:', err);
      setError(err instanceof Error ? err.message : 'Kunde inte uppdatera kalenderdata');
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadRecentEvents = async () => {
    console.log('Loading recent events...');
    setLoading(true);
    setError(null);
    
    try {
      // First check if database has data
      const hasData = await checkDatabaseStatus();
      
      if (!hasData) {
        setDatabaseEmpty(true);
        setEvents([]);
        setError('Kalenderdatabasen är tom. Klicka på "Hämta ny data" för att fylla den.');
        return;
      }

      const result = await fetchCachedCalendarData(50);
      console.log(`Loaded ${result.length} recent events`);
      setEvents(result);
      setDatabaseEmpty(false);
    } catch (err) {
      console.error('Error loading recent events:', err);
      setError('Kunde inte hämta senaste kalenderdata från databasen');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    console.log('Performing search with filters...');
    setLoading(true);
    setError(null);
    
    try {
      let result: CachedCalendarData[] = [];

      if (searchQuery.trim()) {
        console.log(`Searching for: "${searchQuery}"`);
        result = await searchEvents(searchQuery.trim());
      } else if (fromDate && toDate) {
        console.log(`Searching date range: ${fromDate} to ${toDate}`);
        result = await fetchEventsByDateRange(fromDate, toDate);
      } else if (selectedOrgan && selectedOrgan !== "all") {
        console.log(`Searching by organ: ${selectedOrgan}`);
        result = await fetchEventsByOrgan(selectedOrgan);
      } else if (selectedType && selectedType !== "all") {
        console.log(`Searching by type: ${selectedType}`);
        result = await fetchEventsByType(selectedType);
      } else {
        console.log('Loading all events (no specific filters)');
        result = await fetchCachedCalendarData(100);
      }

      console.log(`Search completed: ${result.length} events found`);
      setEvents(result);
    } catch (err) {
      console.error('Error searching events:', err);
      setError('Kunde inte hämta kalenderdata');
    } finally {
      setLoading(false);
    }
  };

  const loadThisWeek = async () => {
    console.log('Loading this week events...');
    setLoading(true);
    setError(null);
    
    try {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      const fromDateStr = today.toISOString().split('T')[0];
      const toDateStr = nextWeek.toISOString().split('T')[0];
      
      console.log(`Loading events from ${fromDateStr} to ${toDateStr}`);
      const result = await fetchEventsByDateRange(fromDateStr, toDateStr);
      console.log(`Loaded ${result.length} events for this week`);
      setEvents(result);
    } catch (err) {
      console.error('Error loading this week events:', err);
      setError('Kunde inte hämta denna veckans händelser');
    } finally {
      setLoading(false);
    }
  };

  const loadNextWeek = async () => {
    console.log('Loading next week events...');
    setLoading(true);
    setError(null);
    
    try {
      const nextWeekStart = new Date();
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);
      const nextWeekEnd = new Date();
      nextWeekEnd.setDate(nextWeekEnd.getDate() + 14);
      
      const fromDateStr = nextWeekStart.toISOString().split('T')[0];
      const toDateStr = nextWeekEnd.toISOString().split('T')[0];
      
      console.log(`Loading events from ${fromDateStr} to ${toDateStr}`);
      const result = await fetchEventsByDateRange(fromDateStr, toDateStr);
      console.log(`Loaded ${result.length} events for next week`);
      setEvents(result);
    } catch (err) {
      console.error('Error loading next week events:', err);
      setError('Kunde inte hämta nästa veckans händelser');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    console.log('Clearing all filters...');
    setSelectedType("all");
    setSelectedOrgan("all");
    setSearchQuery("");
    setFromDate("");
    setToDate("");
    loadRecentEvents();
  };

  const exportToiCal = () => {
    console.log(`Exporting ${events.length} events to iCal format`);
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Riksdag//Calendar//EN',
      ...events.map(event => {
        const eventDate = new Date(event.datum || '');
        if (isNaN(eventDate.getTime())) return [];
        
        return [
          'BEGIN:VEVENT',
          `DTSTART:${eventDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
          `SUMMARY:${event.summary || event.aktivitet || 'Händelse'}`,
          `DESCRIPTION:${event.description || ''}`,
          `LOCATION:${event.plats || ''}`,
          `UID:${event.event_id || event.id}`,
          'END:VEVENT'
        ];
      }).flat(),
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `riksdag-kalender-${new Date().toISOString().split('T')[0]}.ics`;
    link.click();
  };

  const getEventTypeColor = (organ: string, typ: string) => {
    const colors: { [key: string]: string } = {
      'kamm': 'bg-blue-100 text-blue-800',
      'AU': 'bg-green-100 text-green-800',
      'CU': 'bg-purple-100 text-purple-800',
      'FiU': 'bg-red-100 text-red-800',
      'FöU': 'bg-orange-100 text-orange-800',
      'JuU': 'bg-indigo-100 text-indigo-800',
      'KU': 'bg-pink-100 text-pink-800',
      'KrU': 'bg-yellow-100 text-yellow-800',
      'MjU': 'bg-emerald-100 text-emerald-800',
      'NU': 'bg-cyan-100 text-cyan-800',
      'eun': 'bg-violet-100 text-violet-800',
      'debatt': 'bg-blue-100 text-blue-800',
      'sammantrade': 'bg-gray-100 text-gray-800',
      'besök': 'bg-green-100 text-green-800'
    };
    return colors[organ] || colors[typ] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Sök händelser</TabsTrigger>
          <TabsTrigger value="calendar">Kalendervy</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Riksdagens Kalender</span>
              </CardTitle>
              <CardDescription>
                Sök och filtrera händelser från Sveriges riksdag. Data hämtas från vår databas med kalenderdata från Riksdagens API.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {databaseEmpty && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>Kalenderdatabasen är tom. Hämta data från Riksdagens API först.</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={refreshCalendarData}
                        disabled={isRefreshing}
                        className="ml-4"
                      >
                        {isRefreshing ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Hämta ny data
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="searchQuery">Sökord</Label>
                  <Input
                    id="searchQuery"
                    placeholder="Sök i titel, beskrivning eller aktivitet..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="eventType">Händelsetyp</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj händelsetyp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alla typer</SelectItem>
                      {uniqueTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organ">Organ</Label>
                  <Select value={selectedOrgan} onValueChange={setSelectedOrgan}>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj organ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alla organ</SelectItem>
                      {uniqueOrgans.map((organ) => (
                        <SelectItem key={organ} value={organ}>{organ}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="fromDate">Från datum</Label>
                  <Input
                    id="fromDate"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="toDate">Till datum</Label>
                  <Input
                    id="toDate"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSearch} disabled={loading || databaseEmpty}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Sök händelser
                </Button>
                <Button variant="outline" onClick={clearFilters} disabled={loading || databaseEmpty}>
                  Rensa filter
                </Button>
                <Button variant="outline" onClick={loadRecentEvents} disabled={loading}>
                  Senaste händelser
                </Button>
                <Button variant="outline" onClick={loadThisWeek} disabled={loading || databaseEmpty}>
                  Denna vecka
                </Button>
                <Button variant="outline" onClick={loadNextWeek} disabled={loading || databaseEmpty}>
                  Nästa vecka
                </Button>
                <Button variant="outline" onClick={refreshCalendarData} disabled={isRefreshing}>
                  {isRefreshing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Hämta ny data
                </Button>
                <Button variant="outline" onClick={exportToiCal} disabled={events.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportera iCal
                </Button>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && (
            <Card>
              <CardContent className="text-center py-8">
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <p className="text-gray-600">Laddar kalenderhändelser...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Kalenderhändelser</span>
                  <Badge variant="secondary">{events.length} händelser</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.map((event, index) => (
                    <div key={event.id || index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {event.summary || event.aktivitet || 'Utan titel'}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatEventDate(event.datum)}</span>
                            </div>
                            {event.tid && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatEventTime(event.tid)}</span>
                              </div>
                            )}
                            {event.plats && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{event.plats}</span>
                              </div>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-sm text-gray-600 mt-2">
                              {event.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            {event.organ && (
                              <Badge variant="outline" className={getEventTypeColor(event.organ, event.typ || '')}>
                                {event.organ}
                              </Badge>
                            )}
                            {event.typ && (
                              <Badge variant="secondary">
                                {event.typ}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && events.length === 0 && !error && !databaseEmpty && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">Inga händelser hittades. Prova att ändra dina sökkriterier.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <RiksdagCalendarView events={events} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RiksdagCalendarSearch;
