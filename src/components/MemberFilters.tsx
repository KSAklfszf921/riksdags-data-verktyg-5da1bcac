
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MemberFilter {
  search: string;
  party: string[];
  gender: string[];
  constituency: string[];
  committee: string[];
  status: 'all' | 'active' | 'former';
  ageRange: [number, number];
  activeOnly: boolean;
  sortBy: 'name' | 'party' | 'age' | 'constituency' | 'activity';
  sortOrder: 'asc' | 'desc';
}

interface MemberFiltersProps {
  filters: MemberFilter;
  onFiltersChange: (filters: MemberFilter) => void;
  availableParties: string[];
  availableConstituencies: string[];
  availableCommittees: string[];
  compact?: boolean;
  className?: string;
}

const MemberFilters: React.FC<MemberFiltersProps> = ({
  filters,
  onFiltersChange,
  availableParties,
  availableConstituencies,
  availableCommittees,
  compact = false,
  className
}) => {
  const updateFilter = (key: keyof MemberFilter, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFiltersChange({
      search: '',
      party: [],
      gender: [],
      constituency: [],
      committee: [],
      status: 'all',
      ageRange: [20, 80],
      activeOnly: true,
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  const addPartyFilter = (party: string) => {
    if (!filters.party.includes(party)) {
      updateFilter('party', [...filters.party, party]);
    }
  };

  const removePartyFilter = (party: string) => {
    updateFilter('party', filters.party.filter(p => p !== party));
  };

  const addConstituencyFilter = (constituency: string) => {
    if (!filters.constituency.includes(constituency)) {
      updateFilter('constituency', [...filters.constituency, constituency]);
    }
  };

  const removeConstituencyFilter = (constituency: string) => {
    updateFilter('constituency', filters.constituency.filter(c => c !== constituency));
  };

  const addCommitteeFilter = (committee: string) => {
    if (!filters.committee.includes(committee)) {
      updateFilter('committee', [...filters.committee, committee]);
    }
  };

  const removeCommitteeFilter = (committee: string) => {
    updateFilter('committee', filters.committee.filter(c => c !== committee));
  };

  if (compact) {
    return (
      <Card className={className}>
        <CardContent className="p-4 space-y-4">
          {/* Enhanced status filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <Select value={filters.status} onValueChange={(value: 'all' | 'active' | 'former') => updateFilter('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Välj status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla ledamöter</SelectItem>
                <SelectItem value="active">Aktiva ledamöter</SelectItem>
                <SelectItem value="former">Tidigare ledamöter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Parti</Label>
              <Select value="" onValueChange={addPartyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Lägg till parti" />
                </SelectTrigger>
                <SelectContent>
                  {availableParties.filter(party => !filters.party.includes(party)).map(party => (
                    <SelectItem key={party} value={party}>{party}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Sortering</Label>
              <Select value={filters.sortBy} onValueChange={(value: any) => updateFilter('sortBy', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Namn</SelectItem>
                  <SelectItem value="party">Parti</SelectItem>
                  <SelectItem value="age">Ålder</SelectItem>
                  <SelectItem value="constituency">Valkrets</SelectItem>
                  <SelectItem value="activity">Aktivitet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected filters */}
          {(filters.party.length > 0 || filters.constituency.length > 0 || filters.committee.length > 0) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Aktiva filter</Label>
              <div className="flex flex-wrap gap-1">
                {filters.party.map(party => (
                  <Badge key={party} variant="secondary" className="text-xs">
                    {party}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => removePartyFilter(party)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                {filters.constituency.map(constituency => (
                  <Badge key={constituency} variant="secondary" className="text-xs">
                    {constituency}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => removeConstituencyFilter(constituency)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                {filters.committee.map(committee => (
                  <Badge key={committee} variant="secondary" className="text-xs">
                    {committee}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => removeCommitteeFilter(committee)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button onClick={resetFilters} variant="outline" size="sm" className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            Rensa filter
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Filter className="w-5 h-5" />
          <span>Filter</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Sök</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="search"
              placeholder="Sök efter namn, parti eller valkrets..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Enhanced Status Filter */}
        <div className="space-y-2">
          <Label>Medlemsstatus</Label>
          <Select value={filters.status} onValueChange={(value: 'all' | 'active' | 'former') => updateFilter('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Välj status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla ledamöter</SelectItem>
              <SelectItem value="active">Aktiva ledamöter</SelectItem>
              <SelectItem value="former">Tidigare ledamöter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Party filters */}
        <div className="space-y-2">
          <Label>Parti</Label>
          <Select value="" onValueChange={addPartyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Välj parti" />
            </SelectTrigger>
            <SelectContent>
              {availableParties.filter(party => !filters.party.includes(party)).map(party => (
                <SelectItem key={party} value={party}>{party}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.party.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.party.map(party => (
                <Badge key={party} variant="secondary">
                  {party}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => removePartyFilter(party)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Gender filter */}
        <div className="space-y-2">
          <Label>Kön</Label>
          <div className="space-y-2">
            {['man', 'kvinna'].map(gender => (
              <div key={gender} className="flex items-center space-x-2">
                <Checkbox
                  id={`gender-${gender}`}
                  checked={filters.gender.includes(gender)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateFilter('gender', [...filters.gender, gender]);
                    } else {
                      updateFilter('gender', filters.gender.filter(g => g !== gender));
                    }
                  }}
                />
                <Label htmlFor={`gender-${gender}`} className="text-sm">
                  {gender === 'man' ? 'Man' : 'Kvinna'}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Constituency filters */}
        <div className="space-y-2">
          <Label>Valkrets</Label>
          <Select value="" onValueChange={addConstituencyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Välj valkrets" />
            </SelectTrigger>
            <SelectContent>
              {availableConstituencies.filter(c => !filters.constituency.includes(c)).map(constituency => (
                <SelectItem key={constituency} value={constituency}>{constituency}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.constituency.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.constituency.map(constituency => (
                <Badge key={constituency} variant="secondary">
                  {constituency}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => removeConstituencyFilter(constituency)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Committee filters */}
        <div className="space-y-2">
          <Label>Utskott</Label>
          <Select value="" onValueChange={addCommitteeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Välj utskott" />
            </SelectTrigger>
            <SelectContent>
              {availableCommittees.filter(c => !filters.committee.includes(c)).map(committee => (
                <SelectItem key={committee} value={committee}>{committee}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.committee.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.committee.map(committee => (
                <Badge key={committee} variant="secondary">
                  {committee}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => removeCommitteeFilter(committee)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Age range */}
        <div className="space-y-2">
          <Label>Åldersintervall</Label>
          <div className="px-2">
            <Slider
              value={filters.ageRange}
              onValueChange={(value) => updateFilter('ageRange', value as [number, number])}
              max={90}
              min={18}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>{filters.ageRange[0]} år</span>
              <span>{filters.ageRange[1]} år</span>
            </div>
          </div>
        </div>

        {/* Sorting */}
        <div className="space-y-2">
          <Label>Sortering</Label>
          <div className="grid grid-cols-2 gap-2">
            <Select value={filters.sortBy} onValueChange={(value: any) => updateFilter('sortBy', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Namn</SelectItem>
                <SelectItem value="party">Parti</SelectItem>
                <SelectItem value="age">Ålder</SelectItem>
                <SelectItem value="constituency">Valkrets</SelectItem>
                <SelectItem value="activity">Aktivitet</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.sortOrder} onValueChange={(value: any) => updateFilter('sortOrder', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Stigande</SelectItem>
                <SelectItem value="desc">Fallande</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reset button */}
        <Button onClick={resetFilters} variant="outline" className="w-full">
          <RotateCcw className="w-4 h-4 mr-2" />
          Rensa alla filter
        </Button>
      </CardContent>
    </Card>
  );
};

export default MemberFilters;
