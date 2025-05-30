
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, User, Calendar, Percent } from 'lucide-react';

interface PartyStatsCardsProps {
  totalMembers: number;
  totalParties: number;
  averageAge: number;
  genderDistribution: { label: string; value: number }[];
}

const PartyStatsCards = ({ totalMembers, totalParties, averageAge, genderDistribution }: PartyStatsCardsProps) => {
  const malePercentage = genderDistribution.find(g => g.label === 'Män')?.value || 0;
  const femalePercentage = genderDistribution.find(g => g.label === 'Kvinnor')?.value || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Totalt antal ledamöter</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMembers}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Antal partier</CardTitle>
          <User className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalParties}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Medelålder</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageAge.toFixed(1)} år</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Könsfördelning</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm font-bold">
            <div>{malePercentage.toFixed(1)}% Män</div>
            <div>{femalePercentage.toFixed(1)}% Kvinnor</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartyStatsCards;
