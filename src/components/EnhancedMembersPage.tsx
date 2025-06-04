import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Filter, Search, Star, Grid, List, Smartphone, AlertTriangle, Database } from "lucide-react";
import { useEnhancedMembers } from '@/hooks/useEnhancedMembers';
import { useFavorites } from '@/hooks/useFavorites';
import { useResponsive } from '@/hooks/use-responsive';
import EnhancedMemberGrid from './EnhancedMemberGrid';
import MemberFilters, { MemberFilter } from './MemberFilters';
import EnhancedMemberProfile from './EnhancedMemberProfile';
import MobileMemberCard from './MobileMemberCard';
import MemberDataSynchronizer from './MemberDataSynchronizer';
import { cn } from '@/lib/utils';

const EnhancedMembersPage: React.FC = () => {
  const { isMobile } = useResponsive();
  const { favorites, toggleFavorite } = useFavorites();
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'mobile'>('grid');
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [showSyncTool, setShowSyncTool] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  
  const [filters, setFilters] = useState<MemberFilter>({
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

  // Load members with enhanced data, adjusting status filter
  const memberStatus = filters.status === 'all' ? 'all' : 
                      filters.status === 'active' ? 'current' : 'former';
  const { members, loading, error } = useEnhancedMembers(1, 1000, memberStatus);

  // Check if data needs synchronization
  const needsSync = useMemo(() => {
    if (members.length === 0) return false;
    const emptyNames = members.filter(m => !m.first_name || m.first_name.trim() === '').length;
    return (emptyNames / members.length) > 0.1;
  }, [members]);

  // Extract available filter options
  const filterOptions = useMemo(() => {
    const parties = [...new Set(members.map(m => m.party))].sort();
    const constituencies = [...new Set(members.filter(m => m.constituency).map(m => m.constituency!))].sort();
    const committees = [...new Set(members.flatMap(m => m.current_committees || []))].sort();
    
    return { parties, constituencies, committees };
  }, [members]);

  // Apply filters
  const filteredMembers = useMemo(() => {
    let filtered = [...members];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(member => {
        const firstName = member.first_name || '';
        const lastName = member.last_name || '';
        const party = member.party || '';
        const constituency = member.constituency || '';
        
        return firstName.toLowerCase().includes(searchLower) ||
               lastName.toLowerCase().includes(searchLower) ||
               party.toLowerCase().includes(searchLower) ||
               constituency.toLowerCase().includes(searchLower);
      });
    }

    // Party filter
    if (filters.party.length > 0) {
      filtered = filtered.filter(member => filters.party.includes(member.party));
    }

    // Gender filter
    if (filters.gender.length > 0) {
      filtered = filtered.filter(member => 
        member.gender && filters.gender.includes(member.gender)
      );
    }

    // Constituency filter
    if (filters.constituency.length > 0) {
      filtered = filtered.filter(member => 
        member.constituency && filters.constituency.includes(member.constituency)
      );
    }

    // Committee filter
    if (filters.committee.length > 0) {
      filtered = filtered.filter(member =>
        member.current_committees && 
        filters.committee.some(committee => member.current_committees!.includes(committee))
      );
    }

    // Age filter
    filtered = filtered.filter(member => {
      if (!member.birth_year) return true;
      const memberAge = new Date().getFullYear() - member.birth_year;
      return memberAge >= filters.ageRange[0] && memberAge <= filters.ageRange[1];
    });

    // Status is now handled by the useEnhancedMembers hook
    // but we keep the activeOnly filter for backward compatibility
    if (filters.activeOnly && filters.status === 'all') {
      filtered = filtered.filter(member => member.is_active);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim();
          const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim();
          comparison = nameA.localeCompare(nameB);
          break;
        case 'party':
          comparison = (a.party || '').localeCompare(b.party || '');
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
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [members, filters]);

  // Get members based on active tab
  const displayMembers = useMemo(() => {
    if (activeTab === 'favorites') {
      return filteredMembers.filter(member => favorites.includes(member.member_id));
    }
    return filteredMembers;
  }, [filteredMembers, activeTab, favorites]);

  const handleMemberSelect = useCallback((member: any) => {
    setSelectedMember(member);
  }, []);

  const handleViewModeChange = useCallback((mode: 'grid' | 'list') => {
    setViewMode(mode);
  }, []);

  // Auto-adjust view mode based on screen size
  React.useEffect(() => {
    if (isMobile && viewMode !== 'mobile') {
      setViewMode('mobile');
    }
  }, [isMobile, viewMode]);

  if (error) {
    return (
      <Card className="p-8">
        <div className="text-center text-red-600">
          <h3 className="text-lg font-medium mb-2">Fel vid laddning</h3>
          <p className="text-sm">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data quality warning */}
      {needsSync && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <div>
                  <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Ofullständig medlemsdata upptäckt
                  </h3>
                  <p className="text-xs text-orange-600 dark:text-orange-300">
                    Många ledamöter saknar namn och annan viktig information. Kör synkronisering för att hämta fullständig data.
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setShowSyncTool(!showSyncTool)}
                variant="outline"
                size="sm"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <Database className="w-4 h-4 mr-2" />
                {showSyncTool ? 'Dölj' : 'Visa'} Synkronisering
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync tool */}
      {showSyncTool && (
        <MemberDataSynchronizer />
      )}

      {/* Header with tabs and status summary */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-6 h-6" />
              <span>Riksdagsledamöter</span>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              {!isMobile && (
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2"
                >
                  <Filter className="w-4 h-4" />
                  <span>{showFilters ? 'Dölj filter' : 'Visa filter'}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Status summary */}
          <div className="flex flex-wrap gap-2 text-sm text-gray-600">
            <Badge variant="outline">
              Totalt: {members.length} ledamöter
            </Badge>
            <Badge variant="outline">
              Aktiva: {members.filter(m => m.is_active).length}
            </Badge>
            <Badge variant="outline">
              Tidigare: {members.filter(m => !m.is_active).length}
            </Badge>
            <Badge variant="outline">
              Filtrerade: {displayMembers.length}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'favorites')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Alla ({filteredMembers.length})</span>
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex items-center space-x-2">
                <Star className="w-4 h-4" />
                <span>Favoriter ({favorites.length})</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick search for mobile */}
      {isMobile && (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Sök ledamot..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        {showFilters && !isMobile && (
          <div className="lg:col-span-1">
            <MemberFilters
              filters={filters}
              onFiltersChange={setFilters}
              availableParties={filterOptions.parties}
              availableConstituencies={filterOptions.constituencies}
              availableCommittees={filterOptions.committees}
              compact={isMobile}
            />
          </div>
        )}

        {/* Main content */}
        <div className={cn(
          showFilters && !isMobile ? "lg:col-span-3" : "lg:col-span-4"
        )}>
          {/* Mobile filters */}
          {isMobile && showFilters && (
            <MemberFilters
              filters={filters}
              onFiltersChange={setFilters}
              availableParties={filterOptions.parties}
              availableConstituencies={filterOptions.constituencies}
              availableCommittees={filterOptions.committees}
              compact={true}
              className="mb-6"
            />
          )}

          {/* Members display */}
          {viewMode === 'mobile' ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">
                  {displayMembers.length} ledamöter
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
              
              {displayMembers.map((member) => (
                <MobileMemberCard
                  key={member.member_id}
                  member={member}
                  isFavorite={favorites.includes(member.member_id)}
                  onToggleFavorite={toggleFavorite}
                  onMemberSelect={handleMemberSelect}
                />
              ))}
            </div>
          ) : (
            <EnhancedMemberGrid
              members={displayMembers}
              loading={loading}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              onMemberSelect={handleMemberSelect}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
            />
          )}
        </div>
      </div>

      {/* Member profile modal */}
      {selectedMember && (
        <EnhancedMemberProfile 
          member={selectedMember} 
          onClose={() => setSelectedMember(null)} 
        />
      )}
    </div>
  );
};

export default EnhancedMembersPage;
