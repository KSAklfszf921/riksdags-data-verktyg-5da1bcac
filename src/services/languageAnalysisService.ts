
import { supabase } from '@/integrations/supabase/client';

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

export interface MemberLanguageSummary {
  member_id: string;
  member_name: string;
  total_analyses: number;
  speech_count: number;
  document_count: number;
  overall_average: number;
  complexity_average: number;
  vocabulary_average: number;
  rhetorical_average: number;
  clarity_average: number;
  total_words: number;
  last_analysis: string;
}

export interface DataValidationResult {
  member_id: string;
  member_name: string;
  speeches_available: number;
  documents_available: number;
  speeches_with_text: number;
  documents_with_text: number;
  total_analyzable: number;
  totalMembers: number;
  membersWithValidContent: number;
  membersWithSpeeches: number;
  membersWithQuestions: number;
  avgSpeechLength: number;
  avgQuestionLength: number;
  emptyContentCount: number;
  shortContentCount: number;
  recommendations: string[];
}

export class LanguageAnalysisService {
  // Language level mapping
  static getLanguageLevel(score: number): { level: string; description: string; color: string } {
    if (score >= 90) return { level: 'Exceptional', description: 'Enastående språklig skicklighet', color: 'bg-purple-100 text-purple-800' };
    if (score >= 80) return { level: 'Avancerad', description: 'Mycket hög språklig kompetens', color: 'bg-blue-100 text-blue-800' };
    if (score >= 70) return { level: 'Kompetent', description: 'God språklig förmåga', color: 'bg-green-100 text-green-800' };
    if (score >= 60) return { level: 'Utveckling', description: 'Utvecklar språklig skicklighet', color: 'bg-yellow-100 text-yellow-800' };
    return { level: 'Grundläggande', description: 'Grundläggande språklig nivå', color: 'bg-red-100 text-red-800' };
  }

  // Global data validation (for dashboard) - Updated to use available tables
  static async validateDataAvailability(memberId?: string, memberName?: string): Promise<DataValidationResult> {
    console.log(`=== VALIDATING DATA AVAILABILITY ===`);
    
    try {
      if (memberId && memberName) {
        // Individual member validation - using document_data since speech_data doesn't exist
        const { data: documents, error: docError } = await supabase
          .from('document_data')
          .select('document_id, titel, content_preview, intressent_id')
          .eq('intressent_id', memberId)
          .not('content_preview', 'is', null)
          .neq('content_preview', '');

        if (docError) {
          console.error('Error fetching documents:', docError);
        }

        const documentsAvailable = documents?.length || 0;
        
        const documentsWithText = documents?.filter(d => 
          d.content_preview && d.content_preview.trim().length > 100
        ).length || 0;

        return {
          member_id: memberId,
          member_name: memberName,
          speeches_available: 0, // No speech_data table available
          documents_available: documentsAvailable,
          speeches_with_text: 0,
          documents_with_text: documentsWithText,
          total_analyzable: documentsWithText,
          totalMembers: 1,
          membersWithValidContent: documentsWithText > 0 ? 1 : 0,
          membersWithSpeeches: 0,
          membersWithQuestions: documentsWithText > 0 ? 1 : 0,
          avgSpeechLength: 0,
          avgQuestionLength: documents?.reduce((sum, d) => sum + (d.content_preview?.length || 0), 0) / Math.max(documentsAvailable, 1) || 0,
          emptyContentCount: 0,
          shortContentCount: 0,
          recommendations: [`Analysera ${documentsWithText} tillgängliga dokument för ${memberName}`]
        };
      } else {
        // Global validation for all members - using enhanced_member_profiles
        const { data: allDocuments } = await supabase
          .from('document_data')
          .select('intressent_id, content_preview')
          .not('content_preview', 'is', null)
          .neq('content_preview', '');

        const { data: allMembers } = await supabase
          .from('enhanced_member_profiles')
          .select('member_id, first_name, last_name')
          .eq('is_active', true);

        const totalMembers = allMembers?.length || 0;
        const memberIds = new Set(allMembers?.map(m => m.member_id) || []);
        
        const documentsByMember = new Map();
        
        allDocuments?.forEach(doc => {
          if (memberIds.has(doc.intressent_id)) {
            if (!documentsByMember.has(doc.intressent_id)) {
              documentsByMember.set(doc.intressent_id, []);
            }
            documentsByMember.get(doc.intressent_id).push(doc);
          }
        });

        const membersWithQuestions = documentsByMember.size;
        const membersWithValidContent = documentsByMember.size;

        const avgQuestionLength = allDocuments?.reduce((sum, d) => sum + (d.content_preview?.length || 0), 0) / Math.max(allDocuments?.length || 1, 1);

        return {
          member_id: '',
          member_name: '',
          speeches_available: 0,
          documents_available: allDocuments?.length || 0,
          speeches_with_text: 0,
          documents_with_text: allDocuments?.length || 0,
          total_analyzable: allDocuments?.length || 0,
          totalMembers,
          membersWithValidContent,
          membersWithSpeeches: 0,
          membersWithQuestions,
          avgSpeechLength: 0,
          avgQuestionLength,
          emptyContentCount: totalMembers - membersWithValidContent,
          shortContentCount: 0,
          recommendations: [
            `${membersWithValidContent} av ${totalMembers} ledamöter har analysbar text`,
            `Genomsnittlig dokumentlängd: ${Math.round(avgQuestionLength)} tecken`,
            `${membersWithQuestions} ledamöter har dokument`
          ]
        };
      }
    } catch (error) {
      console.error('Error in data validation:', error);
      return {
        member_id: memberId || '',
        member_name: memberName || '',
        speeches_available: 0,
        documents_available: 0,
        speeches_with_text: 0,
        documents_with_text: 0,
        total_analyzable: 0,
        totalMembers: 0,
        membersWithValidContent: 0,
        membersWithSpeeches: 0,
        membersWithQuestions: 0,
        avgSpeechLength: 0,
        avgQuestionLength: 0,
        emptyContentCount: 0,
        shortContentCount: 0,
        recommendations: ['Fel vid validering av data']
      };
    }
  }

  // Simple member language analysis - Updated to use document_data
  static async analyzeMemberLanguage(memberId: string, memberName: string): Promise<number> {
    console.log(`=== STARTING LANGUAGE ANALYSIS FOR ${memberName} ===`);
    
    try {
      const validation = await this.validateDataAvailability(memberId, memberName);
      
      if (validation.total_analyzable === 0) {
        console.warn(`No analyzable content found for ${memberName}`);
        return 0;
      }

      let analyzedCount = 0;

      // Analyze documents instead of speeches since speech_data table doesn't exist
      if (validation.documents_with_text > 0) {
        const { data: documents } = await supabase
          .from('document_data')
          .select('document_id, content_preview, titel, datum')
          .eq('intressent_id', memberId)
          .not('content_preview', 'is', null)
          .neq('content_preview', '')
          .limit(5);

        if (documents) {
          for (const doc of documents) {
            if (doc.content_preview && doc.content_preview.trim().length > 100) {
              const analysis = await this.performLanguageAnalysis(doc.content_preview);
              
              const { error } = await supabase
                .from('language_analysis')
                .insert({
                  member_id: memberId,
                  member_name: memberName,
                  document_id: doc.document_id,
                  document_title: doc.titel || 'Dokument',
                  document_type: 'document',
                  overall_score: analysis.overall_score,
                  language_complexity_score: analysis.language_complexity_score,
                  vocabulary_richness_score: analysis.vocabulary_richness_score,
                  rhetorical_elements_score: analysis.rhetorical_elements_score,
                  structural_clarity_score: analysis.structural_clarity_score,
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
                  formal_language_indicators: analysis.formal_language_indicators,
                  technical_terms_count: analysis.technical_terms_count,
                  full_text: doc.content_preview.substring(0, 5000)
                });

              if (!error) {
                analyzedCount++;
                console.log(`✅ Analyzed document: ${doc.document_id}`);
              }
            }
          }
        }
      }

      console.log(`=== COMPLETED ANALYSIS FOR ${memberName}: ${analyzedCount} texts analyzed ===`);
      return analyzedCount;

    } catch (error) {
      console.error(`Error in language analysis for ${memberName}:`, error);
      return 0;
    }
  }

  // Enhanced member language analysis (alias for compatibility)
  static async analyzeMemberLanguageEnhanced(memberId: string, memberName: string): Promise<number> {
    return this.analyzeMemberLanguage(memberId, memberName);
  }

  // API-based member language analysis (alias for compatibility)
  static async analyzeMemberLanguageWithAPI(memberId: string, memberName: string): Promise<number> {
    return this.analyzeMemberLanguage(memberId, memberName);
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

  // Simple language analysis implementation
  private static async performLanguageAnalysis(text: string): Promise<any> {
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

  // Save analysis result
  static async saveAnalysis(
    memberId: string,
    memberName: string,
    documentType: 'speech' | 'document',
    documentId: string,
    documentTitle: string,
    text: string
  ): Promise<LanguageAnalysisResult | null> {
    try {
      const analysis = await this.performLanguageAnalysis(text);
      
      const { data, error } = await supabase
        .from('language_analysis')
        .insert({
          member_id: memberId,
          member_name: memberName,
          document_id: documentId,
          document_title: documentTitle,
          document_type: documentType,
          overall_score: analysis.overall_score,
          language_complexity_score: analysis.language_complexity_score,
          vocabulary_richness_score: analysis.vocabulary_richness_score,
          rhetorical_elements_score: analysis.rhetorical_elements_score,
          structural_clarity_score: analysis.structural_clarity_score,
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
          formal_language_indicators: analysis.formal_language_indicators,
          technical_terms_count: analysis.technical_terms_count,
          full_text: text.substring(0, 5000)
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving analysis:', error);
        return null;
      }

      return data as LanguageAnalysisResult;
    } catch (error) {
      console.error('Error in saveAnalysis:', error);
      return null;
    }
  }

  // Get member language summary
  static async getMemberLanguageSummary(memberId: string): Promise<MemberLanguageSummary | null> {
    try {
      const { data: analyses, error } = await supabase
        .from('language_analysis')
        .select('*')
        .eq('member_id', memberId);

      if (error || !analyses || analyses.length === 0) {
        return null;
      }

      const speechCount = analyses.filter(a => a.document_type === 'speech').length;
      const documentCount = analyses.filter(a => a.document_type === 'document').length;
      
      const totalWords = analyses.reduce((sum, a) => sum + (a.word_count || 0), 0);
      
      const averageScore = (field: string) => {
        const scores = analyses.map(a => a[field]).filter(s => typeof s === 'number');
        return scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) : 0;
      };

      const latestAnalysis = analyses.sort((a, b) => 
        new Date(b.analysis_date).getTime() - new Date(a.analysis_date).getTime()
      )[0];

      return {
        member_id: memberId,
        member_name: analyses[0].member_name,
        total_analyses: analyses.length,
        speech_count: speechCount,
        document_count: documentCount,
        overall_average: averageScore('overall_score'),
        complexity_average: averageScore('language_complexity_score'),
        vocabulary_average: averageScore('vocabulary_richness_score'),
        rhetorical_average: averageScore('rhetorical_elements_score'),
        clarity_average: averageScore('structural_clarity_score'),
        total_words: totalWords,
        last_analysis: latestAnalysis.analysis_date
      };
    } catch (error) {
      console.error('Error getting member summary:', error);
      return null;
    }
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

      return (data || []) as LanguageAnalysisResult[];
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

      return (data || []) as LanguageAnalysisResult[];
    } catch (error) {
      console.error('Error in getAnalysisByMember:', error);
      return [];
    }
  }
}
