
import { supabase } from "@/integrations/supabase/client";

export interface LanguageAnalysisResult {
  id: string;
  member_id: string;
  member_name: string;
  document_type: 'speech' | 'written_question' | 'motion' | 'interpellation';
  document_id: string;
  document_title?: string;
  analysis_date: string;
  overall_score: number;
  language_complexity_score: number;
  vocabulary_richness_score: number;
  rhetorical_elements_score: number;
  structural_clarity_score: number;
  word_count: number;
  sentence_count: number;
  paragraph_count: number;
  avg_sentence_length?: number;
  avg_word_length?: number;
  unique_words_ratio?: number;
  complex_words_ratio?: number;
  passive_voice_ratio?: number;
  question_count: number;
  exclamation_count: number;
  formal_language_indicators: number;
  technical_terms_count: number;
  full_text?: string;
  analysis_version: string;
  created_at: string;
  updated_at: string;
}

export interface TextAnalysisMetrics {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgSentenceLength: number;
  avgWordLength: number;
  uniqueWordsRatio: number;
  complexWordsRatio: number;
  passiveVoiceRatio: number;
  questionCount: number;
  exclamationCount: number;
  formalLanguageIndicators: number;
  technicalTermsCount: number;
}

export interface MemberLanguageSummary {
  member_id: string;
  member_name: string;
  overall_average: number;
  speech_count: number;
  question_count: number;
  total_words: number;
  complexity_average: number;
  vocabulary_average: number;
  rhetorical_average: number;
  clarity_average: number;
  last_analysis: string;
}

export class LanguageAnalysisService {
  private static complexWords = new Set([
    'återgång', 'förutsättning', 'ansvarighet', 'genomförande', 'utveckling',
    'betydelse', 'förbättring', 'möjlighet', 'verkställande', 'rättsäkerhet',
    'sammanhang', 'förändring', 'kompetens', 'organisation', 'planering',
    'prioritering', 'konsekvens', 'förvaltning', 'hantering', 'utredning'
  ]);

  private static formalIndicators = new Set([
    'därför', 'således', 'emellertid', 'dessutom', 'följaktligen',
    'med anledning av', 'beträffande', 'avseende', 'enligt', 'genom',
    'härigenom', 'jämlikt', 'oaktat', 'trots', 'utöver'
  ]);

  private static technicalTerms = new Set([
    'proposition', 'betänkande', 'utskott', 'riksdag', 'motion',
    'interpellation', 'rättsfall', 'förordning', 'lagstiftning',
    'parlamentarisk', 'konstitutionell', 'juridisk', 'demokratisk'
  ]);

  static analyzeText(text: string): TextAnalysisMetrics {
    if (!text || text.trim().length === 0) {
      return {
        wordCount: 0,
        sentenceCount: 0,
        paragraphCount: 0,
        avgSentenceLength: 0,
        avgWordLength: 0,
        uniqueWordsRatio: 0,
        complexWordsRatio: 0,
        passiveVoiceRatio: 0,
        questionCount: 0,
        exclamationCount: 0,
        formalLanguageIndicators: 0,
        technicalTermsCount: 0
      };
    }

    // Clean text from HTML tags
    const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Basic counts
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const words = cleanText.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    
    // Word analysis
    const uniqueWords = new Set(words);
    const complexWordCount = words.filter(word => 
      this.complexWords.has(word) || word.length > 10
    ).length;
    
    // Passive voice detection (simplified for Swedish)
    const passiveIndicators = ['blev', 'blivit', 'är', 'var', 'varit', 'kommer att'];
    const passiveCount = sentences.filter(sentence => 
      passiveIndicators.some(indicator => sentence.toLowerCase().includes(indicator))
    ).length;
    
    // Question and exclamation counts
    const questionCount = (cleanText.match(/\?/g) || []).length;
    const exclamationCount = (cleanText.match(/!/g) || []).length;
    
    // Formal language indicators
    const formalCount = words.filter(word => 
      this.formalIndicators.has(word)
    ).length;
    
    // Technical terms
    const technicalCount = words.filter(word => 
      this.technicalTerms.has(word)
    ).length;
    
    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      avgSentenceLength: sentences.length > 0 ? words.length / sentences.length : 0,
      avgWordLength: words.length > 0 ? words.join('').length / words.length : 0,
      uniqueWordsRatio: words.length > 0 ? uniqueWords.size / words.length : 0,
      complexWordsRatio: words.length > 0 ? complexWordCount / words.length : 0,
      passiveVoiceRatio: sentences.length > 0 ? passiveCount / sentences.length : 0,
      questionCount,
      exclamationCount,
      formalLanguageIndicators: formalCount,
      technicalTermsCount: technicalCount
    };
  }

  static calculateScores(metrics: TextAnalysisMetrics): {
    languageComplexity: number;
    vocabularyRichness: number;
    rhetoricalElements: number;
    structuralClarity: number;
    overall: number;
  } {
    // Language Complexity (1-100)
    const complexityFactors = [
      Math.min(metrics.avgSentenceLength / 20 * 100, 100),
      Math.min(metrics.avgWordLength / 8 * 100, 100),
      metrics.complexWordsRatio * 100,
      metrics.passiveVoiceRatio * 100
    ];
    const languageComplexity = Math.round(
      complexityFactors.reduce((sum, factor) => sum + factor, 0) / complexityFactors.length
    );

    // Vocabulary Richness (1-100)
    const vocabularyRichness = Math.round(
      Math.min(metrics.uniqueWordsRatio * 150, 100)
    );

    // Rhetorical Elements (1-100)
    const rhetoricalScore = Math.min(
      (metrics.questionCount + metrics.exclamationCount + metrics.formalLanguageIndicators) / 
      Math.max(metrics.sentenceCount, 1) * 100, 100
    );
    const rhetoricalElements = Math.round(rhetoricalScore);

    // Structural Clarity (1-100)
    const idealSentenceLength = 15;
    const sentenceLengthScore = Math.max(0, 100 - Math.abs(metrics.avgSentenceLength - idealSentenceLength) * 5);
    const paragraphScore = metrics.paragraphCount > 0 ? Math.min(metrics.sentenceCount / metrics.paragraphCount * 10, 100) : 50;
    const structuralClarity = Math.round((sentenceLengthScore + paragraphScore) / 2);

    // Overall Score
    const overall = Math.round(
      (languageComplexity + vocabularyRichness + rhetoricalElements + structuralClarity) / 4
    );

    return {
      languageComplexity: Math.max(1, Math.min(100, languageComplexity)),
      vocabularyRichness: Math.max(1, Math.min(100, vocabularyRichness)),
      rhetoricalElements: Math.max(1, Math.min(100, rhetoricalElements)),
      structuralClarity: Math.max(1, Math.min(100, structuralClarity)),
      overall: Math.max(1, Math.min(100, overall))
    };
  }

  static async analyzeCurrentMembers(limit: number = 50): Promise<void> {
    console.log('Starting language analysis for current members...');
    
    try {
      // Hämta nuvarande aktiva ledamöter
      const { data: members, error: membersError } = await supabase
        .from('member_data')
        .select('member_id, first_name, last_name')
        .eq('is_active', true)
        .limit(limit);

      if (membersError) {
        console.error('Error fetching members:', membersError);
        return;
      }

      console.log(`Found ${members?.length || 0} active members to analyze`);

      for (const member of members || []) {
        await this.analyzeMemberLanguage(member.member_id, `${member.first_name} ${member.last_name}`);
        // Lägg till en kort paus för att inte överbelasta databasen
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('Language analysis completed for all members');
    } catch (error) {
      console.error('Error in analyzeCurrentMembers:', error);
    }
  }

  static async analyzeMemberLanguage(memberId: string, memberName: string): Promise<void> {
    try {
      console.log(`Analyzing language for member: ${memberName} (${memberId})`);

      // Hämta anföranden för ledamoten
      const { data: speeches, error: speechError } = await supabase
        .from('speech_data')
        .select('speech_id, anforandetext, rel_dok_titel, anforandedatum')
        .eq('intressent_id', memberId)
        .not('anforandetext', 'is', null)
        .order('anforandedatum', { ascending: false })
        .limit(20); // Begränsa till de senaste 20 anförandena

      if (speechError) {
        console.error('Error fetching speeches:', speechError);
      }

      // Analysera anföranden
      for (const speech of speeches || []) {
        if (speech.anforandetext && speech.anforandetext.trim().length > 100) {
          await this.saveAnalysis(
            memberId,
            memberName,
            'speech',
            speech.speech_id,
            speech.rel_dok_titel || 'Anförande',
            speech.anforandetext
          );
        }
      }

      // Hämta skriftliga frågor
      const { data: questions, error: questionError } = await supabase
        .from('document_data')
        .select('document_id, titel, datum, content_preview')
        .eq('intressent_id', memberId)
        .eq('typ', 'fr') // Skriftliga frågor
        .not('content_preview', 'is', null)
        .order('datum', { ascending: false })
        .limit(10); // Begränsa till de senaste 10 frågorna

      if (questionError) {
        console.error('Error fetching written questions:', questionError);
      }

      // Analysera skriftliga frågor
      for (const question of questions || []) {
        if (question.content_preview && question.content_preview.trim().length > 50) {
          await this.saveAnalysis(
            memberId,
            memberName,
            'written_question',
            question.document_id,
            question.titel || 'Skriftlig fråga',
            question.content_preview
          );
        }
      }

      console.log(`Completed analysis for ${memberName}`);
    } catch (error) {
      console.error(`Error analyzing member ${memberName}:`, error);
    }
  }

  static async saveAnalysis(
    memberId: string,
    memberName: string,
    documentType: 'speech' | 'written_question' | 'motion' | 'interpellation',
    documentId: string,
    documentTitle: string,
    text: string
  ): Promise<LanguageAnalysisResult | null> {
    try {
      const metrics = this.analyzeText(text);
      const scores = this.calculateScores(metrics);

      const analysisData = {
        member_id: memberId,
        member_name: memberName,
        document_type: documentType,
        document_id: documentId,
        document_title: documentTitle,
        overall_score: scores.overall,
        language_complexity_score: scores.languageComplexity,
        vocabulary_richness_score: scores.vocabularyRichness,
        rhetorical_elements_score: scores.rhetoricalElements,
        structural_clarity_score: scores.structuralClarity,
        word_count: metrics.wordCount,
        sentence_count: metrics.sentenceCount,
        paragraph_count: metrics.paragraphCount,
        avg_sentence_length: metrics.avgSentenceLength,
        avg_word_length: metrics.avgWordLength,
        unique_words_ratio: metrics.uniqueWordsRatio,
        complex_words_ratio: metrics.complexWordsRatio,
        passive_voice_ratio: metrics.passiveVoiceRatio,
        question_count: metrics.questionCount,
        exclamation_count: metrics.exclamationCount,
        formal_language_indicators: metrics.formalLanguageIndicators,
        technical_terms_count: metrics.technicalTermsCount,
        full_text: text.length > 10000 ? text.substring(0, 10000) + '...' : text
      };

      const { data, error } = await supabase
        .from('language_analysis')
        .upsert(analysisData, { 
          onConflict: 'document_id,document_type',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving language analysis:', error);
        return null;
      }

      return data as LanguageAnalysisResult;
    } catch (error) {
      console.error('Error in language analysis:', error);
      return null;
    }
  }

  static async getMemberLanguageSummary(memberId: string): Promise<MemberLanguageSummary | null> {
    try {
      const { data, error } = await supabase
        .from('language_analysis')
        .select('*')
        .eq('member_id', memberId)
        .in('document_type', ['speech', 'written_question']);

      if (error) {
        console.error('Error fetching member language summary:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const analyses = data as LanguageAnalysisResult[];
      const speeches = analyses.filter(a => a.document_type === 'speech');
      const questions = analyses.filter(a => a.document_type === 'written_question');

      const totalWords = analyses.reduce((sum, a) => sum + a.word_count, 0);
      const overallAverage = Math.round(
        analyses.reduce((sum, a) => sum + a.overall_score, 0) / analyses.length
      );
      const complexityAverage = Math.round(
        analyses.reduce((sum, a) => sum + a.language_complexity_score, 0) / analyses.length
      );
      const vocabularyAverage = Math.round(
        analyses.reduce((sum, a) => sum + a.vocabulary_richness_score, 0) / analyses.length
      );
      const rhetoricalAverage = Math.round(
        analyses.reduce((sum, a) => sum + a.rhetorical_elements_score, 0) / analyses.length
      );
      const clarityAverage = Math.round(
        analyses.reduce((sum, a) => sum + a.structural_clarity_score, 0) / analyses.length
      );

      const lastAnalysis = analyses.sort((a, b) => 
        new Date(b.analysis_date).getTime() - new Date(a.analysis_date).getTime()
      )[0].analysis_date;

      return {
        member_id: memberId,
        member_name: analyses[0].member_name,
        overall_average: overallAverage,
        speech_count: speeches.length,
        question_count: questions.length,
        total_words: totalWords,
        complexity_average: complexityAverage,
        vocabulary_average: vocabularyAverage,
        rhetorical_average: rhetoricalAverage,
        clarity_average: clarityAverage,
        last_analysis: lastAnalysis
      };
    } catch (error) {
      console.error('Error getting member language summary:', error);
      return null;
    }
  }

  static async getAnalysisByMember(memberId: string): Promise<LanguageAnalysisResult[]> {
    try {
      const { data, error } = await supabase
        .from('language_analysis')
        .select('*')
        .eq('member_id', memberId)
        .in('document_type', ['speech', 'written_question'])
        .order('analysis_date', { ascending: false });

      if (error) {
        console.error('Error fetching member analysis:', error);
        return [];
      }

      return (data || []) as LanguageAnalysisResult[];
    } catch (error) {
      console.error('Error fetching member analysis:', error);
      return [];
    }
  }

  static async getTopPerformers(
    scoreType: 'overall_score' | 'language_complexity_score' | 'vocabulary_richness_score' | 'rhetorical_elements_score' | 'structural_clarity_score' = 'overall_score',
    limit: number = 10
  ): Promise<LanguageAnalysisResult[]> {
    try {
      const { data, error } = await supabase
        .from('language_analysis')
        .select('*')
        .in('document_type', ['speech', 'written_question'])
        .order(scoreType, { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching top performers:', error);
        return [];
      }

      return (data || []) as LanguageAnalysisResult[];
    } catch (error) {
      console.error('Error fetching top performers:', error);
      return [];
    }
  }

  static getLanguageLevel(score: number): { level: string; description: string; color: string } {
    if (score >= 85) {
      return {
        level: 'Mycket hög',
        description: 'Exceptionell språklig kvalitet med sofistikerat ordförråd och komplex struktur',
        color: 'text-green-700 bg-green-50'
      };
    } else if (score >= 70) {
      return {
        level: 'Hög',
        description: 'Hög språklig kvalitet med varierat ordförråd och tydlig struktur',
        color: 'text-blue-700 bg-blue-50'
      };
    } else if (score >= 55) {
      return {
        level: 'Medel',
        description: 'Genomsnittlig språklig kvalitet med standardordförråd och struktur',
        color: 'text-yellow-700 bg-yellow-50'
      };
    } else if (score >= 40) {
      return {
        level: 'Låg',
        description: 'Grundläggande språklig kvalitet med enkelt ordförråd och struktur',
        color: 'text-orange-700 bg-orange-50'
      };
    } else {
      return {
        level: 'Mycket låg',
        description: 'Begränsad språklig kvalitet med mycket enkelt ordförråd och struktur',
        color: 'text-red-700 bg-red-50'
      };
    }
  }
}
