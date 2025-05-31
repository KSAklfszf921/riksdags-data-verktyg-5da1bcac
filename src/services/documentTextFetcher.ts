
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
    
    if (text) {
      this.cache.set(cacheKey, {
        id: documentId,
        text,
        fetchedAt: new Date(),
        type: 'document'
      });
    }
    
    return text;
  }

  async fetchSpeechTextWithCache(speechId: string): Promise<string | null> {
    const cacheKey = `speech_${speechId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      console.log(`Using cached text for speech ${speechId}`);
      return cached.text;
    }
    
    const text = await fetchSpeechText(speechId);
    
    if (text) {
      this.cache.set(cacheKey, {
        id: speechId,
        text,
        fetchedAt: new Date(),
        type: 'speech'
      });
    }
    
    return text;
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

      const content = await fetchMemberContentForAnalysis(memberId, 25);
      
      if (onProgress) {
        onProgress({
          currentItem: 'Innehåll hämtat från API',
          completed: 100,
          total: 100,
          errors: []
        });
      }

      // Cache the results
      content.speeches.forEach(speech => {
        this.cache.set(`speech_${speech.id}`, {
          id: speech.id,
          text: speech.text,
          fetchedAt: new Date(),
          type: 'speech'
        });
      });

      content.documents.forEach(doc => {
        this.cache.set(`doc_${doc.id}`, {
          id: doc.id,
          text: doc.text,
          fetchedAt: new Date(),
          type: 'document'
        });
      });

      return content;
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
