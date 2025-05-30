
import { useState } from 'react';
import { useTopListsData } from '../hooks/useTopListsData';
import TopListCard from '../components/TopListCard';
import LoadingProgress from '../components/LoadingProgress';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  FileText, 
  MessageSquare, 
  HelpCircle, 
  Edit3, 
  RefreshCw,
  Info,
  Calendar,
  Trophy,
  BarChart3,
  Database
} from 'lucide-react';

const Topplistor = () => {
  const [selectedYear, setSelectedYear] = useState('2024/25');
  const [topCount, setTopCount] = useState(10);
  const [showCacheStats, setShowCacheStats] = useState(false);
  
  const { 
    motions, 
    speeches, 
    interpellations, 
    writtenQuestions, 
    loading, 
    error, 
    lastUpdated,
    refreshData,
    loadingSteps,
    loadingProgress,
    getCacheStats
  } = useTopListsData(selectedYear, topCount);

  const availableYears = [
    '2024/25',
    '2023/24',
    '2022/23',
    '2021/22',
    '2020/21'
  ];

  const topCounts = [5, 10, 15, 20];

  const cacheStats = getCacheStats();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Trophy className="w-8 h-8 text-yellow-600" />
          <h1 className="text-3xl font-bold text-gray-900">Topplistor</h1>
        </div>
        <p className="text-gray-600 mb-6">
          Upptäck de mest aktiva riksdagsledamöterna baserat på deras parlamentariska aktivitet. 
          Data uppdateras automatiskt och cachar för optimal prestanda.
        </p>

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Info className="w-5 h-5" />
              <span>Om Topplistorna</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-700">
            <div className="grid md:grid-cols-2 gap-4">
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
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium">Riksdagsår:</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
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
            <label className="text-sm font-medium">Antal i topplistan:</label>
            <Select value={topCount.toString()} onValueChange={(value) => setTopCount(parseInt(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {topCounts.map(count => (
                  <SelectItem key={count} value={count.toString()}>Topp {count}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={refreshData} 
            variant="outline" 
            size="sm"
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Uppdatera</span>
          </Button>

          <Button 
            onClick={() => setShowCacheStats(!showCacheStats)} 
            variant="ghost" 
            size="sm"
            className="flex items-center space-x-2"
          >
            <Database className="w-4 h-4" />
            <span>Cache Stats</span>
          </Button>
        </div>

        {/* Cache Stats */}
        {showCacheStats && (
          <Card className="mb-6 border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-gray-800">
                <BarChart3 className="w-5 h-5" />
                <span>Cache Statistik</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-600">{cacheStats.totalEntries}</div>
                  <div className="text-sm text-gray-600">Cachade poster</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">{cacheStats.totalSize} KB</div>
                  <div className="text-sm text-gray-600">Cache storlek</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600">
                    {Math.round(cacheStats.hitRate * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Träfffrekvens</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-600">
                    {cacheStats.oldestEntry ? 
                      Math.round((Date.now() - cacheStats.oldestEntry) / (1000 * 60 * 60)) : 0}h
                  </div>
                  <div className="text-sm text-gray-600">Äldsta post</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading Progress */}
        {loading && (
          <div className="mb-6 flex justify-center">
            <LoadingProgress 
              steps={loadingSteps} 
              progress={loadingProgress}
              title="Laddar topplistor..."
            />
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-700">
                <Info className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Lists Grid */}
      {!loading && (
        <div className="grid lg:grid-cols-2 gap-6">
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
      )}

      {/* Summary Stats */}
      {!loading && !error && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Sammanfattning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {motions.reduce((sum, m) => sum + m.count, 0)}
                </div>
                <div className="text-sm text-gray-600">Totalt motioner</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {speeches.reduce((sum, m) => sum + m.count, 0)}
                </div>
                <div className="text-sm text-gray-600">Totalt anföranden</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {interpellations.reduce((sum, m) => sum + m.count, 0)}
                </div>
                <div className="text-sm text-gray-600">Totalt interpellationer</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {writtenQuestions.reduce((sum, m) => sum + m.count, 0)}
                </div>
                <div className="text-sm text-gray-600">Totalt skriftliga frågor</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Topplistor;
