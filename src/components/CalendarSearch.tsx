import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Calendar, Clock, MapPin } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EnhancedCalendar from "./EnhancedCalendar";

const CalendarSearch = () => {
  const [events, setEvents] = useState<CachedCalendarData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrgan, setSelectedOrgan] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Preload latest events on component mount
  useEffect(() => {
    loadLatestEvents();
  }, []);

  const loadLatestEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchCachedCalendarData(50);
      setEvents(result);
    } catch (err) {
      setError('Kunde inte hämta kalenderdata');
      console.error('Error loading latest calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let result: CachedCalendarData[] = [];

      if (searchQuery) {
        result = await searchEvents(searchQuery);
      } else if (fromDate && toDate) {
        result = await fetchEventsByDateRange(fromDate, toDate);
      } else if (selectedOrgan && selectedOrgan !== "all") {
        result = await fetchEventsByOrgan(selectedOrgan);
      } else if (selectedType && selectedType !== "all") {
        result = await fetchEventsByType(selectedType);
      } else {
        result = await fetchCachedCalendarData(100);
      }

      setEvents(result);
    } catch (err) {
      setError('Kunde inte hämta kalenderdata');
      console.error('Error searching calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUpcomingEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchUpcomingEvents(30);
      setEvents(result);
    } catch (err) {
      setError('Kunde inte hämta kommande händelser');
      console.error('Error loading upcoming events:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedOrgan("all");
    setSelectedType("all");
    setFromDate("");
    setToDate("");
    loadLatestEvents();
  };

  // Get unique organs and types for dropdowns
  const uniqueOrgans = [...new Set(events.map(event => event.organ).filter(Boolean))];
  const uniqueTypes = [...new Set(events.map(event => event.typ).filter(Boolean))];

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
                <span>Sök kalenderhändelser</span>
              </CardTitle>
              <CardDescription>
                Filtrera och sök bland riksdagens kalenderhändelser. Senaste händelserna visas automatiskt.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                      {uniqueOrgans.map((organ) => (
                        <SelectItem key={organ} value={organ}>{organ}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="eventType">Typ av händelse</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj typ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alla typer</SelectItem>
                      {uniqueTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
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
                <Button variant="outline" onClick={loadLatestEvents}>
                  Visa senaste
                </Button>
                <Button variant="outline" onClick={loadUpcomingEvents}>
                  Kommande händelser
                </Button>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Kalenderhändelser</span>
                  <Badge variant="secondary">{events.length} händelser</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.slice(0, 50).map((event, index) => (
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
                            {event.organ && <Badge variant="outline">{event.organ}</Badge>}
                            {event.typ && <Badge variant="secondary">{event.typ}</Badge>}
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
          <EnhancedCalendar events={events} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CalendarSearch;
