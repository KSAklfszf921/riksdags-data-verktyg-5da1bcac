
import DocumentSearchForm from './DocumentSearchForm';
import DocumentResultsTable from './DocumentResultsTable';
import { useDocumentSearch } from '../hooks/useDocumentSearch';

interface DocumentSearchProps {
  initialMemberId?: string;
  showMemberFilter?: boolean;
}

const DocumentSearch = ({ initialMemberId, showMemberFilter = true }: DocumentSearchProps) => {
  const {
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
  } = useDocumentSearch(initialMemberId);

  return (
    <div className="space-y-6">
      <DocumentSearchForm
        searchParams={searchParams}
        selectedParties={selectedParties}
        loading={loading}
        onUpdateSearchParams={updateSearchParams}
        onToggleParty={toggleParty}
        onSearch={() => handleSearch(true)}
        onReset={resetSearch}
      />

      <DocumentResultsTable
        documents={documents}
        totalCount={totalCount}
        loading={loading}
        error={error}
        currentPage={currentPage}
        searchParams={searchParams}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default DocumentSearch;
