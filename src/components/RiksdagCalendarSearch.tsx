
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Calendar, Clock, MapPin, Download, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  fetchCalendarEvents, 
  fetchThisWeekEvents, 
  fetchNextWeekEvents,
  formatEventDate,
  formatEventTime,
  getEventTypeName,
  getOrganName,
  getActivityName,
  EVENT_TYPES,
  ORGANS,
  ACTIVITIES,
  type RiksdagCalendarEvent,
  type CalendarSearchParams 
} from "../services/riksdagCalendarApi";
import RiksdagCalendarView from "./RiksdagCalendarView";

const RiksdagCalendarSearch = () => {
  const [events, setEvents] = useState<RiksdagCalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [searchParams, setSearchParams] = useState<CalendarSearchParams>({
    utformat: 'json',
    sz: 100,
    sort: 'c',
    sortorder: 'asc'
  });

  // Form state
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedOrgan, setSelectedOrgan] = useState<string>("all");
  const [selectedActivity, setSelectedActivity] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [riksmote, setRiksmote] = useState("");

  useEffect(() => {
    loadRecentEvents();
  }, []);

  const loadRecentEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchCalendarEvents({
        sz: 50,
        sort: 'r', // reverse chronological for recent events
        sortorder: 'desc'
      });
      
      // Check if we got mock data (mock data has predictable IDs)
      const isMockData = result.some(event => ['1', '2', '3'].includes(event.id));
      setUsingMockData(isMockData);
      
      setEvents(result);
    } catch (err) {
      setError('Kunde inte hämta kalenderdata från Riksdagen. Visar exempeldata istället.');
      setUsingMockData(true);
      console.error('Error loading recent events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: CalendarSearchParams = {
        ...searchParams
      };

      // Add filters based on form state
      if (selectedType !== "all") {
        params.typ = selectedType;
      }
      
      if (selectedOrgan !== "all") {
        params.org = selectedOrgan;
        // Note: According to the technical instruction, 'akt' is ignored when 'org' is set for committees
      } else if (selectedActivity !== "all") {
        params.akt = selectedActivity;
      }

      if (fromDate) {
        params.from = fromDate;
      }

      if (toDate) {
        params.tom = toDate;
      }

      if (riksmote) {
        params.rm = riksmote;
      }

      console.log('Search params:', params);
      const result = await fetchCalendarEvents(params);
      
      // Check if we got mock data
      const isMockData = result.some(event => ['1', '2', '3'].includes(event.id));
      setUsingMockData(isMockData);
      
      setEvents(result);
    } catch (err) {
      setError('Kunde inte hämta kalenderdata från Riksdagen. Visar exempeldata istället.');
      setUsingMockData(true);
      console.error('Error searching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadThisWeek = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchThisWeekEvents();
      const isMockData = result.some(event => ['1', '2', '3'].includes(event.id));
      setUsingMockData(isMockData);
      setEvents(result);
    } catch (err) {
      setError('Kunde inte hämta denna veckans händelser. Visar exempeldata istället.');
      setUsingMockData(true);
      console.error('Error loading this week events:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadNextWeek = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchNextWeekEvents();
      const isMockData = result.some(event => ['1', '2', '3'].includes(event.id));
      setUsingMockData(isMockData);
      setEvents(result);
    } catch (err) {
      setError('Kunde inte hämta nästa veckans händelser. Visar exempeldata istället.');
      setUsingMockData(true);
      console.error('Error loading next week events:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedType("all");
    setSelectedOrgan("all");
    setSelectedActivity("all");
    setFromDate("");
    setToDate("");
    setRiksmote("");
    loadRecentEvents();
  };

  const exportToiCal = async () => {
    try {
      const params = { ...searchParams, utformat: 'icalendar' as const };
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const url = `https://data.riksdagen.se/kalender/?${queryParams.toString()}`;
      
      const response = await fetch(url);
      const icalData = await response.text();
      
      const blob = new Blob([icalData], { type: 'text/calendar' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `riksdag-kalender-${new Date().toISOString().split('T')[0]}.ics`;
      link.click();
    } catch (err) {
      console.error('Error exporting calendar:', err);
      setError('Kunde inte exportera kalender');
    }
  };

  const getEventTypeColor = (typ: string, org: string) => {
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
    return colors[org] || colors[typ] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {usingMockData && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Riksdagens API är för närvarande inte tillgängligt på grund av CORS-begränsningar. 
            Exempeldata visas för att demonstrera funktionaliteten.
          </AlertDescription>
        </Alert>
      )}

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
                Sök och filtrera händelser från Sveriges riksdag. Data hämtas direkt från data.riksdagen.se.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eventType">Händelsetyp</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj händelsetyp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alla typer</SelectItem>
                      {Object.entries(EVENT_TYPES).map(([key, name]) => (
                        <SelectItem key={key} value={key}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="organ">Organ</Label>
                  <Select value={selectedOrgan} onValueChange={setSelectedOrgan}>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj organ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alla organ</SelectItem>
                      {Object.entries(ORGANS).map(([key, name]) => (
                        <SelectItem key={key} value={key}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="activity">Aktivitet</Label>
                  <Select 
                    value={selectedActivity} 
                    onValueChange={setSelectedActivity}
                    disabled={selectedOrgan !== "all"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj aktivitet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alla aktiviteter</SelectItem>
                      {Object.entries(ACTIVITIES).map(([key, name]) => (
                        <SelectItem key={key} value={key}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedOrgan !== "all" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Aktivitetsfilter ignoreras när organ är valt
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="riksmote">Riksmöte</Label>
                  <Input
                    id="riksmote"
                    placeholder="t.ex. 2023/24"
                    value={riksmote}
                    onChange={(e) => setRiksmote(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Sök händelser
                </Button>
                <Button variant="outline" onClick={clearFilters}>
                  Rensa filter
                </Button>
                <Button variant="outline" onClick={loadRecentEvents}>
                  Senaste händelser
                </Button>
                <Button variant="outline" onClick={loadThisWeek}>
                  Denna vecka
                </Button>
                <Button variant="outline" onClick={loadNextWeek}>
                  Nästa vecka
                </Button>
                <Button variant="outline" onClick={exportToiCal}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportera iCal
                </Button>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-amber-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Kalenderhändelser</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{events.length} händelser</Badge>
                    {usingMockData && (
                      <Badge variant="outline" className="text-amber-600">
                        Exempeldata
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.map((event, index) => (
                    <div key={event.id || index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {event.titel || 'Utan titel'}
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
                          {event.beskrivning && (
                            <p className="text-sm text-gray-600 mt-2">
                              {event.beskrivning}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            {event.org && (
                              <Badge variant="outline" className={getEventTypeColor(event.typ, event.org)}>
                                {getOrganName(event.org)}
                              </Badge>
                            )}
                            {event.typ && (
                              <Badge variant="secondary">
                                {getEventTypeName(event.typ)}
                              </Badge>
                            )}
                            {event.akt && (
                              <Badge variant="outline">
                                {getActivityName(event.akt)}
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
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <RiksdagCalendarView events={events} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RiksdagCalendarSearch;
