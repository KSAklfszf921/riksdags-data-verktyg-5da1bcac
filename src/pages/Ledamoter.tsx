
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, ArrowLeft, Search, Filter, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { partyInfo } from "../data/mockMembers";
import { Member } from "../types/member";
import MemberCard from "../components/MemberCard";
import MemberProfile from "../components/MemberProfile";
import MemberAutocomplete from "../components/MemberAutocomplete";
import { useMembers } from "../hooks/useMembers";
import { RiksdagMember } from "../services/riksdagApi";

const Ledamoter = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParty, setSelectedParty] = useState<string>("all");
  const [selectedConstituency, setSelectedConstituency] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [autocompleteFilter, setAutocompleteFilter] = useState<RiksdagMember | null>(null);

  const { members, loading, error } = useMembers();

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

      const matchesSearch = 
        member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.lastName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesParty = selectedParty === "all" || member.party === selectedParty;
      const matchesConstituency = selectedConstituency === "all" || member.constituency === selectedConstituency;
      
      return matchesSearch && matchesParty && matchesConstituency;
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
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Laddar ledamöter...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
                <p className="text-gray-600">Utforska riksdagsledamöter och deras aktiviteter</p>
              </div>
            </div>

            {/* Sök- och filtersektion */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="w-5 h-5" />
                  <span>Sök och filtrera</span>
                </CardTitle>
                <CardDescription>
                  Hitta specifika ledamöter eller filtrera efter parti och valkrets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sök ledamot (autocomplete)
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
              </CardContent>
            </Card>

            {/* Resultaträknare */}
            <div className="mb-4">
              <p className="text-gray-600">
                Visar {filteredAndSortedMembers.length} av {members.length} ledamöter
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

          {filteredAndSortedMembers.length === 0 && (
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
