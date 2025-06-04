import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Calendar, Clock, MapPin, Download, AlertCircle, RefreshCw, Info } from "lucide-react";
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
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Form state
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedOrgan, setSelectedOrgan] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Predefined options based on technical specification
  const organOptions = [
    { value: 'kamm', label: 'Kammaren' },
    { value: 'AU', label: 'Arbetsmarknadsutskottet' },
    { value: 'CU', label: 'Civilutskottet' },
    { value: 'FiU', label: 'Finansutskottet' },
    { value: 'FöU', label: 'Försvarsutskottet' },
    { value: 'JuU', label: 'Justitieutskottet' },
    { value: 'KU', label: 'Konstitutionsutskottet' },
    { value: 'KrU', label: 'Kulturutskottet' },
    { value: 'MjU', label: 'Miljö- och jordbruksutskottet' },
    { value: 'NU', label: 'Näringsutskottet' },
    { value: 'eun', label: 'EU-nämnden' }
  ];

  const typeOptions = [
    { value: 'sammantrade', label: 'Sammanträde' },
    { value: 'debatt', label: 'Debatt' },
    { value: 'beslut', label: 'Beslut' },
    { value: 'besök', label: 'Besök' },
    { value: 'seminarium', label: 'Seminarium' },
    { value: 'presskonferens', label: 'Presskonferens' }
  ];

  useEffect(() => {
    checkDatabaseAndLoadEvents();
  }, []);

  const checkDatabaseAndLoadEvents = async () => {
    setLoading(true);
    try {
      const hasData = await checkDatabaseStatus();
      if (hasData) {
        await loadRecentEvents();
      }
    } catch (err) {
      console.error('Error during initial load:', err);
    } finally {
      setLoading(false);
    }
  };

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
        setError('Kalenderdatabasen är tom. Hämta data från Riksdagens API först.');
      } else {
        console.log(`Database contains ${count} calendar events`);
        setError(null);
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
        await loadRecentEvents();
        setDatabaseEmpty(false);
        setError(null);
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
      const result = await fetchCachedCalendarData(50);
      console.log(`Loaded ${result.length} recent events`);
      setEvents(result);
      setSearchPerformed(false);
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
    setSearchPerformed(true);
    
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
    setSearchPerformed(true);
    
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
    setSearchPerformed(true);
    
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
          `SUMMARY:${event.summary || 'Händelse'}`,
          `DESCRIPTION:${event.description || ''}`,
          `LOCATION:${event.location || ''}`,
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
                  <Label htmlFor="organ">Organ</Label>
                  <Select value={selectedOrgan} onValueChange={setSelectedOrgan}>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj organ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alla organ</SelectItem>
                      {organOptions.map((organ) => (
                        <SelectItem key={organ.value} value={organ.value}>{organ.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="eventType">Händelsetyp</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj händelsetyp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alla typer</SelectItem>
                      {typeOptions.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
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
                            {event.summary || 'Utan titel'}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatEventDate(event.datum)}</span>
                            </div>
                            {event.start_time && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatEventTime(event.start_time)}</span>
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{event.location}</span>
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

          {!loading && events.length === 0 && !error && !databaseEmpty && searchPerformed && (
            <Card>
              <CardContent className="text-center py-8">
                <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
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
