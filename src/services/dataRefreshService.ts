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
  warningMessage?: string;
}

export interface RefreshResult {
  success: boolean;
  message: string;
  duration?: number;
  stats?: any;
  errors?: string[];
  warnings?: string[];
}

// Definierar giltiga tabellnamn
type ValidTableName = 'party_data' | 'member_data' | 'vote_data' | 'document_data' | 'speech_data' | 'calendar_data' | 'member_news';

// Förbättrad helper-funktion för att få antal records med bättre felhantering
const getTableRecordCount = async (tableName: ValidTableName): Promise<number> => {
  try {
    console.log(`Getting record count for table: ${tableName}`);
    
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error(`Error getting count for ${tableName}:`, error);
      return 0;
    }
    
    const recordCount = count || 0;
    console.log(`${tableName}: ${recordCount} records`);
    return recordCount;
  } catch (error) {
    console.warn(`Could not get count for ${tableName}:`, error);
    return 0;
  }
};

// Förbättrad helper-funktion för senaste created_at med bättre felhantering
const getLatestCreatedAt = async (tableName: ValidTableName): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error(`Error getting latest created_at for ${tableName}:`, error);
      return null;
    }
    
    return data?.created_at || null;
  } catch (error) {
    console.warn(`Could not get latest created_at for ${tableName}:`, error);
    return null;
  }
};

export const checkAllDataFreshness = async (): Promise<DataFreshnessStatus[]> => {
  console.log('Checking freshness of all data types...');
  
  const checks = [
    { type: 'Party Data', checkFunction: getDataFreshness, countTable: 'party_data' as ValidTableName, expectedMin: 8 },
    { type: 'Member Data', checkFunction: getDataFreshness, countTable: 'member_data' as ValidTableName, expectedMin: 300 },
    { type: 'Vote Data', checkFunction: getVoteDataFreshness, countTable: 'vote_data' as ValidTableName, expectedMin: 50 },
    { type: 'Document Data', checkFunction: getDocumentDataFreshness, countTable: 'document_data' as ValidTableName, expectedMin: 1000 },
    { type: 'Speech Data', checkFunction: getSpeechDataFreshness, countTable: 'speech_data' as ValidTableName, expectedMin: 100 },
    { type: 'Calendar Data', checkFunction: getCalendarDataFreshness, countTable: 'calendar_data' as ValidTableName, expectedMin: 0 },
    { type: 'Member News', checkFunction: null, countTable: 'member_news' as ValidTableName, expectedMin: 0 }
  ];

  const results: DataFreshnessStatus[] = [];

  for (const check of checks) {
    try {
      let freshness = { lastUpdated: null, isStale: true };
      let recordCount = 0;
      let warningMessage: string | undefined;

      // Hämta antal records med förbättrad felhantering
      recordCount = await getTableRecordCount(check.countTable);

      // Kontrollera freshness om funktion finns
      if (check.checkFunction) {
        try {
          freshness = await check.checkFunction();
        } catch (freshnessError) {
          console.warn(`Freshness check failed for ${check.type}:`, freshnessError);
          // Fallback till created_at check
          const latestCreatedAt = await getLatestCreatedAt(check.countTable);
          if (latestCreatedAt) {
            freshness.lastUpdated = latestCreatedAt;
            const lastUpdateTime = new Date(latestCreatedAt);
            const now = new Date();
            const hoursSinceUpdate = (now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60);
            freshness.isStale = hoursSinceUpdate > 24;
          }
        }
      } else {
        // För tabeller utan specifik freshness-check
        const latestCreatedAt = await getLatestCreatedAt(check.countTable);
        
        if (latestCreatedAt) {
          freshness.lastUpdated = latestCreatedAt;
          const lastUpdateTime = new Date(latestCreatedAt);
          const now = new Date();
          const hoursSinceUpdate = (now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60);
          freshness.isStale = hoursSinceUpdate > 24;
        }
      }

      // Kontrollera om vi har tillräckligt med data
      if (recordCount < check.expectedMin) {
        warningMessage = `Lågt antal records (${recordCount}/${check.expectedMin} förväntade)`;
      }

      results.push({
        type: check.type,
        lastUpdated: freshness.lastUpdated,
        isStale: freshness.isStale,
        recordCount,
        warningMessage
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
  console.log('Starting enhanced comprehensive data refresh...');
  
  const startTime = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  let totalStats = {};

  try {
    // Använd den förbättrade comprehensive data sync-funktionen med timeout
    console.log('Step 1: Running enhanced comprehensive data sync...');
    
    const syncPromise = supabase.functions.invoke('fetch-comprehensive-data');
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Sync operation timed out after 5 minutes')), 300000)
    );
    
    const { data: comprehensiveResult, error: comprehensiveError } = await Promise.race([
      syncPromise,
      timeoutPromise
    ]) as any;
    
    if (comprehensiveError) {
      const errorMsg = `Enhanced data sync failed: ${comprehensiveError.message}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    } else if (comprehensiveResult?.stats) {
      totalStats = { ...totalStats, ...comprehensiveResult.stats };
      console.log('Enhanced data sync completed:', comprehensiveResult.stats);
      
      // Lägg till varningar från synkroniseringen
      if (comprehensiveResult.warnings) {
        warnings.push(...comprehensiveResult.warnings);
      }
    }

    // 2. Trigger news refresh för aktiva medlemmar (endast vid behov)
    if (errors.length === 0) {
      console.log('Step 2: Triggering selective news refresh...');
      try {
        const { data: members } = await supabase
          .from('member_data')
          .select('member_id, first_name, last_name')
          .eq('is_active', true)
          .limit(5); // Minska till 5 för att undvika överbelastning

        if (members && members.length > 0) {
          console.log(`Starting news refresh for ${members.length} members...`);
          
          // Bearbeta en i taget för att undvika överbelastning
          for (const member of members) {
            try {
              const { error: newsError } = await supabase.functions.invoke('fetch-member-news', {
                body: { 
                  memberName: `${member.first_name} ${member.last_name}`,
                  memberId: member.member_id 
                }
              });
              
              if (newsError) {
                console.warn(`News fetch failed for ${member.first_name} ${member.last_name}:`, newsError);
                warnings.push(`News fetch failed for ${member.first_name} ${member.last_name}`);
              }
              
              // Paus mellan förfrågningar
              await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (err) {
              console.warn(`News fetch error for ${member.first_name} ${member.last_name}:`, err);
              warnings.push(`News fetch error for ${member.first_name} ${member.last_name}`);
            }
          }
          
          totalStats = { ...totalStats, news_refresh_attempted: members.length };
        }
      } catch (newsError) {
        const errorMsg = `Member news refresh failed: ${newsError}`;
        console.error(errorMsg);
        warnings.push(errorMsg); // Inte en kritisk error
      }
    }

    const duration = Date.now() - startTime;
    const hasErrors = errors.length > 0;
    const hasWarnings = warnings.length > 0;

    // Logga den omfattande synkroniseringen med förbättrad felhantering
    try {
      await supabase
        .from('data_sync_log')
        .insert({
          sync_type: 'enhanced_all_data_refresh',
          status: hasErrors ? 'partial_success' : (hasWarnings ? 'success_with_warnings' : 'success'),
          sync_duration_ms: duration,
          error_details: { 
            errors: hasErrors ? errors : null,
            warnings: hasWarnings ? warnings : null
          },
          ...totalStats
        });
    } catch (logError) {
      console.error('Failed to log sync operation:', logError);
      warnings.push('Failed to log sync operation');
    }

    return {
      success: !hasErrors,
      message: hasErrors 
        ? `Data refresh completed with ${errors.length} errors and ${warnings.length} warnings.`
        : hasWarnings
        ? `Data refresh completed successfully with ${warnings.length} warnings.`
        : 'All data refreshed successfully!',
      duration,
      stats: totalStats,
      errors: hasErrors ? errors : undefined,
      warnings: hasWarnings ? warnings : undefined
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Fatal error in enhanced data refresh:', error);
    
    return {
      success: false,
      message: `Enhanced data refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      case 'calendar':
        // Använd den förbättrade comprehensive data sync för alla kärndata-typer
        result = await supabase.functions.invoke('fetch-comprehensive-data');
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
      stats: result.data?.stats,
      warnings: result.data?.warnings
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
    const hasWarnings = freshnessStatus.some(status => status.warningMessage);
    const totalRecords = freshnessStatus.reduce((sum, status) => sum + (status.recordCount || 0), 0);

    return {
      freshnessStatus,
      lastSync,
      overallStale,
      hasErrors,
      hasWarnings,
      totalRecords,
      summary: {
        totalDataTypes: freshnessStatus.length,
        staleDataTypes: freshnessStatus.filter(s => s.isStale).length,
        errorDataTypes: freshnessStatus.filter(s => s.errorMessage).length,
        warningDataTypes: freshnessStatus.filter(s => s.warningMessage).length,
        totalRecords
      }
    };
  } catch (error) {
    console.error('Error getting comprehensive data status:', error);
    throw error;
  }
};

export const initializeAllDatabases = async (): Promise<RefreshResult> => {
  console.log('Initializing all Supabase databases with enhanced capabilities...');
  
  try {
    // Kontrollera nuvarande datastatus
    const status = await getComprehensiveDataStatus();
    console.log('Current data status:', status.summary);
    
    // Om vi har mycket lite data eller många föråldrade datatyper, gör en fullständig uppdatering
    if (status.totalRecords < 500 || status.summary.staleDataTypes > 3) {
      console.log('Low data count or many stale data types detected. Starting full enhanced initialization...');
      return await refreshAllData();
    } else {
      console.log('Databases appear to be initialized. Checking for updates...');
      
      // Om data finns men en del är föråldrad, uppdatera endast föråldrad data
      const staleTypes = status.freshnessStatus
        .filter(s => s.isStale && s.type !== 'Member News') // Hoppa över nyheter för nu
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
    console.error('Error during enhanced database initialization:', error);
    return {
      success: false,
      message: `Enhanced database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
};

// Utility function to format data status for display
export const formatDataStatusMessage = (status: DataFreshnessStatus[]): string => {
  const staleItems = status.filter(s => s.isStale);
  const errorItems = status.filter(s => s.errorMessage);
  const warningItems = status.filter(s => s.warningMessage);
  const totalRecords = status.reduce((sum, s) => sum + (s.recordCount || 0), 0);

  if (errorItems.length > 0) {
    return `${errorItems.length} data type(s) have errors. ${totalRecords.toLocaleString()} total records. Please refresh.`;
  }

  if (warningItems.length > 0 && staleItems.length === 0) {
    return `Data is fresh but ${warningItems.length} type(s) have warnings. ${totalRecords.toLocaleString()} total records.`;
  }

  if (staleItems.length === 0) {
    return `All data is fresh and up to date. ${totalRecords.toLocaleString()} total records.`;
  }

  if (staleItems.length === status.length) {
    return `All data is stale. ${totalRecords.toLocaleString()} total records. Please refresh.`;
  }

  return `${staleItems.length} of ${status.length} data types are stale. ${totalRecords.toLocaleString()} total records.`;
};
