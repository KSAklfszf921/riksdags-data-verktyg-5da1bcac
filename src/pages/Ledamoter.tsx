import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Filter, Loader2, AlertCircle, Plus } from "lucide-react";
import { partyInfo } from "../data/mockMembers";
import { Member } from "../types/member";
import MemberCard from "../components/MemberCard";
import MemberProfile from "../components/MemberProfile";
import MemberAutocomplete from "../components/MemberAutocomplete";
import { PageHeader } from "../components/PageHeader";
import { useMembers, useCommittees, getCommitteeName, getCommitteeCode } from "../hooks/useMembers";
import { useResponsive } from "../hooks/use-responsive";
import { RiksdagMember } from "../services/riksdagApi";

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

  const { isMobile, isTablet } = useResponsive();

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

  const handleAutocompleteSelect = (member: RiksdagMember | null) => {
    setAutocompleteFilter(member);
    // Rensa andra filter när autocomplete används
    if (member) {
      setSearchTerm("");
      setSelectedParty("all");
      setSelectedConstituency("all");
      setSelectedCommittee("all");
    }
  };

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
            <p className="text-gray-600 mb-4">{error.message}</p>
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

          {/* Status väljare - Mobile optimized */}
          <Card className={`mb-6 ${isMobile ? 'mx-0' : ''}`}>
            <CardHeader className={isMobile ? 'pb-3' : ''}>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Filter className="w-5 h-5" />
                <span>Ledamotstyp</span>
              </CardTitle>
              {!isMobile && (
                <CardDescription>
                  Välj vilken kategori av ledamöter du vill visa
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'flex-wrap gap-4'}`}>
                <Button
                  variant={memberStatus === 'current' ? 'default' : 'outline'}
                  onClick={() => handleStatusChange('current')}
                  className={isMobile ? 'w-full justify-start' : ''}
                  size={isMobile ? 'default' : 'default'}
                >
                  Nuvarande ledamöter
                </Button>
                <Button
                  variant={memberStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => handleStatusChange('all')}
                  className={isMobile ? 'w-full justify-start' : ''}
                  size={isMobile ? 'default' : 'default'}
                >
                  Alla ledamöter
                </Button>
                <Button
                  variant={memberStatus === 'former' ? 'default' : 'outline'}
                  onClick={() => handleStatusChange('former')}
                  className={isMobile ? 'w-full justify-start' : ''}
                  size={isMobile ? 'default' : 'default'}
                >
                  Tidigare ledamöter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search and filter section - Mobile optimized */}
          <Card className={`mb-6 ${isMobile ? 'mx-0' : ''}`}>
            <CardHeader className={isMobile ? 'pb-3' : ''}>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Search className="w-5 h-5" />
                <span>Sök och filtrera</span>
              </CardTitle>
              {!isMobile && (
                <CardDescription>
                  Hitta specifika ledamöter eller filtrera efter parti, valkrets och utskott
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : isTablet ? 'grid-cols-2 gap-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4'}`}>
                <div className={isMobile ? 'col-span-1' : ''}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sök ledamot
                  </label>
                  <MemberAutocomplete 
                    onSelectMember={handleAutocompleteSelect}
                    placeholder="Skriv namn för att söka..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sök efter namn
                  </label>
                  <Input
                    placeholder="Skriv namn..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={!!autocompleteFilter}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parti
                  </label>
                  <Select 
                    value={selectedParty} 
                    onValueChange={setSelectedParty}
                    disabled={!!autocompleteFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj parti" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alla partier</SelectItem>
                      {actualParties.map((party) => (
                        <SelectItem key={party} value={party}>
                          {partyInfo[party] ? `${partyInfo[party].fullName} (${partyInfo[party].name})` : party}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valkrets
                  </label>
                  <Select 
                    value={selectedConstituency} 
                    onValueChange={setSelectedConstituency}
                    disabled={!!autocompleteFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj valkrets" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alla valkretsar</SelectItem>
                      {constituencies.filter(constituency => constituency && constituency.trim() !== "").map((constituency) => (
                        <SelectItem key={constituency} value={constituency}>
                          {constituency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Utskott/Organ
                  </label>
                  <Select 
                    value={selectedCommittee} 
                    onValueChange={handleCommitteeChange}
                    disabled={!!autocompleteFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj utskott" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">Alla utskott/organ</SelectItem>
                      {committees.map((committee) => (
                        <SelectItem key={committee} value={committee}>
                          {committee}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sortera efter
                  </label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sortera efter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Namn</SelectItem>
                      <SelectItem value="party">Parti</SelectItem>
                      <SelectItem value="constituency">Valkrets</SelectItem>
                      <SelectItem value="activity">Aktivitetspoäng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filter status indicators */}
              {autocompleteFilter && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-blue-700">
                    Visar resultat för: <strong>{autocompleteFilter.tilltalsnamn} {autocompleteFilter.efternamn}</strong>
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleAutocompleteSelect(null)}
                    className="text-blue-700 hover:text-blue-800"
                  >
                    Rensa filter
                  </Button>
                </div>
              )}

              {selectedCommittee !== "all" && !autocompleteFilter && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-green-700">
                    Visar ledamöter från: <strong>{selectedCommittee}</strong>
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleCommitteeChange("all")}
                    className="text-green-700 hover:text-green-800"
                  >
                    Rensa filter
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results counter */}
          <div className={`mb-4 ${isMobile ? 'px-0' : ''}`}>
            <p className="text-gray-600 text-sm">
              Visar {filteredAndSortedMembers.length} av {totalCount} ledamöter
              {memberStatus === 'current' && ' (nuvarande)'}
              {memberStatus === 'former' && ' (tidigare)'}
              {memberStatus === 'all' && ' (alla)'}
              {selectedCommittee !== "all" && ` i ${selectedCommittee}`}
            </p>
          </div>
        </div>

        {/* Member grid - Responsive */}
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4' : 'px-4 sm:px-6 lg:px-8'}`}>
          <div className={`grid ${
            isMobile 
              ? 'grid-cols-1 gap-4' 
              : isTablet 
                ? 'grid-cols-2 gap-4' 
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          }`}>
            {filteredAndSortedMembers.map((member: any) => (
              <MemberCard
                key={member.id}
                member={member}
                onClick={() => {
                  setSelectedMemberId(member.id);
                  navigate(`/ledamoter?id=${member.id}`);
                }}
              />
            ))}
          </div>

          {/* Load more button */}
          {hasMore && !autocompleteFilter && (
            <div className="mt-8 text-center pb-8">
              <Button 
                onClick={handleLoadMore}
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
          {filteredAndSortedMembers.length === 0 && !loading && (
            <Card className="mt-8 mb-8">
              <CardContent className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Inga ledamöter hittades
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Inga ledamöter matchar dina sökkriterier. Försök att rensa filter eller sök med ett annat namn.
                </p>
                <Button onClick={clearAllFilters} className="mt-4">
                  Rensa alla filter
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Member profile modal */}
      {selectedMemberId && (
        <MemberProfile
          memberId={selectedMemberId}
          onClose={() => {
            setSelectedMemberId(null);
            navigate('/ledamoter', { replace: true });
          }}
        />
      )}
    </>
  );
};

export default Ledamoter;
