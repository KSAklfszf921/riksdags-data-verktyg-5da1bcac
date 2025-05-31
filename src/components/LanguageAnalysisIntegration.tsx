
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LanguageAnalysisService } from '@/services/languageAnalysisService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Brain, TrendingUp } from 'lucide-react';

interface LanguageAnalysisIntegrationProps {
  memberId?: string;
  documentType?: 'speech' | 'written_question' | 'motion' | 'interpellation';
  limit?: number;
}

const LanguageAnalysisIntegration = ({ 
  memberId, 
  documentType = 'speech', 
  limit = 50 
}: LanguageAnalysisIntegrationProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch unanalyzed speeches/documents
  const { data: unanalyzedData, isLoading } = useQuery({
    queryKey: ['unanalyzedSpeeches', memberId, documentType, limit],
    queryFn: async () => {
      let query = supabase
        .from('speech_data')
        .select('speech_id, intressent_id, talare, anforandetext, rel_dok_titel, anforandedatum')
        .not('anforandetext', 'is', null)
        .neq('anforandetext', '')
        .limit(limit);

      if (memberId) {
        query = query.eq('intressent_id', memberId);
      }

      const { data: speeches, error } = await query;
      if (error) throw error;

      // Check which speeches already have analysis
      const speechIds = speeches?.map(s => s.speech_id) || [];
      if (speechIds.length === 0) return [];

      const { data: existingAnalyses } = await supabase
        .from('language_analysis')
        .select('document_id')
        .in('document_id', speechIds);

      const analyzedIds = new Set(existingAnalyses?.map(a => a.document_id) || []);
      
      return speeches?.filter(speech => !analyzedIds.has(speech.speech_id)) || [];
    }
  });

  // Mutation for bulk analysis
  const analyzeDocumentsMutation = useMutation({
    mutationFn: async (documents: any[]) => {
      const results = [];
      
      for (const doc of documents) {
        if (!doc.anforandetext || doc.anforandetext.trim().length < 50) continue;
        
        const result = await LanguageAnalysisService.saveAnalysis(
          doc.intressent_id || 'unknown',
          doc.talare || 'Okänd',
          'speech',
          doc.speech_id,
          doc.rel_dok_titel || 'Anförande',
          doc.anforandetext
        );
        
        if (result) {
          results.push(result);
        }
        
        // Add small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return results;
    },
    onSuccess: (results) => {
      toast({
        title: "Språkanalys slutförd",
        description: `${results.length} dokument har analyserats framgångsrikt.`,
      });
      queryClient.invalidateQueries({ queryKey: ['unanalyzedSpeeches'] });
      queryClient.invalidateQueries({ queryKey: ['languageStatistics'] });
    },
    onError: (error) => {
      toast({
        title: "Fel vid språkanalys",
        description: "Ett fel uppstod vid analysen. Försök igen.",
        variant: "destructive",
      });
      console.error('Analysis error:', error);
    }
  });

  // Fetch member's latest analysis
  const { data: memberAnalysis } = useQuery({
    queryKey: ['memberLanguageAnalysis', memberId],
    queryFn: () => memberId ? LanguageAnalysisService.getAnalysisByMember(memberId) : Promise.resolve([]),
    enabled: !!memberId
  });

  const handleAnalyzeDocuments = () => {
    if (unanalyzedData && unanalyzedData.length > 0) {
      analyzeDocumentsMutation.mutate(unanalyzedData.slice(0, 10)); // Analyze 10 at a time
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Laddar språkanalysdata...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Analysis Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Språkanalys
          </CardTitle>
          <CardDescription>
            Regelbaserad analys av språklig kvalitet och komplexitet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                {unanalyzedData?.length || 0} oanalyserade dokument
              </p>
              {memberAnalysis && memberAnalysis.length > 0 && (
                <p className="text-sm text-gray-600">
                  {memberAnalysis.length} dokument redan analyserade
                </p>
              )}
            </div>
            
            <Button
              onClick={handleAnalyzeDocuments}
              disabled={!unanalyzedData?.length || analyzeDocumentsMutation.isPending}
              className="ml-4"
            >
              {analyzeDocumentsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Analyserar...
                </>
              ) : (
                'Starta analys'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Latest Analysis Results */}
      {memberAnalysis && memberAnalysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Senaste analysresultat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {memberAnalysis.slice(0, 4).map((analysis) => (
                <div key={analysis.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm truncate">{analysis.document_title}</h4>
                    <Badge variant={analysis.overall_score >= 70 ? 'default' : 'secondary'}>
                      {analysis.overall_score}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div>Komplexitet: {analysis.language_complexity_score}</div>
                    <div>Ordförråd: {analysis.vocabulary_richness_score}</div>
                    <div>Retorik: {analysis.rhetorical_elements_score}</div>
                    <div>Struktur: {analysis.structural_clarity_score}</div>
                  </div>
                  <p className="text-xs text-gray-400">
                    {analysis.word_count} ord • {new Date(analysis.analysis_date).toLocaleDateString('sv-SE')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LanguageAnalysisIntegration;
