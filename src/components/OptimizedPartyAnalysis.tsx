
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Calendar } from "lucide-react";
import { fetchCachedPartyData, CachedPartyData, getDataFreshness, refreshPartyData } from '../services/cachedPartyApi';
import PartyStatsCards from './PartyStatsCards';
import PartyDistributionChart from './PartyDistributionChart';
import DemographicCharts from './DemographicCharts';
import PartyDetailsTable from './PartyDetailsTable';

const OptimizedPartyAnalysis = () => {
  const [partyData, setPartyData] = useState<CachedPartyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    loadCachedPartyData();
    checkDataFreshness();
  }, []);

  const loadCachedPartyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading cached party data...');
      const data = await fetchCachedPartyData();
      setPartyData(data);
      
      console.log(`Loaded ${data.length} parties from cache`);
    } catch (err) {
      setError('Kunde inte hämta partidata från cache');
      console.error('Error loading cached party data:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkDataFreshness = async () => {
    try {
      const { lastUpdated: lastUpdateTime, isStale: dataIsStale } = await getDataFreshness();
      setLastUpdated(lastUpdateTime);
      setIsStale(dataIsStale);
    } catch (error) {
      console.error('Error checking data freshness:', error);
    }
  };

  const handleRefreshData = async () => {
    try {
      setRefreshing(true);
      console.log('Triggering party data refresh...');
      
      await refreshPartyData();
      
      // Wait a bit for the data to be processed, then reload
      setTimeout(async () => {
        await loadCachedPartyData();
        await checkDataFreshness();
        setRefreshing(false);
      }, 3000);
      
    } catch (err) {
      setError('Kunde inte uppdatera partidata');
      console.error('Error refreshing party data:', err);
      setRefreshing(false);
    }
  };

  const convertToPartyStats = (cachedData: CachedPartyData[]) => {
    return cachedData.map(party => ({
      party: party.party_code,
      count: party.total_members,
      averageAge: (party.activity_stats as any)?.average_age || 0,
      genderDistribution: {
        male: (party.gender_distribution as any)?.male || 0,
        female: (party.gender_distribution as any)?.female || 0
      },
      committees: {} // This would need to be extracted from committee_distribution
    }));
  };

  const getFilteredStats = () => {
    const partyStats = convertToPartyStats(partyData);
    if (!selectedParty) return partyStats;
    return partyStats.filter(p => p.party === selectedParty);
  };

  const getGenderStats = () => {
    const stats = getFilteredStats();
    const totalMembers = stats.reduce((sum, p) => sum + p.count, 0);
    const totalMale = stats.reduce((sum, p) => sum + (p.genderDistribution.male * p.count / 100), 0);
    const totalFemale = stats.reduce((sum, p) => sum + (p.genderDistribution.female * p.count / 100), 0);
    
    return [
      { label: 'Män', value: totalMembers > 0 ? (totalMale / totalMembers) * 100 : 0 },
      { label: 'Kvinnor', value: totalMembers > 0 ? (totalFemale / totalMembers) * 100 : 0 }
    ];
  };

  const getAgeStats = () => {
    if (!selectedParty) {
      // Calculate overall age distribution from all parties
      const allAgeData = partyData.reduce((acc, party) => {
        const ageDistribution = party.age_distribution as any;
        if (ageDistribution) {
          Object.keys(ageDistribution).forEach(ageGroup => {
            acc[ageGroup] = (acc[ageGroup] || 0) + ageDistribution[ageGroup];
          });
        }
        return acc;
      }, {} as any);
      
      return Object.entries(allAgeData).map(([label, value]) => ({ label, value: value as number }));
    } else {
      // Get age distribution for selected party
      const party = partyData.find(p => p.party_code === selectedParty);
      if (party && party.age_distribution) {
        const ageDistribution = party.age_distribution as any;
        return Object.entries(ageDistribution).map(([label, value]) => ({ label, value: value as number }));
      }
    }
    
    return [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        <span className="text-lg">Laddar cachad partianalys...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadCachedPartyData} variant="outline">
          Försök igen
        </Button>
      </div>
    );
  }

  const filteredStats = getFilteredStats();
  const genderStats = getGenderStats();
  const ageStats = getAgeStats();
  const totalMembers = filteredStats.reduce((sum, p) => sum + p.count, 0);
  const averageAge = filteredStats.reduce((sum, p) => sum + (p.averageAge * p.count), 0) / totalMembers || 0;

  return (
    <div className="space-y-6">
      {/* Data freshness indicator and refresh */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Cachad partianalys</span>
                {isStale && <Badge variant="destructive">Gamla data</Badge>}
              </CardTitle>
              <CardDescription>
                {lastUpdated 
                  ? `Senast uppdaterad: ${new Date(lastUpdated).toLocaleDateString('sv-SE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}`
                  : 'Uppdateringstid okänd'
                }
              </CardDescription>
            </div>
            <Button 
              onClick={handleRefreshData} 
              disabled={refreshing}
              variant={isStale ? "default" : "outline"}
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {refreshing ? 'Uppdaterar...' : 'Uppdatera data'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Filter controls */}
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>Välj ett specifikt parti för att se detaljerad analys</CardDescription>
        </CardHeader>
        <CardContent>
          <Select onValueChange={(value) => setSelectedParty(value === 'all' ? null : value)}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Alla partier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla partier</SelectItem>
              {partyData.map(party => (
                <SelectItem key={party.party_code} value={party.party_code}>
                  {party.party_name} ({party.total_members} ledamöter)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Statistics cards */}
      <PartyStatsCards
        totalMembers={totalMembers}
        totalParties={filteredStats.length}
        averageAge={averageAge}
        genderDistribution={genderStats}
      />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PartyDistributionChart partyStats={filteredStats} />
        <DemographicCharts genderStats={genderStats} ageStats={ageStats} />
      </div>

      {/* Details table */}
      <PartyDetailsTable partyStats={filteredStats} />
    </div>
  );
};

export default OptimizedPartyAnalysis;
