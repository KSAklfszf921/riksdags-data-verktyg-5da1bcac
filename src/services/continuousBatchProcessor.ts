import { supabase } from '../integrations/supabase/client';
import { enhancedRssFetcher, type FetchResult } from './enhancedRssFetcher';
import { databaseManager } from './databaseManager';

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
  detailedStats: {
    totalFetched: number;
    duplicatesSkipped: number;
    databaseErrors: number;
    strategiesUsed: { [key: string]: number };
    proxiesUsed: { [key: string]: number };
  };
  errors: Array<{
    memberName: string;
    error: string;
    timestamp: string;
    type: 'fetch' | 'database' | 'system';
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

    // Reset database manager stats
    databaseManager.resetStats();

    console.log(`🚀 Starting continuous batch processing (max ${maxMembers} members)`);

    try {
      // Fetch members from enhanced_member_profiles table
      const { data: members, error: memberError } = await supabase
        .from('enhanced_member_profiles')
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
        detailedStats: {
          totalFetched: 0,
          duplicatesSkipped: 0,
          databaseErrors: 0,
          strategiesUsed: {},
          proxiesUsed: {}
        },
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
          const result = await this.processMemberNews(member, progress);
          
          if (result.success) {
            progress.successful++;
            progress.newArticles += result.newArticles || 0;
            
            // Update detailed stats
            if (result.fetchResult?.metrics) {
              progress.detailedStats.totalFetched += result.fetchResult.items.length;
            }
            
            console.log(`✅ ${memberName}: ${result.newArticles} new articles stored`);
          } else {
            progress.failed++;
            progress.errors.push({
              memberName,
              error: result.error || 'Unknown error',
              timestamp: new Date().toISOString(),
              type: result.errorType || 'system'
            });
            console.log(`❌ ${memberName}: ${result.error}`);
          }
        } catch (error) {
          progress.failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          progress.errors.push({
            memberName,
            error: errorMessage,
            timestamp: new Date().toISOString(),
            type: 'system'
          });
          console.error(`💥 Error processing ${memberName}:`, error);
        }

        progress.processed = i + 1;
        
        // Update stats from database manager
        const dbStats = databaseManager.getStats();
        progress.detailedStats.duplicatesSkipped = dbStats.duplicates;
        progress.detailedStats.databaseErrors = dbStats.errors;
        
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

      // Log final statistics
      this.logFinalStatistics(progress);

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
        detailedStats: {
          totalFetched: 0,
          duplicatesSkipped: 0,
          databaseErrors: 0,
          strategiesUsed: {},
          proxiesUsed: {}
        },
        errors: [{
          memberName: 'System',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          type: 'system'
        }]
      };
      this.progressCallback?.(errorProgress);
    } finally {
      this.isRunning = false;
      this.currentBatchId = null;
    }
  }

  private async processMemberNews(member: Member, progress: BatchProgress): Promise<{
    success: boolean;
    error?: string;
    errorType?: 'fetch' | 'database' | 'system';
    newArticles?: number;
    fetchResult?: FetchResult;
  }> {
    const memberName = `${member.first_name} ${member.last_name}`;
    
    try {
      // Use the enhanced RSS fetcher
      const result = await enhancedRssFetcher.fetchNewsForMember(memberName);
      
      // Update strategy and proxy usage stats
      if (result.strategy) {
        progress.detailedStats.strategiesUsed[result.strategy] = 
          (progress.detailedStats.strategiesUsed[result.strategy] || 0) + 1;
      }
      
      if (result.proxy) {
        progress.detailedStats.proxiesUsed[result.proxy] = 
          (progress.detailedStats.proxiesUsed[result.proxy] || 0) + 1;
      }
      
      if (!result.success || result.items.length === 0) {
        return {
          success: false,
          error: result.error || 'No news items found',
          errorType: 'fetch',
          fetchResult: result
        };
      }

      // Store items using database manager
      const dbStats = await databaseManager.storeNewsItems(
        member.member_id,
        memberName,
        result.items,
        (dbProgress) => {
          // Update progress with database operation details
          // This could be used for more granular progress reporting
        }
      );

      return {
        success: true,
        newArticles: dbStats.successfulInserts,
        fetchResult: result
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: 'system'
      };
    }
  }

  private logFinalStatistics(progress: BatchProgress): void {
    console.log('\n📊 === FINAL BATCH STATISTICS ===');
    console.log(`Members processed: ${progress.processed}/${progress.totalMembers}`);
    console.log(`Successful: ${progress.successful}`);
    console.log(`Failed: ${progress.failed}`);
    console.log(`New articles stored: ${progress.newArticles}`);
    console.log(`Total articles fetched: ${progress.detailedStats.totalFetched}`);
    console.log(`Duplicates skipped: ${progress.detailedStats.duplicatesSkipped}`);
    console.log(`Database errors: ${progress.detailedStats.databaseErrors}`);
    
    console.log('\nStrategy usage:');
    Object.entries(progress.detailedStats.strategiesUsed).forEach(([strategy, count]) => {
      console.log(`  ${strategy}: ${count} times`);
    });
    
    console.log('\nProxy usage:');
    Object.entries(progress.detailedStats.proxiesUsed).forEach(([proxy, count]) => {
      const proxyName = proxy || 'direct';
      console.log(`  ${proxyName}: ${count} times`);
    });
    
    // Log proxy performance
    const proxyStats = enhancedRssFetcher.getProxyStats();
    console.log('\nProxy performance:');
    proxyStats.forEach(proxy => {
      const name = proxy.url || 'direct';
      console.log(`  ${name}: ${proxy.isWorking ? 'working' : 'disabled'}, failures: ${proxy.consecutiveFailures}`);
    });
    
    // Log strategy performance
    const strategyStats = enhancedRssFetcher.getStrategyStats();
    console.log('\nStrategy performance:');
    strategyStats.forEach(strategy => {
      console.log(`  ${strategy.name}: ${(strategy.successRate * 100).toFixed(1)}% success, avg ${strategy.averageResults.toFixed(1)} results`);
    });
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
