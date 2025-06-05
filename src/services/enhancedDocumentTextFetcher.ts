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

  // Optimized text cleaning for Swedish parliamentary content
  private cleanText(text: string): string {
    if (!text) return '';
    
    return text
      // Remove HTML/XML tags and entities
      .replace(/<[^>]*>/g, ' ')
      .replace(/&[a-zA-Z0-9#]+;/g, ' ')
      .replace(/&nbsp;/g, ' ')
      // Remove URLs and references
      .replace(/https?:\/\/[^\s]+/g, ' ')
      .replace(/www\.[^\s]+/g, ' ')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .replace(/\t/g, ' ')
      .replace(/\n+/g, ' ')
      // Keep Swedish characters and punctuation
      .replace(/[^\w\såäöÅÄÖ.,!?;:()\-"']/g, ' ')
      // Clean up multiple spaces
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  // Enhanced text validation for Swedish content
  private isValidText(text: string, minLength: number = 100): boolean {
    if (!text || typeof text !== 'string') {
      return false;
    }
    
    const cleaned = this.cleanText(text);
    if (cleaned.length < minLength) {
      return false;
    }
    
    // Check for meaningful Swedish content
    const words = cleaned.split(/\s+/).filter(word => 
      word.length > 2 && /[a-zA-ZåäöÅÄÖ]/.test(word)
    );
    
    // Must have at least 15 meaningful words for documents, 10 for speeches
    const minWords = minLength > 50 ? 15 : 10;
    return words.length >= minWords;
  }

  // Robust text extraction with enhanced error handling
  private async extractTextWithRobustFallback(documentId: string): Promise<{ text: string | null; method: string; attempts: string[] }> {
    const attempts: string[] = [];
    
    // Method 1: Direct text API (most reliable for Swedish content)
    try {
      attempts.push('direct-text-api');
      console.log(`Attempting direct text API for ${documentId}...`);
      
      // Use AbortController for timeout instead of timeout option
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`https://data.riksdagen.se/dokument/${documentId}.txt`, {
        headers: { 'Accept': 'text/plain; charset=utf-8' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const text = await response.text();
        if (text && this.isValidText(text, 100)) {
          console.log(`✅ Direct text API success for ${documentId}`);
          return {
            text: this.cleanText(text),
            method: 'direct-text-api',
            attempts
          };
        } else {
          console.warn(`Direct text API returned invalid content for ${documentId}`);
        }
      } else {
        console.warn(`Direct text API HTTP error ${response.status} for ${documentId}`);
      }
    } catch (error) {
      console.warn(`Direct text API failed for ${documentId}:`, error instanceof Error ? error.message : error);
    }

    // Method 2: Enhanced HTML parsing optimized for Riksdag content
    try {
      attempts.push('enhanced-html-parsing');
      console.log(`Attempting enhanced HTML parsing for ${documentId}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`https://data.riksdagen.se/dokument/${documentId}.html`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const html = await response.text();
        
        // Enhanced HTML to text conversion for Swedish parliamentary documents
        const textContent = html
          // Remove scripts, styles, and navigation
          .replace(/<script[^>]*>.*?<\/script>/gis, '')
          .replace(/<style[^>]*>.*?<\/style>/gis, '')
          .replace(/<nav[^>]*>.*?<\/nav>/gis, '')
          .replace(/<header[^>]*>.*?<\/header>/gis, '')
          .replace(/<footer[^>]*>.*?<\/footer>/gis, '')
          // Extract main content areas common in Riksdag documents
          .replace(/<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/gis, '$1')
          .replace(/<div[^>]*class="[^"]*text[^"]*"[^>]*>(.*?)<\/div>/gis, '$1')
          .replace(/<p[^>]*>(.*?)<\/p>/gis, '$1\n')
          // Remove all remaining HTML tags
          .replace(/<[^>]*>/g, ' ')
          // Clean up entities and normalize
          .replace(/&[a-zA-Z0-9#]+;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (textContent && this.isValidText(textContent, 100)) {
          console.log(`✅ Enhanced HTML parsing success for ${documentId}`);
          return {
            text: this.cleanText(textContent),
            method: 'enhanced-html-parsing',
            attempts
          };
        } else {
          console.warn(`Enhanced HTML parsing returned invalid content for ${documentId}`);
        }
      } else {
        console.warn(`Enhanced HTML parsing HTTP error ${response.status} for ${documentId}`);
      }
    } catch (error) {
      console.warn(`Enhanced HTML parsing failed for ${documentId}:`, error instanceof Error ? error.message : error);
    }

    console.error(`❌ All extraction methods failed for ${documentId}`);
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
    
    const result = await this.extractTextWithRobustFallback(documentId);
    
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
      console.log(`Fetching speech text for ${speechId}...`);
      const text = await fetchSpeechText(speechId);
      
      if (text && this.isValidText(text, 50)) { // Lower threshold for speeches
        const cleanedText = this.cleanText(text);
        this.cache.set(cacheKey, {
          id: speechId,
          text: cleanedText,
          fetchedAt: new Date(),
          type: 'speech',
          extractionMethod: 'riksdag-api'
        });
        console.log(`✅ Speech text fetched successfully for ${speechId}`);
        return {
          text: cleanedText,
          method: 'riksdag-api',
          attempts: ['riksdag-api']
        };
      } else {
        console.warn(`Invalid speech text returned for ${speechId}`);
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

  // Enhanced member content fetching with better error handling
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
      console.log(`=== ENHANCED CONTENT FETCHING FOR ${memberName} ===`);
      
      // Step 1: Fetch content from Riksdag API
      if (onProgress) {
        onProgress({
          currentItem: `Fetching content for ${memberName}`,
          speechesProcessed: 0,
          documentsProcessed: 0,
          errors: [],
          currentStep: 'Fetching content from enhanced Riksdag API',
          details: ['Requesting latest speeches and documents'],
          extractionMethods: []
        });
      }

      const content = await fetchMemberContentForAnalysis(memberId, 20); // Increased from 15
      
      console.log(`Raw content fetched for ${memberName}:`, {
        speeches: content.speeches.length,
        documents: content.documents.length
      });

      if (onProgress) {
        onProgress({
          currentItem: `${content.speeches.length} speeches, ${content.documents.length} documents`,
          speechesProcessed: 0,
          documentsProcessed: 0,
          errors: [],
          currentStep: 'Starting enhanced text validation and extraction',
          details: [`${content.speeches.length} speeches found`, `${content.documents.length} documents found`],
          extractionMethods: []
        });
      }

      // Step 2: Process speeches (already have text, just validate and clean)
      const validSpeeches = content.speeches
        .filter(speech => {
          extractionDetails.speechesAttempted++;
          const isValid = this.isValidText(speech.text, 50);
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
        .slice(0, 10); // Increased from 8

      console.log(`Processed speeches for ${memberName}: ${validSpeeches.length}/${extractionDetails.speechesAttempted} valid`);

      if (onProgress) {
        onProgress({
          currentItem: `${validSpeeches.length} valid speeches`,
          speechesProcessed: validSpeeches.length,
          documentsProcessed: 0,
          errors: [],
          currentStep: 'Enhanced document text extraction',
          details: [`${validSpeeches.length}/${extractionDetails.speechesAttempted} speeches approved`],
          extractionMethods: extractionDetails.extractionMethods
        });
      }

      // Step 3: Process documents with enhanced extraction
      const validDocuments = [];
      const maxDocs = Math.min(content.documents.length, 10); // Increased from 8
      
      for (let i = 0; i < maxDocs; i++) {
        const doc = content.documents[i];
        extractionDetails.documentsAttempted++;
        
        if (onProgress) {
          onProgress({
            currentItem: `Extracting: ${doc.title.substring(0, 40)}...`,
            speechesProcessed: validSpeeches.length,
            documentsProcessed: validDocuments.length,
            errors: [],
            currentStep: `Processing document ${i + 1}/${maxDocs}`,
            details: [`Testing enhanced extraction for ${doc.title.substring(0, 30)}...`],
            extractionMethods: extractionDetails.extractionMethods
          });
        }

        const extractionResult = await this.extractTextWithRobustFallback(doc.id);
        
        if (extractionResult.text && this.isValidText(extractionResult.text, 80)) {
          validDocuments.push({
            ...doc,
            text: extractionResult.text
          });
          
          // Track successful extraction method
          if (!extractionDetails.extractionMethods.includes(extractionResult.method)) {
            extractionDetails.extractionMethods.push(extractionResult.method);
          }
          
          console.log(`✅ Enhanced extraction success for ${doc.id} using ${extractionResult.method}`);
        } else {
          extractionDetails.failedExtractions.push({
            id: doc.id,
            reason: `Enhanced extraction failed: attempted ${extractionResult.attempts.join(', ')}`
          });
          console.warn(`✗ Enhanced extraction failed for ${doc.id}: attempted ${extractionResult.attempts.join(', ')}`);
        }

        // Progress update
        if (onProgress) {
          onProgress({
            currentItem: `${validDocuments.length} documents extracted`,
            speechesProcessed: validSpeeches.length,
            documentsProcessed: validDocuments.length,
            errors: [],
            currentStep: `Document ${i + 1}/${maxDocs} completed`,
            details: [
              `Successful: ${validDocuments.length}`,
              `Failed: ${extractionDetails.failedExtractions.length}`,
              `Methods: ${extractionDetails.extractionMethods.join(', ')}`
            ],
            extractionMethods: extractionDetails.extractionMethods
          });
        }

        // Brief pause between extractions
        await new Promise(resolve => setTimeout(resolve, 150));
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
          extractionMethod: 'enhanced-extraction'
        });
      });

      const totalTexts = validSpeeches.length + validDocuments.length;
      const successRate = extractionDetails.speechesAttempted + extractionDetails.documentsAttempted > 0 
        ? Math.round((totalTexts / (extractionDetails.speechesAttempted + extractionDetails.documentsAttempted)) * 100)
        : 0;

      console.log(`=== ENHANCED CONTENT FETCHING COMPLETED FOR ${memberName} ===`);
      console.log(`Total texts extracted: ${totalTexts} (${successRate}% success rate)`);

      if (onProgress) {
        onProgress({
          currentItem: `Completed: ${totalTexts} texts`,
          speechesProcessed: validSpeeches.length,
          documentsProcessed: validDocuments.length,
          errors: [],
          currentStep: 'Enhanced text extraction completed',
          details: [
            `Total: ${totalTexts} texts`,
            `Success rate: ${successRate}%`,
            `Methods: ${extractionDetails.extractionMethods.join(', ')}`
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
      console.error('Critical error in enhanced member content fetching:', error);
      
      if (onProgress) {
        onProgress({
          currentItem: `Error processing ${memberName}`,
          speechesProcessed: 0,
          documentsProcessed: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          currentStep: 'Error occurred',
          details: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
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
