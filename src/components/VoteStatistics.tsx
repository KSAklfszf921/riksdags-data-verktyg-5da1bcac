
import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, PieChart, TrendingUp, Users } from "lucide-react";
import { RiksdagVote } from '../services/riksdagApi';

interface VoteStatisticsProps {
  votes: RiksdagVote[];
  totalCount: number;
}

interface PartyStats {
  [party: string]: {
    ja: number;
    nej: number;
    avstar: number;
    franvarande: number;
    total: number;
  };
}

interface ValkretStats {
  [valkrets: string]: {
    ja: number;
    nej: number;
    avstar: number;
    franvarande: number;
    total: number;
  };
}

const VoteStatistics = ({ votes, totalCount }: VoteStatisticsProps) => {
  const statistics = useMemo(() => {
    const overall = { ja: 0, nej: 0, avstar: 0, franvarande: 0 };
    const partyStats: PartyStats = {};
    const valkretStats: ValkretStats = {};
    const beteckningar = new Set<string>();
    const riksmoten = new Set<string>();

    votes.forEach(vote => {
      // Overall stats
      const rostLower = (vote.rost || '').toLowerCase();
      switch (rostLower) {
        case 'ja':
          overall.ja++;
          break;
        case 'nej':
          overall.nej++;
          break;
        case 'avstår':
          overall.avstar++;
          break;
        case 'frånvarande':
          overall.franvarande++;
          break;
      }

      // Party stats
      const party = vote.parti || 'Okänt parti';
      if (!partyStats[party]) {
        partyStats[party] = { ja: 0, nej: 0, avstar: 0, franvarande: 0, total: 0 };
      }
      switch (rostLower) {
        case 'ja':
          partyStats[party].ja++;
          break;
        case 'nej':
          partyStats[party].nej++;
          break;
        case 'avstår':
          partyStats[party].avstar++;
          break;
        case 'frånvarande':
          partyStats[party].franvarande++;
          break;
      }
      partyStats[party].total++;

      // Valkrets stats
      const valkrets = vote.valkrets || 'Okänd valkrets';
      if (!valkretStats[valkrets]) {
        valkretStats[valkrets] = { ja: 0, nej: 0, avstar: 0, franvarande: 0, total: 0 };
      }
      switch (rostLower) {
        case 'ja':
          valkretStats[valkrets].ja++;
          break;
        case 'nej':
          valkretStats[valkrets].nej++;
          break;
        case 'avstår':
          valkretStats[valkrets].avstar++;
          break;
        case 'frånvarande':
          valkretStats[valkrets].franvarande++;
          break;
      }
      valkretStats[valkrets].total++;

      // Collect unique values
      if (vote.beteckning) beteckningar.add(vote.beteckning);
      if (vote.rm) riksmoten.add(vote.rm);
    });

    return {
      overall,
      partyStats,
      valkretStats,
      uniqueCounts: {
        beteckningar: beteckningar.size,
        riksmoten: riksmoten.size,
        parties: Object.keys(partyStats).length,
        valkretsar: Object.keys(valkretStats).length
      }
    };
  }, [votes]);

  const getPercentage = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  };

  const totalVotes = statistics.overall.ja + statistics.overall.nej + 
                    statistics.overall.avstar + statistics.overall.franvarande;

  if (votes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Röststatistik</span>
          </CardTitle>
          <CardDescription>
            Översikt av {totalVotes} röster från {totalCount} totala träffar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{statistics.overall.ja}</div>
              <div className="text-sm text-gray-600">Ja ({getPercentage(statistics.overall.ja, totalVotes)}%)</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{statistics.overall.nej}</div>
              <div className="text-sm text-gray-600">Nej ({getPercentage(statistics.overall.nej, totalVotes)}%)</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{statistics.overall.avstar}</div>
              <div className="text-sm text-gray-600">Avstår ({getPercentage(statistics.overall.avstar, totalVotes)}%)</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{statistics.overall.franvarande}</div>
              <div className="text-sm text-gray-600">Frånvarande ({getPercentage(statistics.overall.franvarande, totalVotes)}%)</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold">{statistics.uniqueCounts.beteckningar}</div>
              <div className="text-sm text-gray-600">Beteckningar</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{statistics.uniqueCounts.riksmoten}</div>
              <div className="text-sm text-gray-600">Riksmöten</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{statistics.uniqueCounts.parties}</div>
              <div className="text-sm text-gray-600">Partier</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{statistics.uniqueCounts.valkretsar}</div>
              <div className="text-sm text-gray-600">Valkretsar</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Party Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Partifördelning</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(statistics.partyStats)
              .sort(([,a], [,b]) => b.total - a.total)
              .slice(0, 8)
              .map(([party, stats]) => (
                <div key={party} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">{party}</Badge>
                    <span className="text-sm font-medium">{stats.total} röster</span>
                  </div>
                  <div className="flex space-x-2 text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{stats.ja}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>{stats.nej}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>{stats.avstar}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span>{stats.franvarande}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoteStatistics;
