
import { Button } from "@/components/ui/button";
import { partyInfo } from "../data/mockMembers";
import MemberProfile from "../components/MemberProfile";
import { PageHeader } from "../components/PageHeader";
import { useMembers, useCommittees, getCommitteeName, getCommitteeCode } from "../hooks/useMembers";
import { useResponsive } from "../hooks/use-responsive";
import { RiksdagMember } from "../services/riksdagApi";
import MemberStatusSelector from "../components/MemberStatusSelector";
import MemberFilters from "../components/MemberFilters";
import MemberGrid from "../components/MemberGrid";

const Ledamoter = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParty, setSelectedParty] = useState<string>("all");
  const [selectedConstituency, setSelectedConstituency] = useState<string>("all");
  const [selectedCommittee, setSelectedCommittee] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [autocompleteFilter, setAutocompleteFilter] = useState<RiksdagMember | null>(null);
  const [memberStatus, setMemberStatus] = useState<'current' | 'all' | 'former'>('current');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setSelectedMemberId(id);
    }
  }, [searchParams]);

  const { isMobile } = useResponsive();

  const { data: membersData, isLoading: loading, error } = useMembers(
    currentPage, 
    20, 
    memberStatus, 
    selectedCommittee === "all" ? undefined : selectedCommittee
  );

  // Extract data from the query result
  const members = membersData?.members || [];
  const totalCount = membersData?.totalCount || 0;
  const hasMore = membersData?.hasMore || false;

  const { committees } = useCommittees();

  // Hämta unika valkretsar från riktig data
  const constituencies = Array.from(new Set(members.map((member: any) => member.constituency))).sort();

  // Hämta unika partier från riktig data (filtrera bort tomma strängar)
  const actualParties = Array.from(new Set(members.map((member: any) => member.party).filter((party: any) => party && party.trim() !== ""))).sort();

  // Improved committee filtering using committee codes
  const filteredAndSortedMembers = members
    .filter((member: any) => {
      // Om autocomplete-filter är aktivt, visa bara den valda ledamoten
      if (autocompleteFilter) {
        return member.id === autocompleteFilter.intressent_id;
      }

      const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
      const matchesSearch = searchTerm === "" || fullName.includes(searchTerm.toLowerCase());
      const matchesParty = selectedParty === "all" || member.party === selectedParty;
      const matchesConstituency = selectedConstituency === "all" || member.constituency === selectedConstituency;
      
      // Improved committee filtering using codes
      let matchesCommittee = true;
      if (selectedCommittee !== "all") {
        // Convert committee name to code for matching
        const committeeCodeToMatch = getCommitteeCode(selectedCommittee);
        matchesCommittee = member.committees?.includes(committeeCodeToMatch) || false;
      }
      
      return matchesSearch && matchesParty && matchesConstituency && matchesCommittee;
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case "name":
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case "party":
          return (a.party || '').localeCompare(b.party || '');
        case "constituency":
          return (a.constituency || '').localeCompare(b.constituency || '');
        case "activity":
          return (b.activityScore || 0) - (a.activityScore || 0);
        default:
          return 0;
      }
    });

  const handleStatusChange = (newStatus: 'current' | 'all' | 'former') => {
    setMemberStatus(newStatus);
    setCurrentPage(1);
  };

  const handleCommitteeChange = (committee: string) => {
    setSelectedCommittee(committee);
    setCurrentPage(1);
  };

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handleMemberClick = (memberId: string) => {
    setSelectedMemberId(memberId);
    navigate(`/ledamoter?id=${memberId}`);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedParty("all");
    setSelectedConstituency("all");
    setSelectedCommittee("all");
    setAutocompleteFilter(null);
  };

  if (loading && currentPage === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Laddar ledamöter...</p>
        </div>
      </div>
    );
  }

  if (error && currentPage === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Kunde inte ladda ledamöter
            </h3>
            <p className="text-gray-600 mb-4">Ett fel uppstod när ledamöter skulle hämtas</p>
            <Button onClick={() => window.location.reload()}>
              Försök igen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4' : 'px-4 sm:px-6 lg:px-8'} ${isMobile ? 'py-0' : 'py-8'}`}>
          <PageHeader
            title="Ledamöter"
            description="Utforska riksdagsledamöter och deras aktuella uppdrag"
            icon={<Users className="w-6 h-6 text-white" />}
          />

          <MemberStatusSelector 
            memberStatus={memberStatus}
            onStatusChange={handleStatusChange}
          />

          <MemberFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedParty={selectedParty}
            setSelectedParty={setSelectedParty}
            selectedConstituency={selectedConstituency}
            setSelectedConstituency={setSelectedConstituency}
            selectedCommittee={selectedCommittee}
            setSelectedCommittee={setSelectedCommittee}
            sortBy={sortBy}
            setSortBy={setSortBy}
            autocompleteFilter={autocompleteFilter}
            setAutocompleteFilter={setAutocompleteFilter}
            constituencies={constituencies}
            actualParties={actualParties}
            committees={committees}
            onCommitteeChange={handleCommitteeChange}
          />
        </div>

        {/* Member grid */}
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4' : 'px-4 sm:px-6 lg:px-8'}`}>
