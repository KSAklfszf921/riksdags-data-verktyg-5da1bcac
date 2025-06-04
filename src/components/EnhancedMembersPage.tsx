
import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, Activity, MapPin } from "lucide-react";
import { useResponsive } from "@/hooks/use-responsive";
import { useEnhancedMembers } from "@/hooks/useEnhancedMembers";
import MemberFilters, { MemberFilter } from "./MemberFilters";
import EnhancedMemberGrid from "./EnhancedMemberGrid";

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

  // Load enhanced members data from Supabase with full functionality
  const { members: allMembers, loading, error } = useEnhancedMembers(1, 1000, 'current');

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    if (!allMembers.length) {
      return {
        parties: [],
        constituencies: [],
        committees: []
      };
    }

    const parties = [...new Set(allMembers.map(m => m.party))].sort();
    const constituencies = [...new Set(allMembers.map(m => m.constituency).filter(Boolean))].sort();
    const committees = [...new Set(allMembers.flatMap(m => m.current_committees || []))].sort();

    return { parties, constituencies, committees };
  }, [allMembers]);

  // Enhanced filtering with full data support
  const filteredMembers = useMemo(() => {
    let filtered = allMembers.filter(member => {
      // Search filter - search in name, party, constituency
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
        const searchableText = `${fullName} ${member.party.toLowerCase()} ${(member.constituency || '').toLowerCase()}`;
        if (!searchableText.includes(searchTerm)) return false;
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

      // Committee filter
      if (filters.committee.length > 0) {
        const memberCommittees = member.current_committees || [];
        if (!filters.committee.some(committee => memberCommittees.includes(committee))) {
          return false;
        }
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

    // Enhanced sorting with activity data
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
        case 'activity':
          const activityA = a.current_year_stats?.total_documents || 0;
          const activityB = b.current_year_stats?.total_documents || 0;
          comparison = activityA - activityB;
          break;
        default:
          comparison = 0;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [allMembers, filters]);

  const handleToggleFavorite = useCallback((memberId: string) => {
    setFavorites(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  }, []);

  // Enhanced statistics with real activity data
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

    const averageAge = filteredMembers
      .filter(m => m.birth_year)
      .reduce((sum, m) => sum + (new Date().getFullYear() - (m.birth_year || 0)), 0) / 
      filteredMembers.filter(m => m.birth_year).length;

    const totalActivity = filteredMembers.reduce((sum, m) => {
      return sum + (m.current_year_stats?.total_documents || 0);
    }, 0);

    return {
      total: filteredMembers.length,
      parties: Object.keys(partyStats).length,
      averageAge: isNaN(averageAge) ? 0 : Math.round(averageAge),
      genderDistribution: genderStats,
      totalActivity: totalActivity,
      avgActivity: filteredMembers.length > 0 ? Math.round(totalActivity / filteredMembers.length) : 0
    };
  }, [filteredMembers]);

  if (error) {
    return (
      <Card className="p-8">
        <div className="text-center text-red-500">
          <h3 className="text-lg font-medium mb-2">Fel vid laddning av data</h3>
          <p className="text-sm">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {loading ? '...' : stats.total}
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
                  {loading ? '...' : stats.parties}
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
                  {loading ? '...' : stats.avgActivity || '-'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Snitt aktivitet</p>
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
        availableParties={filterOptions.parties}
        availableConstituencies={filterOptions.constituencies}
        availableCommittees={filterOptions.committees}
        compact={isMobile}
      />

      {/* Enhanced Members Grid with full data */}
      <EnhancedMemberGrid
        members={filteredMembers}
        loading={loading}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
};

export default EnhancedMembersPage;
