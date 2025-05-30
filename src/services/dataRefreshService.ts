
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
}

export const checkAllDataFreshness = async (): Promise<DataFreshnessStatus[]> => {
  console.log('Checking freshness of all data types...');
  
  const checks = [
    { type: 'Party Data', checkFunction: getDataFreshness },
    { type: 'Vote Data', checkFunction: getVoteDataFreshness },
    { type: 'Document Data', checkFunction: getDocumentDataFreshness },
    { type: 'Speech Data', checkFunction: getSpeechDataFreshness },
    { type: 'Calendar Data', checkFunction: getCalendarDataFreshness }
  ];

  const results: DataFreshnessStatus[] = [];

  for (const check of checks) {
    try {
      const freshness = await check.checkFunction();
      results.push({
        type: check.type,
        lastUpdated: freshness.lastUpdated,
        isStale: freshness.isStale
      });
    } catch (error) {
      console.error(`Error checking ${check.type} freshness:`, error);
      results.push({
        type: check.type,
        lastUpdated: null,
        isStale: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
};

export const refreshAllData = async (): Promise<{ success: boolean; message: string; results?: any }> => {
  console.log('Triggering refresh of all data...');
  
  try {
    // Use the main fetch-party-data function which now handles all data types
    const { error } = await supabase.functions.invoke('fetch-party-data');
    
    if (error) {
      console.error('Error refreshing all data:', error);
      throw new Error(`Failed to refresh all data: ${error.message}`);
    }

    return {
      success: true,
      message: 'Successfully triggered refresh of all data types'
    };
  } catch (error) {
    console.error('Error in refreshAllData:', error);
    throw error;
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

    return {
      freshnessStatus,
      lastSync,
      overallStale,
      hasErrors,
      summary: {
        totalDataTypes: freshnessStatus.length,
        staleDataTypes: freshnessStatus.filter(s => s.isStale).length,
        errorDataTypes: freshnessStatus.filter(s => s.errorMessage).length
      }
    };
  } catch (error) {
    console.error('Error getting comprehensive data status:', error);
    throw error;
  }
};

// Utility function to format data status for display
export const formatDataStatusMessage = (status: DataFreshnessStatus[]): string => {
  const staleItems = status.filter(s => s.isStale);
  const errorItems = status.filter(s => s.errorMessage);

  if (errorItems.length > 0) {
    return `${errorItems.length} data type(s) have errors. Please refresh.`;
  }

  if (staleItems.length === 0) {
    return 'All data is fresh and up to date.';
  }

  if (staleItems.length === status.length) {
    return 'All data is stale. Please refresh.';
  }

  return `${staleItems.length} of ${status.length} data types are stale.`;
};
