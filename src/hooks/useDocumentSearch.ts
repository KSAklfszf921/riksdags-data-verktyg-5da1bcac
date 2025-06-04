
import { useState, useCallback, useRef } from 'react';
import { searchDocuments, DocumentSearchParams, RiksdagDocument } from '../services/riksdagApi';

interface UseDocumentSearchResult {
  documents: RiksdagDocument[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  searchDocuments: (params: DocumentSearchParams) => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  currentPage: number;
  resetSearch: () => void;
}

export const useDocumentSearch = (): UseDocumentSearchResult => {
  const [documents, setDocuments] = useState<RiksdagDocument[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const lastSearchParams = useRef<DocumentSearchParams>({
    p: 1
  });

  const searchDocumentsInternal = useCallback(async (params: DocumentSearchParams) => {
    setLoading(true);
    setError(null);
    
    try {
      // Store search params for loadMore functionality
      lastSearchParams.current = { ...params, p: 1 };
      setCurrentPage(1);
      
      const result = await searchDocuments(params);
      setDocuments(result.documents);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setDocuments([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || documents.length >= totalCount) return;
    
    setLoading(true);
    
    try {
      const nextPage = currentPage + 1;
      const result = await searchDocuments({
        ...lastSearchParams.current,
        p: nextPage
      });
      
      setDocuments(prev => [...prev, ...result.documents]);
      setCurrentPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [loading, documents.length, totalCount, currentPage]);

  const resetSearch = useCallback(() => {
    setDocuments([]);
    setTotalCount(0);
    setError(null);
    setCurrentPage(1);
    lastSearchParams.current = { p: 1 };
  }, []);

  const hasMore = documents.length < totalCount && !loading;

  return {
    documents,
    totalCount,
    loading,
    error,
    searchDocuments: searchDocumentsInternal,
    loadMore,
    hasMore,
    currentPage,
    resetSearch
  };
};
