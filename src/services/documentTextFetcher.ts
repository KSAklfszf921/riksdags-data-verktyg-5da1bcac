import { fetchDocumentText, fetchSpeechText, fetchMemberContentForAnalysis } from './riksdagApi';

export interface CachedDocument {
  id: string;
  text: string;
  fetchedAt: Date;
  type: 'speech' | 'document';
}

export interface FetchProgress {
  currentItem: string;
  completed: number;
  total: number;
  errors: string[];
}

class DocumentTextFetcher {
  private cache = new Map<string, CachedDocument>();
  private readonly cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  private isCacheValid(cached: CachedDocument): boolean {
    const now = new Date();
    return (now.getTime() - cached.fetchedAt.getTime()) < this.cacheExpiry;
  }

  // Enhanced text cleaning function
  private cleanText(text: string): string {
    if (!text) return '';
    
    return text
      // Remove HTML/XML tags more thoroughly
      .replace(/<[^>]*>/g, ' ')
      .replace(/&[a-zA-Z0-9#]+;/g, ' ') // Remove HTML entities
      // Remove URLs
      .replace(/https?:\/\/[^\s]+/g, ' ')
      // Remove multiple whitespaces
      .replace(/\s+/g, ' ')
      // Remove special characters but keep Swedish letters
      .replace(/[^\w\såäöÅÄÖ.,!?;:-]/g, ' ')
      .trim();
  }

  // Enhanced text validation
  private isValidText(text: string, minLength: number = 100): boolean {
    if (!text || typeof text !== 'string') return false;
    
    const cleaned = this.cleanText(text);
    if (cleaned.length < minLength) return false;
    
    // Check if text has actual words (not just numbers/punctuation)
    const wordCount = cleaned.split(/\s+/).filter(word => 
      word.length > 2 && /[a-zA-ZåäöÅÄÖ]/.test(word)
    ).length;
    
    return wordCount >= 10; // At least 10 meaningful words
  }

  async fetchDocumentTextWithCache(
    documentId: string, 
    documentType?: string
  ): Promise<string | null> {
    const cacheKey = `doc_${documentId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      console.log(`Using cached text for document ${documentId}`);
      return cached.text;
    }
    
    const text = await fetchDocumentText(documentId, documentType);
    
    if (text && this.isValidText(text)) {
      const cleanedText = this.cleanText(text);
      this.cache.set(cacheKey, {
        id: documentId,
        text: cleanedText,
        fetchedAt: new Date(),
        type: 'document'
      });
      return cleanedText;
    }
    
    return null;
  }

  async fetchSpeechTextWithCache(speechId: string): Promise<string | null> {
    const cacheKey = `speech_${speechId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      console.log(`Using cached text for speech ${speechId}`);
      return cached.text;
    }
    
    const text = await fetchSpeechText(speechId);
    
    if (text && this.isValidText(text, 50)) { // Lower threshold for speeches
      const cleanedText = this.cleanText(text);
      this.cache.set(cacheKey, {
        id: speechId,
        text: cleanedText,
        fetchedAt: new Date(),
        type: 'speech'
      });
      return cleanedText;
    }
    
    return null;
  }

  async fetchMemberContentBatch(
    memberId: string,
    onProgress?: (progress: FetchProgress) => void
  ): Promise<{
    speeches: Array<{ id: string; text: string; title: string; date: string }>;
    documents: Array<{ id: string; text: string; title: string; date: string; type: string }>;
  }> {
    try {
      if (onProgress) {
        onProgress({
          currentItem: 'Hämtar innehåll från Riksdagen...',
          completed: 0,
          total: 100,
          errors: []
        });
      }

      const content = await fetchMemberContentForAnalysis(memberId, 30);
      
      if (onProgress) {
        onProgress({
          currentItem: 'Bearbetar och validerar text...',
          completed: 50,
          total: 100,
          errors: []
        });
      }

      // Enhanced processing with better text validation
      const validSpeeches = content.speeches
        .filter(speech => this.isValidText(speech.text, 100))
        .map(speech => ({
          ...speech,
          text: this.cleanText(speech.text)
        }))
        .slice(0, 15); // Limit to 15 best speeches

      const validDocuments = content.documents
        .filter(doc => this.isValidText(doc.text, 150))
        .map(doc => ({
          ...doc,
          text: this.cleanText(doc.text)
        }))
        .slice(0, 10); // Limit to 10 best documents

      // Cache the results
      validSpeeches.forEach(speech => {
        this.cache.set(`speech_${speech.id}`, {
          id: speech.id,
          text: speech.text,
          fetchedAt: new Date(),
          type: 'speech'
        });
      });

      validDocuments.forEach(doc => {
        this.cache.set(`doc_${doc.id}`, {
          id: doc.id,
          text: doc.text,
          fetchedAt: new Date(),
          type: 'document'
        });
      });

      if (onProgress) {
        onProgress({
          currentItem: `Klar: ${validSpeeches.length} anföranden, ${validDocuments.length} dokument`,
          completed: 100,
          total: 100,
          errors: []
        });
      }

      return {
        speeches: validSpeeches,
        documents: validDocuments
      };
    } catch (error) {
      console.error('Error in fetchMemberContentBatch:', error);
      
      if (onProgress) {
        onProgress({
          currentItem: 'Fel vid hämtning av innehåll',
          completed: 0,
          total: 100,
          errors: [error instanceof Error ? error.message : 'Okänt fel']
        });
      }
      
      return { speeches: [], documents: [] };
    }
  }

  clearCache(): void {
    this.cache.clear();
    console.log('Document text cache cleared');
  }

  getCacheStats(): { size: number; oldestEntry: Date | null } {
    const entries = Array.from(this.cache.values());
    const oldestEntry = entries.length > 0 
      ? entries.reduce((oldest, current) => 
          current.fetchedAt < oldest.fetchedAt ? current : oldest
        ).fetchedAt
      : null;
    
    return {
      size: this.cache.size,
      oldestEntry
    };
  }
}

// Export singleton instance
export const documentTextFetcher = new DocumentTextFetcher();
