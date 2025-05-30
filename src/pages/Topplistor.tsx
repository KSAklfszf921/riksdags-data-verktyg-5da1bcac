
import { useState } from 'react';
import { useTopListsData } from '../hooks/useTopListsData';
import TopListCard from '../components/TopListCard';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { 
  FileText, 
  MessageSquare, 
  HelpCircle, 
  Edit3, 
  RefreshCw,
  Info,
  Calendar,
  Trophy,
  Download,
  Share2
} from 'lucide-react';

const Topplistor = () => {
  const [selectedYear, setSelectedYear] = useState('2024/25');
  const [topCount, setTopCount] = useState(10);
  const { toast } = useToast();
  
  const { 
    motions, 
    speeches, 
    interpellations, 
    writtenQuestions, 
    loading, 
    error, 
    lastUpdated,
    refreshData 
  } = useTopListsData(selectedYear, topCount);

  const availableYears = [
    '2024/25',
    '2023/24',
    '2022/23',
    '2021/22',
    '2020/21'
  ];

  const topCounts = [5, 10, 15, 20];

  const handleRefresh = () => {
    refreshData();
    toast({
      title: "Uppdaterar data",
      description: "Hämtar senaste informationen från riksdagen...",
    });
  };

  const shareUrl = () => {
    const url = `${window.location.origin}/topplistor?year=${selectedYear}&count=${topCount}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Länk kopierad",
        description: "URL:en har kopierats till urklipp",
      });
    }).catch(() => {
      toast({
        title: "Kunde inte kopiera",
        description: "Kopiera URL:en manuellt från adressfältet",
        variant: "destructive"
      });
    });
  };

  const exportAllData = () => {
    const allData = [
      ['Kategori', 'Rang', 'Namn', 'Parti', 'Valkrets', 'Antal'],
      ...motions.map((m, i) => ['Motioner', i + 1, m.name, m.party, m.constituency, m.count]),
      ...speeches.map((m, i) => ['Anföranden', i + 1, m.name, m.party, m.constituency, m.count]),
      ...interpellations.map((m, i) => ['Interpellationer', i + 1, m.name, m.party, m.constituency, m.count]),
      ...writtenQuestions.map((m, i) => ['Skriftliga frågor', i + 1, m.name, m.party, m.constituency, m.count])
    ];

    const csvContent = allData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `topplistor_${selectedYear.replace('/', '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export klar",
      description: "Alla topplistor har exporterats till CSV",
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Topplistor</h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
          Upptäck de mest aktiva riksdagsledamöterna baserat på deras parlamentariska aktivitet. 
          Data uppdateras automatiskt och cachar för optimal prestanda.
        </p>

        {/* Info Card */}
        <Card className="mb-4 sm:mb-6 border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-blue-800 text-base sm:text-lg">
              <Info className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Om Topplistorna</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs sm:text-sm text-blue-700">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Datakällor:</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Motioner: Förslag från riksdagsledamöter</li>
                  <li>• Anföranden: Tal i riksdagens kammare</li>
                  <li>• Interpellationer: Frågor till ministrar</li>
                  <li>• Skriftliga frågor: Frågor till regeringen</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Uppdatering:</h4>
                <p className="text-xs">
                  Data cachar i 24 timmar för optimal prestanda. 
                  {lastUpdated && (
                    <span className="block mt-1">
                      Senast uppdaterad: {lastUpdated.toLocaleString('sv-SE')}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium">År:</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-24 sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium hidden sm:inline">Antal:</label>
            <Select value={topCount.toString()} onValueChange={(value) => setTopCount(parseInt(value))}>
              <SelectTrigger className="w-16 sm:w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {topCounts.map(count => (
                  <SelectItem key={count} value={count.toString()}>{count}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-2">
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm"
              disabled={loading}
              className="flex items-center space-x-1 sm:space-x-2 h-8 sm:h-10"
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Uppdatera</span>
            </Button>
            
            <Button 
              onClick={shareUrl} 
              variant="outline" 
              size="sm"
              className="flex items-center space-x-1 sm:space-x-2 h-8 sm:h-10"
            >
              <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Dela</span>
            </Button>
            
            <Button 
              onClick={exportAllData} 
              variant="outline" 
              size="sm"
              disabled={loading || error !== null}
              className="flex items-center space-x-1 sm:space-x-2 h-8 sm:h-10"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Exportera</span>
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50 mb-4 sm:mb-6">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center space-x-2 text-red-700">
                <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Loading indicator for initial load */}
      {loading && motions.length === 0 && speeches.length === 0 && (
        <div className="flex justify-center items-center py-8">
          <div className="flex flex-col items-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">Hämtar topplistor...</p>
          </div>
        </div>
      )}

      {/* Top Lists Grid */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        <TopListCard
          title="Flest Motioner"
          members={motions}
          icon={<FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />}
          unit="motioner"
          loading={loading}
        />

        <TopListCard
          title="Flest Anföranden"
          members={speeches}
          icon={<MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />}
          unit="anföranden"
          loading={loading}
        />

        <TopListCard
          title="Flest Interpellationer"
          members={interpellations}
          icon={<HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />}
          unit="interpellationer"
          loading={loading}
        />

        <TopListCard
          title="Flest Skriftliga Frågor"
          members={writtenQuestions}
          icon={<Edit3 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />}
          unit="frågor"
          loading={loading}
        />
      </div>

      {/* Summary Stats */}
      {!loading && !error && (
        <Card className="mt-6 sm:mt-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Sammanfattning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center">
              <div>
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {motions.reduce((sum, m) => sum + m.count, 0)}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Totalt motioner</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {speeches.reduce((sum, m) => sum + m.count, 0)}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Totalt anföranden</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-purple-600">
                  {interpellations.reduce((sum, m) => sum + m.count, 0)}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Totalt interpellationer</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-orange-600">
                  {writtenQuestions.reduce((sum, m) => sum + m.count, 0)}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Totalt skriftliga frågor</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Topplistor;
