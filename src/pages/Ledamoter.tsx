
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, ArrowLeft, Search, Filter, Loader2, AlertCircle, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { partyInfo } from "../data/mockMembers";
import { Member } from "../types/member";
import MemberCard from "../components/MemberCard";
import MemberProfile from "../components/MemberProfile";
import MemberAutocomplete from "../components/MemberAutocomplete";
import { useMembers, useCommittees } from "../hooks/useMembers";
import { RiksdagMember } from "../services/riksdagApi";

const Ledamoter = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParty, setSelectedParty] = useState<string>("all");
  const [selectedConstituency, setSelectedConstituency] = useState<string>("all");
  const [selectedCommittee, setSelectedCommittee] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [autocompleteFilter, setAutocompleteFilter] = useState<RiksdagMember | null>(null);
  const [memberStatus, setMemberStatus] = useState<'current' | 'all' | 'former'>('current');
  const [currentPage, setCurrentPage] = useState(1);

  const { members, loading, error, totalCount, hasMore } = useMembers(
    currentPage, 
    20, 
    memberStatus, 
    selectedCommittee === "all" ? undefined : selectedCommittee
  );
  const { committees } = useCommittees();

  // Available committees list for member type filter
  const ALL_COMMITTEES = [
    'Arbetsmarknadsutskottet',
    'Bostadsutskottet', 
    'Civilutskottet',
    'EES-utskottet',
    'EU-nämnden',
    'Europarådets svenska delegation',
    'Finansutskottet',
    'Försvarsutskottet',
    'Jordbruksutskottet',
    'Justitieutskottet',
    'Konstitutionsutskottet',
    'Kulturutskottet',
    'Lagutskottet',
    'Miljö- och jordbruksutskottet',
    'Näringsutskottet',
    'Riksdagens delegation till Europarådets parlamentariska församling',
    'Sammansatta utrikes- och försvarsutskottet',
    'Skatteutskottet',
    'Socialförsäkringsutskottet',
    'Socialutskottet',
    'Trafikutskottet',
    'Utbildningsutskottet',
    'Utrikesutskottet'
  ];

  // Hämta unika valkretsar från riktig data
  const constituencies = Array.from(new Set(members.map(member => member.constituency))).sort();

  // Hämta unika partier från riktig data (filtrera bort tomma strängar)
  const actualParties = Array.from(new Set(members.map(member => member.party).filter(party => party && party.trim() !== ""))).sort();

  // Filtrera och sortera ledamöter
  const filteredAndSortedMembers = members
    .filter(member => {
      // Om autocomplete-filter är aktivt, visa bara den valda ledamoten
      if (autocompleteFilter) {
        return member.id === autocompleteFilter.intressent_id;
      }

      const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
      const matchesSearch = searchTerm === "" || fullName.includes(searchTerm.toLowerCase());
      const matchesParty = selectedParty === "all" || member.party === selectedParty;
      const matchesConstituency = selectedConstituency === "all" || member.constituency === selectedConstituency;
      
      // Improved committee filtering - check if member has any assignment in the selected committee
      const matchesCommittee = selectedCommittee === "all" || 
        member.assignments?.some(assignment => {
          const currentDate = new Date();
          const endDate = assignment.tom ? new Date(assignment.tom) : null;
          const isActive = !endDate || endDate > currentDate;
          
          // Match both by exact name and by containing the committee name
          return isActive && (
            assignment.organ === selectedCommittee ||
            assignment.organ.toLowerCase().includes(selectedCommittee.toLowerCase()) ||
            selectedCommittee.toLowerCase().includes(assignment.organ.toLowerCase())
          );
        });
      
      return matchesSearch && matchesParty && matchesConstituency && matchesCommittee;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case "party":
          return a.party.localeCompare(b.party);
        case "constituency":
          return a.constituency.localeCompare(b.constituency);
        case "activity":
          return b.activityScore - a.activityScore;
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
            <p className="text-gray-600 mb-4">{error}</p>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tillbaka till startsidan
            </Button>
            
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Ledamöter</h1>
                <p className="text-gray-600">Utforska riksdagsledamöter och deras aktuella uppdrag</p>
              </div>
            </div>

            {/* Status väljare */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="w-5 h-5" />
                  <span>Ledamotstyp</span>
                </CardTitle>
                <CardDescription>
                  Välj vilken kategori av ledamöter du vill visa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button
                    variant={memberStatus === 'current' ? 'default' : 'outline'}
                    onClick={() => handleStatusChange('current')}
                  >
                    Nuvarande ledamöter
                  </Button>
                  <Button
                    variant={memberStatus === 'all' ? 'default' : 'outline'}
                    onClick={() => handleStatusChange('all')}
                  >
                    Alla ledamöter
                  </Button>
                  <Button
                    variant={memberStatus === 'former' ? 'default' : 'outline'}
                    onClick={() => handleStatusChange('former')}
                  >
                    Tidigare ledamöter
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sök- och filtersektion */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="w-5 h-5" />
                  <span>Sök och filtrera</span>
                </CardTitle>
                <CardDescription>
                  Hitta specifika ledamöter eller filtrera efter parti, valkrets och utskott
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div>
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
                        {ALL_COMMITTEES.map((committee) => (
                          <SelectItem key={`static-${committee}`} value={committee}>
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

            {/* Resultaträknare */}
            <div className="mb-4">
              <p className="text-gray-600">
                Visar {filteredAndSortedMembers.length} av {totalCount} ledamöter
                {memberStatus === 'current' && ' (nuvarande)'}
                {memberStatus === 'former' && ' (tidigare)'}
                {memberStatus === 'all' && ' (alla)'}
                {selectedCommittee !== "all" && ` i ${selectedCommittee}`}
              </p>
            </div>
          </div>

          {/* Ledamötslista */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                onClick={() => setSelectedMember(member)}
              />
            ))}
          </div>

          {/* Ladda fler knapp */}
          {hasMore && !autocompleteFilter && (
            <div className="mt-8 text-center">
              <Button 
                onClick={handleLoadMore}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>{loading ? 'Laddar...' : 'Ladda fler ledamöter'}</span>
              </Button>
            </div>
          )}

          {filteredAndSortedMembers.length === 0 && !loading && (
            <Card className="mt-8">
              <CardContent className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Inga ledamöter hittades
                </h3>
                <p className="text-gray-600">
                  Prova att ändra dina sökkriterier eller filter
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Ledamotsprofil modal */}
      {selectedMember && (
        <MemberProfile
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </>
  );
};

export default Ledamoter;
