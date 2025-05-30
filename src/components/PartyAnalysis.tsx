
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { fetchMembersWithCommittees } from '../services/riksdagApi';
import { RiksdagMemberDetails } from '../services/riksdagApi';
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

const PartyAnalysis = () => {
  const [members, setMembers] = useState<RiksdagMemberDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [partyStats, setPartyStats] = useState<PartyStats[]>([]);

  useEffect(() => {
    loadPartyData();
  }, []);

  const loadPartyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading party analysis data...');
      const result = await fetchMembersWithCommittees(1, 500, 'current');
      setMembers(result.members);
      
      // Calculate party statistics
      const stats = calculatePartyStats(result.members);
      setPartyStats(stats);
      
      console.log(`Loaded ${result.members.length} members for party analysis`);
    } catch (err) {
      setError('Kunde inte hämta partidata');
      console.error('Error loading party data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculatePartyStats = (membersList: RiksdagMemberDetails[]): PartyStats[] => {
    const partyMap = new Map<string, {
      members: RiksdagMemberDetails[];
      totalAge: number;
      maleCount: number;
      femaleCount: number;
      committees: Map<string, Set<string>>;
    }>();

    // Group members by party
    membersList.forEach(member => {
      if (!partyMap.has(member.parti)) {
        partyMap.set(member.parti, {
          members: [],
          totalAge: 0,
          maleCount: 0,
          femaleCount: 0,
          committees: new Map()
        });
      }

      const partyData = partyMap.get(member.parti)!;
      partyData.members.push(member);
      
      // Calculate age
      const currentYear = new Date().getFullYear();
      const birthYear = parseInt(member.fodd_ar);
      if (!isNaN(birthYear)) {
        partyData.totalAge += (currentYear - birthYear);
      }

      // Count gender
      if (member.kon === 'man') {
        partyData.maleCount++;
      } else if (member.kon === 'kvinna') {
        partyData.femaleCount++;
      }

      // Count committee assignments
      member.assignments.forEach(assignment => {
        if (!partyData.committees.has(assignment.organ_kod)) {
          partyData.committees.set(assignment.organ_kod, new Set());
        }
        partyData.committees.get(assignment.organ_kod)!.add(assignment.roll);
      });
    });

    // Convert to stats array
    return Array.from(partyMap.entries()).map(([party, data]) => {
      const totalMembers = data.members.length;
      const averageAge = totalMembers > 0 ? data.totalAge / totalMembers : 0;
      const malePercentage = (data.maleCount / totalMembers) * 100;
      const femalePercentage = (data.femaleCount / totalMembers) * 100;

      const committees: { [code: string]: { count: number; roles: string[] } } = {};
      data.committees.forEach((roles, code) => {
        committees[code] = {
          count: data.members.filter(m => m.assignments.some(a => a.organ_kod === code)).length,
          roles: Array.from(roles)
        };
      });

      return {
        party,
        count: totalMembers,
        averageAge,
        genderDistribution: {
          male: malePercentage,
          female: femalePercentage
        },
        committees
      };
    }).sort((a, b) => b.count - a.count);
  };

  const getFilteredStats = () => {
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
    const filteredMembers = selectedParty 
      ? members.filter(m => m.parti === selectedParty)
      : members;

    const ageGroups = {
      '20-30': 0,
      '31-40': 0,
      '41-50': 0,
      '51-60': 0,
      '61+': 0
    };

    const currentYear = new Date().getFullYear();
    filteredMembers.forEach(member => {
      const age = currentYear - parseInt(member.fodd_ar);
      if (age <= 30) ageGroups['20-30']++;
      else if (age <= 40) ageGroups['31-40']++;
      else if (age <= 50) ageGroups['41-50']++;
      else if (age <= 60) ageGroups['51-60']++;
      else ageGroups['61+']++;
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
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadPartyData} variant="outline">
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
              {partyStats.map(party => (
                <SelectItem key={party.party} value={party.party}>
                  {party.party} ({party.count} ledamöter)
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

export default PartyAnalysis;
