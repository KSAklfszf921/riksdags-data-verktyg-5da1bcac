
import { supabase } from '../integrations/supabase/client';
import { enhancedRssFetcher, type FetchResult } from './enhancedRssFetcher';

interface BatchProgress {
  currentMember: number;
  totalMembers: number;
  processed: number;
  successful: number;
  failed: number;
  newArticles: number;
  currentMemberName: string;
  status: 'running' | 'paused' | 'completed' | 'error';
  estimatedTimeRemaining?: number;
  errors: Array<{
    memberName: string;
    error: string;
    timestamp: string;
  }>;
}

interface Member {
  member_id: string;
  first_name: string;
  last_name: string;
  party: string;
  is_active: boolean;
}

class ContinuousBatchProcessor {
  private isRunning = false;
  private isPaused = false;
  private currentBatchId: string | null = null;
  private progressCallback?: (progress: BatchProgress) => void;
  private abortController?: AbortController;

  async startBatchProcessing(
    options: {
      maxMembers?: number;
      delayBetweenMembers?: number;
      onProgress?: (progress: BatchProgress) => void;
      resumeFromMember?: number;
    } = {}
  ): Promise<void> {
    if (this.isRunning) {
      throw new Error('Batch processing is already running');
    }

    const {
      maxMembers = 50,
      delayBetweenMembers = 3000,
      onProgress,
      resumeFromMember = 0
    } = options;

    this.isRunning = true;
    this.isPaused = false;
    this.progressCallback = onProgress;
    this.abortController = new AbortController();
    this.currentBatchId = `batch_${Date.now()}`;

    console.log(`🚀 Starting continuous batch processing (max ${maxMembers} members)`);

    try {
      // Fetch members
      const { data: members, error: memberError } = await supabase
        .from('member_data')
        .select('member_id, first_name, last_name, party, is_active')
        .eq('is_active', true)
        .order('party, last_name')
        .limit(maxMembers);

      if (memberError) throw memberError;
      if (!members || members.length === 0) {
        throw new Error('No active members found');
      }

      const progress: BatchProgress = {
        currentMember: resumeFromMember,
        totalMembers: members.length,
        processed: resumeFromMember,
        successful: 0,
        failed: 0,
        newArticles: 0,
        currentMemberName: '',
        status: 'running',
        errors: []
      };

      const startTime = Date.now();

      // Process members starting from resumeFromMember
      for (let i = resumeFromMember; i < members.length; i++) {
        if (this.abortController.signal.aborted) {
          progress.status = 'paused';
          break;
        }

        if (this.isPaused) {
          console.log('⏸️ Batch processing paused');
          progress.status = 'paused';
          this.progressCallback?.(progress);
          return;
        }

        const member = members[i];
        const memberName = `${member.first_name} ${member.last_name}`;
        
        progress.currentMember = i;
        progress.currentMemberName = memberName;
        progress.estimatedTimeRemaining = this.calculateETA(startTime, i, members.length, resumeFromMember);
        
        this.progressCallback?.(progress);

        console.log(`📰 Processing ${i + 1}/${members.length}: ${memberName} (${member.party})`);

        try {
          const result = await this.processMemberNews(member);
          
          if (result.success) {
            progress.successful++;
            progress.newArticles += result.newArticles || 0;
            console.log(`✅ ${memberName}: ${result.newArticles} new articles stored`);
          } else {
            progress.failed++;
            progress.errors.push({
              memberName,
              error: result.error || 'Unknown error',
              timestamp: new Date().toISOString()
            });
            console.log(`❌ ${memberName}: ${result.error}`);
          }
        } catch (error) {
          progress.failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          progress.errors.push({
            memberName,
            error: errorMessage,
            timestamp: new Date().toISOString()
          });
          console.error(`💥 Error processing ${memberName}:`, error);
        }

        progress.processed = i + 1;
        this.progressCallback?.(progress);

        // Add delay between members to avoid rate limiting
        if (i < members.length - 1) {
          await this.delay(delayBetweenMembers);
        }
      }

      progress.status = 'completed';
      progress.estimatedTimeRemaining = 0;
      this.progressCallback?.(progress);

      console.log(`🎉 Batch processing completed: ${progress.successful}/${progress.totalMembers} successful, ${progress.newArticles} new articles`);

    } catch (error) {
      console.error('💥 Batch processing failed:', error);
      const errorProgress: BatchProgress = {
        currentMember: 0,
        totalMembers: 0,
        processed: 0,
        successful: 0,
        failed: 1,
        newArticles: 0,
        currentMemberName: '',
        status: 'error',
        errors: [{
          memberName: 'System',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }]
      };
      this.progressCallback?.(errorProgress);
    } finally {
      this.isRunning = false;
      this.currentBatchId = null;
    }
  }

  private async processMemberNews(member: Member): Promise<{
    success: boolean;
    error?: string;
    newArticles?: number;
  }> {
    const memberName = `${member.first_name} ${member.last_name}`;
    
    try {
      // Use the enhanced RSS fetcher
      const result = await enhancedRssFetcher.fetchNewsForMember(memberName);
      
      if (!result.success || result.items.length === 0) {
        return {
          success: false,
          error: result.error || 'No news items found'
        };
      }

      // Store new items in database
      let storedCount = 0;
      
      for (const item of result.items) {
        try {
          // Check if item already exists
          const { data: existing } = await supabase
            .from('member_news')
            .select('id')
            .eq('member_id', member.member_id)
            .eq('link', item.link)
            .single();

          if (!existing) {
            const { error: insertError } = await supabase
              .from('member_news')
              .insert({
                member_id: member.member_id,
                title: item.title,
                link: item.link,
                pub_date: item.pubDate,
                description: item.description,
                image_url: item.imageUrl
              });
            
            if (!insertError) {
              storedCount++;
            }
          }
        } catch (error) {
          console.warn(`Failed to store item for ${memberName}:`, error);
        }
      }

      return {
        success: true,
        newArticles: storedCount
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  pauseProcessing(): void {
    this.isPaused = true;
    console.log('⏸️ Pausing batch processing...');
  }

  resumeProcessing(): void {
    this.isPaused = false;
    console.log('▶️ Resuming batch processing...');
  }

  stopProcessing(): void {
    this.abortController?.abort();
    this.isRunning = false;
    this.isPaused = false;
    console.log('⏹️ Stopping batch processing...');
  }

  getStatus(): {
    isRunning: boolean;
    isPaused: boolean;
    batchId: string | null;
  } {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      batchId: this.currentBatchId
    };
  }

  private calculateETA(startTime: number, current: number, total: number, offset: number): number {
    if (current <= offset) return 0;
    
    const elapsed = Date.now() - startTime;
    const processed = current - offset;
    const remaining = total - current;
    const avgTimePerItem = elapsed / processed;
    
    return Math.round((avgTimePerItem * remaining) / 1000); // Return in seconds
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const continuousBatchProcessor = new ContinuousBatchProcessor();
export type { BatchProgress, Member };
