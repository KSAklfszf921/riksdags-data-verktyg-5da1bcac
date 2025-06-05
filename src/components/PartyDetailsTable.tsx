
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, ChevronUp, ChevronDown } from 'lucide-react';
import { COMMITTEE_MAPPING } from '../services/riksdagApi';

interface PartyStats {
  party: string;
  count: number;
  averageAge: number;
  averageMotions?: number;
  averageSpeeches?: number;
  averageInterpellations?: number;
  averageQuestions?: number;
  genderDistribution: {
    male: number;
    female: number;
  };
  committees: { [code: string]: { count: number; roles: string[] } };
}

interface PartyDetailsTableProps {
  partyStats: PartyStats[];
}

type SortField =
  | keyof PartyStats
  | 'genderDistribution.male'
  | 'genderDistribution.female';
type SortOrder = 'asc' | 'desc';

const PartyDetailsTable = ({ partyStats }: PartyDetailsTableProps) => {
  const [sortField, setSortField] = useState<SortField>('count');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortValue = (stat: PartyStats, field: SortField): number => {
    switch (field) {
      case 'party':
        return stat.party.charCodeAt(0);
      case 'count':
        return stat.count;
      case 'averageAge':
        return stat.averageAge;
      case 'averageMotions':
        return stat.averageMotions ?? 0;
      case 'averageSpeeches':
        return stat.averageSpeeches ?? 0;
      case 'averageInterpellations':
        return stat.averageInterpellations ?? 0;
      case 'averageQuestions':
        return stat.averageQuestions ?? 0;
      case 'genderDistribution.male':
        return stat.genderDistribution.male;
      case 'genderDistribution.female':
        return stat.genderDistribution.female;
      default:
        return 0;
    }
  };

  const sortedStats = [...partyStats].sort((a, b) => {
    const aValue = getSortValue(a, sortField);
    const bValue = getSortValue(b, sortField);
    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const exportToCSV = () => {
    const headers = [
      'Parti',
      'Antal ledamöter',
      'Medelålder',
      'Män (%)',
      'Kvinnor (%)',
      'Motioner',
      'Anföranden',
      'Frågor',
      'Interpellationer',
      'Huvudutskott'
    ];
    const rows = sortedStats.map(stat => [
      stat.party,
      stat.count.toString(),
      stat.averageAge.toFixed(1),
      stat.genderDistribution.male.toFixed(1),
      stat.genderDistribution.female.toFixed(1),
      stat.averageMotions?.toFixed(1) ?? '-',
      stat.averageSpeeches?.toFixed(1) ?? '-',
      stat.averageQuestions?.toFixed(1) ?? '-',
      stat.averageInterpellations?.toFixed(1) ?? '-',
      Object.keys(stat.committees).slice(0, 3).map(code => COMMITTEE_MAPPING[code] || code).join('; ')
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'partianalys.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Partidetaljer</CardTitle>
          <Button variant="outline" onClick={exportToCSV} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportera CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('party')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Parti</span>
                    <SortIcon field="party" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('count')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Ledamöter</span>
                    <SortIcon field="count" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('averageAge')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Medelålder</span>
                    <SortIcon field="averageAge" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('genderDistribution.male')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Män (%)</span>
                    <SortIcon field="genderDistribution.male" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('genderDistribution.female')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Kvinnor (%)</span>
                    <SortIcon field="genderDistribution.female" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('averageMotions')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Motioner</span>
                    <SortIcon field="averageMotions" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('averageSpeeches')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Anföranden</span>
                    <SortIcon field="averageSpeeches" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('averageQuestions')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Frågor</span>
                    <SortIcon field="averageQuestions" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('averageInterpellations')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Interpellationer</span>
                    <SortIcon field="averageInterpellations" />
                  </div>
                </TableHead>
                <TableHead>Utskott</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStats.map((stat) => (
                <TableRow key={stat.party}>
                  <TableCell className="font-medium">
                    <Badge variant="outline">{stat.party}</Badge>
                  </TableCell>
                  <TableCell>{stat.count}</TableCell>
                  <TableCell>{stat.averageAge.toFixed(1)}</TableCell>
                  <TableCell>{stat.genderDistribution.male.toFixed(1)}%</TableCell>
                  <TableCell>{stat.genderDistribution.female.toFixed(1)}%</TableCell>
                  <TableCell>{stat.averageMotions?.toFixed(1) ?? '-'}</TableCell>
                  <TableCell>{stat.averageSpeeches?.toFixed(1) ?? '-'}</TableCell>
                  <TableCell>{stat.averageQuestions?.toFixed(1) ?? '-'}</TableCell>
                  <TableCell>{stat.averageInterpellations?.toFixed(1) ?? '-'}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {Object.entries(stat.committees).slice(0, 5).map(([code, { count, roles }]) => (
                        <div key={code} className="text-xs">
                          <span className="font-medium">{code}:</span> {count} ledamöter
                          {roles.length > 0 && (
                            <span className="text-gray-500"> ({roles.join(', ')})</span>
                          )}
                        </div>
                      ))}
                      {Object.keys(stat.committees).length > 5 && (
                        <div className="text-xs text-gray-500">
                          +{Object.keys(stat.committees).length - 5} fler...
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PartyDetailsTable;
