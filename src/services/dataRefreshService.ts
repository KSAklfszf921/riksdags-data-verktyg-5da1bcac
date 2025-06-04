
import { supabase } from '@/integrations/supabase/client';

type ValidTableName = 
  | 'enhanced_member_profiles'
  | 'calendar_data'
  | 'document_data'
  | 'language_analysis'
  | 'member_news'
  | 'party_data'
  | 'vote_data';

interface RefreshOptions {
  maxAge?: number; // in hours
  forceRefresh?: boolean;
}

interface TableStats {
  tableName: string;
  recordCount: number;
  lastUpdated: string | null;
  isStale: boolean;
}

class DataRefreshService {
  private readonly validTables: ValidTableName[] = [
    'enhanced_member_profiles',
    'calendar_data',
    'document_data',
    'language_analysis',
    'member_news',
    'party_data',
    'vote_data'
  ];

  async getTableStats(tableName: ValidTableName): Promise<TableStats> {
    try {
      // Get record count
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw countError;
      }

      // Get last updated timestamp - different tables have different timestamp columns
      let lastUpdatedQuery;
      if (tableName === 'enhanced_member_profiles') {
        lastUpdatedQuery = supabase
          .from(tableName)
          .select('updated_at')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
      } else {
        lastUpdatedQuery = supabase
          .from(tableName)
          .select('updated_at')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
      }

      const { data: lastRecord, error: lastError } = await lastUpdatedQuery;

      const lastUpdated = lastRecord?.updated_at || null;
      const isStale = this.isDataStale(lastUpdated, 24); // 24 hours default

      return {
        tableName,
        recordCount: count || 0,
        lastUpdated,
        isStale
      };
    } catch (error) {
      console.error(`Error getting stats for ${tableName}:`, error);
      return {
        tableName,
        recordCount: 0,
        lastUpdated: null,
        isStale: true
      };
    }
  }

  async getAllTableStats(): Promise<TableStats[]> {
    const statsPromises = this.validTables.map(table => this.getTableStats(table));
    return Promise.all(statsPromises);
  }

  private isDataStale(lastUpdated: string | null, maxAgeHours: number): boolean {
    if (!lastUpdated) return true;
    
    const lastUpdateTime = new Date(lastUpdated);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceUpdate > maxAgeHours;
  }

  async refreshTable(tableName: ValidTableName, options: RefreshOptions = {}): Promise<boolean> {
    const { maxAge = 24, forceRefresh = false } = options;

    try {
      // Check if refresh is needed
      if (!forceRefresh) {
        const stats = await this.getTableStats(tableName);
        if (!stats.isStale) {
          console.log(`Table ${tableName} is up to date, skipping refresh`);
          return true;
        }
      }

      console.log(`Refreshing table: ${tableName}`);

      // Use appropriate edge function based on table
      let functionName: string;
      let payload: any = {};

      switch (tableName) {
        case 'enhanced_member_profiles':
          functionName = 'fetch-comprehensive-data';
          payload = { dataType: 'members' };
          break;
        case 'party_data':
          functionName = 'fetch-party-data';
          break;
        case 'calendar_data':
          functionName = 'fetch-comprehensive-data';
          payload = { dataType: 'calendar' };
          break;
        case 'document_data':
          functionName = 'fetch-comprehensive-data';
          payload = { dataType: 'documents' };
          break;
        case 'vote_data':
          functionName = 'fetch-comprehensive-data';
          payload = { dataType: 'votes' };
          break;
        default:
          console.log(`No refresh function available for table: ${tableName}`);
          return false;
      }

      const { error } = await supabase.functions.invoke(functionName, {
        body: payload
      });

      if (error) {
        console.error(`Error refreshing ${tableName}:`, error);
        return false;
      }

      console.log(`Successfully refreshed ${tableName}`);
      return true;

    } catch (error) {
      console.error(`Failed to refresh ${tableName}:`, error);
      return false;
    }
  }

  async refreshAllStaleData(options: RefreshOptions = {}): Promise<{
    refreshed: string[];
    failed: string[];
    skipped: string[];
  }> {
    const refreshed: string[] = [];
    const failed: string[] = [];
    const skipped: string[] = [];

    console.log('Starting comprehensive data refresh...');

    for (const table of this.validTables) {
      try {
        const success = await this.refreshTable(table, options);
        if (success) {
          refreshed.push(table);
        } else {
          failed.push(table);
        }
      } catch (error) {
        console.error(`Error refreshing ${table}:`, error);
        failed.push(table);
      }

      // Add delay between table refreshes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`Refresh complete. Refreshed: ${refreshed.length}, Failed: ${failed.length}, Skipped: ${skipped.length}`);

    return { refreshed, failed, skipped };
  }

  async getSystemHealthSummary(): Promise<{
    totalTables: number;
    healthyTables: number;
    staleTables: number;
    emptyTables: number;
    overallHealth: 'good' | 'warning' | 'critical';
  }> {
    const stats = await this.getAllTableStats();
    
    const totalTables = stats.length;
    const staleTables = stats.filter(s => s.isStale).length;
    const emptyTables = stats.filter(s => s.recordCount === 0).length;
    const healthyTables = totalTables - staleTables - emptyTables;

    let overallHealth: 'good' | 'warning' | 'critical';
    if (staleTables === 0 && emptyTables === 0) {
      overallHealth = 'good';
    } else if (staleTables <= 2 || emptyTables <= 1) {
      overallHealth = 'warning';
    } else {
      overallHealth = 'critical';
    }

    return {
      totalTables,
      healthyTables,
      staleTables,
      emptyTables,
      overallHealth
    };
  }
}

export const dataRefreshService = new DataRefreshService();
export type { ValidTableName, RefreshOptions, TableStats };
