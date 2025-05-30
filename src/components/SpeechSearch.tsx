
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  Search, 
  MessageSquare, 
  Calendar, 
  Users, 
  Loader2,
  ExternalLink,
  Eye,
  User
} from 'lucide-react';
import { searchSpeeches, SpeechSearchParams, RiksdagSpeech } from '../services/riksdagApi';
import MemberAutocomplete from './MemberAutocomplete';

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
  const [selectedSpeech, setSelectedSpeech] = useState<RiksdagSpeech | null>(null);
  const [speechContent, setSpeechContent] = useState<string>('');
  const [loadingSpeech, setLoadingSpeech] = useState(false);

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

  const openSpeech = async (speech: RiksdagSpeech) => {
    setSelectedSpeech(speech);
    setLoadingSpeech(true);
    setSpeechContent('');
    
    try {
      // Try to fetch HTML content from the riksdag API
      const htmlUrl = speech.anforande_url_html || `https://data.riksdagen.se/anforande/${speech.dok_id}-${speech.anforande_nummer}/html`;
      const response = await fetch(htmlUrl);
      
      if (response.ok) {
        let content = await response.text();
        
        // Clean up problematic CSS styles
        content = content.replace(/body\s*\{[^}]*\}/g, '');
        content = content.replace(/#page_\d+[^{]*\{[^}]*\}/g, '');
        content = content.replace(/margin-top:\s*0px;/g, '');
        content = content.replace(/margin-left:\s*0px;/g, '');
        
        // Extract just the speech content, remove unnecessary styles
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        
        // Find the main speech div
        const speechDiv = doc.querySelector('.anforande') || doc.querySelector('.text');
        if (speechDiv) {
          // Clean up and format the content
          const cleanContent = speechDiv.innerHTML
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/body\s*\{[^}]*\}/g, '')
            .replace(/#page_[^{]*\{[^}]*\}/g, '');
          setSpeechContent(cleanContent);
        } else {
          setSpeechContent(content);
        }
      } else {
        // Fallback to showing basic info if HTML fetch fails
        setSpeechContent(`
          <div class="speech-fallback">
            <h4>${speech.dok_titel}</h4>
            <p><strong>Talare:</strong> ${speech.talare}</p>
            <p><strong>Parti:</strong> ${speech.parti}</p>
            <p><strong>Datum:</strong> ${formatDate(speech.anforandedatum)}</p>
            <p><strong>Kammaraktivitet:</strong> ${speech.kammaraktivitet}</p>
            ${speech.anforandetext ? `<p><strong>Text:</strong> ${speech.anforandetext}</p>` : ''}
          </div>
        `);
      }
    } catch (err) {
      console.error('Error fetching speech content:', err);
      setSpeechContent(`
        <div class="speech-error">
          <p>Kunde inte ladda anförandets innehåll.</p>
          <p><a href="${speech.protokoll_url_www || '#'}" target="_blank" rel="noopener noreferrer">Öppna i riksdagens webbplats</a></p>
        </div>
      `);
    } finally {
      setLoadingSpeech(false);
    }
  };

  const updateSearchParams = (key: keyof SpeechSearchParams, value: any) => {
    setSearchParams(prev => ({ ...prev, [key]: value }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('sv-SE');
    } catch {
      return dateString;
    }
  };

  const getSpeechTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'Anförande': 'Anförande',
      'Replik': 'Replik',
      'Svar': 'Svar',
      'Slutreplik': 'Slutreplik',
      'Återkallelse': 'Återkallelse',
      'Övrigt': 'Övrigt'
    };
    return typeMap[type] || type;
  };

  const getSpeechTypeColor = (type: string) => {
    switch (type) {
      case 'Anförande':
        return 'default';
      case 'Replik':
        return 'secondary';
      case 'Svar':
        return 'outline';
      case 'Slutreplik':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Group speeches by debate
  const groupSpeechesByDebate = (speeches: RiksdagSpeech[]) => {
    const groups: { [key: string]: RiksdagSpeech[] } = {};
    
    speeches.forEach(speech => {
      const debateKey = speech.kammaraktivitet || 'Okänd debatt';
      if (!groups[debateKey]) {
        groups[debateKey] = [];
      }
      groups[debateKey].push(speech);
    });

    // Sort speeches within each group by date and time
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        const dateA = new Date(a.anforandedatum + ' ' + (a.anf_klockslag || '00:00'));
        const dateB = new Date(b.anforandedatum + ' ' + (b.anf_klockslag || '00:00'));
        return dateA.getTime() - dateB.getTime();
      });
    });

    return groups;
  };

  const groupedSpeeches = groupSpeechesByDebate(speeches);

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

          {/* Ledamot filter */}
          {showMemberFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Ledamot
              </label>
              <MemberAutocomplete
                onSelectMember={(member) => {
                  updateSearchParams('intressentId', member?.intressent_id);
                }}
                placeholder="Sök ledamot..."
              />
            </div>
          )}

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
        <div className="space-y-4">
          {Object.entries(groupedSpeeches).map(([debateTitle, debateSpeeches]) => (
            <Card key={debateTitle}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  <span className="truncate">{debateTitle}</span>
                </CardTitle>
                <CardDescription>
                  {debateSpeeches.length} anföranden • {formatDate(debateSpeeches[0]?.anforandedatum)}
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
                      <TableHead>Åtgärder</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {debateSpeeches.map((speech) => (
                      <TableRow key={speech.anforande_id}>
                        <TableCell className="font-medium">{speech.talare}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {speech.parti.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getSpeechTypeColor(speech.anforandetyp) as any}>
                            {getSpeechTypeLabel(speech.anforandetyp)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span className="text-sm">{formatDate(speech.anforandedatum)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openSpeech(speech)}
                            className="flex items-center space-x-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Öppna</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
          
          <Card>
            <CardContent className="text-center py-4">
              <p className="text-sm text-gray-600">
                Visar {speeches.length} av {totalCount} anföranden grupperade efter debatt
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialog för att visa anförande */}
      <Dialog open={!!selectedSpeech} onOpenChange={(open) => !open && setSelectedSpeech(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <span>Anförande - {selectedSpeech?.talare}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {loadingSpeech ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Laddar anförande...</span>
              </div>
            ) : (
              <div 
                className="prose prose-sm max-w-none speech-content"
                dangerouslySetInnerHTML={{ __html: speechContent }}
                style={{
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}
              />
            )}
          </div>
          
          {selectedSpeech && (
            <div className="border-t pt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedSpeech.anforandedatum} • {selectedSpeech.parti} • {selectedSpeech.kammaraktivitet}
              </div>
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={selectedSpeech.protokoll_url_www} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Öppna i riksdagen.se</span>
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SpeechSearch;
