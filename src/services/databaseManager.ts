
import { supabase } from '../integrations/supabase/client';

interface DatabaseStats {
  totalAttempts: number;
  successfulInserts: number;
  duplicates: number;
  errors: number;
  lastError?: string;
}

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
  imageUrl?: string;
}

class DatabaseManager {
  private stats: DatabaseStats = {
    totalAttempts: 0,
    successfulInserts: 0,
    duplicates: 0,
    errors: 0
  };

  async storeNewsItems(
    memberId: string, 
    memberName: string, 
    items: NewsItem[],
    onProgress?: (progress: { stored: number; duplicates: number; errors: number }) => void
  ): Promise<DatabaseStats> {
    console.log(`💾 Storing ${items.length} items for ${memberName}...`);
    
    const sessionStats: DatabaseStats = {
      totalAttempts: 0,
      successfulInserts: 0,
      duplicates: 0,
      errors: 0
    };

    for (const item of items) {
      sessionStats.totalAttempts++;
      this.stats.totalAttempts++;

      try {
        // Enhanced duplicate detection
        const isDuplicate = await this.checkForDuplicate(memberId, item);
        
        if (isDuplicate) {
          sessionStats.duplicates++;
          this.stats.duplicates++;
          console.log(`- Duplicate: ${item.title.substring(0, 50)}...`);
          continue;
        }

        // Validate and clean data before insertion
        const cleanedItem = this.validateAndCleanItem(item);
        
        const { error: insertError } = await supabase
          .from('member_news')
          .insert({
            member_id: memberId,
            title: cleanedItem.title,
            link: cleanedItem.link,
            pub_date: cleanedItem.pubDate,
            description: cleanedItem.description,
            image_url: cleanedItem.imageUrl
          });
        
        if (insertError) {
          sessionStats.errors++;
          this.stats.errors++;
          this.stats.lastError = insertError.message;
          console.error(`❌ Insert error for ${memberName}:`, insertError.message);
        } else {
          sessionStats.successfulInserts++;
          this.stats.successfulInserts++;
          console.log(`✓ Stored: ${item.title.substring(0, 50)}...`);
        }
      } catch (error) {
        sessionStats.errors++;
        this.stats.errors++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.stats.lastError = errorMessage;
        console.error(`💥 Database error for ${memberName}:`, errorMessage);
      }

      // Report progress
      if (onProgress) {
        onProgress({
          stored: sessionStats.successfulInserts,
          duplicates: sessionStats.duplicates,
          errors: sessionStats.errors
        });
      }
    }

    console.log(`✅ Database operation complete for ${memberName}: ${sessionStats.successfulInserts} stored, ${sessionStats.duplicates} duplicates, ${sessionStats.errors} errors`);
    return sessionStats;
  }

  private async checkForDuplicate(memberId: string, item: NewsItem): Promise<boolean> {
    try {
      // Check by exact link match
      const { data: existingByLink } = await supabase
        .from('member_news')
        .select('id')
        .eq('member_id', memberId)
        .eq('link', item.link)
        .limit(1);

      if (existingByLink && existingByLink.length > 0) {
        return true;
      }

      // Check by title similarity (for cases where URLs might differ)
      const { data: existingByTitle } = await supabase
        .from('member_news')
        .select('id, title')
        .eq('member_id', memberId)
        .eq('title', item.title)
        .limit(1);

      if (existingByTitle && existingByTitle.length > 0) {
        return true;
      }

      return false;
    } catch (error) {
      console.warn('Error checking for duplicates:', error);
      return false; // Assume not duplicate if check fails
    }
  }

  private validateAndCleanItem(item: NewsItem): NewsItem {
    return {
      title: this.cleanText(item.title).substring(0, 500), // Limit title length
      link: item.link.substring(0, 1000), // Limit URL length
      pubDate: item.pubDate,
      description: item.description ? this.cleanText(item.description).substring(0, 2000) : undefined,
      imageUrl: item.imageUrl ? item.imageUrl.substring(0, 1000) : undefined
    };
  }

  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[^;]+;/g, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  getStats(): DatabaseStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      totalAttempts: 0,
      successfulInserts: 0,
      duplicates: 0,
      errors: 0
    };
  }
}

export const databaseManager = new DatabaseManager();
