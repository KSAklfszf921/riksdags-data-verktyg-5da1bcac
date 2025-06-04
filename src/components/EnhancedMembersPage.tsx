
import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Activity, MapPin, Filter } from "lucide-react";
import { useResponsive } from "@/hooks/use-responsive";
import MemberFilters, { MemberFilter } from "./MemberFilters";
import EnhancedMemberGrid from "./EnhancedMemberGrid";
import StatsDashboard from "./StatsDashboard";

// Mock data - in real app this would come from your API
const mockMembers = [
  {
    id: '1',
    member_id: 'i-123',
    first_name: 'Anna',
    last_name: 'Andersson',
    party: 'S',
    constituency: 'Stockholm',
    birth_year: 1975,
    gender: 'kvinna',
    current_committees: ['UU', 'FiU'],
    image_urls: {},
    is_active: true
  },
  {
    id: '2',
    member_id: 'i-124',
    first_name: 'Erik',
    last_name: 'Eriksson',
    party: 'M',
    constituency: 'Göteborg',
    birth_year: 1968,
    gender: 'man',
    current_committees: ['NU'],
    image_urls: {},
    is_active: true
  },
  // Add more mock members as needed
];

const availableParties = ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP'];
const availableConstituencies = ['Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Västra Götaland'];
const availableCommittees = ['UU', 'FiU', 'NU', 'SoU', 'SkU', 'TU', 'MU'];

interface EnhancedMembersPageProps {
  className?: string;
}

const EnhancedMembersPage: React.FC<EnhancedMembersPageProps> = ({
  className = ""
}) => {
  const { isMobile } = useResponsive();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filters, setFilters] = useState<MemberFilter>({
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

  // Filter and sort members
  const filteredMembers = useMemo(() => {
    let filtered = mockMembers.filter(member => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
        if (!fullName.includes(searchTerm)) return false;
      }

      // Party filter
      if (filters.party.length > 0 && !filters.party.includes(member.party)) {
        return false;
      }

      // Gender filter
      if (filters.gender.length > 0 && member.gender && !filters.gender.includes(member.gender)) {
        return false;
      }

      // Constituency filter
      if (filters.constituency.length > 0 && member.constituency && !filters.constituency.includes(member.constituency)) {
        return false;
      }

      // Age filter
      if (member.birth_year) {
        const age = new Date().getFullYear() - member.birth_year;
        if (age < filters.ageRange[0] || age > filters.ageRange[1]) {
          return false;
        }
      }

      // Active only filter
      if (filters.activeOnly && !member.is_active) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
          break;
        case 'party':
          comparison = a.party.localeCompare(b.party);
          break;
        case 'age':
          const ageA = a.birth_year ? new Date().getFullYear() - a.birth_year : 0;
          const ageB = b.birth_year ? new Date().getFullYear() - b.birth_year : 0;
          comparison = ageA - ageB;
          break;
        case 'constituency':
          comparison = (a.constituency || '').localeCompare(b.constituency || '');
          break;
        default:
          comparison = 0;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [filters]);

  const handleToggleFavorite = useCallback((memberId: string) => {
    setFavorites(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  }, []);

  // Generate quick stats
  const stats = useMemo(() => {
    const partyStats = filteredMembers.reduce((acc, member) => {
      acc[member.party] = (acc[member.party] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const genderStats = filteredMembers.reduce((acc, member) => {
      if (member.gender) {
        acc[member.gender] = (acc[member.gender] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      total: filteredMembers.length,
      parties: Object.keys(partyStats).length,
      averageAge: filteredMembers
        .filter(m => m.birth_year)
        .reduce((sum, m) => sum + (new Date().getFullYear() - (m.birth_year || 0)), 0) / 
        filteredMembers.filter(m => m.birth_year).length,
      genderDistribution: genderStats
    };
  }, [filteredMembers]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.total}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Ledamöter</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.parties}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Partier</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {isNaN(stats.averageAge) ? '-' : Math.round(stats.averageAge)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Medelålder</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {favorites.length}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Favoriter</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <MemberFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableParties={availableParties}
        availableConstituencies={availableConstituencies}
        availableCommittees={availableCommittees}
        compact={isMobile}
      />

      {/* Members Grid */}
      <EnhancedMemberGrid
        members={filteredMembers}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
};

export default EnhancedMembersPage;
