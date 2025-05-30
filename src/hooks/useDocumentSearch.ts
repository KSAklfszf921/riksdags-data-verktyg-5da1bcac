
import { useState, useEffect } from 'react';
import { searchDocuments, DocumentSearchParams, RiksdagDocument } from '../services/riksdagApi';

export const useDocumentSearch = (initialMemberId?: string) => {
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

  const resetSearch = () => {
    setSearchParams({
      sort: 'datum',
      sortOrder: 'desc',
      pageSize: 20
    });
    setSelectedParties([]);
    setCurrentPage(1);
    handleSearch(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Implement actual pagination with API call here if needed
  };

  return {
    searchParams,
    documents,
    totalCount,
    loading,
    error,
    selectedParties,
    currentPage,
    updateSearchParams,
    toggleParty,
    handleSearch,
    resetSearch,
    handlePageChange
  };
};
