
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Search, 
  Calendar, 
  User, 
  MessageSquare, 
  Filter,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useSpeechData } from '../hooks/useSupabaseData';
import { fetchCachedSpeechData, formatSpeechDate, getSpeechDuration, truncateText } from '../services/cachedSpeechApi';

interface Speech {
  id: string;
  speech_id: string;
  namn: string | null;
  party: string | null;
  anforandedatum: string | null;
  anforandetext: string | null;
  anforandetyp: string | null;
  rel_dok_titel: string | null;
  word_count: number | null;
  anforande_url_html: string | null;
}

interface GroupedSpeeches {
  [key: string]: Speech[];
}

const SpeechSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParty, setSelectedParty] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSpeech, setSelectedSpeech] = useState<Speech | null>(null);
  const [cachedSpeeches, setCachedSpeeches] = useState<Speech[]>([]);
  const [loadingCached, setLoadingCached] = useState(false);
  const [cachedError, setCachedError] = useState<string | null>(null);

  const { data: speeches = [], loading, error } = useSpeechData();

  // Säkerställ att speeches alltid är en array
  const safeSpeeches = Array.isArray(speeches) ? speeches : [];

  const loadCachedData = async () => {
    setLoadingCached(true);
    setCachedError(null);
    try {
      const cached = await fetchCachedSpeechData(200);
      setCachedSpeeches(cached || []);
    } catch (err) {
      console.error('Error loading cached speech data:', err);
      setCachedError(err instanceof Error ? err.message : 'Kunde inte ladda cachad data');
    } finally {
      setLoadingCached(false);
    }
  };

  // Kombinera live data och cached data
  const allSpeeches = useMemo(() => {
    const combined = [...safeSpeeches, ...cachedSpeeches];
    // Ta bort dubbletter baserat på speech_id
    const unique = combined.filter((speech, index, self) => 
      index === self.findIndex(s => s.speech_id === speech.speech_id)
    );
    return unique;
  }, [safeSpeeches, cachedSpeeches]);

  // Gruppera anföranden efter ämne/dokument
  const groupSpeechesBySubject = (speechList: Speech[]): GroupedSpeeches => {
    if (!Array.isArray(speechList)) {
      console.warn('speechList is not an array:', speechList);
      return {};
    }

    return speechList.reduce((groups: GroupedSpeeches, speech) => {
      const subject = speech.rel_dok_titel || speech.anforandetyp || 'Övrigt';
      if (!groups[subject]) {
        groups[subject] = [];
      }
      groups[subject].push(speech);
      return groups;
    }, {});
  };

  const groupedSpeeches = useMemo(() => {
    return groupSpeechesBySubject(allSpeeches);
  }, [allSpeeches]);

  // Filtrera anföranden
  const filteredSpeeches = useMemo(() => {
    return allSpeeches.filter(speech => {
      const matchesSearch = !searchQuery || 
        (speech.namn && speech.namn.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (speech.anforandetext && speech.anforandetext.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (speech.rel_dok_titel && speech.rel_dok_titel.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesParty = selectedParty === 'all' || speech.party === selectedParty;
      const matchesType = selectedType === 'all' || speech.anforandetyp === selectedType;
      
      return matchesSearch && matchesParty && matchesType;
    });
  }, [allSpeeches, searchQuery, selectedParty, selectedType]);

  // Extrahera unika partier och typer
  const parties = useMemo(() => {
    const uniqueParties = new Set(allSpeeches.map(s => s.party).filter(Boolean));
    return Array.from(uniqueParties).sort();
  }, [allSpeeches]);

  const speechTypes = useMemo(() => {
    const uniqueTypes = new Set(allSpeeches.map(s => s.anforandetyp).filter(Boolean));
    return Array.from(uniqueTypes).sort();
  }, [allSpeeches]);

  const formatDate = (dateString: string | null) => {
    return formatSpeechDate(dateString);
  };

  if (loading && !loadingCached) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Laddar anföranden...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Sök Anföranden</span>
          </CardTitle>
          <CardDescription>
            Sök och filtrera anföranden från riksdagsledamöter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sökfält */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Sök efter talare, innehåll eller ämne..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedParty} onValueChange={setSelectedParty}>
              <SelectTrigger>
                <SelectValue placeholder="Välj parti" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla partier</SelectItem>
                {parties.map(party => (
                  <SelectItem key={party} value={party}>{party}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Välj typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla typer</SelectItem>
                {speechTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={loadCachedData} 
              disabled={loadingCached}
              variant="outline"
              className="flex items-center space-x-2"
            >
              {loadingCached ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Filter className="w-4 h-4" />
              )}
              <span>Ladda cachad data</span>
            </Button>
          </div>

          {/* Status och fel */}
          {error && (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Fel vid laddning av anföranden: {error}
              </AlertDescription>
            </Alert>
          )}

          {cachedError && (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                {cachedError}
              </AlertDescription>
            </Alert>
          )}

          {allSpeeches.length === 0 && !loading && (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                Inga anföranden hittades. Prova att ladda cachad data eller kontrollera databasstatus.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Resultat */}
      {filteredSpeeches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Anföranden ({filteredSpeeches.length} av {allSpeeches.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredSpeeches.slice(0, 50).map((speech) => (
                <div key={speech.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">
                        {speech.namn || 'Okänd talare'}
                      </h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Badge variant="secondary">{speech.party}</Badge>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(speech.anforandedatum)}</span>
                        </span>
                        {speech.word_count && (
                          <span>{getSpeechDuration(speech.word_count)}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">{speech.anforandetyp}</Badge>
                  </div>
                  
                  {speech.rel_dok_titel && (
                    <p className="text-sm font-medium text-blue-800 mb-2">
                      {speech.rel_dok_titel}
                    </p>
                  )}
                  
                  {speech.anforandetext && (
                    <p className="text-sm text-gray-700 mb-3">
                      {truncateText(speech.anforandetext, 300)}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {speech.word_count} ord
                    </span>
                    {speech.anforande_url_html && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(speech.anforande_url_html!, '_blank')}
                      >
                        Läs fullständigt anförande
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredSpeeches.length > 50 && (
                <Alert>
                  <AlertDescription>
                    Visar de första 50 anförandena av {filteredSpeeches.length} träffar. 
                    Använd filter för att begränsa resultatet.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SpeechSearch;
