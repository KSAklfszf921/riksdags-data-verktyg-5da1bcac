
import { supabase } from '@/integrations/supabase/client';
import { EdgeFunctionTester, TestResult } from './edgeFunctionTester';

export class SyncProgressTester extends EdgeFunctionTester {
  
  async testSyncProgress(syncType: string): Promise<TestResult> {
    return this.runTest(`${syncType} Sync Progress Monitor`, async () => {
      console.log(`Monitoring progress for ${syncType} sync...`);
      
      const { data, error } = await supabase
        .from('automated_sync_status')
        .select('*')
        .eq('sync_type', syncType)
        .order('started_at', { ascending: false })
        .limit(1);

      if (error) {
        throw new Error(`Error fetching sync status: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return {
          status: 'no_records',
          message: `No ${syncType} sync records found`,
          timestamp: new Date().toISOString()
        };
      }

      const syncRecord = data[0];
      
      // Calculate progress if possible
      let progress = 0;
      if (syncRecord.status === 'completed') {
        progress = 100;
      } else if (syncRecord.stats) {
        // Try to estimate progress based on stats
        // This is a simple implementation - you may want to enhance it based on specific sync types
        if (syncRecord.stats.total_records && syncRecord.stats.processed_records) {
          progress = Math.round((syncRecord.stats.processed_records / syncRecord.stats.total_records) * 100);
        } else {
          // Fallback to time-based estimation
          const startTime = new Date(syncRecord.started_at).getTime();
          const currentTime = new Date().getTime();
          // Most syncs complete in ~10 minutes
          const elapsedFraction = Math.min(1, (currentTime - startTime) / (10 * 60 * 1000));
          progress = Math.round(elapsedFraction * 100);
        }
      }
      
      return {
        status: syncRecord.status,
        progress,
        started_at: syncRecord.started_at,
        completed_at: syncRecord.completed_at,
        stats: syncRecord.stats || {},
        error_message: syncRecord.error_message,
        elapsed_ms: syncRecord.completed_at 
          ? new Date(syncRecord.completed_at).getTime() - new Date(syncRecord.started_at).getTime() 
          : new Date().getTime() - new Date(syncRecord.started_at).getTime()
      };
    });
  }

  async monitorAllSyncs(): Promise<Record<string, TestResult>> {
    console.log('Monitoring all sync operations...');
    
    const syncTypes = ['comprehensive', 'calendar', 'party', 'toplists'];
    const results: Record<string, TestResult> = {};
    
    for (const syncType of syncTypes) {
      results[syncType] = await this.testSyncProgress(syncType);
    }
    
    return results;
  }

  async summarizeSystemStatus(): Promise<TestResult> {
    return this.runTest('System Status Summary', async () => {
      console.log('Generating system status summary...');
      
      // Get counts from all tables
      const tablesWithCounts = await Promise.all([
        supabase.from('document_data').select('*', { count: 'exact', head: true }),
        supabase.from('member_data').select('*', { count: 'exact', head: true }),
        supabase.from('calendar_data').select('*', { count: 'exact', head: true }),
        supabase.from('speech_data').select('*', { count: 'exact', head: true }),
        supabase.from('vote_data').select('*', { count: 'exact', head: true }),
        supabase.from('party_data').select('*', { count: 'exact', head: true })
      ]);
      
      // Get latest sync status for each type
      const { data: syncData, error: syncError } = await supabase
        .from('automated_sync_status')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);
        
      if (syncError) {
        throw new Error(`Error fetching sync status: ${syncError.message}`);
      }
      
      // Group by sync_type and get the latest for each
      const latestSyncs: Record<string, any> = {};
      if (syncData) {
        for (const record of syncData) {
          if (!latestSyncs[record.sync_type] || 
              new Date(record.started_at) > new Date(latestSyncs[record.sync_type].started_at)) {
            latestSyncs[record.sync_type] = record;
          }
        }
      }
      
      return {
        timestamp: new Date().toISOString(),
        table_counts: {
          documents: tablesWithCounts[0].count || 0,
          members: tablesWithCounts[1].count || 0,
          calendar_events: tablesWithCounts[2].count || 0,
          speeches: tablesWithCounts[3].count || 0,
          votes: tablesWithCounts[4].count || 0,
          parties: tablesWithCounts[5].count || 0,
        },
        latest_syncs: latestSyncs,
        system_health: this.calculateSystemHealth(tablesWithCounts, latestSyncs)
      };
    });
  }
  
  private calculateSystemHealth(
    tablesWithCounts: Array<{ count: number | null }>,
    latestSyncs: Record<string, any>
  ): { status: string, score: number } {
    // Simple algorithm to determine system health based on:
    // 1. Presence of data in tables
    // 2. Recent successful syncs
    // 3. No failed syncs
    
    const hasData = tablesWithCounts.every(result => (result.count || 0) > 0);
    const hasRecentSyncs = Object.values(latestSyncs).some(sync => {
      const syncTime = new Date(sync.started_at).getTime();
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return syncTime > oneDayAgo;
    });
    const hasFailedSyncs = Object.values(latestSyncs).some(sync => sync.status === 'failed');
    
    if (!hasData) {
      return { status: 'critical', score: 0 };
    } else if (hasFailedSyncs) {
      return { status: 'warning', score: 50 };
    } else if (hasRecentSyncs) {
      return { status: 'healthy', score: 100 };
    } else {
      return { status: 'moderate', score: 75 };
    }
  }
}
