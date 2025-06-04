
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from './ui/pagination';
import { FileText, ExternalLink, Loader2, Calendar } from 'lucide-react';
import { RiksdagDocument, DocumentSearchParams } from '../services/riksdagApi';
import { useDocumentTypes } from '../hooks/useDocumentTypes';
import DocumentViewer from './DocumentViewer';

interface DocumentResultsTableProps {
  documents: RiksdagDocument[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  currentPage: number;
  searchParams: DocumentSearchParams;
  onPageChange: (page: number) => void;
}

// Enhanced function to detect calendar entries
const isCalendarEntry = (document: RiksdagDocument): boolean => {
  const title = document.titel?.toLowerCase() || '';
  const subtitle = document.undertitel?.toLowerCase() || '';
  const combined = `${title} ${subtitle}`.toLowerCase();
  
  // Enhanced patterns for calendar entries
  const calendarPatterns = [
    // Meeting patterns
    /sammanträde.*\d{4}-\d{2}-\d{2}/,           // "sammanträde" followed by date
    /utskottsmöte/,                             // "utskottsmöte"
    /utskottets sammanträde/,                   // "utskottets sammanträde"
    /socialutskottets sammanträde/,             // "socialutskottets sammanträde"
    /näringsutskottets sammanträde/,            // "näringsutskottets sammanträde"
    /.*utskottets? sammanträde/,                // any committee meeting
    
    // Debate patterns
    /debatt.*med.*anledning/,                   // "debatt med anledning"
    /debatt.*av.*avlämnande/,                   // "debatt av ... avlämnande"
    /vårpropositionens avlämnande/,             // "vårpropositionens avlämnande"
    /budgetpropositionens avlämnande/,          // "budgetpropositionens avlämnande"
    
    // Activity type patterns
    /kammakt.*\d{4}-\d{2}-\d{2}/,               // "kammakt" followed by date
    /kammaraktivitet/,                          // "kammaraktivitet"
    
    // Time patterns
    /\d{4}-\d{2}-\d{2}.*kl\.\s*\d{1,2}:\d{2}/, // date followed by time
    /kl\.\s*\d{1,2}:\d{2}/,                     // time pattern "kl. XX:XX"
    
    // Day patterns
    /måndag.*\d{4}-\d{2}-\d{2}/,                // weekday with date
    /tisdag.*\d{4}-\d{2}-\d{2}/,
    /onsdag.*\d{4}-\d{2}-\d{2}/,
    /torsdag.*\d{4}-\d{2}-\d{2}/,
    /fredag.*\d{4}-\d{2}-\d{2}/,
    /lördag.*\d{4}-\d{2}-\d{2}/,
    /söndag.*\d{4}-\d{2}-\d{2}/,
    
    // Short date-only entries
    /^\s*\d{4}-\d{2}-\d{2}\s*$/,               // Just a date
    
    // Additional meeting types
    /partigruppsmöte/,                          // "partigruppsmöte"
    /gruppledarmöte/,                           // "gruppledarmöte"
    /presidiemöte/,                             // "presidiemöte"
    /konstitutionsutskottet/,                   // committee names
    /finansutskott/,
    /försvarsutskott/,
    /justitieutskott/,
    /kulturutskott/,
    /miljö.*och.*jordbruksutskott/,
    /näringsutskott/,
    /socialutskott/,
    /trafikutskott/,
    /utbildningsutskott/,
    /utrikesutskott/,
    
    // Event indicators
    /hearing/,                                  // "hearing"
    /öppet möte/,                              // "öppet möte"
    /studiebesök/,                             // "studiebesök"
    /konferens/,                               // "konferens"
  ];
  
  // Check if title or subtitle matches calendar patterns
  const matchesPattern = calendarPatterns.some(pattern => 
    pattern.test(title) || pattern.test(subtitle) || pattern.test(combined)
  );
  
  // Additional check for very short titles that are just dates or similar
  const isShortDateLike = (title.length < 30 && /\d{4}-\d{2}-\d{2}/.test(title)) ||
                          (subtitle && subtitle.length < 30 && /\d{4}-\d{2}-\d{2}/.test(subtitle));
  
  // Check for typical calendar entry structure (short title + date info)
  const hasCalendarStructure = title.length < 100 && (
    /kl\.\s*\d{1,2}:\d{2}/.test(combined) ||
    /\d{4}-\d{2}-\d{2}/.test(combined)
  );
  
  // Check document type - some types are more likely to be calendar entries
  const calendarDocTypes = ['prot', 'kammakt'];
  const isCalendarDocType = calendarDocTypes.includes(document.typ) && (
    title.length < 50 || matchesPattern
  );
  
  return matchesPattern || isShortDateLike || (hasCalendarStructure && title.length < 80) || isCalendarDocType;
};

const DocumentResultsTable = ({
  documents,
  totalCount,
  loading,
  error,
  currentPage,
  searchParams,
  onPageChange
}: DocumentResultsTableProps) => {
  const { documentTypes } = useDocumentTypes();

  // Filter out calendar entries from documents
  const filteredDocuments = documents.filter(doc => !isCalendarEntry(doc));
  const filteredCount = filteredDocuments.length;
  const calendarEntriesFiltered = documents.length - filteredDocuments.length;

  // Bestäm vilka kolumner som ska visas baserat på dokumenttyp och sökkriterier
  const getVisibleColumns = () => {
    const columns = {
      titel: true,
      typ: true,
      datum: true,
      beteckning: false,
      utskott: false,
      actions: true
    };

    // Visa beteckning för de flesta dokumenttyper utom vissa
    const noBeteckningTypes = ['prot', 'fr', 'frs'];
    if (!searchParams.doktyp || !noBeteckningTypes.includes(searchParams.doktyp)) {
      columns.beteckning = true;
    }

    // Visa utskott endast för utskottsrelaterade dokument
    const utskottTypes = ['bet', 'yttr', 'utskdok'];
    if (!searchParams.doktyp || utskottTypes.includes(searchParams.doktyp)) {
      columns.utskott = true;
    }

    return columns;
  };

  const visibleColumns = getVisibleColumns();

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('sv-SE');
    } catch {
      return dateString;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const docType = documentTypes.find(dt => dt.value === type);
    return docType ? docType.label : type;
  };

  const pageSize = 10; // Set to 10 results per page
  const totalPages = Math.ceil(filteredCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, filteredCount);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!loading && filteredDocuments.length === 0) {
    return null;
  }

  return (
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
            <div className="space-y-2">
              <div>
                Visar {filteredDocuments.length > 0 ? startIndex : 0}-{endIndex} av {filteredCount} dokument
              </div>
              {calendarEntriesFiltered > 0 && (
                <div className="flex items-center space-x-2 text-sm bg-blue-50 text-blue-700 p-2 rounded-lg border border-blue-200">
                  <Calendar className="w-4 h-4" />
                  <span>
                    <strong>{calendarEntriesFiltered}</strong> kalenderinslag filtrerades bort och visas istället i <a href="/kalender" className="underline font-medium hover:text-blue-800">Kalenderhändelser</a>
                  </span>
                </div>
              )}
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && filteredDocuments.length === 0 ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p>Laddar dokument...</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.titel && <TableHead>Titel</TableHead>}
                  {visibleColumns.typ && <TableHead>Typ</TableHead>}
                  {visibleColumns.datum && <TableHead>Datum</TableHead>}
                  {visibleColumns.beteckning && <TableHead>Beteckning</TableHead>}
                  {visibleColumns.utskott && <TableHead>Utskott</TableHead>}
                  {visibleColumns.actions && <TableHead></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    {visibleColumns.titel && (
                      <TableCell className="font-medium">
                        <div className="max-w-xs">
                          <p className="truncate">{doc.titel}</p>
                          {doc.undertitel && (
                            <p className="text-sm text-gray-500 truncate">{doc.undertitel}</p>
                          )}
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.typ && (
                      <TableCell>
                        <Badge variant="outline">
                          {getDocumentTypeLabel(doc.typ)}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.datum && <TableCell>{formatDate(doc.datum)}</TableCell>}
                    {visibleColumns.beteckning && (
                      <TableCell className="font-mono text-sm">{doc.beteckning || '-'}</TableCell>
                    )}
                    {visibleColumns.utskott && <TableCell>{doc.organ || '-'}</TableCell>}
                    {visibleColumns.actions && (
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
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                        className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {currentPage > 3 && (
                      <>
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => onPageChange(1)}
                            className="cursor-pointer"
                          >
                            1
                          </PaginationLink>
                        </PaginationItem>
                        {currentPage > 4 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                      </>
                    )}
                    
                    {getPageNumbers().map((pageNum) => (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => onPageChange(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => onPageChange(totalPages)}
                            className="cursor-pointer"
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      </>
                    )}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
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
  );
};

export default DocumentResultsTable;
