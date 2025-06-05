
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { partyInfo } from "../data/mockMembers";
import MemberAutocomplete from "./MemberAutocomplete";
import { useResponsive } from "../hooks/use-responsive";
import { RiksdagMember } from "../services/riksdagApi";

interface MemberFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedParty: string;
  setSelectedParty: (party: string) => void;
  selectedConstituency: string;
  setSelectedConstituency: (constituency: string) => void;
  selectedCommittee: string;
  setSelectedCommittee: (committee: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  autocompleteFilter: RiksdagMember | null;
  setAutocompleteFilter: (member: RiksdagMember | null) => void;
  constituencies: string[];
  actualParties: string[];
  committees: string[];
  onCommitteeChange: (committee: string) => void;
}

const MemberFilters = ({
  searchTerm,
  setSearchTerm,
  selectedParty,
  setSelectedParty,
  selectedConstituency,
  setSelectedConstituency,
  selectedCommittee,
  setSelectedCommittee,
  sortBy,
  setSortBy,
  autocompleteFilter,
  setAutocompleteFilter,
  constituencies,
  actualParties,
  committees,
  onCommitteeChange
}: MemberFiltersProps) => {
  const { isMobile, isTablet } = useResponsive();

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

  return (
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
              onValueChange={onCommitteeChange}
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
              onClick={() => onCommitteeChange("all")}
              className="text-green-700 hover:text-green-800"
            >
              Rensa filter
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberFilters;
