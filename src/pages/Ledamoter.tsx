
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, ArrowLeft, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { mockMembers, partyInfo } from "../data/mockMembers";
import { Member } from "../types/member";
import MemberCard from "../components/MemberCard";
import MemberProfile from "../components/MemberProfile";

const Ledamoter = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParty, setSelectedParty] = useState<string>("all");
  const [selectedConstituency, setSelectedConstituency] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Hämta unika valkretsar
  const constituencies = Array.from(new Set(mockMembers.map(member => member.constituency))).sort();

  // Filtrera och sortera ledamöter
  const filteredAndSortedMembers = mockMembers
    .filter(member => {
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sök efter namn
                    </label>
                    <Input
                      placeholder="Skriv namn..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parti
                    </label>
                    <Select value={selectedParty} onValueChange={setSelectedParty}>
                      <SelectTrigger>
                        <SelectValue placeholder="Välj parti" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alla partier</SelectItem>
                        {Object.entries(partyInfo).map(([key, party]) => (
                          <SelectItem key={key} value={key}>
                            {party.fullName} ({party.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valkrets
                    </label>
                    <Select value={selectedConstituency} onValueChange={setSelectedConstituency}>
                      <SelectTrigger>
                        <SelectValue placeholder="Välj valkrets" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alla valkretsar</SelectItem>
                        {constituencies.map((constituency) => (
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
              </CardContent>
            </Card>

            {/* Resultaträknare */}
            <div className="mb-4">
              <p className="text-gray-600">
                Visar {filteredAndSortedMembers.length} av {mockMembers.length} ledamöter
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
