
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, Loader2 } from "lucide-react";
import MemberCard from "./MemberCard";
import { useResponsive } from "../hooks/use-responsive";

interface MemberGridProps {
  members: any[];
  totalCount: number;
  memberStatus: 'current' | 'all' | 'former';
  selectedCommittee: string;
  hasMore: boolean;
  loading: boolean;
  error: any;
  autocompleteFilter: any;
  onMemberClick: (memberId: string) => void;
  onLoadMore: () => void;
  onClearAllFilters: () => void;
}

const MemberGrid = ({
  members,
  totalCount,
  memberStatus,
  selectedCommittee,
  hasMore,
  loading,
  error,
  autocompleteFilter,
  onMemberClick,
  onLoadMore,
  onClearAllFilters
}: MemberGridProps) => {
  const { isMobile, isTablet } = useResponsive();

  return (
    <>
      {/* Results counter */}
      <div className={`mb-4 ${isMobile ? 'px-0' : ''}`}>
        <p className="text-gray-600 text-sm">
          Visar {members.length} av {totalCount} ledamöter
          {memberStatus === 'current' && ' (nuvarande)'}
          {memberStatus === 'former' && ' (tidigare)'}
          {memberStatus === 'all' && ' (alla)'}
          {selectedCommittee !== "all" && ` i ${selectedCommittee}`}
        </p>
      </div>

      {/* Member grid */}
      <div className={`grid ${
        isMobile 
          ? 'grid-cols-1 gap-4' 
          : isTablet 
            ? 'grid-cols-2 gap-4' 
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
      }`}>
        {members.map((member: any) => (
          <MemberCard
            key={member.id}
            member={member}
            onClick={() => onMemberClick(member.id)}
          />
        ))}
      </div>

      {/* Load more button */}
      {hasMore && !autocompleteFilter && (
        <div className="mt-8 text-center pb-8">
          <Button 
            onClick={onLoadMore}
            disabled={loading}
            className="flex items-center space-x-2"
            size={isMobile ? 'lg' : 'default'}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>{loading ? 'Laddar...' : 'Ladda fler ledamöter'}</span>
          </Button>
          {error && <p className="text-red-500 mt-2 text-sm">{error.message}</p>}
        </div>
      )}

      {/* No results */}
      {members.length === 0 && !loading && (
        <Card className="mt-8 mb-8">
          <CardContent className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Inga ledamöter hittades
            </h3>
            <p className="text-gray-600 mb-4 text-sm">
              Inga ledamöter matchar dina sökkriterier. Försök att rensa filter eller sök med ett annat namn.
            </p>
            <Button onClick={onClearAllFilters} className="mt-4">
              Rensa alla filter
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default MemberGrid;
