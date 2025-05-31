
import { CalendarTester, TestResult } from './testUtils';

export interface RiksdagApiTestConfig {
  baseUrl: string;
  endpoints: string[];
  timeout: number;
}

export class RiksdagApiTester extends CalendarTester {
  private config: RiksdagApiTestConfig;

  constructor(config?: Partial<RiksdagApiTestConfig>) {
    super();
    this.config = {
      baseUrl: 'https://data.riksdagen.se',
      endpoints: [
        '/kalender/?utformat=json&sz=10',
        '/kalender/?utformat=json&sz=10&org=kamm',
        '/kalender/?utformat=json&sz=10&typ=sammantrade'
      ],
      timeout: 30000,
      ...config
    };
  }

  async testDirectApiAccess(): Promise<TestResult> {
    return this.runTest('Direct Riksdag API Access', async () => {
      const endpoint = this.config.endpoints[0];
      const url = `${this.config.baseUrl}${endpoint}`;
      
      console.log(`Testing direct API access to: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Calendar-Test/1.0'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          const text = await response.text();
          if (text.trim().startsWith('<')) {
            throw new Error('Received HTML instead of JSON (likely error page)');
          }
        }
        
        const data = await response.json();
        
        // Validate response structure
        if (!data.kalender) {
          throw new Error('Missing kalender property in response');
        }
        
        console.log(`API Response structure:`, Object.keys(data));
        if (data.kalender.händelse) {
          const events = Array.isArray(data.kalender.händelse) 
            ? data.kalender.händelse 
            : [data.kalender.händelse];
          console.log(`Found ${events.length} calendar events`);
        }
        
        return {
          url,
          status: response.status,
          data: data,
          hasEvents: !!data.kalender?.händelse
        };
      } finally {
        clearTimeout(timeoutId);
      }
    });
  }

  async testMultipleEndpoints(): Promise<TestResult> {
    return this.runTest('Multiple API Endpoints', async () => {
      const results = [];
      
      for (const endpoint of this.config.endpoints) {
        const url = `${this.config.baseUrl}${endpoint}`;
        console.log(`Testing endpoint: ${endpoint}`);
        
        try {
          const response = await fetch(url, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Calendar-Test/1.0'
            }
          });
          
          results.push({
            endpoint,
            status: response.status,
            success: response.ok,
            contentType: response.headers.get('content-type')
          });
        } catch (error) {
          results.push({
            endpoint,
            status: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      console.log(`Endpoint test results: ${successCount}/${results.length} successful`);
      
      return {
        total: results.length,
        successful: successCount,
        results
      };
    });
  }

  async testApiResponseTime(): Promise<TestResult> {
    return this.runTest('API Response Time', async () => {
      const url = `${this.config.baseUrl}${this.config.endpoints[0]}`;
      const measurements = [];
      
      for (let i = 0; i < 3; i++) {
        const start = Date.now();
        
        try {
          const response = await fetch(url, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Calendar-Test/1.0'
            }
          });
          
          const duration = Date.now() - start;
          measurements.push({
            attempt: i + 1,
            duration,
            status: response.status,
            success: response.ok
          });
          
          console.log(`Attempt ${i + 1}: ${duration}ms (${response.status})`);
        } catch (error) {
          const duration = Date.now() - start;
          measurements.push({
            attempt: i + 1,
            duration,
            status: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
        
        // Small delay between requests
        if (i < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      const avgDuration = measurements.reduce((sum, m) => sum + m.duration, 0) / measurements.length;
      console.log(`Average response time: ${avgDuration.toFixed(2)}ms`);
      
      return {
        measurements,
        averageResponseTime: avgDuration,
        successRate: measurements.filter(m => m.success).length / measurements.length * 100
      };
    });
  }
}
