
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { RiksdagVote } from '../services/riksdagApi';
import { Badge } from "@/components/ui/badge";
import { partyInfo } from "../data/mockMembers";

interface VoteChartsProps {
  votes: RiksdagVote[];
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#6b7280'];

const VoteCharts = ({ votes }: VoteChartsProps) => {
  const chartConfig = {
    ja: { label: "Ja", color: "#10b981" },
    nej: { label: "Nej", color: "#ef4444" },
    avstar: { label: "Avstår", color: "#f59e0b" },
    franvarande: { label: "Frånvarande", color: "#6b7280" }
  };

  // Overall vote distribution
  const overallStats = React.useMemo(() => {
    const stats = { ja: 0, nej: 0, avstar: 0, franvarande: 0 };
    votes.forEach(vote => {
      const rostLower = (vote.rost || '').toLowerCase();
      switch (rostLower) {
        case 'ja': stats.ja++; break;
        case 'nej': stats.nej++; break;
        case 'avstår': stats.avstar++; break;
        case 'frånvarande': stats.franvarande++; break;
      }
    });
    return [
      { name: 'Ja', value: stats.ja, fill: '#10b981' },
      { name: 'Nej', value: stats.nej, fill: '#ef4444' },
      { name: 'Avstår', value: stats.avstar, fill: '#f59e0b' },
      { name: 'Frånvarande', value: stats.franvarande, fill: '#6b7280' }
    ];
  }, [votes]);

  // Party vote distribution
  const partyStats = React.useMemo(() => {
    const partyData: { [key: string]: { ja: number; nej: number; avstar: number; franvarande: number } } = {};
    
    votes.forEach(vote => {
      const party = vote.parti || 'Okänt';
      if (!partyData[party]) {
        partyData[party] = { ja: 0, nej: 0, avstar: 0, franvarande: 0 };
      }
      
      const rostLower = (vote.rost || '').toLowerCase();
      switch (rostLower) {
        case 'ja': partyData[party].ja++; break;
        case 'nej': partyData[party].nej++; break;
        case 'avstår': partyData[party].avstar++; break;
        case 'frånvarande': partyData[party].franvarande++; break;
      }
    });

    return Object.entries(partyData)
      .map(([party, stats]) => ({
        party,
        fullName: partyInfo[party]?.fullName || party,
        ...stats,
        total: stats.ja + stats.nej + stats.avstar + stats.franvarande
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [votes]);

  // Timeline data (votes over time)
  const timelineData = React.useMemo(() => {
    const dateGroups: { [key: string]: { ja: number; nej: number; avstar: number; franvarande: number } } = {};
    
    votes.forEach(vote => {
      if (!vote.systemdatum) return;
      
      const date = new Date(vote.systemdatum).toISOString().split('T')[0];
      if (!dateGroups[date]) {
        dateGroups[date] = { ja: 0, nej: 0, avstar: 0, franvarande: 0 };
      }
      
      const rostLower = (vote.rost || '').toLowerCase();
      switch (rostLower) {
        case 'ja': dateGroups[date].ja++; break;
        case 'nej': dateGroups[date].nej++; break;
        case 'avstår': dateGroups[date].avstar++; break;
        case 'frånvarande': dateGroups[date].franvarande++; break;
      }
    });

    return Object.entries(dateGroups)
      .map(([date, stats]) => ({
        date,
        ...stats,
        total: stats.ja + stats.nej + stats.avstar + stats.franvarande
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 data points
  }, [votes]);

  if (votes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">Inga röster att visualisera. Gör en sökning först.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="parties">Partier</TabsTrigger>
          <TabsTrigger value="timeline">Tidslinje</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Röstfördelning</CardTitle>
              <CardDescription>Övergripande fördelning av alla röster</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overallStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {overallStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Röster per parti</CardTitle>
              <CardDescription>Fördelning av röster uppdelat på politiska partier</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={partyStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="party" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="ja" stackId="a" fill="#10b981" name="Ja" />
                    <Bar dataKey="nej" stackId="a" fill="#ef4444" name="Nej" />
                    <Bar dataKey="avstar" stackId="a" fill="#f59e0b" name="Avstår" />
                    <Bar dataKey="franvarande" stackId="a" fill="#6b7280" name="Frånvarande" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Röstaktivitet över tid</CardTitle>
              <CardDescription>Utveckling av röstning över tid (senaste 30 datapunkterna)</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="ja" stroke="#10b981" name="Ja" strokeWidth={2} />
                    <Line type="monotone" dataKey="nej" stroke="#ef4444" name="Nej" strokeWidth={2} />
                    <Line type="monotone" dataKey="total" stroke="#8b5cf6" name="Totalt" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VoteCharts;
