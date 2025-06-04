
import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Filter, Search, Star, Grid, List, AlertTriangle, Trash2, Database, RefreshCw } from "lucide-react";
import { useEnhancedMembers } from '@/hooks/useEnhancedMembers';
import { useFavorites } from '@/hooks/useFavorites';
import { useResponsive } from '@/hooks/use-responsive';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import EnhancedMemberGrid from './EnhancedMemberGrid';
import MemberFilters, { MemberFilter } from './MemberFilters';
import EnhancedMemberProfile from './EnhancedMemberProfile';
import MobileMemberCard from './MobileMemberCard';
import { cn } from '@/lib/utils';

const EnhancedMembersPage: React.FC = () => {
  const { isMobile } = useResponsive();
  const { favorites, toggleFavorite } = useFavorites();
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'mobile'>('grid');
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const [cleanupInProgress, setCleanupInProgress] = useState(false);
  
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

  // Load members with enhanced data
  const { members, loading, error } = useEnhancedMembers(1, 1000, 'current');

  // Check if database is empty
  const isDatabaseEmpty = !loading && members.length === 0 && !error;

  // Enhanced filter options with validation
  const filterOptions = useMemo(() => {
    const parties = [...new Set(members.filter(m => m.party).map(m => m.party))].sort();
    const constituencies = [...new Set(members.filter(m => m.constituency).map(m => m.constituency!))].sort();
    const committees = [...new Set(members.flatMap(m => m.current_committees || []))].sort();
    
    return { parties, constituencies, committees };
  }, [members]);

  // Data quality analysis for non-empty database
  const dataQualityAnalysis = useMemo(() => {
    if (members.length === 0) return { needsSync: false, incompleteProfiles: [] };
    
    const incompleteProfiles = members.filter(member => {
      const hasNoImage = !member.primary_image_url && 
                        (!member.image_urls || Object.keys(member.image_urls).length === 0);
      const hasNoName = !member.first_name || member.first_name.trim() === '';
      const hasNoBasicData = !member.constituency || !member.party;
      const hasLowCompleteness = (member.data_completeness_score || 0) < 30;
      
      return hasNoImage || hasNoName || hasNoBasicData || hasLowCompleteness;
    });
    
    const emptyNames = members.filter(m => !m.first_name || m.first_name.trim() === '').length;
    const needsSync = (emptyNames / members.length) > 0.1; // More than 10% have empty names
    
    return { needsSync, incompleteProfiles };
  }, [members]);

  // Clean up incomplete member profiles
  const handleCleanupIncompleteProfiles = useCallback(async () => {
    if (dataQualityAnalysis.incompleteProfiles.length === 0) {
      toast.info('Inga ofullständiga profiler hittades');
      return;
    }

    setCleanupInProgress(true);
    try {
      const memberIds = dataQualityAnalysis.incompleteProfiles.map(p => p.member_id);
      
      // Delete from enhanced_member_profiles
      const { error: enhancedError } = await supabase
        .from('enhanced_member_profiles')
        .delete()
        .in('member_id', memberIds);

      if (enhancedError) throw enhancedError;

      toast.success(`${memberIds.length} ofullständiga profiler har tagits bort. Kör datasynkronisering för att hämta uppdaterad data.`);
      
      // Refresh the page to reload data
      window.location.reload();
      
    } catch (error) {
      console.error('Error cleaning up incomplete profiles:', error);
      toast.error('Fel vid rensning av ofullständiga profiler');
    } finally {
      setCleanupInProgress(false);
    }
  }, [dataQualityAnalysis.incompleteProfiles]);

  // Trigger data synchronization
  const handleDataSync = useCallback(async () => {
    try {
      toast.info('Startar datasynkronisering...');
      
      // Call the comprehensive data sync function
      const { error } = await supabase.functions.invoke('fetch-comprehensive-data', {
        body: { 
          syncType: 'enhanced_members',
          forceRefresh: true 
        }
      });

      if (error) {
        throw error;
      }

      toast.success('Datasynkronisering startad. Data kommer att uppdateras inom kort.');
      
      // Refresh after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } catch (error) {
      console.error('Error starting data sync:', error);
      toast.error('Kunde inte starta datasynkronisering');
    }
  }, []);

  // Apply filters with enhanced validation
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
      filtered = filtered.filter(member => member.party && filters.party.includes(member.party));
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

    // Active status filter
    if (filters.activeOnly) {
      filtered = filtered.filter(member => member.is_active);
    }

    // Apply sorting with enhanced logic
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

  // Show empty database state
  if (isDatabaseEmpty) {
    return (
      <div className="space-y-6">
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <Database className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200">
                    Databasen är tom
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    Inga ledamöter finns i databasen ännu. Starta datasynkronisering för att hämta medlemsdata.
                  </p>
                </div>
              </div>
              <div className="flex justify-center space-x-4">
                <Button 
                  onClick={handleDataSync}
                  variant="default"
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Starta datasynkronisering
                </Button>
                <Button 
                  onClick={() => window.location.href = '/admin'}
                  variant="outline"
                  size="lg"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Admin-panel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced data quality notice */}
      {dataQualityAnalysis.needsSync && (
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
                    {dataQualityAnalysis.incompleteProfiles.length} ledamöter har ofullständiga profiler. 
                    Använd rensningsfunktionen eller admin-panelen för datasynkronisering.
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={handleCleanupIncompleteProfiles}
                  disabled={cleanupInProgress}
                  variant="outline"
                  size="sm"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {cleanupInProgress ? 'Rensar...' : 'Rensa ofullständiga'}
                </Button>
                <Button 
                  onClick={() => window.location.href = '/admin'}
                  variant="outline"
                  size="sm"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  Admin-panel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header with enhanced tabs */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-6 h-6" />
              <span>Riksdagsledamöter</span>
              {dataQualityAnalysis.incompleteProfiles.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {dataQualityAnalysis.incompleteProfiles.length} ofullständiga
                </Badge>
              )}
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

      {/* Enhanced member profile modal */}
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
