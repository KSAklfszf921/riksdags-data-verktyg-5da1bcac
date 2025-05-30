
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './ui/pagination';
import { 
  Search, 
  Calendar, 
  FileText, 
  Building,
  ExternalLink,
  Loader2,
  Hash
} from 'lucide-react';
import { searchDocuments, DocumentSearchParams, RiksdagDocument } from '../services/riksdagApi';
import { DOCUMENT_TYPES } from '../types/document';
import DocumentViewer from './DocumentViewer';

interface DocumentSearchProps {
  initialMemberId?: string;
  showMemberFilter?: boolean;
}

// Filtered committees without composite ones
const COMMITTEES = [
  { value: 'AU', label: 'Arbetsmarknadsutskottet' },
  { value: 'BoU', label: 'Bostadsutskottet' },
  { value: 'CU', label: 'Civilutskottet' },
  { value: 'EU', label: 'EES-utskottet' },
  { value: 'eun', label: 'EU-nämnden' },
  { value: 'FiU', label: 'Finansutskottet' },
  { value: 'FöU', label: 'Försvarsutskottet' },
  { value: 'JoU', label: 'Jordbruksutskottet' },
  { value: 'JuU', label: 'Justitieutskottet' },
  { value: 'KU', label: 'Konstitutionsutskottet' },
  { value: 'KrU', label: 'Kulturutskottet' },
  { value: 'LU', label: 'Lagutskottet' },
  { value: 'MjU', label: 'Miljö- och jordbruksutskottet' },
  { value: 'NU', label: 'Näringsutskottet' },
  { value: 'SkU', label: 'Skatteutskottet' },
  { value: 'SfU', label: 'Socialförsäkringsutskottet' },
  { value: 'SoU', label: 'Socialutskottet' },
  { value: 'TU', label: 'Trafikutskottet' },
  { value: 'UbU', label: 'Utbildningsutskottet' },
  { value: 'UU', label: 'Utrikesutskottet' }
];

// Available riksmöte years
const RIKSMOTE_YEARS = [
  '2024/25', '2023/24', '2022/23', '2021/22', '2020/21', '2019/20', 
  '2018/19', '2017/18', '2016/17', '2015/16', '2014/15', '2013/14',
  '2012/13', '2011/12', '2010/11', '2009/10', '2008/09', '2007/08'
];

const SORT_OPTIONS = [
  { value: 'datum', label: 'Datum' },
  { value: 'systemdatum', label: 'Systemdatum' },
  { value: 'bet', label: 'Beteckning' },
  { value: 'rel', label: 'Relevans' }
];

const DocumentSearch = ({ initialMemberId, showMemberFilter = true }: DocumentSearchProps) => {
  const [searchParams, setSearchParams] = useState<DocumentSearchParams>({
    intressentId: initialMemberId,
    sort: 'datum',
    sortOrder: 'desc',
    pageSize: 20
  });
  const [documents, setDocuments] = useState<RiksdagDocument[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedParties, setSelectedParties] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

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

  // Load initial documents on component mount
  useEffect(() => {
    handleSearch(true);
  }, []);

  // Live search when parameters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchParams.searchTerm !== undefined || selectedParties.length > 0 || 
          searchParams.docType || searchParams.organ || searchParams.fromDate || 
          searchParams.toDate || searchParams.rm || searchParams.beteckning) {
        handleSearch(true);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchParams, selectedParties]);

  const handleSearch = async (resetPage = false) => {
    setLoading(true);
    setError(null);
    
    if (resetPage) {
      setCurrentPage(1);
    }
    
    try {
      const params = {
        ...searchParams,
        party: selectedParties.length > 0 ? selectedParties : undefined,
        pageSize: 20
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

  const totalPages = Math.ceil(totalCount / 20);
  const startIndex = (currentPage - 1) * 20 + 1;
  const endIndex = Math.min(currentPage * 20, totalCount);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Implement actual pagination with API call here if needed
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
                Utskott
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
              <Select 
                value={searchParams.rm || 'all'} 
                onValueChange={(value) => updateSearchParams('rm', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj riksmöte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla riksmöten</SelectItem>
                  {RIKSMOTE_YEARS.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Button onClick={() => handleSearch(true)} disabled={loading}>
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
                  pageSize: 20
                });
                setSelectedParties([]);
                setCurrentPage(1);
                handleSearch(true);
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

      {(documents.length > 0 || loading) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Sökresultat</span>
            </CardTitle>
            <CardDescription>
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Laddar dokument...
                </div>
              ) : (
                `Visar ${documents.length > 0 ? startIndex : 0}-${endIndex} av ${totalCount} dokument`
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && documents.length === 0 ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p>Laddar dokument...</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titel</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Beteckning</TableHead>
                      <TableHead>Utskott</TableHead>
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
                        <TableCell className="font-mono text-sm">{doc.beteckning || '-'}</TableCell>
                        <TableCell>{doc.organ || '-'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <DocumentViewer document={doc} />
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                            className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          const pageNum = i + 1;
                          if (totalPages <= 5) {
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  onClick={() => handlePageChange(pageNum)}
                                  isActive={currentPage === pageNum}
                                  className="cursor-pointer"
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                          return null;
                        })}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                            className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentSearch;
