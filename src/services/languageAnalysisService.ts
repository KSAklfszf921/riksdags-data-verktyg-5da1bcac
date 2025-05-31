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

export interface BatchProgress {
  currentMember: string;
  completedCount: number;
  totalCount: number;
  successCount: number;
  errorCount: number;
  estimatedTimeLeft: string;
  errors: string[];
}

export interface DataValidationResult {
  totalMembers: number;
  membersWithSpeeches: number;
  membersWithQuestions: number;
  membersWithValidContent: number;
  avgSpeechLength: number;
  avgQuestionLength: number;
  emptyContentCount: number;
  shortContentCount: number;
  recommendations: string[];
}

export class LanguageAnalysisService {
  private static complexWords = new Set([
    'återgång', 'förutsättning', 'ansvarighet', 'genomförande', 'utveckling',
    'betydelse', 'förbättring', 'möjlighet', 'verkställande', 'rättsäkerhet',
    'sammanhang', 'förändring', 'kompetens', 'organisation', 'planering',
    'prioritering', 'konsekvens', 'förvaltning', 'hantering', 'utredning',
    'förfarande', 'verksamhet', 'beslutande', 'rättslig', 'förordning',
    'lagstiftning', 'parlamentarisk', 'demokratisk', 'representation'
  ]);

  private static formalIndicators = new Set([
    'därför', 'således', 'emellertid', 'dessutom', 'följaktligen',
    'med anledning av', 'beträffande', 'avseende', 'enligt', 'genom',
    'härigenom', 'jämlikt', 'oaktat', 'trots', 'utöver', 'sålunda',
    'därigenom', 'härmed', 'vidare', 'å ena sidan', 'å andra sidan'
  ]);

  private static technicalTerms = new Set([
    'proposition', 'betänkande', 'utskott', 'riksdag', 'motion',
    'interpellation', 'rättsfall', 'förordning', 'lagstiftning',
    'parlamentarisk', 'konstitutionell', 'juridisk', 'demokratisk',
    'kammare', 'plenum', 'votering', 'bordläggning', 'ärendets',
    'remiss', 'departement', 'myndighet', 'delegation'
  ]);

  static validateDataAvailability = async (): Promise<DataValidationResult> => {
    try {
      console.log('Starting data availability validation...');
      
      // Get active members
      const { data: members, error: membersError } = await supabase
        .from('member_data')
        .select('member_id, first_name, last_name')
        .eq('is_active', true);

      if (membersError) {
        throw new Error(`Error fetching members: ${membersError.message}`);
      }

      const totalMembers = members?.length || 0;
      let membersWithSpeeches = 0;
      let membersWithQuestions = 0;
      let membersWithValidContent = 0;
      let totalSpeechLength = 0;
      let totalQuestionLength = 0;
      let speechCount = 0;
      let questionCount = 0;
      let emptyContentCount = 0;
      let shortContentCount = 0;

      // Check each member's data
      for (const member of members || []) {
        let memberHasValidContent = false;

        // Check speeches
        const { data: speeches } = await supabase
          .from('speech_data')
          .select('anforandetext')
          .eq('intressent_id', member.member_id)
          .not('anforandetext', 'is', null)
          .limit(5);

        if (speeches && speeches.length > 0) {
          membersWithSpeeches++;
          for (const speech of speeches) {
            speechCount++;
            const textLength = speech.anforandetext?.trim().length || 0;
            totalSpeechLength += textLength;
            
            if (textLength === 0) {
              emptyContentCount++;
            } else if (textLength < 150) {
              shortContentCount++;
            } else {
              memberHasValidContent = true;
            }
          }
        }

        // Check written questions
        const { data: questions } = await supabase
          .from('document_data')
          .select('content_preview')
          .eq('intressent_id', member.member_id)
          .eq('typ', 'fr')
          .not('content_preview', 'is', null)
          .limit(5);

        if (questions && questions.length > 0) {
          membersWithQuestions++;
          for (const question of questions) {
            questionCount++;
            const textLength = question.content_preview?.trim().length || 0;
            totalQuestionLength += textLength;
            
            if (textLength === 0) {
              emptyContentCount++;
            } else if (textLength < 80) {
              shortContentCount++;
            } else {
              memberHasValidContent = true;
            }
          }
        }

        if (memberHasValidContent) {
          membersWithValidContent++;
        }
      }

      const avgSpeechLength = speechCount > 0 ? Math.round(totalSpeechLength / speechCount) : 0;
      const avgQuestionLength = questionCount > 0 ? Math.round(totalQuestionLength / questionCount) : 0;

      // Generate recommendations
      const recommendations: string[] = [];
      
      if (membersWithValidContent < totalMembers * 0.5) {
        recommendations.push('Över 50% av ledamöterna saknar analysbar text - överväg dataimport från externa källor');
      }
      
      if (emptyContentCount > totalMembers * 0.2) {
        recommendations.push('Många tomma textfält hittades - implementera datavalidering vid import');
      }
      
      if (avgSpeechLength < 300) {
        recommendations.push('Anföranden är generellt korta - justera minimikrav för analys');
      }
      
      if (avgQuestionLength < 150) {
        recommendations.push('Skriftliga frågor är generellt korta - överväg att inkludera motiveringstexter');
      }

      if (recommendations.length === 0) {
        recommendations.push('Datan verkar vara i bra skick för språkanalys');
      }

      console.log('Data validation completed');

      return {
        totalMembers,
        membersWithSpeeches,
        membersWithQuestions,
        membersWithValidContent,
        avgSpeechLength,
        avgQuestionLength,
        emptyContentCount,
        shortContentCount,
        recommendations
      };
    } catch (error) {
      console.error('Error validating data availability:', error);
      throw error;
    }
  };

  static enhancedTextExtraction = (rawText: string): string => {
    if (!rawText) return '';

    try {
      let cleanText = rawText;

      // Remove HTML tags more comprehensively
      cleanText = cleanText.replace(/<[^>]*>/g, ' ');
      
      // Remove XML/markup tags
      cleanText = cleanText.replace(/<\/?[^>]+(>|$)/g, ' ');
      
      // Remove URLs
      cleanText = cleanText.replace(/https?:\/\/[^\s]+/g, ' ');
      
      // Remove email addresses
      cleanText = cleanText.replace(/[^\s]+@[^\s]+\.[^\s]+/g, ' ');
      
      // Remove excessive whitespace and normalize
      cleanText = cleanText.replace(/\s+/g, ' ');
      
      // Remove special characters but keep Swedish characters
      cleanText = cleanText.replace(/[^\w\såäöÅÄÖ.,!?:;()-]/g, ' ');
      
      // Remove standalone numbers and short fragments
      cleanText = cleanText.replace(/\b\d+\b/g, ' ');
      cleanText = cleanText.replace(/\b\w{1,2}\b/g, ' ');
      
      // Final cleanup
      cleanText = cleanText.replace(/\s+/g, ' ').trim();
      
      return cleanText;
    } catch (error) {
      console.error('Error in enhanced text extraction:', error);
      return rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
  };

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

    try {
      // Enhanced text preprocessing
      const cleanText = this.enhancedTextExtraction(text);
      
      if (!cleanText || cleanText.length < 10) {
        throw new Error('Text too short after cleaning');
      }

      // Enhanced sentence detection
      const sentences = cleanText
        .split(/[.!?]+/)
        .filter(s => {
          const trimmed = s.trim();
          return trimmed.length > 8 && /[a-zåäöA-ZÅÄÖ]/.test(trimmed) && 
                 trimmed.split(/\s+/).length >= 3; // At least 3 words
        })
        .map(s => s.trim());
      
      // Enhanced paragraph detection
      const paragraphs = cleanText
        .split(/\n\s*\n|\.\s*\n/)
        .filter(p => {
          const trimmed = p.trim();
          return trimmed.length > 20 && trimmed.split(/\s+/).length >= 5; // At least 5 words
        });
      
      // Enhanced word extraction
      const words = cleanText
        .toLowerCase()
        .split(/\s+/)
        .filter(w => {
          const cleaned = w.replace(/[^a-zåäö]/g, '');
          return cleaned.length >= 3 && /[a-zåäö]{3,}/.test(cleaned);
        })
        .map(w => w.replace(/[^a-zåäö]/g, ''));
      
      if (words.length === 0) {
        throw new Error('No valid words found after filtering');
      }

      // Word analysis with better filtering
      const uniqueWords = new Set(words);
      const complexWordCount = words.filter(word => 
        this.complexWords.has(word) || (word.length > 12 && /[a-zåäö]{12,}/.test(word))
      ).length;
      
      // Enhanced passive voice detection for Swedish
      const passivePatterns = [
        /\b(blev|blivit|är|var|varit|kommer\s+att|har\s+\w+[td]s?)\b/gi,
        /\b\w+a[ds]\s+av\b/gi,
        /\b\w+[td]s?\s+(av|genom|med)\b/gi,
        /\b(utförs|genomförs|behandlas|diskuteras|föreslås)\b/gi
      ];
      
      const passiveCount = sentences.filter(sentence => 
        passivePatterns.some(pattern => {
          pattern.lastIndex = 0; // Reset regex
          return pattern.test(sentence);
        })
      ).length;
      
      // Enhanced punctuation analysis
      const questionCount = (cleanText.match(/\?/g) || []).length;
      const exclamationCount = (cleanText.match(/!/g) || []).length;
      
      // Enhanced formal language detection
      let formalCount = 0;
      const textLower = cleanText.toLowerCase();
      for (const indicator of this.formalIndicators) {
        const regex = new RegExp(`\\b${indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = textLower.match(regex) || [];
        formalCount += matches.length;
      }
      
      // Enhanced technical terms detection
      const technicalCount = words.filter(word => 
        this.technicalTerms.has(word) || 
        (/^(riks|parlaments|demokrati|konstitution)/.test(word) && word.length > 8)
      ).length;
      
      return {
        wordCount: words.length,
        sentenceCount: Math.max(sentences.length, 1),
        paragraphCount: Math.max(paragraphs.length, 1),
        avgSentenceLength: words.length / Math.max(sentences.length, 1),
        avgWordLength: words.join('').length / words.length,
        uniqueWordsRatio: uniqueWords.size / words.length,
        complexWordsRatio: complexWordCount / words.length,
        passiveVoiceRatio: passiveCount / Math.max(sentences.length, 1),
        questionCount,
        exclamationCount,
        formalLanguageIndicators: formalCount,
        technicalTermsCount: technicalCount
      };
    } catch (error) {
      console.error('Error analyzing text:', error);
      // Return safe fallback metrics
      return {
        wordCount: Math.max(text.split(/\s+/).length, 1),
        sentenceCount: 1,
        paragraphCount: 1,
        avgSentenceLength: 10,
        avgWordLength: 5,
        uniqueWordsRatio: 0.6,
        complexWordsRatio: 0.1,
        passiveVoiceRatio: 0.1,
        questionCount: 0,
        exclamationCount: 0,
        formalLanguageIndicators: 0,
        technicalTermsCount: 0
      };
    }
  }

  static calculateScores(metrics: TextAnalysisMetrics): {
    languageComplexity: number;
    vocabularyRichness: number;
    rhetoricalElements: number;
    structuralClarity: number;
    overall: number;
  } {
    try {
      // Language Complexity (1-100) - Balanced scoring
      const sentenceLengthScore = Math.min(Math.max(metrics.avgSentenceLength / 25 * 100, 10), 90);
      const wordLengthScore = Math.min(Math.max(metrics.avgWordLength / 7 * 100, 10), 90);
      const complexityScore = Math.min(metrics.complexWordsRatio * 200, 80);
      const passiveScore = Math.min(metrics.passiveVoiceRatio * 150, 70);
      
      const languageComplexity = Math.round(
        (sentenceLengthScore * 0.3 + wordLengthScore * 0.2 + complexityScore * 0.3 + passiveScore * 0.2)
      );

      // Vocabulary Richness (1-100) - Enhanced calculation
      const uniquenessBonus = metrics.uniqueWordsRatio > 0.7 ? 20 : 0;
      const vocabularyRichness = Math.round(
        Math.min(metrics.uniqueWordsRatio * 120 + uniquenessBonus, 100)
      );

      // Rhetorical Elements (1-100) - Balanced approach
      const questionRatio = metrics.questionCount / Math.max(metrics.sentenceCount, 1);
      const exclamationRatio = metrics.exclamationCount / Math.max(metrics.sentenceCount, 1);
      const formalRatio = metrics.formalLanguageIndicators / Math.max(metrics.wordCount, 1);
      const technicalRatio = metrics.technicalTermsCount / Math.max(metrics.wordCount, 1);
      
      const rhetoricalScore = (
        Math.min(questionRatio * 200, 25) +
        Math.min(exclamationRatio * 150, 20) +
        Math.min(formalRatio * 500, 30) +
        Math.min(technicalRatio * 300, 25)
      );
      const rhetoricalElements = Math.round(Math.max(Math.min(rhetoricalScore, 100), 10));

      // Structural Clarity (1-100) - Improved calculation
      const idealSentenceLength = 18;
      const sentenceLengthScore2 = Math.max(0, 100 - Math.abs(metrics.avgSentenceLength - idealSentenceLength) * 3);
      const paragraphBalance = Math.min(metrics.sentenceCount / Math.max(metrics.paragraphCount, 1) * 8, 100);
      const structuralClarity = Math.round((sentenceLengthScore2 * 0.6 + paragraphBalance * 0.4));

      // Overall Score - Weighted average
      const overall = Math.round(
        (languageComplexity * 0.25 + vocabularyRichness * 0.3 + rhetoricalElements * 0.2 + structuralClarity * 0.25)
      );

      return {
        languageComplexity: Math.max(1, Math.min(100, languageComplexity)),
        vocabularyRichness: Math.max(1, Math.min(100, vocabularyRichness)),
        rhetoricalElements: Math.max(1, Math.min(100, rhetoricalElements)),
        structuralClarity: Math.max(1, Math.min(100, structuralClarity)),
        overall: Math.max(1, Math.min(100, overall))
      };
    } catch (error) {
      console.error('Error calculating scores:', error);
      return {
        languageComplexity: 50,
        vocabularyRichness: 50,
        rhetoricalElements: 50,
        structuralClarity: 50,
        overall: 50
      };
    }
  }

  static async batchAnalyzeMembers(
    onProgress?: (progress: BatchProgress) => void,
    limit: number = 100
  ): Promise<{ success: number; errors: number; details: string[] }> {
    const startTime = new Date();
    let successCount = 0;
    let errorCount = 0;
    const errorDetails: string[] = [];

    try {
      console.log('Starting enhanced batch language analysis...');
      
      // First validate data availability
      const validation = await this.validateDataAvailability();
      console.log('Data validation results:', validation);
      
      if (validation.membersWithValidContent < 10) {
        throw new Error(`Otillräckligt med analysbar data: endast ${validation.membersWithValidContent} ledamöter har giltig text`);
      }

      // Get active members with priority for those with more content
      const { data: members, error: membersError } = await supabase
        .from('member_data')
        .select('member_id, first_name, last_name')
        .eq('is_active', true)
        .limit(limit);

      if (membersError) {
        throw new Error(`Fel vid hämtning av ledamöter: ${membersError.message}`);
      }

      if (!members || members.length === 0) {
        throw new Error('Inga aktiva ledamöter hittades');
      }

      console.log(`Startar analys för ${members.length} aktiva ledamöter`);

      for (let i = 0; i < members.length; i++) {
        const member = members[i];
        const memberName = `${member.first_name} ${member.last_name}`;
        
        // Enhanced progress reporting
        if (onProgress) {
          const elapsed = new Date().getTime() - startTime.getTime();
          const avgTimePerMember = elapsed / Math.max(i, 1);
          const remainingMembers = members.length - i;
          const estimatedRemaining = remainingMembers * avgTimePerMember;
          
          const minutes = Math.floor(estimatedRemaining / 60000);
          const seconds = Math.floor((estimatedRemaining % 60000) / 1000);
          
          onProgress({
            currentMember: `${memberName} (${i + 1}/${members.length})`,
            completedCount: i,
            totalCount: members.length,
            successCount,
            errorCount,
            estimatedTimeLeft: `${minutes}m ${seconds}s`,
            errors: errorDetails.slice(-5)
          });
        }
        
        try {
          const analyzedCount = await this.analyzeMemberLanguageEnhanced(member.member_id, memberName);
          if (analyzedCount > 0) {
            successCount++;
            console.log(`✓ Slutförd analys för ${memberName}: ${analyzedCount} dokument (${i + 1}/${members.length})`);
          } else {
            errorCount++;
            errorDetails.push(`${memberName}: Ingen analysbar text hittades`);
            console.warn(`⚠ Inga dokument analyserade för ${memberName}`);
          }
          
          // Adaptive pause based on system load
          await new Promise(resolve => setTimeout(resolve, 150));
          
        } catch (memberError: any) {
          errorCount++;
          const errorMsg = `${memberName}: ${memberError.message}`;
          errorDetails.push(errorMsg);
          console.error(`✗ Fel vid analys av ${memberName}:`, memberError);
        }
      }

      // Final progress update
      if (onProgress) {
        onProgress({
          currentMember: 'Analys slutförd',
          completedCount: members.length,
          totalCount: members.length,
          successCount,
          errorCount,
          estimatedTimeLeft: '',
          errors: errorDetails.slice(-10)
        });
      }

      console.log(`Enhanced batch-analys slutförd: ${successCount} lyckades, ${errorCount} fel`);
      
      return {
        success: successCount,
        errors: errorCount,
        details: errorDetails
      };

    } catch (error: any) {
      console.error('Kritiskt fel i enhanced batch-analys:', error);
      errorDetails.push(`Kritiskt fel: ${error.message}`);
      
      if (onProgress) {
        onProgress({
          currentMember: 'Fel uppstod',
          completedCount: 0,
          totalCount: 0,
          successCount,
          errorCount: errorCount + 1,
          estimatedTimeLeft: '',
          errors: errorDetails
        });
      }
      
      return {
        success: successCount,
        errors: errorCount + 1,
        details: errorDetails
      };
    }
  }

  static async analyzeMemberLanguageEnhanced(memberId: string, memberName: string): Promise<number> {
    let analyzedCount = 0;
    
    try {
      console.log(`Enhanced språkanalys för ${memberName} (${memberId})`);

      // Check for recent analyses
      const { data: existingAnalyses } = await supabase
        .from('language_analysis')
        .select('analysis_date')
        .eq('member_id', memberId)
        .gte('analysis_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (existingAnalyses && existingAnalyses.length > 0) {
        console.log(`Hoppar över ${memberName} - har redan recent analys`);
        return 0;
      }

      // Enhanced speech fetching with better filtering
      const { data: speeches, error: speechError } = await supabase
        .from('speech_data')
        .select('speech_id, anforandetext, rel_dok_titel, anforandedatum')
        .eq('intressent_id', memberId)
        .not('anforandetext', 'is', null)
        .neq('anforandetext', '')
        .order('anforandedatum', { ascending: false })
        .limit(20); // Increased limit for better selection

      if (speechError) {
        console.error('Fel vid hämtning av anföranden:', speechError);
      }

      // Enhanced speech analysis with better content validation
      const validSpeeches = (speeches || []).filter(speech => {
        if (!speech.anforandetext) return false;
        const cleanText = this.enhancedTextExtraction(speech.anforandetext);
        return cleanText.length > 200 && cleanText.split(/\s+/).length > 30;
      });

      console.log(`Hittade ${validSpeeches.length} giltiga anföranden för ${memberName}`);

      for (const speech of validSpeeches.slice(0, 15)) {
        try {
          await this.saveAnalysis(
            memberId,
            memberName,
            'speech',
            speech.speech_id,
            speech.rel_dok_titel || 'Anförande',
            speech.anforandetext
          );
          analyzedCount++;
        } catch (error) {
          console.error(`Fel vid analys av anförande för ${memberName}:`, error);
        }
      }

      // Enhanced written questions fetching
      const { data: questions, error: questionError } = await supabase
        .from('document_data')
        .select('document_id, titel, datum, content_preview')
        .eq('intressent_id', memberId)
        .eq('typ', 'fr')
        .not('content_preview', 'is', null)
        .neq('content_preview', '')
        .order('datum', { ascending: false })
        .limit(15); // Increased limit

      if (questionError) {
        console.error('Fel vid hämtning av skriftliga frågor:', questionError);
      }

      // Enhanced question analysis with better content validation
      const validQuestions = (questions || []).filter(question => {
        if (!question.content_preview) return false;
        const cleanText = this.enhancedTextExtraction(question.content_preview);
        return cleanText.length > 100 && cleanText.split(/\s+/).length > 15;
      });

      console.log(`Hittade ${validQuestions.length} giltiga frågor för ${memberName}`);

      for (const question of validQuestions.slice(0, 10)) {
        try {
          await this.saveAnalysis(
            memberId,
            memberName,
            'written_question',
            question.document_id,
            question.titel || 'Skriftlig fråga',
            question.content_preview
          );
          analyzedCount++;
        } catch (error) {
          console.error(`Fel vid analys av skriftlig fråga för ${memberName}:`, error);
        }
      }

      if (analyzedCount === 0) {
        throw new Error(`Ingen analysbar text hittades (kontrollerade ${validSpeeches.length} anföranden och ${validQuestions.length} frågor)`);
      }

      console.log(`Slutförde enhanced analys för ${memberName}: ${analyzedCount} dokument`);
      return analyzedCount;
      
    } catch (error: any) {
      console.error(`Enhanced analys misslyckades för ${memberName}:`, error);
      throw new Error(`Analys misslyckades: ${error.message}`);
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
      // Enhanced text preprocessing before analysis
      const cleanedText = this.enhancedTextExtraction(text);
      
      if (!cleanedText || cleanedText.trim().length < 50) {
        throw new Error(`Text för kort för analys: ${cleanedText.length} tecken`);
      }

      const wordCount = cleanedText.split(/\s+/).length;
      if (wordCount < 10) {
        throw new Error(`För få ord för analys: ${wordCount} ord`);
      }

      const metrics = this.analyzeText(cleanedText);
      
      // Validate metrics before scoring
      if (metrics.wordCount === 0) {
        throw new Error('Inga giltiga ord hittades efter textanalys');
      }

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
        paragraph_count: metrics.paragraphCount, // Fixed: use paragraphCount instead of paragraph_count
        avg_sentence_length: Math.round(metrics.avgSentenceLength * 10) / 10,
        avg_word_length: Math.round(metrics.avgWordLength * 10) / 10,
        unique_words_ratio: Math.round(metrics.uniqueWordsRatio * 1000) / 1000,
        complex_words_ratio: Math.round(metrics.complexWordsRatio * 1000) / 1000,
        passive_voice_ratio: Math.round(metrics.passiveVoiceRatio * 1000) / 1000,
        question_count: metrics.questionCount,
        exclamation_count: metrics.exclamationCount,
        formal_language_indicators: metrics.formalLanguageIndicators,
        technical_terms_count: metrics.technicalTermsCount,
        full_text: cleanedText.length > 10000 ? cleanedText.substring(0, 10000) + '...' : cleanedText,
        analysis_version: '2.1' // Updated version to reflect enhancements
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
        console.error('Fel vid sparande av språkanalys:', error);
        throw new Error(`Databas fel: ${error.message}`);
      }

      return data as LanguageAnalysisResult;
    } catch (error: any) {
      console.error('Fel i saveAnalysis:', error);
      throw error;
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

  static async getAnalysisStatistics(): Promise<{
    totalAnalyses: number;
    totalMembers: number;
    averageScore: number;
    lastWeekAnalyses: number;
  }> {
    try {
      const [totalResult, membersResult, avgResult, weekResult] = await Promise.all([
        supabase
          .from('language_analysis')
          .select('id', { count: 'exact' }),
        supabase
          .from('language_analysis')
          .select('member_id')
          .not('member_id', 'is', null),
        supabase
          .from('language_analysis')
          .select('overall_score'),
        supabase
          .from('language_analysis')
          .select('id', { count: 'exact' })
          .gte('analysis_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      const totalAnalyses = totalResult.count || 0;
      const uniqueMembers = new Set(membersResult.data?.map(d => d.member_id) || []).size;
      const avgScore = avgResult.data?.length ? 
        Math.round(avgResult.data.reduce((sum, d) => sum + d.overall_score, 0) / avgResult.data.length) : 0;
      const lastWeekAnalyses = weekResult.count || 0;

      return {
        totalAnalyses,
        totalMembers: uniqueMembers,
        averageScore: avgScore,
        lastWeekAnalyses
      };
    } catch (error) {
      console.error('Error fetching analysis statistics:', error);
      return {
        totalAnalyses: 0,
        totalMembers: 0,
        averageScore: 0,
        lastWeekAnalyses: 0
      };
    }
  }
}
