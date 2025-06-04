
import { useState } from 'react';
import { useCachedTopListsData } from '../hooks/useCachedTopListsData';
import TopListCard from '../components/TopListCard';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { PageHeader } from '../components/PageHeader';
import { useResponsive } from '../hooks/use-responsive';
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
  Share2,
  Clock
} from 'lucide-react';

const Topplistor = () => {
  const [selectedYear, setSelectedYear] = useState('2024/25');
  const [topCount, setTopCount] = useState(10);
  const { toast } = useToast();
  const { isMobile, isTablet } = useResponsive();
  
  const { 
    motions, 
    speeches, 
    interpellations, 
    writtenQuestions, 
    loading, 
    error, 
    lastUpdated,
    refreshData 
  } = useCachedTopListsData(selectedYear, topCount);

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
      description: "Hämtar senaste cachade informationen...",
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 py-0' : 'px-4 sm:px-6 lg:px-8 py-8'}`}>
        <PageHeader
          title="Topplistor"
          description="De mest aktiva riksdagsledamöterna - data uppdateras automatiskt dagligen"
          icon={<Trophy className="w-6 h-6 text-white" />}
        >
          {isMobile && (
            <Card className="border-blue-200 bg-blue-50 mb-4">
              <CardContent className="pt-4">
                <div className="flex items-start space-x-2 text-blue-700">
                  <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium mb-1">Automatisk uppdatering</p>
                    <p>Data från riksdagen uppdateras automatiskt varje natt.</p>
                    {lastUpdated && (
                      <p className="mt-1 text-xs opacity-75">
                        Senast uppdaterad: {lastUpdated.toLocaleString('sv-SE')}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </PageHeader>

        {!isMobile && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-blue-800 text-lg">
                <Clock className="w-5 h-5" />
                <span>Automatisk datauppdatering</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-700">
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
                  <h4 className="font-semibold mb-2">Schemaläggning:</h4>
                  <p className="text-xs">
                    Data hämtas automatiskt från riksdagen varje natt. 
                    Ingen manuell uppdatering behövs.
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
        )}

        <div className={`mb-6 ${isMobile ? 'space-y-4' : 'flex flex-wrap items-center gap-4'}`}>
          <div className={`${isMobile ? 'grid grid-cols-2 gap-3' : 'flex items-center space-x-4'}`}>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              {!isMobile && <label className="text-sm font-medium">År:</label>}
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className={isMobile ? "w-full text-sm" : "w-32"}>
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
              {!isMobile && <label className="text-sm font-medium">Antal:</label>}
              <Select value={topCount.toString()} onValueChange={(value) => setTopCount(parseInt(value))}>
                <SelectTrigger className={isMobile ? "w-full text-sm" : "w-20"}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {topCounts.map(count => (
                    <SelectItem key={count} value={count.toString()}>{count}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={`${isMobile ? 'grid grid-cols-3 gap-2' : 'flex space-x-2'}`}>
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size={isMobile ? "sm" : "default"}
              disabled={loading}
              className="flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {!isMobile && <span>Uppdatera</span>}
            </Button>
            
            <Button 
              onClick={shareUrl} 
              variant="outline" 
              size={isMobile ? "sm" : "default"}
              className="flex items-center justify-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              {!isMobile && <span>Dela</span>}
            </Button>
            
            <Button 
              onClick={exportAllData} 
              variant="outline" 
              size={isMobile ? "sm" : "default"}
              disabled={loading || error !== null}
              className="flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              {!isMobile && <span>Exportera</span>}
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-orange-200 bg-orange-50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-orange-700">
                <Info className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {loading && motions.length === 0 && speeches.length === 0 && (
          <div className="flex justify-center items-center py-8">
            <div className="flex flex-col items-center">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">Laddar cachade topplistor...</p>
            </div>
          </div>
        )}

        <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-1 lg:grid-cols-2' : 'md:grid-cols-2'}`}>
          <TopListCard
            title="Flest Motioner"
            members={motions}
            icon={<FileText className="w-5 h-5 text-blue-600" />}
            unit="motioner"
            loading={loading}
          />

          <TopListCard
            title="Flest Anföranden"
            members={speeches}
            icon={<MessageSquare className="w-5 h-5 text-green-600" />}
            unit="anföranden"
            loading={loading}
          />

          <TopListCard
            title="Flest Interpellationer"
            members={interpellations}
            icon={<HelpCircle className="w-5 h-5 text-purple-600" />}
            unit="interpellationer"
            loading={loading}
          />

          <TopListCard
            title="Flest Skriftliga Frågor"
            members={writtenQuestions}
            icon={<Edit3 className="w-5 h-5 text-orange-600" />}
            unit="frågor"
            loading={loading}
          />
        </div>

        {!loading && !error && (
          <Card className="mt-8">
            <CardHeader className="pb-3">
              <CardTitle className={isMobile ? "text-lg" : "text-xl"}>Sammanfattning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-blue-600`}>
                    {motions.reduce((sum, m) => sum + m.count, 0)}
                  </div>
                  <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Totalt motioner</div>
                </div>
                <div>
                  <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-green-600`}>
                    {speeches.reduce((sum, m) => sum + m.count, 0)}
                  </div>
                  <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Totalt anföranden</div>
                </div>
                <div>
                  <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-purple-600`}>
                    {interpellations.reduce((sum, m) => sum + m.count, 0)}
                  </div>
                  <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Totalt interpellationer</div>
                </div>
                <div>
                  <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-orange-600`}>
                    {writtenQuestions.reduce((sum, m) => sum + m.count, 0)}
                  </div>
                  <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Totalt skriftliga frågor</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Topplistor;
