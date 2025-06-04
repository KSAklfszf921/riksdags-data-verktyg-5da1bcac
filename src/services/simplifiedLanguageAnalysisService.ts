
import { supabase } from '@/integrations/supabase/client';

export interface SimpleLanguageAnalysisResult {
  id: string;
  member_id: string;
  member_name: string;
  document_type: 'speech' | 'document';
  overall_score: number;
  word_count: number;
  analysis_date: string;
}

export interface SimpleMemberLanguageSummary {
  member_id: string;
  member_name: string;
  total_analyses: number;
  overall_average: number;
  total_words: number;
  last_analysis: string;
}

export class SimplifiedLanguageAnalysisService {
  // Get member language summary with optimized query
  static async getMemberLanguageSummary(memberId: string): Promise<SimpleMemberLanguageSummary | null> {
    try {
      const { data: analyses, error } = await supabase
        .from('language_analysis')
        .select('member_name, overall_score, word_count, analysis_date')
        .eq('member_id', memberId)
        .order('analysis_date', { ascending: false });

      if (error || !analyses || analyses.length === 0) {
        return null;
      }

      const totalWords = analyses.reduce((sum, a) => sum + (a.word_count || 0), 0);
      const overallAverage = Math.round(
        analyses.reduce((sum, a) => sum + a.overall_score, 0) / analyses.length
      );

      return {
        member_id: memberId,
        member_name: analyses[0].member_name,
        total_analyses: analyses.length,
        overall_average: overallAverage,
        total_words: totalWords,
        last_analysis: analyses[0].analysis_date
      };
    } catch (error) {
      console.error('Error getting member summary:', error);
      return null;
    }
  }

  // Get recent analyses for a member
  static async getRecentAnalyses(memberId: string, limit: number = 5): Promise<SimpleLanguageAnalysisResult[]> {
    try {
      const { data, error } = await supabase
        .from('language_analysis')
        .select('id, member_id, member_name, document_type, overall_score, word_count, analysis_date')
        .eq('member_id', memberId)
        .order('analysis_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent analyses:', error);
        return [];
      }

      return (data || []) as SimpleLanguageAnalysisResult[];
    } catch (error) {
      console.error('Error in getRecentAnalyses:', error);
      return [];
    }
  }

  // Check if member has analyzable content
  static async hasAnalyzableContent(memberId: string): Promise<{
    hasContent: boolean;
    documentCount: number;
    estimatedAnalyses: number;
  }> {
    try {
      const { data: documents, error } = await supabase
        .from('document_data')
        .select('document_id, content_preview')
        .eq('intressent_id', memberId)
        .not('content_preview', 'is', null)
        .neq('content_preview', '');

      if (error) {
        console.error('Error checking analyzable content:', error);
        return { hasContent: false, documentCount: 0, estimatedAnalyses: 0 };
      }

      const documentsWithText = documents?.filter(d => 
        d.content_preview && d.content_preview.trim().length > 100
      ) || [];

      return {
        hasContent: documentsWithText.length > 0,
        documentCount: documents?.length || 0,
        estimatedAnalyses: documentsWithText.length
      };
    } catch (error) {
      console.error('Error in hasAnalyzableContent:', error);
      return { hasContent: false, documentCount: 0, estimatedAnalyses: 0 };
    }
  }

  // Simplified analysis initiation
  static async initiateAnalysis(memberId: string, memberName: string): Promise<{
    success: boolean;
    message: string;
    analysisCount: number;
  }> {
    try {
      console.log(`Starting simplified analysis for ${memberName}`);

      const contentCheck = await this.hasAnalyzableContent(memberId);
      
      if (!contentCheck.hasContent) {
        return {
          success: false,
          message: 'No analyzable content found',
          analysisCount: 0
        };
      }

      // Get documents to analyze
      const { data: documents } = await supabase
        .from('document_data')
        .select('document_id, content_preview, titel, datum')
        .eq('intressent_id', memberId)
        .not('content_preview', 'is', null)
        .neq('content_preview', '')
        .limit(5);

      if (!documents || documents.length === 0) {
        return {
          success: false,
          message: 'No documents available for analysis',
          analysisCount: 0
        };
      }

      let analyzedCount = 0;

      for (const doc of documents) {
        if (doc.content_preview && doc.content_preview.trim().length > 100) {
          const analysis = await this.performSimpleAnalysis(doc.content_preview);
          
          const { error } = await supabase
            .from('language_analysis')
            .insert({
              member_id: memberId,
              member_name: memberName,
              document_id: doc.document_id,
              document_title: doc.titel || 'Dokument',
              document_type: 'document',
              overall_score: analysis.overall_score,
              language_complexity_score: analysis.complexity_score,
              vocabulary_richness_score: analysis.vocabulary_score,
              rhetorical_elements_score: analysis.rhetorical_score,
              structural_clarity_score: analysis.clarity_score,
              word_count: analysis.word_count,
              sentence_count: analysis.sentence_count,
              paragraph_count: analysis.paragraph_count,
              avg_sentence_length: analysis.avg_sentence_length,
              avg_word_length: analysis.avg_word_length,
              unique_words_ratio: analysis.unique_words_ratio,
              complex_words_ratio: analysis.complex_words_ratio,
              passive_voice_ratio: analysis.passive_voice_ratio,
              question_count: analysis.question_count,
              exclamation_count: analysis.exclamation_count,
              formal_language_indicators: analysis.formal_indicators,
              technical_terms_count: analysis.technical_terms,
              full_text: doc.content_preview.substring(0, 5000)
            });

          if (!error) {
            analyzedCount++;
          }
        }
      }

      return {
        success: analyzedCount > 0,
        message: `Analysis completed for ${analyzedCount} documents`,
        analysisCount: analyzedCount
      };

    } catch (error) {
      console.error(`Error in analysis for ${memberName}:`, error);
      return {
        success: false,
        message: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        analysisCount: 0
      };
    }
  }

  // Simplified analysis algorithm
  private static async performSimpleAnalysis(text: string): Promise<any> {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    const wordCount = words.length;
    const sentenceCount = Math.max(sentences.length, 1);
    const paragraphCount = Math.max(paragraphs.length, 1);
    
    const avgSentenceLength = wordCount / sentenceCount;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / Math.max(wordCount, 1);
    
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const uniqueWordsRatio = uniqueWords.size / Math.max(wordCount, 1);
    
    const complexWords = words.filter(word => word.length > 6);
    const complexWordsRatio = complexWords.length / Math.max(wordCount, 1);
    
    const passiveIndicators = (text.match(/\b(blev|blir|blivit|var|är|varit)\b/gi) || []).length;
    const passiveVoiceRatio = passiveIndicators / sentenceCount;
    
    const questionCount = (text.match(/\?/g) || []).length;
    const exclamationCount = (text.match(/!/g) || []).length;
    
    const formalIndicators = (text.match(/\b(följaktligen|emellertid|däremot|sålunda|således)\b/gi) || []).length;
    const technicalTerms = (text.match(/\b(proposition|motion|interpellation|riksdag|utskott)\b/gi) || []).length;
    
    // Simplified scoring
    const complexityScore = Math.min(100, Math.round(
      (avgSentenceLength * 2) + (avgWordLength * 8) + (complexWordsRatio * 30) + (passiveVoiceRatio * 10)
    ));
    
    const vocabularyScore = Math.min(100, Math.round(
      (uniqueWordsRatio * 60) + (complexWordsRatio * 40)
    ));
    
    const rhetoricalScore = Math.min(100, Math.round(
      ((questionCount + exclamationCount) / sentenceCount * 20) +
      (formalIndicators / wordCount * 100 * 30) +
      (technicalTerms / wordCount * 100 * 50)
    ));
    
    const clarityScore = Math.min(100, Math.round(
      100 - (Math.abs(avgSentenceLength - 15) * 2) - (passiveVoiceRatio * 20)
    ));
    
    const overallScore = Math.round(
      (complexityScore * 0.25) + (vocabularyScore * 0.25) + 
      (rhetoricalScore * 0.25) + (clarityScore * 0.25)
    );

    return {
      overall_score: Math.max(10, Math.min(100, overallScore)),
      complexity_score: Math.max(10, Math.min(100, complexityScore)),
      vocabulary_score: Math.max(10, Math.min(100, vocabularyScore)),
      rhetorical_score: Math.max(10, Math.min(100, rhetoricalScore)),
      clarity_score: Math.max(10, Math.min(100, clarityScore)),
      word_count: wordCount,
      sentence_count: sentenceCount,
      paragraph_count: paragraphCount,
      avg_sentence_length: Math.round(avgSentenceLength * 100) / 100,
      avg_word_length: Math.round(avgWordLength * 100) / 100,
      unique_words_ratio: Math.round(uniqueWordsRatio * 1000) / 1000,
      complex_words_ratio: Math.round(complexWordsRatio * 1000) / 1000,
      passive_voice_ratio: Math.round(passiveVoiceRatio * 1000) / 1000,
      question_count: questionCount,
      exclamation_count: exclamationCount,
      formal_indicators: formalIndicators,
      technical_terms: technicalTerms
    };
  }

  // Get analysis statistics
  static async getAnalysisStatistics(): Promise<{
    totalAnalyses: number;
    totalMembers: number;
    averageScore: number;
    lastWeekAnalyses: number;
  }> {
    try {
      const { data: analyses } = await supabase
        .from('language_analysis')
        .select('member_id, overall_score, analysis_date');

      const totalAnalyses = analyses?.length || 0;
      const uniqueMembers = new Set(analyses?.map(a => a.member_id) || []).size;
      const averageScore = analyses?.length ? 
        Math.round(analyses.reduce((sum, a) => sum + a.overall_score, 0) / analyses.length) : 0;

      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastWeekAnalyses = analyses?.filter(a => 
        new Date(a.analysis_date) > lastWeek
      ).length || 0;

      return {
        totalAnalyses,
        totalMembers: uniqueMembers,
        averageScore,
        lastWeekAnalyses
      };
    } catch (error) {
      console.error('Error getting analysis statistics:', error);
      return {
        totalAnalyses: 0,
        totalMembers: 0,
        averageScore: 0,
        lastWeekAnalyses: 0
      };
    }
  }
}

export default SimplifiedLanguageAnalysisService;
