
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncStats {
  startTime: number;
  processed: number;
  errors: number;
  duplicates: number;
  apiCalls: number;
}

interface RiksdagApiResponse {
  dokumentlista?: {
    '@antal': string;
    dokument?: any[];
  };
  personlista?: {
    '@antal': string;
    person?: any[];
  };
  votering?: any[];
  anforande?: any[];
}

// Enhanced API client with retry logic and rate limiting
class RiksdagApiClient {
  private readonly baseUrl = 'https://data.riksdagen.se';
  private readonly maxRetries = 4;
  private readonly retryDelay = 1000;
  private lastRequestTime = 0;
  private readonly minRequestInterval = 100; // 100ms between requests

  async fetchWithRetry(url: string, retries = 0): Promise<RiksdagApiResponse> {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();

    console.log(`📡 Fetching: ${url} (attempt ${retries + 1}/${this.maxRetries})`);
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Fetch successful, data keys: ${Object.keys(data).join(', ')}`);
      return data;
    } catch (error) {
      console.error(`❌ Fetch attempt ${retries + 1} failed:`, error.message);
      
      if (retries < this.maxRetries - 1) {
        const delay = this.retryDelay * Math.pow(2, retries); // Exponential backoff
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, retries + 1);
      }
      
      throw new Error(`Failed after ${this.maxRetries} attempts: ${error.message}`);
    }
  }
}

// Enhanced database manager with conflict resolution
class DatabaseManager {
  constructor(private supabase: any) {}

  async safeBatchInsert(tableName: string, data: any[], conflictColumns: string[]): Promise<{
    successful: number;
    conflicts: number;
    errors: string[];
  }> {
    const batchSize = 25;
    let successful = 0;
    let conflicts = 0;
    const errors: string[] = [];

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      try {
        const { data: result, error } = await this.supabase
          .from(tableName)
          .upsert(batch, { 
            onConflict: conflictColumns.join(','),
            ignoreDuplicates: false 
          });

        if (error) {
          if (error.code === '21000') {
            // Handle duplicate constraint violation
            console.log(`⚠️ Batch conflict detected, using individual inserts for safety`);
            const individualResults = await this.insertIndividually(tableName, batch, conflictColumns);
            successful += individualResults.successful;
            conflicts += individualResults.conflicts;
            errors.push(...individualResults.errors);
          } else {
            console.error(`❌ Batch insert error:`, error);
            errors.push(`Batch ${i}-${i + batch.length}: ${error.message}`);
          }
        } else {
          successful += batch.length;
          console.log(`✅ Batch stored: ${batch.length}/${batch.length} ${tableName}`);
        }
      } catch (exception) {
        console.error(`❌ Batch insert exception:`, exception);
        errors.push(`Batch ${i}-${i + batch.length}: ${exception.message}`);
      }
    }

    return { successful, conflicts, errors };
  }

  private async insertIndividually(tableName: string, batch: any[], conflictColumns: string[]): Promise<{
    successful: number;
    conflicts: number;
    errors: string[];
  }> {
    let successful = 0;
    let conflicts = 0;
    const errors: string[] = [];

    for (const item of batch) {
      try {
        const { error } = await this.supabase
          .from(tableName)
          .upsert([item], { 
            onConflict: conflictColumns.join(','),
            ignoreDuplicates: false 
          });

        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            conflicts++;
          } else {
            errors.push(`Item ${item.id || 'unknown'}: ${error.message}`);
          }
        } else {
          successful++;
        }
      } catch (exception) {
        errors.push(`Item ${item.id || 'unknown'}: ${exception.message}`);
      }
    }

    return { successful, conflicts, errors };
  }
}

// Enhanced sync manager for each data type
class ComprehensiveDataSyncer {
  private apiClient: RiksdagApiClient;
  private dbManager: DatabaseManager;
  private stats: SyncStats;

  constructor(private supabase: any) {
    this.apiClient = new RiksdagApiClient();
    this.dbManager = new DatabaseManager(supabase);
    this.stats = {
      startTime: Date.now(),
      processed: 0,
      errors: 0,
      duplicates: 0,
      apiCalls: 0
    };
  }

  async syncDocuments(fromYear = 2020, toYear = new Date().getFullYear()): Promise<void> {
    console.log(`📚 Starting document sync: ${fromYear}-${toYear}`);
    let totalDocuments = 0;

    for (let year = fromYear; year <= toYear; year++) {
      for (let month = 1; month <= 12; month++) {
        // Skip future months
        const now = new Date();
        if (year === now.getFullYear() && month > now.getMonth() + 1) {
          break;
        }

        const yearMonth = `${year}-${month.toString().padStart(2, '0')}`;
        console.log(`\n🗓️ Processing ${yearMonth}`);

        const fromDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const toDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

        console.log(`📅 Fetching documents for ${yearMonth} (${fromDate} to ${toDate})`);

        let page = 1;
        let monthDocuments = 0;

        while (true) {
          const url = `${this.apiClient['baseUrl']}/dokumentlista/?utformat=json&from=${fromDate}&tom=${toDate}&sz=500&p=${page}&sort=datum&sortorder=desc`;
          
          try {
            const data = await this.apiClient.fetchWithRetry(url);
            this.stats.apiCalls++;

            if (!data.dokumentlista?.dokument) {
              console.log(`📄 Month ${yearMonth}, page ${page}: No more documents found`);
              break;
            }

            const documents = Array.isArray(data.dokumentlista.dokument) 
              ? data.dokumentlista.dokument 
              : [data.dokumentlista.dokument];

            if (documents.length === 0) {
              console.log(`📄 Month ${yearMonth}, page ${page}: Empty page, stopping`);
              break;
            }

            console.log(`📄 Month ${yearMonth}, page ${page}: Found ${documents.length} documents (total: ${monthDocuments + documents.length})`);

            // Transform documents for database
            const transformedDocs = documents.map(doc => ({
              document_id: doc.id || doc.dok_id,
              titel: doc.titel || '',
              typ: doc.typ || '',
              datum: doc.datum || '',
              beteckning: doc.beteckning || '',
              organ: doc.organ || '',
              rm: doc.rm || '',
              publicerad: doc.publicerad || '',
              dokumentstatus: doc.dokumentstatus || '',
              party: doc.parti || '',
              intressent_id: doc.intressent?.intressent_id || '',
              document_url_html: doc.dokument_url_html || '',
              document_url_text: doc.dokument_url_text || '',
              hangar_id: doc.hangar_id || '',
              metadata: {
                source: 'riksdag_api',
                sync_date: new Date().toISOString(),
                api_page: page,
                month_batch: yearMonth
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }));

            monthDocuments += documents.length;

            // Store documents in batches
            if (transformedDocs.length > 0) {
              console.log(`💾 Storing ${transformedDocs.length} documents`);
              const result = await this.dbManager.safeBatchInsert(
                'document_data', 
                transformedDocs, 
                ['document_id']
              );
              this.stats.processed += result.successful;
              this.stats.duplicates += result.conflicts;
              this.stats.errors += result.errors.length;
            }

            // Check if we got fewer documents than requested (last page)
            if (documents.length < 500) {
              console.log(`📄 Month ${yearMonth}: Reached last page (${documents.length} < 500)`);
              break;
            }

            page++;
          } catch (error) {
            console.error(`❌ Error processing ${yearMonth}, page ${page}:`, error);
            this.stats.errors++;
            break; // Move to next month on error
          }
        }

        console.log(`📚 Month ${yearMonth}: Total ${monthDocuments} documents fetched`);
        console.log(`✅ Month ${yearMonth} complete: ${monthDocuments} documents (running total: ${totalDocuments + monthDocuments})`);
        totalDocuments += monthDocuments;

        // Small delay between months to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`🎉 Document sync complete: ${totalDocuments} total documents processed`);
  }

  async syncMembers(): Promise<void> {
    console.log(`👥 Starting member sync`);
    
    const url = `${this.apiClient['baseUrl']}/personlista/?utformat=json&rdlstatus=samtliga&sz=1000&sort=sorteringsnamn`;
    
    try {
      const data = await this.apiClient.fetchWithRetry(url);
      this.stats.apiCalls++;

      if (!data.personlista?.person) {
        throw new Error('No member data found in API response');
      }

      const members = Array.isArray(data.personlista.person) 
        ? data.personlista.person 
        : [data.personlista.person];

      console.log(`👥 Found ${members.length} members to process`);

      // Transform members for database
      const transformedMembers = members.map(member => ({
        member_id: member.intressent_id,
        first_name: member.tilltalsnamn || '',
        last_name: member.efternamn || '',
        full_name: `${member.tilltalsnamn || ''} ${member.efternamn || ''}`.trim(),
        party: member.parti || '',
        constituency: member.valkrets || null,
        gender: member.kon || null,
        birth_year: member.fodd_ar ? parseInt(member.fodd_ar) : null,
        birth_date: member.fodd ? new Date(member.fodd).toISOString().split('T')[0] : null,
        is_active: member.status === 'aktiv',
        riksdag_status: member.status || 'Riksdagsledamot',
        sync_version: '2.0',
        sync_source: 'riksdag_api_comprehensive',
        last_sync_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Store members
      console.log(`💾 Storing ${transformedMembers.length} members`);
      const result = await this.dbManager.safeBatchInsert(
        'enhanced_member_profiles', 
        transformedMembers, 
        ['member_id']
      );
      
      this.stats.processed += result.successful;
      this.stats.duplicates += result.conflicts;
      this.stats.errors += result.errors.length;

      console.log(`✅ Member sync complete: ${result.successful} processed, ${result.conflicts} conflicts`);
    } catch (error) {
      console.error(`❌ Member sync failed:`, error);
      this.stats.errors++;
      throw error;
    }
  }

  async syncVotes(fromYear = 2020): Promise<void> {
    console.log(`🗳️ Starting vote sync from ${fromYear}`);
    
    const currentYear = new Date().getFullYear();
    
    for (let year = fromYear; year <= currentYear; year++) {
      console.log(`\n📊 Processing votes for ${year}`);
      
      const url = `${this.apiClient['baseUrl']}/voteringlista/?utformat=json&rm=${year.toString().slice(-2)}&sz=1000`;
      
      try {
        const data = await this.apiClient.fetchWithRetry(url);
        this.stats.apiCalls++;

        if (!data.votering) {
          console.log(`🗳️ No votes found for ${year}`);
          continue;
        }

        const votes = Array.isArray(data.votering) ? data.votering : [data.votering];
        console.log(`🗳️ Found ${votes.length} votes for ${year}`);

        // Transform votes for database
        const transformedVotes = votes.map(vote => ({
          vote_id: vote.votering_id,
          rm: vote.rm || '',
          beteckning: vote.beteckning || '',
          punkt: vote.punkt || '',
          avser: vote.avser || '',
          votering: vote.votering || '',
          systemdatum: vote.systemdatum || '',
          dok_id: vote.dok_id || '',
          hangar_id: vote.hangar_id || '',
          metadata: {
            source: 'riksdag_api',
            sync_date: new Date().toISOString(),
            year_batch: year
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        // Store votes
        if (transformedVotes.length > 0) {
          console.log(`💾 Storing ${transformedVotes.length} votes`);
          const result = await this.dbManager.safeBatchInsert(
            'vote_data', 
            transformedVotes, 
            ['vote_id']
          );
          
          this.stats.processed += result.successful;
          this.stats.duplicates += result.conflicts;
          this.stats.errors += result.errors.length;
        }

        console.log(`✅ Year ${year} votes complete: ${transformedVotes.length} processed`);
      } catch (error) {
        console.error(`❌ Error processing votes for ${year}:`, error);
        this.stats.errors++;
      }
    }

    console.log(`🎉 Vote sync complete`);
  }

  async syncCalendar(): Promise<void> {
    console.log(`📅 Starting calendar sync`);
    
    // Get current and next month
    const now = new Date();
    const dates = [
      { year: now.getFullYear(), month: now.getMonth() + 1 },
      { year: now.getFullYear(), month: now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2 }
    ];

    for (const { year, month } of dates) {
      const yearMonth = `${year}-${month.toString().padStart(2, '0')}`;
      console.log(`📅 Processing calendar for ${yearMonth}`);

      const fromDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const toDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

      const url = `${this.apiClient['baseUrl']}/aktivitetslista/?utformat=json&from=${fromDate}&tom=${toDate}&sz=1000`;

      try {
        const data = await this.apiClient.fetchWithRetry(url);
        this.stats.apiCalls++;

        if (!data.aktivitetslista?.aktivitet) {
          console.log(`📅 No calendar events found for ${yearMonth}`);
          continue;
        }

        const events = Array.isArray(data.aktivitetslista.aktivitet) 
          ? data.aktivitetslista.aktivitet 
          : [data.aktivitetslista.aktivitet];

        console.log(`📅 Found ${events.length} calendar events for ${yearMonth}`);

        // Transform events for database
        const transformedEvents = events.map(event => ({
          event_id: event.id || `${event.datum}_${event.tid}_${event.organ}`,
          typ: event.typ || '',
          organ: event.organ || '',
          aktivitet: event.aktivitet || '',
          datum: event.datum || '',
          tid: event.tid || '',
          plats: event.plats || '',
          sekretess: event.sekretess || '',
          url: event.url || '',
          metadata: {
            source: 'riksdag_api',
            sync_date: new Date().toISOString(),
            month_batch: yearMonth
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        // Store events
        if (transformedEvents.length > 0) {
          console.log(`💾 Storing ${transformedEvents.length} calendar events`);
          const result = await this.dbManager.safeBatchInsert(
            'calendar_data', 
            transformedEvents, 
            ['event_id']
          );
          
          this.stats.processed += result.successful;
          this.stats.duplicates += result.conflicts;
          this.stats.errors += result.errors.length;
        }

        console.log(`✅ Calendar ${yearMonth} complete: ${transformedEvents.length} processed`);
      } catch (error) {
        console.error(`❌ Error processing calendar for ${yearMonth}:`, error);
        this.stats.errors++;
      }
    }

    console.log(`🎉 Calendar sync complete`);
  }

  getStats(): SyncStats & { duration: number; successRate: number } {
    const duration = Date.now() - this.stats.startTime;
    const total = this.stats.processed + this.stats.errors;
    const successRate = total > 0 ? (this.stats.processed / total) * 100 : 0;
    
    return {
      ...this.stats,
      duration,
      successRate
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { dataType = 'all' } = await req.json().catch(() => ({}));

    console.log(`🚀 Starting comprehensive data sync: ${dataType}`);

    // Log sync start
    const { data: syncRecord } = await supabase
      .from('automated_sync_status')
      .insert({
        sync_type: `comprehensive_${dataType}`,
        status: 'running',
        started_at: new Date().toISOString(),
        stats: { dataType, startTime: Date.now() }
      })
      .select()
      .single();

    const syncer = new ComprehensiveDataSyncer(supabase);

    try {
      // Perform sync based on data type
      switch (dataType) {
        case 'documents':
          await syncer.syncDocuments();
          break;
        case 'members':
          await syncer.syncMembers();
          break;
        case 'votes':
          await syncer.syncVotes();
          break;
        case 'calendar':
          await syncer.syncCalendar();
          break;
        case 'all':
        default:
          await syncer.syncMembers();
          await syncer.syncDocuments();
          await syncer.syncVotes();
          await syncer.syncCalendar();
          break;
      }

      const finalStats = syncer.getStats();
      
      // Update sync record
      if (syncRecord) {
        await supabase
          .from('automated_sync_status')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            stats: finalStats
          })
          .eq('id', syncRecord.id);
      }

      console.log(`✅ Comprehensive sync completed:`, finalStats);

      return new Response(JSON.stringify({
        success: true,
        stats: finalStats,
        message: `Sync completed successfully: ${finalStats.processed} items processed`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (syncError) {
      // Update sync record with error
      if (syncRecord) {
        await supabase
          .from('automated_sync_status')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: syncError.message,
            stats: syncer.getStats()
          })
          .eq('id', syncRecord.id);
      }

      throw syncError;
    }

  } catch (error) {
    console.error('❌ Comprehensive sync failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
