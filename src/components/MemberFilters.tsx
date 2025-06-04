
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X, Search, Users, MapPin, Calendar, RotateCcw, Activity } from "lucide-react";
import { cn } from '@/lib/utils';

export interface MemberFilter {
  search: string;
  party: string[];
  gender: string[];
  constituency: string[];
  committee: string[];
  ageRange: [number, number];
  activeOnly: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface MemberFiltersProps {
  filters: MemberFilter;
  onFiltersChange: (filters: MemberFilter) => void;
  availableParties: string[];
  availableConstituencies: string[];
  availableCommittees: string[];
  className?: string;
  compact?: boolean;
}

const MemberFilters: React.FC<MemberFiltersProps> = ({
  filters,
  onFiltersChange,
  availableParties,
  availableConstituencies,
  availableCommittees,
  className = "",
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);

  const updateFilter = useCallback((key: keyof MemberFilter, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  }, [filters, onFiltersChange]);

  const toggleArrayFilter = useCallback((key: 'party' | 'gender' | 'constituency' | 'committee', value: string) => {
    const currentArray = filters[key];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilter(key, newArray);
  }, [filters, updateFilter]);

  const clearAllFilters = useCallback(() => {
    onFiltersChange({
      search: '',
      party: [],
      gender: [],
      constituency: [],
      committee: [],
      ageRange: [20, 80],
      activeOnly: true,
      sortBy: 'name',
      sortOrder: 'asc'
    });
  }, [onFiltersChange]);

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.party.length > 0) count++;
    if (filters.gender.length > 0) count++;
    if (filters.constituency.length > 0) count++;
    if (filters.committee.length > 0) count++;
    if (filters.ageRange[0] !== 20 || filters.ageRange[1] !== 80) count++;
    if (!filters.activeOnly) count++;
    return count;
  };

  const sortOptions = [
    { value: 'name', label: 'Namn' },
    { value: 'party', label: 'Parti' },
    { value: 'age', label: 'Ålder' },
    { value: 'constituency', label: 'Valkrets' },
    { value: 'activity', label: 'Aktivitet' }
  ];

  // Committee name mapping for better display
  const COMMITTEE_MAPPING: { [key: string]: string } = {
    'AU': 'Arbetsmarknadsutskottet',
    'CU': 'Civilutskottet',
    'FiU': 'Finansutskottet',
    'FöU': 'Försvarsutskottet',
    'JuU': 'Justitieutskottet',
    'KU': 'Konstitutionsutskottet',
    'KrU': 'Kulturutskottet',
    'MjU': 'Miljö- och jordbruksutskottet',
    'NU': 'Näringsutskottet',
    'SkU': 'Skatteutskottet',
    'SfU': 'Socialförsäkringsutskottet',
    'SoU': 'Socialutskottet',
    'TU': 'Trafikutskottet',
    'UbU': 'Utbildningsutskottet',
    'UU': 'Utrikesutskottet',
    'UFöU': 'Sammansatta utrikes- och försvarsutskottet',
    'EUN': 'EU-nämnden',
    'SäU': 'Säkerhetsutskottet'
  };

  const getCommitteeDisplayName = (code: string) => {
    return COMMITTEE_MAPPING[code] || code;
  };

  if (compact && !isExpanded) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Button
          variant="outline"
          onClick={() => setIsExpanded(true)}
          className="flex items-center space-x-2"
        >
          <Filter className="w-4 h-4" />
          <span>Filter</span>
          {getActiveFilterCount() > 0 && (
            <Badge variant="secondary" className="ml-1">
              {getActiveFilterCount()}
            </Badge>
          )}
        </Button>
        
        <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          {filters.sortOrder === 'asc' ? '↑' : '↓'}
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn("bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filter och sortering</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary">
                {getActiveFilterCount()} aktiva filter
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Rensa
            </Button>
            {compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center space-x-1">
            <Search className="w-4 h-4" />
            <span>Sök ledamot</span>
          </label>
          <Input
            placeholder="Sök på namn, parti eller valkrets..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
        </div>

        {/* Sort */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-1">
              <Activity className="w-4 h-4" />
              <span>Sortera efter</span>
            </label>
            <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Ordning</label>
            <Select 
              value={filters.sortOrder} 
              onValueChange={(value: 'asc' | 'desc') => updateFilter('sortOrder', value)}
            >
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

        {/* Parties */}
        {availableParties.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>Partier</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {availableParties.map(party => (
                <Badge
                  key={party}
                  variant={filters.party.includes(party) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                  onClick={() => toggleArrayFilter('party', party)}
                >
                  {party}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Gender */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Kön</label>
          <div className="flex space-x-4">
            {['man', 'kvinna'].map(gender => (
              <div key={gender} className="flex items-center space-x-2">
                <Checkbox
                  id={gender}
                  checked={filters.gender.includes(gender)}
                  onCheckedChange={() => toggleArrayFilter('gender', gender)}
                />
                <label htmlFor={gender} className="text-sm capitalize">
                  {gender}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Age Range */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>Åldersintervall: {filters.ageRange[0]} - {filters.ageRange[1]} år</span>
          </label>
          <Slider
            value={filters.ageRange}
            onValueChange={(value) => updateFilter('ageRange', value as [number, number])}
            max={80}
            min={20}
            step={1}
            className="w-full"
          />
        </div>

        {/* Constituencies */}
        {availableConstituencies.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>Valkrets</span>
            </label>
            <Select onValueChange={(value) => toggleArrayFilter('constituency', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Välj valkrets..." />
              </SelectTrigger>
              <SelectContent>
                {availableConstituencies.map(constituency => (
                  <SelectItem key={constituency} value={constituency}>
                    {constituency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.constituency.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {filters.constituency.map(constituency => (
                  <Badge 
                    key={constituency} 
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => toggleArrayFilter('constituency', constituency)}
                  >
                    {constituency}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Committees */}
        {availableCommittees.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>Utskott</span>
            </label>
            <Select onValueChange={(value) => toggleArrayFilter('committee', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Välj utskott..." />
              </SelectTrigger>
              <SelectContent>
                {availableCommittees.map(committee => (
                  <SelectItem key={committee} value={committee}>
                    {getCommitteeDisplayName(committee)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.committee.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {filters.committee.map(committee => (
                  <Badge 
                    key={committee} 
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => toggleArrayFilter('committee', committee)}
                  >
                    {getCommitteeDisplayName(committee)}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active Only */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="activeOnly"
            checked={filters.activeOnly}
            onCheckedChange={(checked) => updateFilter('activeOnly', checked)}
          />
          <label htmlFor="activeOnly" className="text-sm">
            Visa endast aktiva ledamöter
          </label>
        </div>
      </CardContent>
    </Card>
  );
};

export default MemberFilters;
