
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { 
  Search, 
  MessageSquare, 
  Calendar, 
  Users, 
  Loader2,
  ExternalLink,
  Clock
} from 'lucide-react';
import { searchSpeeches, SpeechSearchParams, RiksdagSpeech } from '../services/riksdagApi';

interface SpeechSearchProps {
  initialMemberId?: string;
  showMemberFilter?: boolean;
}

const SpeechSearch = ({ initialMemberId, showMemberFilter = true }: SpeechSearchProps) => {
  const [searchParams, setSearchParams] = useState<SpeechSearchParams>({
    intressentId: initialMemberId,
    pageSize: 50
  });
  const [speeches, setSpeeches] = useState<RiksdagSpeech[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parties = [
    { value: 'c', label: 'Centerpartiet' },
    { value: 'l', label: 'Liberalerna' },
    { value: 'kd', label: 'Kristdemokraterna' },
    { value: 'mp', label: 'Miljöpartiet' },
    { value: 'm', label: 'Moderata samlingspartiet' },
    { value: 's', label: 'Socialdemokraterna' },
    { value: 'sd', label: 'Sverigedemokraterna' },
    { value: 'v', label: 'Vänsterpartiet' }
  ];

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await searchSpeeches(searchParams);
      setSpeeches(result.speeches);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError('Kunde inte söka anföranden');
      console.error('Error searching speeches:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSearchParams = (key: keyof SpeechSearchParams, value: any) => {
    setSearchParams(prev => ({ ...prev, [key]: value }));
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('sv-SE');
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // Format HH:MM
  };

  const getSpeechTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'Anförande': 'Anförande',
      'Replik': 'Replik',
      'Svar': 'Svar',
      'Slutreplik': 'Slutreplik'
    };
    return typeMap[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Sökformulär */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Anförandesökning</span>
          </CardTitle>
          <CardDescription>
            Sök och filtrera riksdagsanföranden med avancerade kriterier
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Grundläggande sökning */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Riksmöte
              </label>
              <Input
                placeholder="ex. 2023/24"
                value={searchParams.rm || ''}
                onChange={(e) => updateSearchParams('rm', e.target.value || undefined)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anförandetyp
              </label>
              <Select 
                value={searchParams.anftyp || 'all'} 
                onValueChange={(value) => updateSearchParams('anftyp', value === 'all' ? undefined : value as 'Nej' | '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj anförandetyp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Anföranden och repliker</SelectItem>
                  <SelectItem value="Nej">Endast anföranden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parti
              </label>
              <Select 
                value={searchParams.party || 'all'} 
                onValueChange={(value) => updateSearchParams('party', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj parti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla partier</SelectItem>
                  {parties.map((party) => (
                    <SelectItem key={party.value} value={party.value}>
                      {party.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Datum */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Datum (efter)
              </label>
              <Input
                type="date"
                value={searchParams.date || ''}
                onChange={(e) => updateSearchParams('date', e.target.value || undefined)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Systemdatum (ändrad efter)
              </label>
              <Input
                type="date"
                value={searchParams.systemDate || ''}
                onChange={(e) => updateSearchParams('systemDate', e.target.value || undefined)}
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Sök anföranden
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchParams({
                  pageSize: 50
                });
                setSpeeches([]);
                setTotalCount(0);
              }}
            >
              Rensa
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultat */}
      {error && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {speeches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Sökresultat</span>
            </CardTitle>
            <CardDescription>
              Visar {speeches.length} av {totalCount} anföranden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Talare</TableHead>
                  <TableHead>Parti</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Tid</TableHead>
                  <TableHead>Debatt</TableHead>
                  <TableHead>Text (utdrag)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {speeches.map((speech) => (
                  <TableRow key={speech.anforande_id}>
                    <TableCell className="font-medium">{speech.talare}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {speech.parti}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getSpeechTypeLabel(speech.anforandetyp)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(speech.anforandedatum)}</TableCell>
                    <TableCell>
                      {speech.anf_klockslag && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span className="text-sm">{formatTime(speech.anf_klockslag)}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm truncate">{speech.kammaraktivitet}</p>
                      {speech.rel_dok_titel && (
                        <p className="text-xs text-gray-500 truncate">{speech.rel_dok_titel}</p>
                      )}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm line-clamp-3">
                        {speech.anforandetext.substring(0, 200)}...
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SpeechSearch;
