
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
  // Add missing properties
  searchParams: DocumentSearchParams;
  selectedParties: string[];
  hasSearched: boolean;
  updateSearchParams: (key: keyof DocumentSearchParams, value: any) => void;
  toggleParty: (party: string) => void;
  handleSearch: (reset?: boolean) => Promise<void>;
  handlePageChange: (page: number) => void;
}

export const useDocumentSearch = (initialMemberId?: string): UseDocumentSearchResult => {
  const [documents, setDocuments] = useState<RiksdagDocument[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams, setSearchParams] = useState<DocumentSearchParams>({
    p: 1,
    iid: initialMemberId
  });
  const [selectedParties, setSelectedParties] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const lastSearchParams = useRef<DocumentSearchParams>({
    p: 1
  });

  const updateSearchParams = useCallback((key: keyof DocumentSearchParams, value: any) => {
    setSearchParams(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleParty = useCallback((party: string) => {
    setSelectedParties(prev => {
      const newParties = prev.includes(party) 
        ? prev.filter(p => p !== party)
        : [...prev, party];
      
      // Update search params with new parties
      setSearchParams(prevParams => ({ ...prevParams, parti: newParties }));
      return newParties;
    });
  }, []);

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
      setHasSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setDocuments([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (reset = false) => {
    if (reset) {
      setCurrentPage(1);
      setSearchParams(prev => ({ ...prev, p: 1 }));
    }
    await searchDocumentsInternal(searchParams);
  }, [searchParams, searchDocumentsInternal]);

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

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setSearchParams(prev => ({ ...prev, p: page }));
    searchDocumentsInternal({ ...searchParams, p: page });
  }, [searchParams, searchDocumentsInternal]);

  const resetSearch = useCallback(() => {
    setDocuments([]);
    setTotalCount(0);
    setError(null);
    setCurrentPage(1);
    setHasSearched(false);
    setSelectedParties([]);
    setSearchParams({ p: 1, iid: initialMemberId });
    lastSearchParams.current = { p: 1 };
  }, [initialMemberId]);

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
    resetSearch,
    searchParams,
    selectedParties,
    hasSearched,
    updateSearchParams,
    toggleParty,
    handleSearch,
    handlePageChange
  };
};
