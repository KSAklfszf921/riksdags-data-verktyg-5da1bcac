
import { supabase } from '@/integrations/supabase/client';
import { CalendarTester, TestResult } from './testUtils';

export class EdgeFunctionTester extends CalendarTester {
  
  async testCalendarDataSync(): Promise<TestResult> {
    return this.runTest('Calendar Data Sync Edge Function', async () => {
      console.log('Testing fetch-calendar-data edge function...');
      
      const { data, error } = await supabase.functions.invoke('fetch-calendar-data', {
        body: { 
          manual_trigger: true,
          test_mode: true,
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }

      console.log('Edge function response:', data);

      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from edge function');
      }

      const expectedFields = ['success', 'message'];
      for (const field of expectedFields) {
        if (!(field in data)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      return {
        success: data.success,
        message: data.message,
        stats: data.stats || {},
        responseTime: Date.now()
      };
    });
  }

  async testEdgeFunctionError(): Promise<TestResult> {
    return this.runTest('Edge Function Error Handling', async () => {
      console.log('Testing edge function error handling...');
      
      try {
        const { data, error } = await supabase.functions.invoke('fetch-calendar-data', {
          body: { 
            invalid_parameter: 'test_error_handling'
          }
        });

        // Even with invalid parameters, the function should return a response
        return {
          handledGracefully: !error,
          response: data,
          error: error?.message
        };
      } catch (error) {
        // Network or connection errors
        return {
          handledGracefully: false,
          networkError: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }

  async testEdgeFunctionTimeout(): Promise<TestResult> {
    return this.runTest('Edge Function Timeout Handling', async () => {
      console.log('Testing edge function with timeout...');
      
      const timeout = 30000; // 30 seconds
      const startTime = Date.now();
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const { data, error } = await supabase.functions.invoke('fetch-calendar-data', {
          body: { 
            manual_trigger: true,
            timestamp: new Date().toISOString()
          }
        });
        
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;
        
        return {
          completed: !error,
          duration,
          withinTimeout: duration < timeout,
          response: data,
          error: error?.message
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        return {
          completed: false,
          duration,
          withinTimeout: duration < timeout,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }
}
