
import { CalendarTester, TestResult } from './testUtils';

export class RiksdagApiTester extends CalendarTester {

  async testDirectApiAccess(): Promise<TestResult> {
    return this.runTest('Direct API Access', async () => {
      console.log('Testing direct access to Riksdag calendar API...');
      
      const testUrls = [
        'https://data.riksdagen.se/kalender/?utformat=json&sz=5',
        'https://data.riksdagen.se/kalender/?utformat=json&sz=3&typ=sammanträde'
      ];

      const results = [];

      for (const url of testUrls) {
        try {
          const response = await fetch(url, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (compatible; Test-Client/1.0)'
            }
          });

          const responseText = await response.text();
          const isHtml = responseText.trim().startsWith('<');
          
          let jsonValid = false;
          let eventCount = 0;
          
          if (!isHtml) {
            try {
              const data = JSON.parse(responseText);
              jsonValid = true;
              
              // Check different response structures
              if (data.kalender?.händelse) {
                eventCount = Array.isArray(data.kalender.händelse) 
                  ? data.kalender.händelse.length 
                  : 1;
              } else if (data.kalenderlista?.kalender) {
                eventCount = Array.isArray(data.kalenderlista.kalender) 
                  ? data.kalenderlista.kalender.length 
                  : 1;
              }
            } catch (e) {
              jsonValid = false;
            }
          }

          results.push({
            url,
            status: response.status,
            isJson: !isHtml && jsonValid,
            eventCount,
            responseLength: responseText.length
          });

        } catch (error) {
          results.push({
            url,
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 0
          });
        }
      }

      const successfulRequests = results.filter(r => r.status === 200 && r.isJson);
      
      return {
        successful_requests: successfulRequests.length,
        total_requests: results.length,
        results,
        api_accessible: successfulRequests.length > 0
      };
    });
  }

  async testMultipleEndpoints(): Promise<TestResult> {
    return this.runTest('Multiple Endpoints', async () => {
      console.log('Testing multiple Riksdag API endpoints...');

      const endpoints = [
        { url: 'https://data.riksdagen.se/kalender/?utformat=json&sz=10', name: 'Basic calendar' },
        { url: 'https://data.riksdagen.se/kalender/?utformat=json&sz=5&typ=sammanträde', name: 'Meetings only' },
        { url: 'https://data.riksdagen.se/kalender/?utformat=json&sz=5&org=kamm', name: 'Committee calendar' }
      ];

      const results = [];

      for (const endpoint of endpoints) {
        try {
          const startTime = Date.now();
          const response = await fetch(endpoint.url, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (compatible; Test-Client/1.0)'
            }
          });
          const duration = Date.now() - startTime;

          const responseText = await response.text();
          const isValidJson = !responseText.trim().startsWith('<');
          
          let eventCount = 0;
          if (isValidJson) {
            try {
              const data = JSON.parse(responseText);
              if (data.kalender?.händelse) {
                eventCount = Array.isArray(data.kalender.händelse) 
                  ? data.kalender.händelse.length 
                  : 1;
              } else if (data.kalenderlista?.kalender) {
                eventCount = Array.isArray(data.kalenderlista.kalender) 
                  ? data.kalenderlista.kalender.length 
                  : 1;
              }
            } catch (e) {
              // JSON parsing failed
            }
          }

          results.push({
            endpoint: endpoint.name,
            url: endpoint.url,
            status: response.status,
            duration,
            isValidJson,
            eventCount,
            success: response.status === 200 && isValidJson
          });

        } catch (error) {
          results.push({
            endpoint: endpoint.name,
            url: endpoint.url,
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false
          });
        }
      }

      return {
        endpoints_tested: endpoints.length,
        successful_endpoints: results.filter(r => r.success).length,
        results
      };
    });
  }

  async testApiResponseTime(): Promise<TestResult> {
    return this.runTest('API Response Time', async () => {
      console.log('Testing Riksdag API response times...');

      const testUrl = 'https://data.riksdagen.se/kalender/?utformat=json&sz=5';
      const measurements = [];

      // Take 3 measurements
      for (let i = 0; i < 3; i++) {
        try {
          const startTime = Date.now();
          const response = await fetch(testUrl, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (compatible; Test-Client/1.0)'
            }
          });
          const duration = Date.now() - startTime;

          const responseText = await response.text();
          const isValidResponse = response.status === 200 && !responseText.trim().startsWith('<');

          measurements.push({
            attempt: i + 1,
            duration,
            status: response.status,
            isValidResponse,
            responseSize: responseText.length
          });

          // Wait a bit between requests
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          measurements.push({
            attempt: i + 1,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const successfulMeasurements = measurements.filter(m => m.isValidResponse);
      const avgResponseTime = successfulMeasurements.length > 0 
        ? successfulMeasurements.reduce((sum, m) => sum + (m.duration || 0), 0) / successfulMeasurements.length
        : 0;

      return {
        measurements,
        average_response_time: Math.round(avgResponseTime),
        successful_requests: successfulMeasurements.length,
        total_requests: measurements.length
      };
    });
  }
}
