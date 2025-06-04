
import { supabase } from '@/integrations/supabase/client';

const BASE_URL = 'https://data.riksdagen.se';

interface RateLimiter {
  requests: number[];
  maxRequests: number;
  timeWindow: number;
}

class CalendarApiService {
  private rateLimiter: RateLimiter = {
    requests: [],
    maxRequests: 10, // Max 10 requests per time window
    timeWindow: 60000 // 1 minute window
  };

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Clean old requests outside time window
    this.rateLimiter.requests = this.rateLimiter.requests.filter(
      timestamp => now - timestamp < this.rateLimiter.timeWindow
    );
    
    // Check if we're at the limit
    if (this.rateLimiter.requests.length >= this.rateLimiter.maxRequests) {
      const oldestRequest = Math.min(...this.rateLimiter.requests);
      const waitTime = this.rateLimiter.timeWindow - (now - oldestRequest);
      
      console.log(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime + 1000));
      
      // Clean again after waiting
      this.rateLimiter.requests = this.rateLimiter.requests.filter(
        timestamp => Date.now() - timestamp < this.rateLimiter.timeWindow
      );
    }
    
    // Add current request
    this.rateLimiter.requests.push(now);
  }

  private async fetchWithRetry<T>(
    url: string, 
    maxRetries: number = 3,
    baseDelay: number = 2000
  ): Promise<T | null> {
    let retries = 0;
    
    while (retries <= maxRetries) {
      try {
        // Check rate limit before making request
        await this.checkRateLimit();
        
        console.log(`Fetching calendar data from: ${url} (attempt ${retries + 1})`);
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'RiksdagMonitor/1.0',
            'Cache-Control': 'no-cache'
          }
        });

        if (!response.ok) {
          if (response.status === 429) {
            // Rate limited, wait longer
            const delay = baseDelay * Math.pow(2, retries) + 5000;
            console.log(`Rate limited (429), waiting ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
            retries++;
            continue;
          }
          
          if (response.status >= 500) {
            // Server error, retry
            throw new Error(`Server error: ${response.status}`);
          }
          
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        
        if (!text || text.trim() === '') {
          throw new Error('Empty response from API');
        }
        
        if (text.trim().startsWith('<')) {
          throw new Error('API returned HTML instead of JSON');
        }

        try {
          return JSON.parse(text);
        } catch (parseError) {
          throw new Error('Invalid JSON response from API');
        }
        
      } catch (error) {
        console.error(`Attempt ${retries + 1} failed:`, error);
        
        if (retries === maxRetries) {
          console.error(`All ${maxRetries + 1} attempts failed for ${url}`);
          return null;
        }
        
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, retries) + Math.random() * 1000;
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      }
    }
    
    return null;
  }

  async fetchCalendarEvents(params: any = {}): Promise<any[]> {
    try {
      const defaultParams = {
        utformat: 'json',
        sz: 100,
        sort: 'c',
        sortorder: 'asc',
        ...params
      };

      const queryParams = new URLSearchParams();
      Object.entries(defaultParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const url = `${BASE_URL}/kalender/?${queryParams.toString()}`;
      const data = await this.fetchWithRetry(url, 5, 3000);
      
      if (!data) {
        console.log('API request failed, returning mock data');
        return this.getMockEvents();
      }

      let events: any[] = [];
      
      if (data.kalender?.händelse) {
        events = Array.isArray(data.kalender.händelse) 
          ? data.kalender.händelse 
          : [data.kalender.händelse];
      } else if (data.kalenderlista?.kalender) {
        const kalenderData = Array.isArray(data.kalenderlista.kalender) 
          ? data.kalenderlista.kalender 
          : [data.kalenderlista.kalender];
        
        events = kalenderData.flatMap(k => 
          k.händelse ? (Array.isArray(k.händelse) ? k.händelse : [k.händelse]) : []
        );
      }

      console.log(`Successfully fetched ${events.length} calendar events`);
      return events;
      
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return this.getMockEvents();
    }
  }

  async fetchThisWeekEvents(): Promise<any[]> {
    try {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const params = {
        from: today.toISOString().split('T')[0],
        tom: nextWeek.toISOString().split('T')[0]
      };
      
      return await this.fetchCalendarEvents(params);
    } catch (error) {
      console.error('Error fetching this week events:', error);
      return this.getMockEvents().slice(0, 3);
    }
  }

  async storeEventsInDatabase(events: any[]): Promise<number> {
    if (events.length === 0) return 0;
    
    try {
      const eventsToStore = events.map((event, index) => ({
        event_id: event.id || event.händelse_id || `event-${Date.now()}-${index}`,
        datum: event.datum || null,
        tid: event.tid || event.tid_från || null,
        typ: event.typ || null,
        aktivitet: event.aktivitet || event.titel || null,
        plats: event.plats || event.lokal || null,
        organ: event.organ || null,
        summary: event.summary || event.kort_beskrivning || null,
        description: event.beskrivning || event.innehåll || null,
        status: event.status || 'planerad',
        url: event.url || event.länk || null,
        sekretess: event.sekretess || 'öppen',
        participants: event.deltagare || null,
        related_documents: event.dokument || null,
        metadata: {
          source: 'enhanced_calendar_api',
          fetched_at: new Date().toISOString(),
          api_version: '2.0'
        }
      }));
      
      let stored = 0;
      const batchSize = 25;
      
      for (let i = 0; i < eventsToStore.length; i += batchSize) {
        const batch = eventsToStore.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from('calendar_data')
          .upsert(batch, { 
            onConflict: 'event_id',
            ignoreDuplicates: false 
          })
          .select('id');
        
        if (error) {
          console.error('Batch insert error:', error);
        } else {
          stored += data?.length || 0;
          console.log(`Stored batch: ${data?.length || 0}/${batch.length} events`);
        }
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      return stored;
    } catch (error) {
      console.error('Error storing events in database:', error);
      return 0;
    }
  }

  private getMockEvents(): any[] {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
    
    return [
      {
        id: 'mock-1',
        datum: today.toISOString().split('T')[0],
        titel: 'Kammaren sammanträder',
        typ: 'sammantrade',
        org: 'kamm',
        tid: '09:00',
        plats: 'Kammarens plenisal',
        beskrivning: 'Ordinarie sammanträde i kammaren (mock data)',
        status: 'Bekräftad'
      },
      {
        id: 'mock-2',
        datum: tomorrow.toISOString().split('T')[0],
        titel: 'Finansutskottets sammanträde',
        typ: 'sammantrade',
        org: 'FiU',
        tid: '10:00',
        plats: 'Utskottssalen',
        beskrivning: 'Finansutskottets ordinarie sammanträde (mock data)',
        status: 'Bekräftad'
      },
      {
        id: 'mock-3',
        datum: dayAfter.toISOString().split('T')[0],
        titel: 'Aktuell debatt',
        typ: 'debatt',
        org: 'kamm',
        tid: '14:00',
        plats: 'Kammarens plenisal',
        beskrivning: 'Aktuell debatt om samhällsfrågor (mock data)',
        status: 'Bekräftad'
      }
    ];
  }
}

export const enhancedCalendarApi = new CalendarApiService();
