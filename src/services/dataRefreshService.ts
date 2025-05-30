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

// Förbättrad helper-funktion för att få antal records
const getTableRecordCount = async (tableName: string): Promise<number> => {
  try {
    console.log(`Getting record count for table: ${tableName}`);
    
    let query;
    switch (tableName) {
      case 'party_data':
        query = supabase.from('party_data').select('*', { count: 'exact', head: true });
        break;
      case 'member_data':
        query = supabase.from('member_data').select('*', { count: 'exact', head: true });
        break;
      case 'vote_data':
        query = supabase.from('vote_data').select('*', { count: 'exact', head: true });
        break;
      case 'document_data':
        query = supabase.from('document_data').select('*', { count: 'exact', head: true });
        break;
      case 'speech_data':
        query = supabase.from('speech_data').select('*', { count: 'exact', head: true });
        break;
      case 'calendar_data':
        query = supabase.from('calendar_data').select('*', { count: 'exact', head: true });
        break;
      case 'member_news':
        query = supabase.from('member_news').select('*', { count: 'exact', head: true });
        break;
      default:
        console.warn(`Unknown table name: ${tableName}`);
        return 0;
    }
    
    const { count, error } = await query;
    
    if (error) {
      console.error(`Error getting count for ${tableName}:`, error);
      return 0;
    }
    
    console.log(`${tableName}: ${count} records`);
    return count || 0;
  } catch (error) {
    console.warn(`Could not get count for ${tableName}:`, error);
    return 0;
  }
};

// Förbättrad helper-funktion för senaste created_at
const getLatestCreatedAt = async (tableName: string): Promise<string | null> => {
  try {
    let query;
    switch (tableName) {
      case 'party_data':
        query = supabase.from('party_data').select('created_at').order('created_at', { ascending: false }).limit(1).single();
        break;
      case 'member_data':
        query = supabase.from('member_data').select('created_at').order('created_at', { ascending: false }).limit(1).single();
        break;
      case 'vote_data':
        query = supabase.from('vote_data').select('created_at').order('created_at', { ascending: false }).limit(1).single();
        break;
      case 'document_data':
        query = supabase.from('document_data').select('created_at').order('created_at', { ascending: false }).limit(1).single();
        break;
      case 'speech_data':
        query = supabase.from('speech_data').select('created_at').order('created_at', { ascending: false }).limit(1).single();
        break;
      case 'calendar_data':
        query = supabase.from('calendar_data').select('created_at').order('created_at', { ascending: false }).limit(1).single();
        break;
      case 'member_news':
        query = supabase.from('member_news').select('created_at').order('created_at', { ascending: false }).limit(1).single();
        break;
      default:
        return null;
    }
    
    const { data } = await query;
    return data?.created_at || null;
  } catch (error) {
    return null;
  }
};

export const checkAllDataFreshness = async (): Promise<DataFreshnessStatus[]> => {
  console.log('Checking freshness of all data types...');
  
  const checks = [
    { type: 'Party Data', checkFunction: getDataFreshness, countTable: 'party_data', expectedMin: 8 },
    { type: 'Member Data', checkFunction: getDataFreshness, countTable: 'member_data', expectedMin: 300 },
    { type: 'Vote Data', checkFunction: getVoteDataFreshness, countTable: 'vote_data', expectedMin: 50 },
    { type: 'Document Data', checkFunction: getDocumentDataFreshness, countTable: 'document_data', expectedMin: 1000 },
    { type: 'Speech Data', checkFunction: getSpeechDataFreshness, countTable: 'speech_data', expectedMin: 100 },
    { type: 'Calendar Data', checkFunction: getCalendarDataFreshness, countTable: 'calendar_data', expectedMin: 0 }, // Låg förväntning pga API-problem
    { type: 'Member News', checkFunction: null, countTable: 'member_news', expectedMin: 0 }
  ];

  const results: DataFreshnessStatus[] = [];

  for (const check of checks) {
    try {
      let freshness = { lastUpdated: null, isStale: true };
      let recordCount = 0;
      let warningMessage: string | undefined;

      // Hämta antal records
      recordCount = await getTableRecordCount(check.countTable);

      // Kontrollera freshness om funktion finns
      if (check.checkFunction) {
        freshness = await check.checkFunction();
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
    // Använd den förbättrade comprehensive data sync-funktionen
    console.log('Step 1: Running enhanced comprehensive data sync...');
    const { data: comprehensiveResult, error: comprehensiveError } = await supabase.functions.invoke('fetch-comprehensive-data');
    
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

    // 2. Trigger news refresh för aktiva medlemmar (begränsat antal)
    console.log('Step 2: Triggering selective news refresh...');
    try {
      const { data: members } = await supabase
        .from('member_data')
        .select('member_id, first_name, last_name')
        .eq('is_active', true)
        .limit(10); // Begränsa till 10 medlemmar för att undvika överbelastning

      if (members && members.length > 0) {
        console.log(`Starting news refresh for ${members.length} members...`);
        
        // Bearbeta 2 i taget för att undvika överbelastning
        for (let i = 0; i < members.length; i += 2) {
          const batch = members.slice(i, i + 2);
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
                warnings.push(`News fetch failed for ${member.first_name} ${member.last_name}`);
              }
            } catch (err) {
              console.warn(`News fetch error for ${member.first_name} ${member.last_name}:`, err);
              warnings.push(`News fetch error for ${member.first_name} ${member.last_name}`);
            }
          });
          
          await Promise.all(newsPromises);
          
          // Paus mellan batches
          if (i + 2 < members.length) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
        
        totalStats = { ...totalStats, news_refresh_attempted: members.length };
      }
    } catch (newsError) {
      const errorMsg = `Member news refresh failed: ${newsError}`;
      console.error(errorMsg);
      warnings.push(errorMsg); // Inte en kritisk error
    }

    const duration = Date.now() - startTime;
    const hasErrors = errors.length > 0;
    const hasWarnings = warnings.length > 0;

    // Logga den omfattande synkroniseringen
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
