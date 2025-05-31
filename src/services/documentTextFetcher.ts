
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
  currentStep: string;
}

class DocumentTextFetcher {
  private cache = new Map<string, CachedDocument>();
  private readonly cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  private isCacheValid(cached: CachedDocument): boolean {
    const now = new Date();
    return (now.getTime() - cached.fetchedAt.getTime()) < this.cacheExpiry;
  }

  // Kraftigt förbättrad textrensning
  private cleanText(text: string): string {
    if (!text) return '';
    
    return text
      // Ta bort HTML/XML-taggar grundligt
      .replace(/<[^>]*>/g, ' ')
      .replace(/&[a-zA-Z0-9#]+;/g, ' ') // Ta bort HTML-entiteter
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      // Ta bort URLs
      .replace(/https?:\/\/[^\s]+/g, ' ')
      .replace(/www\.[^\s]+/g, ' ')
      // Ta bort extra whitespace
      .replace(/\s+/g, ' ')
      .replace(/\t/g, ' ')
      .replace(/\n+/g, ' ')
      // Ta bort specialtecken men behåll svenska bokstäver
      .replace(/[^\w\såäöÅÄÖ.,!?;:-]/g, ' ')
      // Ta bort siffror som står ensamma
      .replace(/\b\d+\b/g, ' ')
      .trim();
  }

  // Förbättrad textvalidering
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
    
    // Kontrollera att texten har riktiga ord (inte bara siffror/interpunktion)
    const wordCount = cleaned.split(/\s+/).filter(word => 
      word.length > 2 && /[a-zA-ZåäöÅÄÖ]/.test(word)
    ).length;
    
    const isValid = wordCount >= 10; // Minst 10 meningsfulla ord
    console.log(`Text validation: ${wordCount} words, valid: ${isValid}`);
    return isValid;
  }

  // Förbättrad textextraktion med flera försök
  private async extractTextWithFallback(documentId: string, documentType?: string): Promise<string | null> {
    const attempts = [
      // Försök 1: Standard text-endpoint
      async () => {
        const response = await fetch(`https://data.riksdagen.se/dokument/${documentId}.txt`);
        if (response.ok) {
          const text = await response.text();
          console.log(`Text endpoint success for ${documentId}: ${text.length} chars`);
          return text;
        }
        return null;
      },
      
      // Försök 2: HTML-endpoint med textrensning
      async () => {
        const response = await fetch(`https://data.riksdagen.se/dokument/${documentId}.html`);
        if (response.ok) {
          const html = await response.text();
          // Mer avancerad HTML-till-text konvertering
          const textContent = html
            .replace(/<script[^>]*>.*?<\/script>/gis, '')
            .replace(/<style[^>]*>.*?<\/style>/gis, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          console.log(`HTML endpoint success for ${documentId}: ${textContent.length} chars`);
          return textContent;
        }
        return null;
      },
      
      // Försök 3: JSON API med dokumentstruktur
      async () => {
        const response = await fetch(`https://data.riksdagen.se/dokumentlista/?utformat=json&dokid=${documentId}`);
        if (response.ok) {
          const data = await response.json();
          const dokument = data.dokumentlista?.dokument?.[0];
          if (dokument) {
            // Försök extrahera text från olika fält
            const textSources = [
              dokument.summary,
              dokument.notis,
              dokument.titel,
              dokument.undertitel
            ].filter(Boolean);
            
            if (textSources.length > 0) {
              const combinedText = textSources.join(' ');
              console.log(`JSON endpoint success for ${documentId}: ${combinedText.length} chars`);
              return combinedText;
            }
          }
        }
        return null;
      }
    ];

    for (let i = 0; i < attempts.length; i++) {
      try {
        const text = await attempts[i]();
        if (text && this.isValidText(text, 50)) {
          console.log(`Successfully extracted text from attempt ${i + 1} for ${documentId}`);
          return this.cleanText(text);
        }
      } catch (error) {
        console.warn(`Attempt ${i + 1} failed for ${documentId}:`, error);
      }
    }

    console.error(`All text extraction attempts failed for ${documentId}`);
    return null;
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
    
    const text = await this.extractTextWithFallback(documentId, documentType);
    
    if (text) {
      this.cache.set(cacheKey, {
        id: documentId,
        text: text,
        fetchedAt: new Date(),
        type: 'document'
      });
      return text;
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
    
    if (text && this.isValidText(text, 50)) {
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

  // Ny metod för steg-för-steg analys enligt specifikation
  async fetchMemberContentStepByStep(
    memberId: string,
    memberName: string,
    onProgress?: (progress: FetchProgress) => void
  ): Promise<{
    speeches: Array<{ id: string; text: string; title: string; date: string }>;
    documents: Array<{ id: string; text: string; title: string; date: string; type: string }>;
  }> {
    try {
      // Steg 1: Informera om start
      if (onProgress) {
        onProgress({
          currentItem: `Startar analys av ${memberName}`,
          completed: 0,
          total: 100,
          errors: [],
          currentStep: 'Förbereder analys'
        });
      }

      // Steg 2: Hämta innehåll från Riksdagen API
      if (onProgress) {
        onProgress({
          currentItem: `Hämtar senaste anföranden för ${memberName}`,
          completed: 10,
          total: 100,
          errors: [],
          currentStep: 'Hämtar anföranden från Riksdagen API'
        });
      }

      const content = await fetchMemberContentForAnalysis(memberId, 20);
      
      if (onProgress) {
        onProgress({
          currentItem: `Hittade ${content.speeches.length} anföranden, ${content.documents.length} dokument`,
          completed: 30,
          total: 100,
          errors: [],
          currentStep: 'Extraherar och validerar textinnehåll'
        });
      }

      // Steg 3: Bearbeta anföranden (redan har text)
      const validSpeeches = content.speeches
        .filter(speech => this.isValidText(speech.text, 100))
        .map(speech => ({
          ...speech,
          text: this.cleanText(speech.text)
        }))
        .slice(0, 10); // Begränsa till 10 bästa anföranden

      if (onProgress) {
        onProgress({
          currentItem: `Validerade ${validSpeeches.length} anföranden`,
          completed: 50,
          total: 100,
          errors: [],
          currentStep: 'Extraherar text från dokument'
        });
      }

      // Steg 4: Bearbeta dokument med textextraktion
      const validDocuments = [];
      const totalDocs = Math.min(content.documents.length, 10);
      
      for (let i = 0; i < totalDocs; i++) {
        const doc = content.documents[i];
        
        if (onProgress) {
          onProgress({
            currentItem: `Extraherar text från dokument ${i + 1}/${totalDocs}: ${doc.title}`,
            completed: 50 + ((i / totalDocs) * 30),
            total: 100,
            errors: [],
            currentStep: `Bearbetar dokument ${i + 1}/${totalDocs}`
          });
        }

        const extractedText = await this.extractTextWithFallback(doc.id, doc.type);
        if (extractedText && this.isValidText(extractedText, 150)) {
          validDocuments.push({
            ...doc,
            text: extractedText
          });
        } else {
          console.warn(`Failed to extract valid text from document ${doc.id}: ${doc.title}`);
        }

        // Kort paus mellan dokumentextraktioner
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Steg 5: Cacha resultaten
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
          currentItem: `Klar: ${validSpeeches.length} anföranden, ${validDocuments.length} dokument med giltig text`,
          completed: 100,
          total: 100,
          errors: [],
          currentStep: 'Textextraktion slutförd'
        });
      }

      return {
        speeches: validSpeeches,
        documents: validDocuments
      };
    } catch (error) {
      console.error('Error in fetchMemberContentStepByStep:', error);
      
      if (onProgress) {
        onProgress({
          currentItem: `Fel vid bearbetning av ${memberName}`,
          completed: 0,
          total: 100,
          errors: [error instanceof Error ? error.message : 'Okänt fel'],
          currentStep: 'Fel uppstod'
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
