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

  // Enhanced text cleaning with more thorough processing
  private cleanText(text: string): string {
    if (!text) return '';
    
    return text
      // Remove HTML/XML tags thoroughly
      .replace(/<[^>]*>/g, ' ')
      .replace(/&[a-zA-Z0-9#]+;/g, ' ') // Remove HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#\d+;/g, ' ') // Remove numeric entities
      // Remove URLs and email addresses
      .replace(/https?:\/\/[^\s]+/g, ' ')
      .replace(/www\.[^\s]+/g, ' ')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, ' ')
      // Remove extra whitespace and normalize
      .replace(/\s+/g, ' ')
      .replace(/\t/g, ' ')
      .replace(/\n+/g, ' ')
      // Keep Swedish characters and meaningful punctuation
      .replace(/[^\w\såäöÅÄÖ.,!?;:()-]/g, ' ')
      // Remove standalone numbers but keep years and meaningful numbers
      .replace(/\b\d{1,3}\b(?!\d)/g, ' ')
      // Clean up multiple spaces
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  // Enhanced text validation with more thorough checks
  private isValidText(text: string, minLength: number = 100): boolean {
    if (!text || typeof text !== 'string') {
      console.log('Invalid text: not a string or empty');
      return false;
    }
    
    const cleaned = this.cleanText(text);
    if (cleaned.length < minLength) {
      console.log(`Text too short: ${cleaned.length} < ${minLength}`);
      return false;
    }
    
    // Check for meaningful Swedish words
    const swedishWords = cleaned.split(/\s+/).filter(word => 
      word.length > 2 && 
      /[a-zA-ZåäöÅÄÖ]/.test(word) &&
      !/^\d+$/.test(word) // Not just numbers
    );
    
    // Check word diversity
    const uniqueWords = new Set(swedishWords.map(w => w.toLowerCase()));
    const wordDiversity = uniqueWords.size / swedishWords.length;
    
    const isValid = swedishWords.length >= 15 && wordDiversity > 0.3;
    console.log(`Enhanced text validation: ${swedishWords.length} words, diversity: ${wordDiversity.toFixed(2)}, valid: ${isValid}`);
    return isValid;
  }

  // Enhanced text extraction with multiple sophisticated methods
  private async extractTextWithEnhancedFallback(documentId: string, documentType?: string): Promise<{ text: string | null; method: string; attempts: string[] }> {
    const attempts: string[] = [];
    
    const extractionMethods = [
      // Method 1: Direct text endpoint
      {
        name: 'direct-text-api',
        description: 'Direct text API endpoint',
        attempt: async () => {
          attempts.push('direct-text-api');
          const response = await fetch(`https://data.riksdagen.se/dokument/${documentId}.txt`, {
            headers: { 'Accept': 'text/plain' }
          });
          if (response.ok) {
            const text = await response.text();
            console.log(`Direct text API success for ${documentId}: ${text.length} chars`);
            return text;
          }
          throw new Error(`Direct text API failed: ${response.status}`);
        }
      },
      
      // Method 2: JSON API with document content
      {
        name: 'json-api-content',
        description: 'JSON API document content extraction',
        attempt: async () => {
          attempts.push('json-api-content');
          const response = await fetch(`https://data.riksdagen.se/dokumentlista/?utformat=json&dokid=${documentId}`);
          if (response.ok) {
            const data = await response.json();
            const dokument = data.dokumentlista?.dokument?.[0];
            if (dokument) {
              // Try multiple content fields
              const textSources = [
                dokument.html,
                dokument.text,
                dokument.summary,
                dokument.notis,
                dokument.titel + ' ' + (dokument.undertitel || ''),
                dokument.htmlformaterad_text
              ].filter(Boolean);
              
              if (textSources.length > 0) {
                const combinedText = textSources.join(' ');
                console.log(`JSON API content success for ${documentId}: ${combinedText.length} chars`);
                return combinedText;
              }
            }
          }
          throw new Error(`JSON API content failed: No usable content found`);
        }
      },
      
      // Method 3: HTML endpoint with advanced parsing
      {
        name: 'html-advanced-parsing',
        description: 'HTML endpoint with advanced parsing',
        attempt: async () => {
          attempts.push('html-advanced-parsing');
          const response = await fetch(`https://data.riksdagen.se/dokument/${documentId}.html`);
          if (response.ok) {
            const html = await response.text();
            // Advanced HTML to text conversion
            const textContent = html
              .replace(/<script[^>]*>.*?<\/script>/gis, '')
              .replace(/<style[^>]*>.*?<\/style>/gis, '')
              .replace(/<nav[^>]*>.*?<\/nav>/gis, '')
              .replace(/<header[^>]*>.*?<\/header>/gis, '')
              .replace(/<footer[^>]*>.*?<\/footer>/gis, '')
              .replace(/<aside[^>]*>.*?<\/aside>/gis, '')
              .replace(/<div[^>]*class[^>]*nav[^>]*>.*?<\/div>/gis, '')
              // Convert paragraphs and breaks to spaces
              .replace(/<\/p>/gi, ' ')
              .replace(/<br[^>]*>/gi, ' ')
              .replace(/<\/div>/gi, ' ')
              // Remove all remaining tags
              .replace(/<[^>]*>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            console.log(`Advanced HTML parsing success for ${documentId}: ${textContent.length} chars`);
            return textContent;
          }
          throw new Error(`HTML parsing failed: ${response.status}`);
        }
      },
      
      // Method 4: Alternative document formats
      {
        name: 'alternative-formats',
        description: 'Alternative document formats (PDF, DOC)',
        attempt: async () => {
          attempts.push('alternative-formats');
          // Try different format endpoints
          const formats = ['pdf', 'doc', 'rtf'];
          for (const format of formats) {
            try {
              const response = await fetch(`https://data.riksdagen.se/dokument/${documentId}.${format}`);
              if (response.ok) {
                // For now, we'll skip binary format parsing but log the availability
                console.log(`Alternative format ${format} available for ${documentId}`);
                throw new Error(`Binary format ${format} found but parsing not implemented`);
              }
            } catch (e) {
              console.log(`Format ${format} not available for ${documentId}`);
            }
          }
          throw new Error('No alternative formats could be processed');
        }
      },
      
      // Method 5: Search API content extraction
      {
        name: 'search-api-content',
        description: 'Search API content extraction',
        attempt: async () => {
          attempts.push('search-api-content');
          const response = await fetch(`https://data.riksdagen.se/dokumentlista/?sok=${encodeURIComponent(documentId)}&utformat=json`);
          if (response.ok) {
            const data = await response.json();
            const documents = data.dokumentlista?.dokument || [];
            const targetDoc = documents.find((doc: any) => doc.id === documentId || doc.dokument_url_text?.includes(documentId));
            
            if (targetDoc) {
              const textSources = [
                targetDoc.summary,
                targetDoc.notis,
                targetDoc.titel,
                targetDoc.undertitel
              ].filter(Boolean);
              
              if (textSources.length > 0) {
                const combinedText = textSources.join(' ');
                console.log(`Search API success for ${documentId}: ${combinedText.length} chars`);
                return combinedText;
              }
            }
          }
          throw new Error('Search API extraction failed');
        }
      }
    ];

    for (const method of extractionMethods) {
      try {
        console.log(`Trying ${method.description} for ${documentId}...`);
        const text = await method.attempt();
        if (text && this.isValidText(text, 50)) {
          console.log(`✓ Successfully extracted text using ${method.name} for ${documentId}`);
          return {
            text: this.cleanText(text),
            method: method.name,
            attempts
          };
        } else {
          console.log(`✗ ${method.name} returned invalid text for ${documentId}`);
        }
      } catch (error) {
        console.warn(`✗ ${method.name} failed for ${documentId}:`, error instanceof Error ? error.message : error);
      }
    }

    console.error(`All enhanced extraction methods failed for ${documentId}`);
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
      console.log(`Using cached text for document ${documentId} (method: ${cached.extractionMethod})`);
      return {
        text: cached.text,
        method: cached.extractionMethod,
        attempts: ['cache']
      };
    }
    
    const result = await this.extractTextWithEnhancedFallback(documentId, documentType);
    
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
      console.log(`Using cached text for speech ${speechId} (method: ${cached.extractionMethod})`);
      return {
        text: cached.text,
        method: cached.extractionMethod,
        attempts: ['cache']
      };
    }
    
    try {
      const text = await fetchSpeechText(speechId);
      
      if (text && this.isValidText(text, 50)) {
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

  // Enhanced member content fetching with detailed progress and debugging
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
      // Step 1: Inform about start
      if (onProgress) {
        onProgress({
          currentItem: `Enhanced analys av ${memberName}`,
          speechesProcessed: 0,
          documentsProcessed: 0,
          errors: [],
          currentStep: 'Förbereder förbättrad textextraktion',
          details: ['Initierar enhanced content fetcher'],
          extractionMethods: []
        });
      }

      // Step 2: Fetch content from Riksdag API with enhanced parameters
      if (onProgress) {
        onProgress({
          currentItem: `Hämtar förbättrat innehåll för ${memberName}`,
          speechesProcessed: 0,
          documentsProcessed: 0,
          errors: [],
          currentStep: 'Hämtar innehåll från Riksdagen API med enhanced metoder',
          details: ['Begär större dataset för bättre analys'],
          extractionMethods: []
        });
      }

      const content = await fetchMemberContentForAnalysis(memberId, 25); // Increased from 20
      
      if (onProgress) {
        onProgress({
          currentItem: `Enhanced: ${content.speeches.length} anföranden, ${content.documents.length} dokument`,
          speechesProcessed: 0,
          documentsProcessed: 0,
          errors: [],
          currentStep: 'Startar enhanced textvalidering och extraktion',
          details: [`${content.speeches.length} anföranden hittade`, `${content.documents.length} dokument hittade`],
          extractionMethods: []
        });
      }

      // Step 3: Enhanced speech processing (already have text)
      const validSpeeches = content.speeches
        .filter(speech => {
          extractionDetails.speechesAttempted++;
          const isValid = this.isValidText(speech.text, 80); // Slightly lower threshold for speeches
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
        .slice(0, 12); // Keep top 12 speeches

      if (onProgress) {
        onProgress({
          currentItem: `Enhanced: ${validSpeeches.length} giltiga anföranden`,
          speechesProcessed: validSpeeches.length,
          documentsProcessed: 0,
          errors: [],
          currentStep: 'Enhanced dokumenttextextraktion',
          details: [`${validSpeeches.length}/${extractionDetails.speechesAttempted} anföranden godkända`],
          extractionMethods: extractionDetails.extractionMethods
        });
      }

      // Step 4: Enhanced document processing with detailed extraction
      const validDocuments = [];
      const totalDocs = Math.min(content.documents.length, 12);
      
      for (let i = 0; i < totalDocs; i++) {
        const doc = content.documents[i];
        extractionDetails.documentsAttempted++;
        
        if (onProgress) {
          onProgress({
            currentItem: `Enhanced textextraktion: ${doc.title}`,
            speechesProcessed: validSpeeches.length,
            documentsProcessed: validDocuments.length,
            errors: [],
            currentStep: `Enhanced bearbetar dokument ${i + 1}/${totalDocs}`,
            details: [`Testar flera extraktionsmetoder för ${doc.title.substring(0, 50)}...`],
            extractionMethods: extractionDetails.extractionMethods
          });
        }

        const extractionResult = await this.extractTextWithEnhancedFallback(doc.id, doc.type);
        
        if (extractionResult.text && this.isValidText(extractionResult.text, 120)) {
          validDocuments.push({
            ...doc,
            text: extractionResult.text
          });
          
          // Track successful extraction method
          if (!extractionDetails.extractionMethods.includes(extractionResult.method)) {
            extractionDetails.extractionMethods.push(extractionResult.method);
          }
          
          console.log(`✓ Enhanced extraction success for ${doc.id} using ${extractionResult.method}`);
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
            currentItem: `Enhanced: ${validDocuments.length} dokument extraherade`,
            speechesProcessed: validSpeeches.length,
            documentsProcessed: validDocuments.length,
            errors: [],
            currentStep: `Enhanced dokument ${i + 1}/${totalDocs} slutfört`,
            details: [
              `Lyckat: ${validDocuments.length}`,
              `Misslyckad: ${extractionDetails.failedExtractions.length}`,
              `Metoder: ${extractionDetails.extractionMethods.join(', ')}`
            ],
            extractionMethods: extractionDetails.extractionMethods
          });
        }

        // Enhanced pause between extractions
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      // Step 5: Enhanced caching and final results
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
          extractionMethod: 'enhanced-multi-method'
        });
      });

      if (onProgress) {
        onProgress({
          currentItem: `Enhanced slutförd: ${validSpeeches.length + validDocuments.length} texter`,
          speechesProcessed: validSpeeches.length,
          documentsProcessed: validDocuments.length,
          errors: [],
          currentStep: 'Enhanced textextraktion slutförd',
          details: [
            `Totalt: ${validSpeeches.length + validDocuments.length} texter`,
            `Framgång: ${Math.round(((validSpeeches.length + validDocuments.length) / (extractionDetails.speechesAttempted + extractionDetails.documentsAttempted)) * 100)}%`,
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
      console.error('Enhanced error in fetchMemberContentWithDetails:', error);
      
      if (onProgress) {
        onProgress({
          currentItem: `Enhanced fel vid bearbetning av ${memberName}`,
          speechesProcessed: 0,
          documentsProcessed: 0,
          errors: [error instanceof Error ? error.message : 'Okänt enhanced fel'],
          currentStep: 'Enhanced fel uppstod',
          details: [`Enhanced fel: ${error instanceof Error ? error.message : 'Okänt fel'}`],
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
