import { fetchDocumentText, fetchSpeechText, fetchMemberContentForAnalysis } from './riksdagApi';

export interface CachedDocument {
  id: string;
  text: string;
  fetchedAt: Date;
  type: 'speech' | 'document';
  extractionMethod: string;
}

export interface EnhancedFetchProgress {
  currentItem: string;
  speechesProcessed: number;
  documentsProcessed: number;
  errors: string[];
  currentStep: string;
  details: string[];
  extractionMethods: string[];
}

export interface MemberContentWithDetails {
  speeches: Array<{ id: string; text: string; title: string; date: string }>;
  documents: Array<{ id: string; text: string; title: string; date: string; type: string }>;
  extractionDetails: {
    speechesAttempted: number;
    documentsAttempted: number;
    extractionMethods: string[];
    failedExtractions: Array<{ id: string; reason: string }>;
  };
}

class EnhancedDocumentTextFetcher {
  private cache = new Map<string, CachedDocument>();
  private readonly cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  private isCacheValid(cached: CachedDocument): boolean {
    const now = new Date();
    return (now.getTime() - cached.fetchedAt.getTime()) < this.cacheExpiry;
  }

  // Simplified text cleaning optimized for batch processing
  private cleanText(text: string): string {
    if (!text) return '';
    
    return text
      // Remove HTML/XML tags
      .replace(/<[^>]*>/g, ' ')
      .replace(/&[a-zA-Z0-9#]+;/g, ' ')
      .replace(/&nbsp;/g, ' ')
      // Remove URLs
      .replace(/https?:\/\/[^\s]+/g, ' ')
      .replace(/www\.[^\s]+/g, ' ')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .replace(/\t/g, ' ')
      .replace(/\n+/g, ' ')
      // Keep Swedish characters and basic punctuation
      .replace(/[^\w\såäöÅÄÖ.,!?;:()\-]/g, ' ')
      // Clean up multiple spaces
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  // Simplified text validation for batch processing
  private isValidText(text: string, minLength: number = 50): boolean {
    if (!text || typeof text !== 'string') {
      return false;
    }
    
    const cleaned = this.cleanText(text);
    if (cleaned.length < minLength) {
      return false;
    }
    
    // Simple word count check - must have at least 8 meaningful words
    const words = cleaned.split(/\s+/).filter(word => 
      word.length > 2 && /[a-zA-ZåäöÅÄÖ]/.test(word)
    );
    
    return words.length >= 8;
  }

  // Simplified text extraction with 2 robust methods
  private async extractTextWithSimplifiedFallback(documentId: string): Promise<{ text: string | null; method: string; attempts: string[] }> {
    const attempts: string[] = [];
    
    // Method 1: Direct text endpoint (most reliable)
    try {
      attempts.push('direct-text-api');
      const response = await fetch(`https://data.riksdagen.se/dokument/${documentId}.txt`, {
        headers: { 'Accept': 'text/plain' }
      });
      if (response.ok) {
        const text = await response.text();
        if (text && this.isValidText(text)) {
          return {
            text: this.cleanText(text),
            method: 'direct-text-api',
            attempts
          };
        }
      }
    } catch (error) {
      console.warn(`Direct text API failed for ${documentId}:`, error instanceof Error ? error.message : error);
    }

    // Method 2: HTML endpoint with simple parsing
    try {
      attempts.push('html-simple-parsing');
      const response = await fetch(`https://data.riksdagen.se/dokument/${documentId}.html`);
      if (response.ok) {
        const html = await response.text();
        // Simple HTML to text conversion
        const textContent = html
          .replace(/<script[^>]*>.*?<\/script>/gis, '')
          .replace(/<style[^>]*>.*?<\/style>/gis, '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (textContent && this.isValidText(textContent)) {
          return {
            text: this.cleanText(textContent),
            method: 'html-simple-parsing',
            attempts
          };
        }
      }
    } catch (error) {
      console.warn(`HTML parsing failed for ${documentId}:`, error instanceof Error ? error.message : error);
    }

    return {
      text: null,
      method: 'none',
      attempts
    };
  }

  async fetchDocumentTextWithCache(
    documentId: string, 
    documentType?: string
  ): Promise<{ text: string | null; method: string; attempts: string[] }> {
    const cacheKey = `doc_${documentId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      return {
        text: cached.text,
        method: cached.extractionMethod,
        attempts: ['cache']
      };
    }
    
    const result = await this.extractTextWithSimplifiedFallback(documentId);
    
    if (result.text) {
      this.cache.set(cacheKey, {
        id: documentId,
        text: result.text,
        fetchedAt: new Date(),
        type: 'document',
        extractionMethod: result.method
      });
    }
    
    return result;
  }

  async fetchSpeechTextWithCache(speechId: string): Promise<{ text: string | null; method: string; attempts: string[] }> {
    const cacheKey = `speech_${speechId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      return {
        text: cached.text,
        method: cached.extractionMethod,
        attempts: ['cache']
      };
    }
    
    try {
      const text = await fetchSpeechText(speechId);
      
      if (text && this.isValidText(text)) {
        const cleanedText = this.cleanText(text);
        this.cache.set(cacheKey, {
          id: speechId,
          text: cleanedText,
          fetchedAt: new Date(),
          type: 'speech',
          extractionMethod: 'riksdag-api'
        });
        return {
          text: cleanedText,
          method: 'riksdag-api',
          attempts: ['riksdag-api']
        };
      }
    } catch (error) {
      console.error(`Speech text extraction failed for ${speechId}:`, error);
    }
    
    return {
      text: null,
      method: 'none',
      attempts: ['riksdag-api']
    };
  }

  // Optimized member content fetching for batch processing
  async fetchMemberContentWithDetails(
    memberId: string,
    memberName: string,
    onProgress?: (progress: EnhancedFetchProgress) => void
  ): Promise<MemberContentWithDetails> {
    const extractionDetails = {
      speechesAttempted: 0,
      documentsAttempted: 0,
      extractionMethods: [] as string[],
      failedExtractions: [] as Array<{ id: string; reason: string }>
    };

    try {
      // Step 1: Fetch content from Riksdag API
      if (onProgress) {
        onProgress({
          currentItem: `Hämtar innehåll för ${memberName}`,
          speechesProcessed: 0,
          documentsProcessed: 0,
          errors: [],
          currentStep: 'Hämtar innehåll från Riksdagen API',
          details: ['Begär senaste anföranden och dokument'],
          extractionMethods: []
        });
      }

      const content = await fetchMemberContentForAnalysis(memberId, 15); // Reduced from 25
      
      if (onProgress) {
        onProgress({
          currentItem: `${content.speeches.length} anföranden, ${content.documents.length} dokument`,
          speechesProcessed: 0,
          documentsProcessed: 0,
          errors: [],
          currentStep: 'Startar textvalidering och extraktion',
          details: [`${content.speeches.length} anföranden hittade`, `${content.documents.length} dokument hittade`],
          extractionMethods: []
        });
      }

      // Step 2: Process speeches (already have text, just validate)
      const validSpeeches = content.speeches
        .filter(speech => {
          extractionDetails.speechesAttempted++;
          const isValid = this.isValidText(speech.text, 50); // Lower threshold for speeches
          if (!isValid) {
            extractionDetails.failedExtractions.push({
              id: speech.id,
              reason: 'Speech text too short or invalid'
            });
          }
          return isValid;
        })
        .map(speech => ({
          ...speech,
          text: this.cleanText(speech.text)
        }))
        .slice(0, 8); // Reduced from 12

      if (onProgress) {
        onProgress({
          currentItem: `${validSpeeches.length} giltiga anföranden`,
          speechesProcessed: validSpeeches.length,
          documentsProcessed: 0,
          errors: [],
          currentStep: 'Dokumenttextextraktion',
          details: [`${validSpeeches.length}/${extractionDetails.speechesAttempted} anföranden godkända`],
          extractionMethods: extractionDetails.extractionMethods
        });
      }

      // Step 3: Process documents with simplified extraction
      const validDocuments = [];
      const maxDocs = Math.min(content.documents.length, 8); // Reduced from 12
      
      for (let i = 0; i < maxDocs; i++) {
        const doc = content.documents[i];
        extractionDetails.documentsAttempted++;
        
        if (onProgress) {
          onProgress({
            currentItem: `Extraherar: ${doc.title.substring(0, 40)}...`,
            speechesProcessed: validSpeeches.length,
            documentsProcessed: validDocuments.length,
            errors: [],
            currentStep: `Bearbetar dokument ${i + 1}/${maxDocs}`,
            details: [`Testar textextraktion för ${doc.title.substring(0, 30)}...`],
            extractionMethods: extractionDetails.extractionMethods
          });
        }

        const extractionResult = await this.extractTextWithSimplifiedFallback(doc.id);
        
        if (extractionResult.text && this.isValidText(extractionResult.text, 80)) {
          validDocuments.push({
            ...doc,
            text: extractionResult.text
          });
          
          // Track successful extraction method
          if (!extractionDetails.extractionMethods.includes(extractionResult.method)) {
            extractionDetails.extractionMethods.push(extractionResult.method);
          }
          
          console.log(`✓ Extraction success for ${doc.id} using ${extractionResult.method}`);
        } else {
          extractionDetails.failedExtractions.push({
            id: doc.id,
            reason: `Extraction failed: attempted ${extractionResult.attempts.join(', ')}`
          });
          console.warn(`✗ Extraction failed for ${doc.id}: attempted ${extractionResult.attempts.join(', ')}`);
        }

        // Progress update
        if (onProgress) {
          onProgress({
            currentItem: `${validDocuments.length} dokument extraherade`,
            speechesProcessed: validSpeeches.length,
            documentsProcessed: validDocuments.length,
            errors: [],
            currentStep: `Dokument ${i + 1}/${maxDocs} slutfört`,
            details: [
              `Lyckat: ${validDocuments.length}`,
              `Misslyckad: ${extractionDetails.failedExtractions.length}`,
              `Metoder: ${extractionDetails.extractionMethods.join(', ')}`
            ],
            extractionMethods: extractionDetails.extractionMethods
          });
        }

        // Shorter pause between extractions for batch processing
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Step 4: Cache results
      validSpeeches.forEach(speech => {
        this.cache.set(`speech_${speech.id}`, {
          id: speech.id,
          text: speech.text,
          fetchedAt: new Date(),
          type: 'speech',
          extractionMethod: 'riksdag-api'
        });
      });

      validDocuments.forEach(doc => {
        this.cache.set(`doc_${doc.id}`, {
          id: doc.id,
          text: doc.text,
          fetchedAt: new Date(),
          type: 'document',
          extractionMethod: 'simplified-extraction'
        });
      });

      if (onProgress) {
        const totalTexts = validSpeeches.length + validDocuments.length;
        const successRate = extractionDetails.speechesAttempted + extractionDetails.documentsAttempted > 0 
          ? Math.round((totalTexts / (extractionDetails.speechesAttempted + extractionDetails.documentsAttempted)) * 100)
          : 0;

        onProgress({
          currentItem: `Slutförd: ${totalTexts} texter`,
          speechesProcessed: validSpeeches.length,
          documentsProcessed: validDocuments.length,
          errors: [],
          currentStep: 'Textextraktion slutförd',
          details: [
            `Totalt: ${totalTexts} texter`,
            `Framgång: ${successRate}%`,
            `Metoder: ${extractionDetails.extractionMethods.join(', ')}`
          ],
          extractionMethods: extractionDetails.extractionMethods
        });
      }

      return {
        speeches: validSpeeches,
        documents: validDocuments,
        extractionDetails
      };
    } catch (error) {
      console.error('Error in fetchMemberContentWithDetails:', error);
      
      if (onProgress) {
        onProgress({
          currentItem: `Fel vid bearbetning av ${memberName}`,
          speechesProcessed: 0,
          documentsProcessed: 0,
          errors: [error instanceof Error ? error.message : 'Okänt fel'],
          currentStep: 'Fel uppstod',
          details: [`Fel: ${error instanceof Error ? error.message : 'Okänt fel'}`],
          extractionMethods: extractionDetails.extractionMethods
        });
      }
      
      return { 
        speeches: [], 
        documents: [], 
        extractionDetails 
      };
    }
  }

  clearCache(): void {
    this.cache.clear();
    console.log('Enhanced document text cache cleared');
  }

  getCacheStats(): { size: number; oldestEntry: Date | null; methodStats: Record<string, number> } {
    const entries = Array.from(this.cache.values());
    const oldestEntry = entries.length > 0 
      ? entries.reduce((oldest, current) => 
          current.fetchedAt < oldest.fetchedAt ? current : oldest
        ).fetchedAt
      : null;
    
    // Calculate method statistics
    const methodStats = entries.reduce((stats, entry) => {
      stats[entry.extractionMethod] = (stats[entry.extractionMethod] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);
    
    return {
      size: this.cache.size,
      oldestEntry,
      methodStats
    };
  }
}

// Export singleton instance
export const enhancedDocumentTextFetcher = new EnhancedDocumentTextFetcher();
