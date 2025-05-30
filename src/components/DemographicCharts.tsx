
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DemographicChartsProps {
  genderStats: { label: string; value: number }[];
  ageStats: { label: string; value: number }[];
}

const GENDER_COLORS = ['#3B82F6', '#EC4899'];

const DemographicCharts = ({ genderStats, ageStats }: DemographicChartsProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Könsfördelning</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={genderStats}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ label, value }) => `${label}: ${value.toFixed(1)}%`}
              >
                {genderStats.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={GENDER_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${(value as number).toFixed(1)}%`} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Åldersfördelning</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ageStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemographicCharts;
