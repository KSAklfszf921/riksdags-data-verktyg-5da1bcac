
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchCachedPartyData, 
  fetchCachedMemberData, 
  getDataFreshness, 
  refreshPartyData,
  type CachedPartyData,
  type CachedMemberData
} from '../services/cachedPartyApi';
import PartyStatsCards from './PartyStatsCards';
import PartyDistributionChart from './PartyDistributionChart';
import DemographicCharts from './DemographicCharts';
import PartyDetailsTable from './PartyDetailsTable';

interface PartyStats {
  party: string;
  count: number;
  averageAge: number;
  genderDistribution: {
    male: number;
    female: number;
  };
  committees: { [code: string]: { count: number; roles: string[] } };
}

const OptimizedPartyAnalysis = () => {
  const [partyData, setPartyData] = useState<CachedPartyData[]>([]);
  const [memberData, setMemberData] = useState<CachedMemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [dataFreshness, setDataFreshness] = useState<{ lastUpdated: string | null; isStale: boolean }>({ lastUpdated: null, isStale: true });
  const { toast } = useToast();

  useEffect(() => {
    loadCachedData();
  }, []);

  const loadCachedData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading cached party analysis data...');
      
      // Check data freshness
      const freshness = await getDataFreshness();
      setDataFreshness(freshness);
      
      // Load cached data
      const [parties, members] = await Promise.all([
        fetchCachedPartyData(),
        fetchCachedMemberData()
      ]);
      
      setPartyData(parties);
      setMemberData(members);
      
      console.log(`Loaded ${members.length} members and ${parties.length} parties from cache`);
      
      if (freshness.isStale) {
        toast({
          title: "Data kanske är föråldrad",
          description: "Datan är äldre än 24 timmar. Överväg att uppdatera.",
          variant: "default"
        });
      }
      
    } catch (err) {
      setError('Kunde inte hämta partidata från cache');
      console.error('Error loading cached data:', err);
      toast({
        title: "Fel",
        description: "Kunde inte hämta partidata. Försök igen senare.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    try {
      setRefreshing(true);
      
      toast({
        title: "Uppdaterar data",
        description: "Hämtar senaste data från Riksdagen...",
      });
      
      await refreshPartyData();
      
      // Wait a moment for the data to be processed
      setTimeout(async () => {
        await loadCachedData();
        setRefreshing(false);
        
        toast({
          title: "Data uppdaterad",
          description: "Senaste data har hämtats från Riksdagen.",
        });
      }, 3000);
      
    } catch (err) {
      setRefreshing(false);
      console.error('Error refreshing data:', err);
      toast({
        title: "Fel vid uppdatering",
        description: "Kunde inte uppdatera data. Försök igen senare.",
        variant: "destructive"
      });
    }
  };

  const convertToPartyStats = (parties: CachedPartyData[]): PartyStats[] => {
    return parties.map(party => ({
      party: party.party_code,
      count: party.total_members,
      averageAge: 0, // Will be calculated from member data if needed
      genderDistribution: {
        male: party.gender_distribution?.male || 0,
        female: party.gender_distribution?.female || 0
      },
      committees: {} // Will be populated if needed
    }));
  };

  const getFilteredStats = () => {
    const stats = convertToPartyStats(partyData);
    if (!selectedParty) return stats;
    return stats.filter(p => p.party === selectedParty);
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
    const filteredMembers = selectedParty 
      ? memberData.filter(m => m.party === selectedParty)
      : memberData;

    const ageGroups = {
      '20-30': 0,
      '31-40': 0,
      '41-50': 0,
      '51-60': 0,
      '61+': 0
    };

    const currentYear = new Date().getFullYear();
    filteredMembers.forEach(member => {
      if (member.birth_year) {
        const age = currentYear - member.birth_year;
        if (age <= 30) ageGroups['20-30']++;
        else if (age <= 40) ageGroups['31-40']++;
        else if (age <= 50) ageGroups['41-50']++;
        else if (age <= 60) ageGroups['51-60']++;
        else ageGroups['61+']++;
      }
    });

    return Object.entries(ageGroups).map(([label, value]) => ({ label, value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        <span className="text-lg">Laddar partianalys...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadCachedData} variant="outline">
          Försök igen
        </Button>
      </div>
    );
  }

  const filteredStats = getFilteredStats();
  const genderStats = getGenderStats();
  const ageStats = getAgeStats();
  const totalMembers = filteredStats.reduce((sum, p) => sum + p.count, 0);
  const averageAge = memberData.length > 0 
    ? memberData.reduce((sum, m) => {
        if (m.birth_year) {
          return sum + (new Date().getFullYear() - m.birth_year);
        }
        return sum;
      }, 0) / memberData.filter(m => m.birth_year).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Data status and controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Partianalys</CardTitle>
              <CardDescription>
                Data från cache - uppdateras automatiskt dagligen
              </CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              {dataFreshness.lastUpdated && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    Uppdaterad: {new Date(dataFreshness.lastUpdated).toLocaleString('sv-SE')}
                  </span>
                  {dataFreshness.isStale && (
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      Föråldrad
                    </Badge>
                  )}
                </div>
              )}
              <Button 
                onClick={handleRefreshData} 
                disabled={refreshing}
                variant="outline"
                size="sm"
              >
                {refreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Uppdatera data
              </Button>
            </div>
          </div>
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
