
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Clock, AlertCircle, Database, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchCachedPartyData, 
  fetchCachedMemberData, 
  getDataFreshness, 
  refreshPartyData,
  getLastSyncInfo,
  type CachedPartyData,
  type CachedMemberData,
  type DataSyncLog
} from '../services/cachedPartyApi';
import PartyStatsCards from './PartyStatsCards';
import PartyDistributionChart from './PartyDistributionChart';
import DemographicCharts from './DemographicCharts';
import PartyDetailsTable from './PartyDetailsTable';

interface PartyStats {
  party: string;
  count: number;
  averageAge: number;
  averageMotions: number;
  averageSpeeches: number;
  averageInterpellations: number;
  averageQuestions: number;
  genderDistribution: {
    male: number;
    female: number;
  };
  committees: { [code: string]: { count: number; roles: string[] } };
}

// Helper function to safely extract gender distribution from Json
const extractGenderDistribution = (genderDistribution: any): { male: number; female: number } => {
  if (genderDistribution && typeof genderDistribution === 'object' && !Array.isArray(genderDistribution)) {
    return {
      male: Number(genderDistribution.male) || 0,
      female: Number(genderDistribution.female) || 0
    };
  }
  return { male: 0, female: 0 };
};

const OptimizedPartyAnalysis = () => {
  const [partyData, setPartyData] = useState<CachedPartyData[]>([]);
  const [memberData, setMemberData] = useState<CachedMemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [dataFreshness, setDataFreshness] = useState<{ lastUpdated: string | null; isStale: boolean }>({ lastUpdated: null, isStale: true });
  const [lastSync, setLastSync] = useState<DataSyncLog | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCachedData();
  }, []);

  const loadCachedData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading enhanced cached party analysis data...');
      
      // Check data freshness and last sync info
      const [freshness, syncInfo] = await Promise.all([
        getDataFreshness(),
        getLastSyncInfo()
      ]);
      
      setDataFreshness(freshness);
      setLastSync(syncInfo);
      
      // Load cached data
      const [parties, members] = await Promise.all([
        fetchCachedPartyData(),
        fetchCachedMemberData()
      ]);
      
      setPartyData(parties);
      setMemberData(members);
      
      console.log(`Loaded ${members.length} members and ${parties.length} parties from enhanced cache`);
      
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
      
      // Wait a moment for the data to be processed, then reload
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

  const convertToPartyStats = (
    parties: CachedPartyData[],
    members: CachedMemberData[]
  ): PartyStats[] => {
    return parties.map(party => {
      const genderDist = extractGenderDistribution(party.gender_distribution);
      const partyMembers = members.filter(m => m.party === party.party_code);
      const ages = partyMembers
        .filter(m => m.birth_year)
        .map(m => new Date().getFullYear() - (m.birth_year as number));
      const activity = (field: string) =>
        partyMembers.reduce((sum, m) => sum + ((m.activity_data as any)?.[field] || 0), 0);
      const avg = (total: number) => (partyMembers.length > 0 ? total / partyMembers.length : 0);

      return {
        party: party.party_code,
        count: party.total_members,
        averageAge: ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0,
        averageMotions: avg(activity('motions')),
        averageSpeeches: avg(activity('speeches')),
        averageInterpellations: avg(activity('interpellations')),
        averageQuestions: avg(activity('written_questions')),
        genderDistribution: genderDist,
        committees: {}
      };
    });
  };

  const getFilteredStats = () => {
    const stats = convertToPartyStats(partyData, memberData);
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

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        <span className="text-lg">Laddar förbättrad partianalys...</span>
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
  const averageAge = totalMembers > 0
    ? filteredStats.reduce((sum, p) => sum + p.averageAge * p.count, 0) / totalMembers
    : 0;

  return (
    <div className="space-y-6">
      {/* Enhanced data status and controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Förbättrad Partianalys
              </CardTitle>
              <CardDescription>
                Data från förbättrad cache med utskottsinformation - uppdateras automatiskt dagligen
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
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
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

            {/* Sync status info */}
            {lastSync && (
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Senaste synk: {lastSync.members_processed || 0} ledamöter</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4" />
                  <span>Tid: {formatDuration(lastSync.sync_duration_ms)}</span>
                </div>
                <Badge 
                  variant={lastSync.status === 'completed' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {lastSync.status}
                </Badge>
              </div>
            )}
          </div>
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
