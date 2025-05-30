
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { 
  Search, 
  Filter, 
  Calendar, 
  FileText, 
  Users, 
  Building,
  ExternalLink,
  Loader2,
  Download
} from 'lucide-react';
import { searchDocuments, DocumentSearchParams, RiksdagDocument } from '../services/riksdagApi';
import { DOCUMENT_TYPES, COMMITTEES, SORT_OPTIONS } from '../types/document';

interface DocumentSearchProps {
  initialMemberId?: string;
  showMemberFilter?: boolean;
}

const DocumentSearch = ({ initialMemberId, showMemberFilter = true }: DocumentSearchProps) => {
  const [searchParams, setSearchParams] = useState<DocumentSearchParams>({
    intressentId: initialMemberId,
    sort: 'datum',
    sortOrder: 'desc',
    pageSize: 50
  });
  const [documents, setDocuments] = useState<RiksdagDocument[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedParties, setSelectedParties] = useState<string[]>([]);

  const parties = ['S', 'M', 'L', 'KD', 'V', 'SD', 'C', 'MP'];
  const partyNames = {
    'S': 'Socialdemokraterna',
    'M': 'Moderata samlingspartiet', 
    'L': 'Liberalerna',
    'KD': 'Kristdemokraterna',
    'V': 'Vänsterpartiet',
    'SD': 'Sverigedemokraterna',
    'C': 'Centerpartiet',
    'MP': 'Miljöpartiet'
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        ...searchParams,
        party: selectedParties.length > 0 ? selectedParties : undefined
      };
      const result = await searchDocuments(params);
      setDocuments(result.documents);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError('Kunde inte söka dokument');
      console.error('Error searching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSearchParams = (key: keyof DocumentSearchParams, value: any) => {
    setSearchParams(prev => ({ ...prev, [key]: value }));
  };

  const toggleParty = (party: string) => {
    setSelectedParties(prev => 
      prev.includes(party) 
        ? prev.filter(p => p !== party)
        : [...prev, party]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('sv-SE');
    } catch {
      return dateString;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const docType = DOCUMENT_TYPES.find(dt => dt.value === type);
    return docType ? docType.label : type;
  };

  return (
    <div className="space-y-6">
      {/* Sökformulär */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Dokumentsökning</span>
          </CardTitle>
          <CardDescription>
            Sök och filtrera riksdagsdokument med avancerade kriterier
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Grundläggande sökning */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sökord
              </label>
              <Input
                placeholder="Ange sökord..."
                value={searchParams.searchTerm || ''}
                onChange={(e) => updateSearchParams('searchTerm', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dokumenttyp
              </label>
              <Select 
                value={searchParams.docType || 'all'} 
                onValueChange={(value) => updateSearchParams('docType', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj dokumenttyp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla typer</SelectItem>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Utskott/Organ
              </label>
              <Select 
                value={searchParams.organ || 'all'} 
                onValueChange={(value) => updateSearchParams('organ', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj utskott" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla utskott</SelectItem>
                  {COMMITTEES.map((committee) => (
                    <SelectItem key={committee.value} value={committee.value}>
                      {committee.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Datum och identifierare */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Från datum
              </label>
              <Input
                type="date"
                value={searchParams.fromDate || ''}
                onChange={(e) => updateSearchParams('fromDate', e.target.value || undefined)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Till datum
              </label>
              <Input
                type="date"
                value={searchParams.toDate || ''}
                onChange={(e) => updateSearchParams('toDate', e.target.value || undefined)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beteckning
              </label>
              <Input
                placeholder="ex. 2023/24:1"
                value={searchParams.beteckning || ''}
                onChange={(e) => updateSearchParams('beteckning', e.target.value || undefined)}
              />
            </div>

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
          </div>

          {/* Partier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Partier
            </label>
            <div className="flex flex-wrap gap-2">
              {parties.map((party) => (
                <Button
                  key={party}
                  variant={selectedParties.includes(party) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleParty(party)}
                >
                  {party}
                </Button>
              ))}
            </div>
            {selectedParties.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedParties.map((party) => (
                  <Badge key={party} variant="secondary">
                    {partyNames[party as keyof typeof partyNames]} ({party})
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Sortering */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sortera efter
              </label>
              <Select 
                value={searchParams.sort || 'datum'} 
                onValueChange={(value: any) => updateSearchParams('sort', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordning
              </label>
              <Select 
                value={searchParams.sortOrder || 'desc'} 
                onValueChange={(value: any) => updateSearchParams('sortOrder', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Fallande (nyast först)</SelectItem>
                  <SelectItem value="asc">Stigande (äldst först)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Sök dokument
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchParams({
                  sort: 'datum',
                  sortOrder: 'desc',
                  pageSize: 50
                });
                setSelectedParties([]);
                setDocuments([]);
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

      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Sökresultat</span>
            </CardTitle>
            <CardDescription>
              Visar {documents.length} av {totalCount} dokument
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Beteckning</TableHead>
                  <TableHead>Organ</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <div className="max-w-xs">
                        <p className="truncate">{doc.titel}</p>
                        {doc.undertitel && (
                          <p className="text-sm text-gray-500 truncate">{doc.undertitel}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getDocumentTypeLabel(doc.typ)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(doc.datum)}</TableCell>
                    <TableCell className="font-mono text-sm">{doc.beteckning}</TableCell>
                    <TableCell>{doc.organ}</TableCell>
                    <TableCell>
                      {(doc.dokument_url_html || doc.dokument_url_text) && (
                        <Button variant="ghost" size="sm" asChild>
                          <a 
                            href={doc.dokument_url_html || doc.dokument_url_text} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                      )}
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

export default DocumentSearch;
