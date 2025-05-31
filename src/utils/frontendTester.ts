
import { CalendarTester, TestResult } from './testUtils';
import { supabase } from '@/integrations/supabase/client';

export class FrontendTester extends CalendarTester {

  async testComponentRendering(): Promise<TestResult> {
    return this.runTest('Component Rendering', async () => {
      console.log('Testing component rendering...');
      
      // Check if calendar components exist in DOM
      const components = [
        { name: 'Calendar Search', selector: '[data-testid="calendar-search"]' },
        { name: 'Calendar Manager', selector: '[data-testid="calendar-manager"]' },
        { name: 'Calendar View', selector: '[data-testid="calendar-view"]' }
      ];

      const results = components.map(comp => {
        const element = document.querySelector(comp.selector);
        return {
          component: comp.name,
          found: !!element,
          visible: element ? window.getComputedStyle(element).display !== 'none' : false
        };
      });

      // Check for any obvious React errors
      const errorElements = document.querySelectorAll('[data-react-error]');
      
      return {
        components: results,
        reactErrors: errorElements.length,
        totalComponents: components.length,
        renderedComponents: results.filter(r => r.found).length
      };
    });
  }

  async testDataBinding(): Promise<TestResult> {
    return this.runTest('Data Binding', async () => {
      console.log('Testing data binding...');
      
      // Test fetching calendar data
      const { data, error } = await supabase
        .from('calendar_data')
        .select('*')
        .limit(5);

      if (error) {
        throw new Error(`Data fetch failed: ${error.message}`);
      }

      // Simulate component state update
      const events = data || [];
      
      // Check if data can be processed by frontend functions
      const processedEvents = events.map(event => ({
        id: event.id,
        title: event.summary || event.aktivitet || 'Unnamed Event',
        date: event.datum || 'No date',
        organ: event.organ || 'Unknown',
        type: event.typ || 'Unknown'
      }));

      return {
        rawEvents: events.length,
        processedEvents: processedEvents.length,
        dataProcessing: 'success',
        sampleEvent: processedEvents[0] || null
      };
    });
  }

  async testUserInteractions(): Promise<TestResult> {
    return this.runTest('User Interactions', async () => {
      console.log('Testing user interactions...');
      
      const interactions = [];

      // Test search functionality
      try {
        const searchQuery = 'test';
        const { data: searchResults, error: searchError } = await supabase
          .from('calendar_data')
          .select('*')
          .or(`summary.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .limit(10);

        interactions.push({
          action: 'search',
          success: !searchError,
          results: searchResults?.length || 0,
          error: searchError?.message
        });
      } catch (error) {
        interactions.push({
          action: 'search',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test date filtering
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data: dateResults, error: dateError } = await supabase
          .from('calendar_data')
          .select('*')
          .gte('datum', today)
          .limit(10);

        interactions.push({
          action: 'date_filter',
          success: !dateError,
          results: dateResults?.length || 0,
          error: dateError?.message
        });
      } catch (error) {
        interactions.push({
          action: 'date_filter',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test organ filtering
      try {
        const { data: organResults, error: organError } = await supabase
          .from('calendar_data')
          .select('*')
          .eq('organ', 'kamm')
          .limit(10);

        interactions.push({
          action: 'organ_filter',
          success: !organError,
          results: organResults?.length || 0,
          error: organError?.message
        });
      } catch (error) {
        interactions.push({
          action: 'organ_filter',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      const successfulInteractions = interactions.filter(i => i.success).length;

      return {
        interactions,
        successRate: (successfulInteractions / interactions.length) * 100,
        totalTests: interactions.length
      };
    });
  }

  async testErrorHandling(): Promise<TestResult> {
    return this.runTest('Error Handling', async () => {
      console.log('Testing error handling...');
      
      const errorTests = [];

      // Test invalid query - using a valid table but invalid column
      try {
        const { data, error } = await supabase
          .from('calendar_data')
          .select('non_existent_column')
          .limit(1);

        errorTests.push({
          test: 'invalid_column',
          errorHandled: !!error,
          errorMessage: error?.message || 'No error'
        });
      } catch (error) {
        errorTests.push({
          test: 'invalid_column',
          errorHandled: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test invalid filter value
      try {
        const { data, error } = await supabase
          .from('calendar_data')
          .select('*')
          .eq('datum', 'invalid-date-format')
          .limit(1);

        errorTests.push({
          test: 'invalid_filter',
          errorHandled: !!error,
          errorMessage: error?.message || 'Query completed without error'
        });
      } catch (error) {
        errorTests.push({
          test: 'invalid_filter',
          errorHandled: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test empty result handling
      try {
        const { data, error } = await supabase
          .from('calendar_data')
          .select('*')
          .eq('event_id', 'definitely-non-existent-id-12345')
          .limit(1);

        errorTests.push({
          test: 'empty_result',
          errorHandled: !error && (!data || data.length === 0),
          errorMessage: error?.message || `Found ${data?.length || 0} results`
        });
      } catch (error) {
        errorTests.push({
          test: 'empty_result',
          errorHandled: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      const handledErrors = errorTests.filter(t => t.errorHandled).length;

      return {
        errorTests,
        errorHandlingRate: (handledErrors / errorTests.length) * 100,
        totalTests: errorTests.length
      };
    });
  }
}
