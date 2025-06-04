
import { supabase } from '@/integrations/supabase/client';

interface DocumentTextResult {
  document_id: string;
  text_content: string | null;
  content_length: number;
  fetch_success: boolean;
  error_message?: string;
}

export class DocumentTextFetcher {
  private readonly BASE_URL = 'https://data.riksdagen.se';
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;

  async fetchDocumentText(documentId: string, documentType?: string): Promise<string | null> {
    try {
      console.log(`Fetching document text for: ${documentId}, type: ${documentType}`);
      
      // Try text endpoint first
      let url = `${this.BASE_URL}/dokument/${documentId}.txt`;
      let response = await this.fetchWithRetry(url);
      
      if (response && response.ok) {
        const textContent = await response.text();
        if (textContent && textContent.trim().length > 100) {
          console.log(`Successfully fetched text document: ${documentId} (${textContent.length} chars)`);
          return textContent.trim();
        }
      }
      
      // Try HTML endpoint if text fails or is too short
      url = `${this.BASE_URL}/dokument/${documentId}.html`;
      response = await this.fetchWithRetry(url);
      
      if (response && response.ok) {
        const htmlContent = await response.text();
        const textContent = this.extractTextFromHtml(htmlContent);
        
        if (textContent && textContent.length > 100) {
          console.log(`Successfully fetched HTML document: ${documentId} (${textContent.length} chars)`);
          return textContent;
        }
      }
      
      console.warn(`Could not fetch substantial text for document: ${documentId}`);
      return null;
      
    } catch (error) {
      console.error(`Error fetching document text for ${documentId}:`, error);
      return null;
    }
  }

  private async fetchWithRetry(url: string): Promise<Response | null> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          return response;
        }
        
        if (response.status === 404) {
          // Don't retry on 404
          return null;
        }
        
        console.warn(`Fetch attempt ${attempt} failed with status ${response.status} for ${url}`);
        
      } catch (error) {
        console.error(`Fetch attempt ${attempt} error for ${url}:`, error);
      }
      
      if (attempt < this.MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
      }
    }
    
    return null;
  }

  private extractTextFromHtml(html: string): string {
    // Basic HTML stripping - removes tags and normalizes whitespace
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/&[^;]+;/g, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  async batchFetchDocumentTexts(
    documents: Array<{ id: string; type?: string; title?: string }>,
    onProgress?: (progress: { completed: number; total: number; current: string }) => void
  ): Promise<DocumentTextResult[]> {
    const results: DocumentTextResult[] = [];
    const batchSize = 5; // Conservative to avoid rate limiting
    
    console.log(`Starting batch fetch for ${documents.length} documents`);
    
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(documents.length/batchSize)}`);
      
      const batchPromises = batch.map(async (doc) => {
        if (onProgress) {
          onProgress({
            completed: i + batch.indexOf(doc),
            total: documents.length,
            current: doc.title || doc.id
          });
        }
        
        try {
          const text = await this.fetchDocumentText(doc.id, doc.type);
          
          return {
            document_id: doc.id,
            text_content: text,
            content_length: text ? text.length : 0,
            fetch_success: text !== null
          };
        } catch (error) {
          return {
            document_id: doc.id,
            text_content: null,
            content_length: 0,
            fetch_success: false,
            error_message: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('Batch promise rejected:', result.reason);
        }
      });
      
      // Add delay between batches to be respectful to the API
      if (i + batchSize < documents.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const successCount = results.filter(r => r.fetch_success).length;
    console.log(`Batch fetch completed: ${successCount}/${documents.length} documents with text`);
    
    return results;
  }

  async updateDocumentWithText(documentId: string, textContent: string): Promise<boolean> {
    try {
      // Create a content preview (first 500 characters)
      const contentPreview = textContent.length > 500 
        ? textContent.substring(0, 500) + '...'
        : textContent;
      
      const { error } = await supabase
        .from('document_data')
        .update({
          content_preview: contentPreview,
          metadata: {
            full_text_available: true,
            text_length: textContent.length,
            last_text_fetch: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('document_id', documentId);
      
      if (error) {
        console.error(`Error updating document ${documentId}:`, error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Database error updating document ${documentId}:`, error);
      return false;
    }
  }

  async batchUpdateDocumentsWithText(results: DocumentTextResult[]): Promise<number> {
    let updated = 0;
    
    for (const result of results) {
      if (result.fetch_success && result.text_content) {
        const success = await this.updateDocumentWithText(result.document_id, result.text_content);
        if (success) {
          updated++;
        }
      }
    }
    
    console.log(`Updated ${updated}/${results.length} documents with text content`);
    return updated;
  }
}

export const documentTextFetcher = new DocumentTextFetcher();
