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
} from './ui/pagination';
import { FileText, ExternalLink, Loader2 } from 'lucide-react';
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

  const totalPages = Math.ceil(totalCount / 20);
  const startIndex = (currentPage - 1) * 20 + 1;
  const endIndex = Math.min(currentPage * 20, totalCount);

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!loading && documents.length === 0) {
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
                  {visibleColumns.titel && <TableHead>Titel</TableHead>}
                  {visibleColumns.typ && <TableHead>Typ</TableHead>}
                  {visibleColumns.datum && <TableHead>Datum</TableHead>}
                  {visibleColumns.beteckning && <TableHead>Beteckning</TableHead>}
                  {visibleColumns.utskott && <TableHead>Utskott</TableHead>}
                  {visibleColumns.actions && <TableHead></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
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
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                        className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const pageNum = i + 1;
                      if (totalPages <= 5) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => onPageChange(pageNum)}
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
