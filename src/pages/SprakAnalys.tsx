
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LanguageAnalysisService, LanguageAnalysisResult } from '@/services/languageAnalysisService';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, FileText, Award } from 'lucide-react';

const SprakAnalys = () => {
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [scoreType, setScoreType] = useState<'overall_score' | 'language_complexity_score' | 'vocabulary_richness_score' | 'rhetorical_elements_score' | 'structural_clarity_score'>('overall_score');

  // Fetch top performers
  const { data: topPerformers, isLoading: topLoading } = useQuery({
    queryKey: ['topPerformers', scoreType],
    queryFn: () => LanguageAnalysisService.getTopPerformers(scoreType, 10)
  });

  // Fetch member-specific analysis
  const { data: memberAnalysis, isLoading: memberLoading } = useQuery({
    queryKey: ['memberAnalysis', selectedMember],
    queryFn: () => selectedMember ? LanguageAnalysisService.getAnalysisByMember(selectedMember) : Promise.resolve([]),
    enabled: !!selectedMember
  });

  // Fetch overall statistics
  const { data: statistics } = useQuery({
    queryKey: ['languageStatistics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('language_analysis')
        .select('*');
      
      if (error) return null;
      
      const totalAnalyses = data.length;
      const avgOverallScore = data.reduce((sum, item) => sum + item.overall_score, 0) / totalAnalyses;
      const uniqueMembers = new Set(data.map(item => item.member_id)).size;
      
      const documentTypes = data.reduce((acc, item) => {
        acc[item.document_type] = (acc[item.document_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalAnalyses,
        avgOverallScore: Math.round(avgOverallScore),
        uniqueMembers,
        documentTypes
      };
    }
  });

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const chartData = topPerformers?.map(analysis => ({
    name: analysis.member_name,
    score: analysis[scoreType],
    complexity: analysis.language_complexity_score,
    vocabulary: analysis.vocabulary_richness_score,
    rhetorical: analysis.rhetorical_elements_score,
    structure: analysis.structural_clarity_score
  })) || [];

  const pieData = statistics ? Object.entries(statistics.documentTypes).map(([type, count]) => ({
    name: type,
    value: count
  })) : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Språkanalys
        </h1>
        <p className="text-gray-600">
          Regelbaserad analys av språklig komplexitet, ordförråd och retoriska element i politiska dokument
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totala analyser</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalAnalyses}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Genomsnittlig poäng</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.avgOverallScore}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Analyserade ledamöter</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.uniqueMembers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dokumenttyper</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(statistics.documentTypes).length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="rankings">Ranking</TabsTrigger>
          <TabsTrigger value="member">Ledamot</TabsTrigger>
          <TabsTrigger value="analysis">Gör analys</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fördelning av dokumenttyper</CardTitle>
                <CardDescription>Antal analyserade dokument per typ</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Topp 5 prestationer</CardTitle>
                <CardDescription>Högsta poäng inom olika kategorier</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPerformers?.slice(0, 5).map((analysis, index) => (
                    <div key={analysis.id} className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{analysis.member_name}</p>
                        <p className="text-sm text-gray-500">{analysis.document_type}</p>
                      </div>
                      <Badge variant={getScoreBadgeVariant(analysis[scoreType])}>
                        {analysis[scoreType]}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rankings" className="space-y-6">
          <div className="flex gap-4 mb-6">
            <Select value={scoreType} onValueChange={(value: any) => setScoreType(value)}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Välj kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overall_score">Övergripande poäng</SelectItem>
                <SelectItem value="language_complexity_score">Språklig komplexitet</SelectItem>
                <SelectItem value="vocabulary_richness_score">Ordförrådsrikedom</SelectItem>
                <SelectItem value="rhetorical_elements_score">Retoriska element</SelectItem>
                <SelectItem value="structural_clarity_score">Strukturell tydlighet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ranking - {scoreType.replace('_', ' ').replace('score', 'poäng')}</CardTitle>
              <CardDescription>Topp 10 prestationer inom vald kategori</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="member" className="space-y-6">
          <div className="flex gap-4 mb-6">
            <Input
              placeholder="Ange medlems-ID eller sök efter namn..."
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="flex-1"
            />
          </div>

          {memberAnalysis && memberAnalysis.length > 0 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{memberAnalysis[0].member_name} - Språkanalys</CardTitle>
                  <CardDescription>{memberAnalysis.length} analyserade dokument</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(memberAnalysis.reduce((sum, a) => sum + a.overall_score, 0) / memberAnalysis.length)}
                      </div>
                      <div className="text-sm text-gray-500">Genomsnitt</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.max(...memberAnalysis.map(a => a.overall_score))}
                      </div>
                      <div className="text-sm text-gray-500">Högsta</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {Math.min(...memberAnalysis.map(a => a.overall_score))}
                      </div>
                      <div className="text-sm text-gray-500">Lägsta</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {memberAnalysis.reduce((sum, a) => sum + a.word_count, 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">Totala ord</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {memberAnalysis.map((analysis) => (
                      <div key={analysis.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">{analysis.document_title}</h3>
                            <p className="text-sm text-gray-500">
                              {analysis.document_type} • {new Date(analysis.analysis_date).toLocaleDateString('sv-SE')}
                            </p>
                          </div>
                          <Badge variant={getScoreBadgeVariant(analysis.overall_score)}>
                            {analysis.overall_score}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Komplexitet:</span>
                            <span className={`ml-2 font-medium ${getScoreColor(analysis.language_complexity_score)}`}>
                              {analysis.language_complexity_score}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Ordförråd:</span>
                            <span className={`ml-2 font-medium ${getScoreColor(analysis.vocabulary_richness_score)}`}>
                              {analysis.vocabulary_richness_score}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Retorik:</span>
                            <span className={`ml-2 font-medium ${getScoreColor(analysis.rhetorical_elements_score)}`}>
                              {analysis.rhetorical_elements_score}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Struktur:</span>
                            <span className={`ml-2 font-medium ${getScoreColor(analysis.structural_clarity_score)}`}>
                              {analysis.structural_clarity_score}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mt-2">
                          <div>{analysis.word_count} ord</div>
                          <div>{analysis.sentence_count} meningar</div>
                          <div>{analysis.question_count} frågor</div>
                          <div>{analysis.technical_terms_count} tekniska termer</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Skapa ny språkanalys</CardTitle>
              <CardDescription>
                Analysera språklig kvalitet i politiska dokument med regelbaserade metoder
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Språkanalys sker automatiskt när nya anföranden och dokument läggs till i systemet. 
                Analysen utvärderar text baserat på:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
                <li><strong>Språklig komplexitet:</strong> Meningslängd, ordlängd, komplexa ord och passiv form</li>
                <li><strong>Ordförrådsrikedom:</strong> Andel unika ord och variation i ordval</li>
                <li><strong>Retoriska element:</strong> Användning av frågor, utrop och formella språkmarkörer</li>
                <li><strong>Strukturell tydlighet:</strong> Meningsbyggnad och styckeindelning</li>
              </ul>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Information:</strong> Språkanalys körs automatiskt för nya anföranden från Riksdagens API. 
                  Befintliga dokument kan analyseras manuellt via databashanteringssidan.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SprakAnalys;
