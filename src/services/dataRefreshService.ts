
import { supabase } from '@/integrations/supabase/client';
import { 
  getDataFreshness, 
  refreshPartyData,
  getLastSyncInfo 
} from './cachedPartyApi';
import { getVoteDataFreshness } from './cachedVoteApi';
import { getDocumentDataFreshness } from './cachedDocumentApi';
import { getSpeechDataFreshness } from './cachedSpeechApi';
import { getCalendarDataFreshness } from './cachedCalendarApi';

export interface DataFreshnessStatus {
  type: string;
  lastUpdated: string | null;
  isStale: boolean;
  errorMessage?: string;
  recordCount?: number;
}

export interface RefreshResult {
  success: boolean;
  message: string;
  duration?: number;
  stats?: any;
  errors?: string[];
}

export const checkAllDataFreshness = async (): Promise<DataFreshnessStatus[]> => {
  console.log('Checking freshness of all data types...');
  
  const checks = [
    { type: 'Party Data', checkFunction: getDataFreshness, countTable: 'party_data' },
    { type: 'Member Data', checkFunction: getDataFreshness, countTable: 'member_data' },
    { type: 'Vote Data', checkFunction: getVoteDataFreshness, countTable: 'vote_data' },
    { type: 'Document Data', checkFunction: getDocumentDataFreshness, countTable: 'document_data' },
    { type: 'Speech Data', checkFunction: getSpeechDataFreshness, countTable: 'speech_data' },
    { type: 'Calendar Data', checkFunction: getCalendarDataFreshness, countTable: 'calendar_data' },
    { type: 'Member News', checkFunction: null, countTable: 'member_news' }
  ];

  const results: DataFreshnessStatus[] = [];

  for (const check of checks) {
    try {
      let freshness = { lastUpdated: null, isStale: true };
      let recordCount = 0;

      // Get record count
      try {
        const { count } = await supabase
          .from(check.countTable)
          .select('*', { count: 'exact', head: true });
        recordCount = count || 0;
      } catch (countError) {
        console.warn(`Could not get count for ${check.countTable}:`, countError);
      }

      // Check freshness if function available
      if (check.checkFunction) {
        freshness = await check.checkFunction();
      } else {
        // For tables without specific freshness check, check if we have recent data
        const { data } = await supabase
          .from(check.countTable)
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (data) {
          freshness.lastUpdated = data.created_at;
          const lastUpdateTime = new Date(data.created_at);
          const now = new Date();
          const hoursSinceUpdate = (now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60);
          freshness.isStale = hoursSinceUpdate > 24;
        }
      }

      results.push({
        type: check.type,
        lastUpdated: freshness.lastUpdated,
        isStale: freshness.isStale,
        recordCount
      });
    } catch (error) {
      console.error(`Error checking ${check.type} freshness:`, error);
      results.push({
        type: check.type,
        lastUpdated: null,
        isStale: true,
        recordCount: 0,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
};

export const refreshAllData = async (): Promise<RefreshResult> => {
  console.log('Starting comprehensive data refresh for all systems...');
  
  const startTime = Date.now();
  const errors: string[] = [];
  let totalStats = {};

  try {
    // 1. Refresh core party and member data (includes documents, votes, speeches)
    console.log('Step 1: Refreshing core party data...');
    const { data: partyResult, error: partyError } = await supabase.functions.invoke('fetch-party-data');
    
    if (partyError) {
      const errorMsg = `Party data sync failed: ${partyError.message}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    } else if (partyResult?.stats) {
      totalStats = { ...totalStats, ...partyResult.stats };
      console.log('Party data sync completed:', partyResult.stats);
    }

    // 2. Refresh calendar data
    console.log('Step 2: Refreshing calendar data...');
    const { data: calendarResult, error: calendarError } = await supabase.functions.invoke('fetch-calendar-data');
    
    if (calendarError) {
      const errorMsg = `Calendar data sync failed: ${calendarError.message}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    } else if (calendarResult?.stats) {
      totalStats = { ...totalStats, ...calendarResult.stats };
      console.log('Calendar data sync completed:', calendarResult.stats);
    }

    // 3. Trigger news refresh for active members
    console.log('Step 3: Triggering news refresh for members...');
    try {
      const { data: members } = await supabase
        .from('member_data')
        .select('member_id, first_name, last_name')
        .eq('is_active', true)
        .limit(20); // Limit to top 20 active members to avoid overwhelming the system

      if (members && members.length > 0) {
        console.log(`Starting news refresh for ${members.length} members...`);
        
        // Process in smaller batches to avoid overwhelming the system
        for (let i = 0; i < members.length; i += 5) {
          const batch = members.slice(i, i + 5);
          const newsPromises = batch.map(async (member) => {
            try {
              const { error: newsError } = await supabase.functions.invoke('fetch-member-news', {
                body: { 
                  memberName: `${member.first_name} ${member.last_name}`,
                  memberId: member.member_id 
                }
              });
              if (newsError) {
                console.warn(`News fetch failed for ${member.first_name} ${member.last_name}:`, newsError);
              }
            } catch (err) {
              console.warn(`News fetch error for ${member.first_name} ${member.last_name}:`, err);
            }
          });
          
          await Promise.all(newsPromises);
          
          // Small delay between batches
          if (i + 5 < members.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
        
        totalStats = { ...totalStats, news_refresh_attempted: members.length };
      }
    } catch (newsError) {
      const errorMsg = `Member news refresh failed: ${newsError}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }

    const duration = Date.now() - startTime;
    const hasErrors = errors.length > 0;

    // Log the comprehensive sync
    try {
      await supabase
        .from('data_sync_log')
        .insert({
          sync_type: 'comprehensive_all_data',
          status: hasErrors ? 'partial_success' : 'success',
          sync_duration_ms: duration,
          error_details: hasErrors ? { errors } : null,
          ...totalStats
        });
    } catch (logError) {
      console.error('Failed to log sync operation:', logError);
    }

    return {
      success: !hasErrors || errors.length < 3, // Consider successful if most operations worked
      message: hasErrors 
        ? `Data refresh completed with ${errors.length} errors. Most data was updated successfully.`
        : 'All data refreshed successfully across all systems!',
      duration,
      stats: totalStats,
      errors: hasErrors ? errors : undefined
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Fatal error in comprehensive data refresh:', error);
    
    return {
      success: false,
      message: `Comprehensive data refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
};

export const refreshSpecificDataType = async (dataType: string): Promise<RefreshResult> => {
  console.log(`Refreshing specific data type: ${dataType}`);
  
  const startTime = Date.now();
  
  try {
    let result;
    
    switch (dataType.toLowerCase()) {
      case 'party':
      case 'member':
      case 'vote':
      case 'document':
      case 'speech':
        result = await supabase.functions.invoke('fetch-party-data');
        break;
      case 'calendar':
        result = await supabase.functions.invoke('fetch-calendar-data');
        break;
      default:
        throw new Error(`Unknown data type: ${dataType}`);
    }
    
    const duration = Date.now() - startTime;
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    return {
      success: true,
      message: `${dataType} data refreshed successfully`,
      duration,
      stats: result.data?.stats
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      message: `Failed to refresh ${dataType} data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
};

export const getComprehensiveDataStatus = async () => {
  try {
    const [freshnessStatus, lastSync] = await Promise.all([
      checkAllDataFreshness(),
      getLastSyncInfo()
    ]);

    const overallStale = freshnessStatus.some(status => status.isStale);
    const hasErrors = freshnessStatus.some(status => status.errorMessage);
    const totalRecords = freshnessStatus.reduce((sum, status) => sum + (status.recordCount || 0), 0);

    return {
      freshnessStatus,
      lastSync,
      overallStale,
      hasErrors,
      totalRecords,
      summary: {
        totalDataTypes: freshnessStatus.length,
        staleDataTypes: freshnessStatus.filter(s => s.isStale).length,
        errorDataTypes: freshnessStatus.filter(s => s.errorMessage).length,
        totalRecords
      }
    };
  } catch (error) {
    console.error('Error getting comprehensive data status:', error);
    throw error;
  }
};

export const initializeAllDatabases = async (): Promise<RefreshResult> => {
  console.log('Initializing all Supabase databases...');
  
  try {
    // Check current data status
    const status = await getComprehensiveDataStatus();
    console.log('Current data status:', status.summary);
    
    // If we have very little data, do a full refresh
    if (status.totalRecords < 100 || status.summary.staleDataTypes > 3) {
      console.log('Low data count or many stale data types detected. Starting full initialization...');
      return await refreshAllData();
    } else {
      console.log('Databases appear to be initialized. Checking for updates...');
      
      // If data exists but some is stale, refresh only stale data
      const staleTypes = status.freshnessStatus
        .filter(s => s.isStale && s.type !== 'Member News') // Skip news for now
        .map(s => s.type);
      
      if (staleTypes.length > 0) {
        console.log(`Refreshing ${staleTypes.length} stale data types...`);
        return await refreshAllData();
      } else {
        return {
          success: true,
          message: 'All databases are already initialized and up to date!',
          stats: status.summary
        };
      }
    }
  } catch (error) {
    console.error('Error during database initialization:', error);
    return {
      success: false,
      message: `Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
};

// Utility function to format data status for display
export const formatDataStatusMessage = (status: DataFreshnessStatus[]): string => {
  const staleItems = status.filter(s => s.isStale);
  const errorItems = status.filter(s => s.errorMessage);
  const totalRecords = status.reduce((sum, s) => sum + (s.recordCount || 0), 0);

  if (errorItems.length > 0) {
    return `${errorItems.length} data type(s) have errors. ${totalRecords.toLocaleString()} total records. Please refresh.`;
  }

  if (staleItems.length === 0) {
    return `All data is fresh and up to date. ${totalRecords.toLocaleString()} total records.`;
  }

  if (staleItems.length === status.length) {
    return `All data is stale. ${totalRecords.toLocaleString()} total records. Please refresh.`;
  }

  return `${staleItems.length} of ${status.length} data types are stale. ${totalRecords.toLocaleString()} total records.`;
};
