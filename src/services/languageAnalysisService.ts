
import { supabase } from '@/integrations/supabase/client';
import { enhancedDocumentTextFetcher } from './enhancedDocumentTextFetcher';

export interface LanguageAnalysisResult {
  id: string;
  member_id: string;
  member_name: string;
  document_id: string;
  document_title: string;
  document_type: 'speech' | 'document';
  overall_score: number;
  language_complexity_score: number;
  vocabulary_richness_score: number;
  rhetorical_elements_score: number;
  structural_clarity_score: number;
  word_count: number;
  sentence_count: number;
  paragraph_count: number;
  avg_sentence_length: number;
  avg_word_length: number;
  unique_words_ratio: number;
  complex_words_ratio: number;
  passive_voice_ratio: number;
  question_count: number;
  exclamation_count: number;
  formal_language_indicators: number;
  technical_terms_count: number;
  analysis_date: string;
  full_text?: string;
}

export interface AnalysisStatistics {
  totalAnalyses: number;
  totalMembers: number;
  averageScore: number;
  lastWeekAnalyses: number;
}

export class LanguageAnalysisService {
  private static readonly OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

  // Language level mapping
  static getLanguageLevel(score: number): { level: string; description: string; color: string } {
    if (score >= 90) return { level: 'Exceptional', description: 'Enastående språklig skicklighet', color: 'bg-purple-100 text-purple-800' };
    if (score >= 80) return { level: 'Avancerad', description: 'Mycket hög språklig kompetens', color: 'bg-blue-100 text-blue-800' };
    if (score >= 70) return { level: 'Kompetent', description: 'God språklig förmåga', color: 'bg-green-100 text-green-800' };
    if (score >= 60) return { level: 'Utveckling', description: 'Utvecklar språklig skicklighet', color: 'bg-yellow-100 text-yellow-800' };
    return { level: 'Grundläggande', description: 'Grundläggande språklig nivå', color: 'bg-red-100 text-red-800' };
  }

  // Enhanced member content analysis using the proper enhanced fetcher
  static async analyzeMemberLanguageWithAPI(memberId: string, memberName: string): Promise<number> {
    console.log(`=== STARTING ENHANCED LANGUAGE ANALYSIS FOR ${memberName} ===`);
    
    try {
      // Use the enhanced document text fetcher to get member content
      console.log(`Fetching content for ${memberName} using enhanced fetcher...`);
      const memberContent = await enhancedDocumentTextFetcher.fetchMemberContentWithDetails(
        memberId,
        memberName,
        (progress) => {
          console.log(`Enhanced fetch progress: ${progress.currentStep}`);
        }
      );

      console.log(`Enhanced content fetched for ${memberName}:`, {
        speeches: memberContent.speeches.length,
        documents: memberContent.documents.length,
        extractionDetails: memberContent.extractionDetails
      });

      const allTexts = [
        ...memberContent.speeches.map(speech => ({
          id: speech.id,
          text: speech.text,
          title: speech.title,
          date: speech.date,
          type: 'speech' as const
        })),
        ...memberContent.documents.map(doc => ({
          id: doc.id,
          text: doc.text,
          title: doc.title,
          date: doc.date,
          type: 'document' as const
        }))
      ];

      if (allTexts.length === 0) {
        console.warn(`No texts available for analysis for ${memberName}`);
        return 0;
      }

      console.log(`Analyzing ${allTexts.length} texts for ${memberName}...`);
      let analyzedCount = 0;

      // Analyze each text individually
      for (const textItem of allTexts) {
        try {
          console.log(`Analyzing ${textItem.type}: ${textItem.title.substring(0, 50)}...`);
          
          // Check if already analyzed recently (within 24 hours)
          const { data: existingAnalysis } = await supabase
            .from('language_analysis')
            .select('id, analysis_date')
            .eq('member_id', memberId)
            .eq('document_id', textItem.id)
            .order('analysis_date', { ascending: false })
            .limit(1);

          if (existingAnalysis && existingAnalysis.length > 0) {
            const lastAnalysis = new Date(existingAnalysis[0].analysis_date);
            const hoursSinceAnalysis = (Date.now() - lastAnalysis.getTime()) / (1000 * 60 * 60);
            
            if (hoursSinceAnalysis < 24) {
              console.log(`Skipping ${textItem.id} - analyzed ${Math.round(hoursSinceAnalysis)} hours ago`);
              continue;
            }
          }

          // Perform AI analysis
          const analysisResult = await this.performAILanguageAnalysis(textItem.text);
          
          if (analysisResult) {
            // Save to database with service role (bypass RLS)
            const { error: insertError } = await supabase
              .from('language_analysis')
              .insert({
                member_id: memberId,
                member_name: memberName,
                document_id: textItem.id,
                document_title: textItem.title,
                document_type: textItem.type,
                overall_score: analysisResult.overall_score,
                language_complexity_score: analysisResult.language_complexity_score,
                vocabulary_richness_score: analysisResult.vocabulary_richness_score,
                rhetorical_elements_score: analysisResult.rhetorical_elements_score,
                structural_clarity_score: analysisResult.structural_clarity_score,
                word_count: analysisResult.word_count,
                sentence_count: analysisResult.sentence_count,
                paragraph_count: analysisResult.paragraph_count,
                avg_sentence_length: analysisResult.avg_sentence_length,
                avg_word_length: analysisResult.avg_word_length,
                unique_words_ratio: analysisResult.unique_words_ratio,
                complex_words_ratio: analysisResult.complex_words_ratio,
                passive_voice_ratio: analysisResult.passive_voice_ratio,
                question_count: analysisResult.question_count,
                exclamation_count: analysisResult.exclamation_count,
                formal_language_indicators: analysisResult.formal_language_indicators,
                technical_terms_count: analysisResult.technical_terms_count,
                full_text: textItem.text.substring(0, 10000) // Limit text length
              });

            if (insertError) {
              console.error(`Database error for ${textItem.id}:`, insertError);
              // Continue with other texts even if one fails
            } else {
              analyzedCount++;
              console.log(`✅ Successfully analyzed and saved: ${textItem.title.substring(0, 50)}...`);
            }
          }

          // Short delay between analyses
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Error analyzing individual text ${textItem.id}:`, error);
          // Continue with other texts
        }
      }

      console.log(`=== COMPLETED ANALYSIS FOR ${memberName}: ${analyzedCount}/${allTexts.length} texts analyzed ===`);
      return analyzedCount;

    } catch (error) {
      console.error(`Critical error in enhanced language analysis for ${memberName}:`, error);
      return 0;
    }
  }

  // AI analysis method
  private static async performAILanguageAnalysis(text: string): Promise<any> {
    // Mock implementation for now - replace with actual OpenAI API call
    console.log('Performing AI language analysis...');
    
    // Simulate AI analysis with realistic metrics
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const paragraphCount = Math.max(paragraphs.length, 1);
    
    const avgSentenceLength = wordCount / Math.max(sentenceCount, 1);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / Math.max(wordCount, 1);
    
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const uniqueWordsRatio = uniqueWords.size / Math.max(wordCount, 1);
    
    const complexWords = words.filter(word => word.length > 6);
    const complexWordsRatio = complexWords.length / Math.max(wordCount, 1);
    
    const passiveIndicators = (text.match(/\b(blev|blir|blivit|var|är|varit)\b/gi) || []).length;
    const passiveVoiceRatio = passiveIndicators / Math.max(sentenceCount, 1);
    
    const questionCount = (text.match(/\?/g) || []).length;
    const exclamationCount = (text.match(/!/g) || []).length;
    
    const formalIndicators = (text.match(/\b(följaktligen|emellertid|däremot|sålunda|således)\b/gi) || []).length;
    const technicalTerms = (text.match(/\b(proposition|motion|interpellation|riksdag|utskott)\b/gi) || []).length;
    
    // Calculate scores (0-100)
    const complexityScore = Math.min(100, Math.round(
      (avgSentenceLength * 2) + 
      (avgWordLength * 8) + 
      (complexWordsRatio * 30) +
      (passiveVoiceRatio * 10)
    ));
    
    const vocabularyScore = Math.min(100, Math.round(
      (uniqueWordsRatio * 60) +
      (complexWordsRatio * 40)
    ));
    
    const rhetoricalScore = Math.min(100, Math.round(
      ((questionCount + exclamationCount) / Math.max(sentenceCount, 1) * 20) +
      (formalIndicators / Math.max(wordCount, 1) * 100 * 30) +
      (technicalTerms / Math.max(wordCount, 1) * 100 * 50)
    ));
    
    const clarityScore = Math.min(100, Math.round(
      100 - (Math.abs(avgSentenceLength - 15) * 2) -
      (passiveVoiceRatio * 20)
    ));
    
    const overallScore = Math.round(
      (complexityScore * 0.25) +
      (vocabularyScore * 0.25) +
      (rhetoricalScore * 0.25) +
      (clarityScore * 0.25)
    );

    return {
      overall_score: Math.max(10, Math.min(100, overallScore)),
      language_complexity_score: Math.max(10, Math.min(100, complexityScore)),
      vocabulary_richness_score: Math.max(10, Math.min(100, vocabularyScore)),
      rhetorical_elements_score: Math.max(10, Math.min(100, rhetoricalScore)),
      structural_clarity_score: Math.max(10, Math.min(100, clarityScore)),
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
      formal_language_indicators: formalIndicators,
      technical_terms_count: technicalTerms
    };
  }

  // Database query methods
  static async getTopPerformers(category: string = 'overall_score', limit: number = 10): Promise<LanguageAnalysisResult[]> {
    try {
      const { data, error } = await supabase
        .from('language_analysis')
        .select('*')
        .order(category, { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching top performers:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTopPerformers:', error);
      return [];
    }
  }

  static async getAnalysisByMember(memberId: string): Promise<LanguageAnalysisResult[]> {
    try {
      const { data, error } = await supabase
        .from('language_analysis')
        .select('*')
        .eq('member_id', memberId)
        .order('analysis_date', { ascending: false });

      if (error) {
        console.error('Error fetching member analysis:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAnalysisByMember:', error);
      return [];
    }
  }

  static async getAnalysisStatistics(): Promise<AnalysisStatistics> {
    try {
      const { data: allAnalyses, error: allError } = await supabase
        .from('language_analysis')
        .select('member_id, overall_score, analysis_date');

      if (allError) {
        console.error('Error fetching analysis statistics:', error);
        return { totalAnalyses: 0, totalMembers: 0, averageScore: 0, lastWeekAnalyses: 0 };
      }

      const totalAnalyses = allAnalyses?.length || 0;
      const uniqueMembers = new Set(allAnalyses?.map(a => a.member_id) || []);
      const totalMembers = uniqueMembers.size;
      
      const averageScore = totalAnalyses > 0
        ? Math.round((allAnalyses?.reduce((sum, a) => sum + a.overall_score, 0) || 0) / totalAnalyses)
        : 0;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const lastWeekAnalyses = allAnalyses?.filter(a => 
        new Date(a.analysis_date) > oneWeekAgo
      ).length || 0;

      return {
        totalAnalyses,
        totalMembers,
        averageScore,
        lastWeekAnalyses
      };
    } catch (error) {
      console.error('Error calculating statistics:', error);
      return { totalAnalyses: 0, totalMembers: 0, averageScore: 0, lastWeekAnalyses: 0 };
    }
  }
}
