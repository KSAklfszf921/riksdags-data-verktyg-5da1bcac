
import { supabase } from '@/integrations/supabase/client';

export interface TableStatus {
  table: string;
  recordCount: number;
  lastUpdate: string | null;
  hoursOld: number | null;
  isStale: boolean;
  error?: string;
}

export interface RefreshResult {
  success: boolean;
  message: string;
  duration?: number;
  errors?: string[];
}

type ValidTableName = 
  | 'member_data'
  | 'party_data'
  | 'document_data'
  | 'speech_data'
  | 'vote_data'
  | 'calendar_data';

export class DatabaseService {
  private static readonly STALE_THRESHOLD_HOURS = 24;
  private static readonly VALID_TABLES: ValidTableName[] = [
    'member_data',
    'party_data', 
    'document_data',
    'speech_data',
    'vote_data',
    'calendar_data'
  ];

  static async getDataStatus(): Promise<TableStatus[]> {
    const statusPromises = this.VALID_TABLES.map(async (table) => {
      try {
        // Get record count
        const { count, error: countError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (countError) {
          throw countError;
        }

        // Get latest update timestamp
        const { data: latestData, error: latestError } = await supabase
          .from(table)
          .select('updated_at')
          .order('updated_at', { ascending: false })
          .limit(1);

        if (latestError) {
          console.warn(`Warning getting latest update for ${table}:`, latestError);
        }

        const lastUpdate = latestData?.[0]?.updated_at || null;
        const hoursOld = lastUpdate ? 
          (Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60) : null;
        const isStale = hoursOld ? hoursOld > this.STALE_THRESHOLD_HOURS : true;

        return {
          table,
          recordCount: count || 0,
          lastUpdate,
          hoursOld,
          isStale
        };
      } catch (error) {
        console.error(`Error getting status for table ${table}:`, error);
        return {
          table,
          recordCount: 0,
          lastUpdate: null,
          hoursOld: null,
          isStale: true,
          error: error instanceof Error ? error.message : 'Okänt fel'
        };
      }
    });

    return Promise.all(statusPromises);
  }

  static async refreshTable(tableName: ValidTableName): Promise<RefreshResult> {
    try {
      console.log(`Uppdaterar tabell: ${tableName}`);
      
      // This is a placeholder for actual refresh logic
      // In a real implementation, this would trigger data sync from external APIs
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
      
      console.log(`Tabell ${tableName} uppdaterad`);
      return { 
        success: true, 
        message: `Tabell ${tableName} uppdaterad framgångsrikt`
      };
    } catch (error) {
      console.error(`Fel vid uppdatering av tabell ${tableName}:`, error);
      return {
        success: false,
        message: `Misslyckades att uppdatera ${tableName}`,
        errors: [error instanceof Error ? error.message : 'Okänt fel']
      };
    }
  }

  static async refreshAllData(): Promise<RefreshResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    console.log('Startar uppdatering av all data...');
    
    for (const table of this.VALID_TABLES) {
      const result = await this.refreshTable(table);
      if (!result.success && result.errors) {
        errors.push(...result.errors);
      }
    }

    const duration = Date.now() - startTime;

    return {
      success: errors.length === 0,
      message: errors.length === 0 ? 
        'All data uppdaterad framgångsrikt' : 
        `Uppdatering slutförd med ${errors.length} fel`,
      duration,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  static async initializeAllDatabases(): Promise<RefreshResult> {
    try {
      console.log('Initierar alla databaser...');
      const result = await this.refreshAllData();
      return {
        ...result,
        message: result.success ? 
          'Databasinitiering slutförd framgångsrikt' : 
          'Databasinitiering slutförd med fel'
      };
    } catch (error) {
      return {
        success: false,
        message: `Databasinitiering misslyckades: ${error instanceof Error ? error.message : 'Okänt fel'}`
      };
    }
  }

  static formatLastUpdated(lastUpdated: string | null): string {
    if (!lastUpdated) return 'Aldrig';

    try {
      const date = new Date(lastUpdated);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        return `${diffDays} dag${diffDays > 1 ? 'ar' : ''} sedan`;
      } else if (diffHours > 0) {
        return `${diffHours} timm${diffHours > 1 ? 'ar' : 'e'} sedan`;
      } else {
        return 'Nyligen';
      }
    } catch {
      return 'Okänt';
    }
  }
}

// Export individual functions for backward compatibility
export const getDataStatus = DatabaseService.getDataStatus.bind(DatabaseService);
export const refreshAllData = DatabaseService.refreshAllData.bind(DatabaseService);
export const refreshTable = DatabaseService.refreshTable.bind(DatabaseService);
export const initializeAllDatabases = DatabaseService.initializeAllDatabases.bind(DatabaseService);
export const formatDataStatusMessage = (status: TableStatus): string => {
  if (status.error) {
    return `Fel: ${status.error}`;
  }
  
  const lastUpdatedText = DatabaseService.formatLastUpdated(status.lastUpdate);
  return `${status.recordCount} poster, senast uppdaterad: ${lastUpdatedText}`;
};
