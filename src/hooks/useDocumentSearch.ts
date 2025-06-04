
import { useState, useEffect } from 'react';
import { searchDocuments, DocumentSearchParams, RiksdagDocument } from '../services/riksdagApi';

export const useDocumentSearch = (initialMemberId?: string) => {
  const [searchParams, setSearchParams] = useState<DocumentSearchParams>({
    iid: initialMemberId,
    sort: 'datum',
    sortorder: 'desc',
    sz: 20
  });
  const [documents, setDocuments] = useState<RiksdagDocument[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedParties, setSelectedParties] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  // Only auto-search if we have a member ID
  useEffect(() => {
    if (initialMemberId) {
      handleSearch(true);
    }
  }, [initialMemberId]);

  // Live search when parameters change (but only after first manual search)
  useEffect(() => {
    if (!hasSearched) return;
    
    const timeoutId = setTimeout(() => {
      if (searchParams.searchTerm || selectedParties.length > 0 || 
          searchParams.doktyp || searchParams.org || searchParams.fromDate || 
          searchParams.toDate || searchParams.rm || searchParams.bet) {
        handleSearch(true);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchParams, selectedParties, hasSearched]);

  const handleSearch = async (resetPage = false) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    
    if (resetPage) {
      setCurrentPage(1);
    }
    
    try {
      const params = {
        ...searchParams,
        parti: selectedParties.length > 0 ? selectedParties : undefined,
        sz: 20
      };
      
      console.log('Searching with params:', params);
      
      const result = await searchDocuments(params);
      setDocuments(result.documents);
      setTotalCount(result.totalCount);
      
      console.log('Search results:', result);
    } catch (err) {
      setError('Kunde inte söka dokument');
      console.error('Error searching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSearchParams = (key: keyof DocumentSearchParams, value: any) => {
    console.log('Updating search param:', key, value);
    setSearchParams(prev => ({ 
      ...prev, 
      [key]: value === '' ? undefined : value 
    }));
  };

  const toggleParty = (party: string) => {
    setSelectedParties(prev => 
      prev.includes(party) 
        ? prev.filter(p => p !== party)
        : [...prev, party]
    );
  };

  const resetSearch = () => {
    setSearchParams({
      sort: 'datum',
      sortorder: 'desc',
      sz: 20
    });
    setSelectedParties([]);
    setCurrentPage(1);
    setDocuments([]);
    setTotalCount(0);
    setHasSearched(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Note: Actual pagination would require API support for page offset
    console.log('Page change requested:', page);
  };

  return {
    searchParams,
    documents,
    totalCount,
    loading,
    error,
    selectedParties,
    currentPage,
    hasSearched,
    updateSearchParams,
    toggleParty,
    handleSearch,
    resetSearch,
    handlePageChange
  };
};
