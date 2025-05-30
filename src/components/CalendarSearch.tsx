
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, Calendar, Clock, MapPin } from "lucide-react";
import { searchCalendarEvents, CalendarSearchParams, RiksdagCalendarEvent } from "../services/riksdagApi";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CalendarSearch = () => {
  const [searchParams, setSearchParams] = useState<CalendarSearchParams>({});
  const [events, setEvents] = useState<RiksdagCalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [allaHandelser, setAllaHandelser] = useState(false);

  const kammarAktiviteter = [
    { value: 'ad', label: 'Aktuell debatt' },
    { value: 'al', label: 'Allmänpolitisk debatt' },
    { value: 'af', label: 'Anmälan om partiföreträdare' },
    { value: 'av', label: 'Avslutning' },
    { value: 'at', label: 'Avtackning' },
    { value: 'vo', label: 'Beslut' },
    { value: 'bl', label: 'Bordläggning av ärenden' },
    { value: 'bd', label: 'Bordläggningsdebatt' },
    { value: 'bp', label: 'Bordläggningsplenum' },
    { value: 'bu', label: 'Budgetdebatt' },
    { value: 'ap', label: 'Debatt om förslag' },
    { value: 'dv', label: 'Debatt om vårpropositionen' },
    { value: 'fs', label: 'Frågestund' },
    { value: 'ha', label: 'Hälsningsanförande' },
    { value: 'hh', label: 'Högtidlighållande' },
    { value: 'ar', label: 'Information från regeringen' },
    { value: 'in', label: 'Inledning' },
    { value: 'ip', label: 'Interpellationsdebat' },
    { value: 'pa', label: 'Parentation' },
    { value: 'pd', label: 'Partiledardebatt' },
    { value: 'rf', label: 'Regeringsförklaring' },
    { value: 'rd', label: 'Remissdebatt' },
    { value: 'ro', label: 'Riksmötets öppnande' },
    { value: 'sf', label: 'Statsministerns frågestund' },
    { value: 'sd', label: 'Särskild debatt' },
    { value: 'up', label: 'Upprop' },
    { value: 'ud', label: 'Utrikespolitisk debatt' },
    { value: 'va', label: 'Val' },
    { value: 'ar', label: 'Återrapportering' }
  ];

  const utskott = [
    { value: 'AU', label: 'Arbetsmarknadsutskottet' },
    { value: 'CU', label: 'Civilutskottet' },
    { value: 'eun', label: 'EU-nämnden' },
    { value: 'FiU', label: 'Finansutskottet' },
    { value: 'FöU', label: 'Försvarsutskottet' },
    { value: 'JuU', label: 'Justitieutskottet' },
    { value: 'KU', label: 'Konstitutionsutskottet' },
    { value: 'KrU', label: 'Kulturutskottet' },
    { value: 'MjU', label: 'Miljö- och jordbruksutskottet' },
    { value: 'NU', label: 'Näringsutskottet' },
    { value: 'CKrU', label: 'Sammansatta civil- och kulturutskottet' },
    { value: 'UFöU', label: 'Sammansatta utrikes- och försvarsutskottet' },
    { value: 'SkU', label: 'Skatteutskottet' },
    { value: 'SfU', label: 'Socialförsäkringsutskottet' },
    { value: 'SoU', label: 'Socialutskottet' },
    { value: 'TU', label: 'Trafikutskottet' },
    { value: 'UbU', label: 'Utbildningsutskottet' },
    { value: 'UU', label: 'Utrikesutskottet' }
  ];

  const utskottAktiviteter = [
    { value: 'pk', label: 'Presskonferens' },
    { value: 'ss', label: 'Session' },
    { value: 'are', label: 'Återrapportering från europeiska rådets möte' },
    { value: 'ko', label: 'Öppen konferens' },
    { value: 'ou', label: 'Öppen utfrågning' },
    { value: 'be', label: 'Öppet besök' },
    { value: 'st', label: 'Öppet sammanträde' },
    { value: 'os', label: 'Öppet samråd' },
    { value: 'se', label: 'Öppet seminarium' }
  ];

  const ovrigaAktiviteter = [
    { value: 'be', label: 'Besök' },
    { value: 'ib', label: 'Inkommande besök' },
    { value: 're', label: 'Resa' },
    { value: 'se', label: 'Seminarium (Ej öppet)' },
    { value: 'tl', label: 'Träffa ledamöter' },
    { value: 'ur', label: 'Ungdomens riksdag' },
    { value: 'ub', label: 'Utgående besök' },
    { value: 'vi', label: 'Visning' },
    { value: 'oh', label: 'Öppet hus' }
  ];

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await searchCalendarEvents(searchParams);
      setEvents(result.events);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError('Kunde inte hämta kalenderdata');
      console.error('Error searching calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrgChange = (org: string, checked: boolean) => {
    if (org === 'kamm' && checked) {
      setAllaHandelser(true);
      setSearchParams({
        ...searchParams,
        org: ['kamm']
      });
    } else {
      if (org === 'kamm') {
        setAllaHandelser(false);
      }
      const currentOrg = searchParams.org || [];
      if (checked) {
        setSearchParams({
          ...searchParams,
          org: [...currentOrg.filter(o => o !== 'kamm'), org]
        });
      } else {
        setSearchParams({
          ...searchParams,
          org: currentOrg.filter(o => o !== org)
        });
      }
    }
  };

  const handleAktChange = (akt: string, checked: boolean) => {
    if (allaHandelser && checked) {
      setAllaHandelser(false);
      setSearchParams({
        ...searchParams,
        org: searchParams.org?.filter(o => o !== 'kamm')
      });
    }
    
    const currentAkt = searchParams.akt || [];
    if (checked) {
      setSearchParams({
        ...searchParams,
        akt: [...currentAkt, akt]
      });
    } else {
      setSearchParams({
        ...searchParams,
        akt: currentAkt.filter(a => a !== akt)
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('sv-SE');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Sök kalenderhändelser</span>
          </CardTitle>
          <CardDescription>
            Filtrera och sök bland riksdagens kalenderhändelser
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fromDate">Från datum</Label>
              <Input
                id="fromDate"
                type="date"
                value={searchParams.fromDate || ''}
                onChange={(e) => setSearchParams({
                  ...searchParams,
                  fromDate: e.target.value
                })}
              />
            </div>
            
            <div>
              <Label htmlFor="toDate">Till datum</Label>
              <Input
                id="toDate"
                type="date"
                value={searchParams.toDate || ''}
                onChange={(e) => setSearchParams({
                  ...searchParams,
                  toDate: e.target.value
                })}
              />
            </div>
          </div>

          <Tabs defaultValue="kammaren" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="kammaren">Kammaren</TabsTrigger>
              <TabsTrigger value="utskott">Utskott</TabsTrigger>
              <TabsTrigger value="ovriga">Övriga</TabsTrigger>
            </TabsList>
            
            <TabsContent value="kammaren" className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="allaHandelser"
                    checked={allaHandelser}
                    onCheckedChange={(checked) => handleOrgChange('kamm', checked as boolean)}
                  />
                  <Label htmlFor="allaHandelser" className="font-medium">
                    Alla händelser i kammaren
                  </Label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {kammarAktiviteter.map((aktivitet) => (
                    <div key={aktivitet.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`akt-${aktivitet.value}`}
                        checked={searchParams.akt?.includes(aktivitet.value) || false}
                        onCheckedChange={(checked) => handleAktChange(aktivitet.value, checked as boolean)}
                        disabled={allaHandelser}
                      />
                      <Label htmlFor={`akt-${aktivitet.value}`} className="text-sm">
                        {aktivitet.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="utskott" className="space-y-4">
              <div>
                <Label className="text-base font-medium">Utskott och EU-nämnden</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {utskott.map((org) => (
                    <div key={org.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`org-${org.value}`}
                        checked={searchParams.org?.includes(org.value) || false}
                        onCheckedChange={(checked) => handleOrgChange(org.value, checked as boolean)}
                      />
                      <Label htmlFor={`org-${org.value}`} className="text-sm">
                        {org.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Utskottsaktiviteter</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                  {utskottAktiviteter.map((aktivitet) => (
                    <div key={aktivitet.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`utskott-akt-${aktivitet.value}`}
                        checked={searchParams.akt?.includes(aktivitet.value) || false}
                        onCheckedChange={(checked) => handleAktChange(aktivitet.value, checked as boolean)}
                      />
                      <Label htmlFor={`utskott-akt-${aktivitet.value}`} className="text-sm">
                        {aktivitet.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ovriga" className="space-y-4">
              <div>
                <Label className="text-base font-medium">Övriga kalenderhändelser</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                  {ovrigaAktiviteter.map((aktivitet) => (
                    <div key={aktivitet.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`ovrig-akt-${aktivitet.value}`}
                        checked={searchParams.akt?.includes(aktivitet.value) || false}
                        onCheckedChange={(checked) => handleAktChange(aktivitet.value, checked as boolean)}
                      />
                      <Label htmlFor={`ovrig-akt-${aktivitet.value}`} className="text-sm">
                        {aktivitet.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex space-x-2">
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Sök händelser
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchParams({});
                setAllaHandelser(false);
              }}
            >
              Rensa filter
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
              <Badge variant="secondary">{totalCount} träffar</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events.slice(0, 50).map((event, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {event.summary || event.aktivitet}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(event.datum)}</span>
                        </div>
                        {event.tid && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{event.tid}</span>
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
                        <Badge variant="outline">{event.organ}</Badge>
                        <Badge variant="secondary">{event.typ}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {events.length < totalCount && (
              <p className="text-center text-gray-500 mt-4">
                Visar {events.length} av {totalCount} händelser
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CalendarSearch;
