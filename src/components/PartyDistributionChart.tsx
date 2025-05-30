
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

interface PartyDistributionChartProps {
  partyStats: PartyStats[];
}

const PARTY_COLORS: { [key: string]: string } = {
  'S': '#E53E3E',
  'M': '#3182CE',
  'SD': '#F6AD55',
  'C': '#38A169',
  'V': '#D53F8C',
  'KD': '#2B6CB0',
  'L': '#4299E1',
  'MP': '#48BB78'
};

const PartyDistributionChart = ({ partyStats }: PartyDistributionChartProps) => {
  const data = partyStats.map(p => ({
    name: p.party,
    value: p.count,
    fill: PARTY_COLORS[p.party] || '#6B7280'
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Partifördelning i Riksdagen</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [value, 'Antal ledamöter']}
              labelFormatter={(label) => `Parti: ${label}`}
            />
            <Bar dataKey="value" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PartyDistributionChart;
