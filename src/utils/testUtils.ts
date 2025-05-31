
// Test utilities for calendar functionality
export interface TestResult {
  name: string;
  success: boolean;
  message: string;
  duration: number;
  data?: any;
}

export interface TestSuite {
  name: string;
  results: TestResult[];
  startTime: number;
  endTime?: number;
}

export class CalendarTester {
  private results: TestResult[] = [];
  private startTime: number = 0;

  constructor() {
    this.startTime = Date.now();
  }

  async runTest(name: string, testFn: () => Promise<any>): Promise<TestResult> {
    const start = Date.now();
    
    try {
      console.log(`🧪 Running test: ${name}`);
      const data = await testFn();
      const duration = Date.now() - start;
      
      const result: TestResult = {
        name,
        success: true,
        message: 'Test passed',
        duration,
        data
      };
      
      this.results.push(result);
      console.log(`✅ ${name} - PASSED (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      const result: TestResult = {
        name,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
      
      this.results.push(result);
      console.error(`❌ ${name} - FAILED (${duration}ms):`, error);
      return result;
    }
  }

  getSummary(): TestSuite {
    return {
      name: 'Calendar Test Suite',
      results: this.results,
      startTime: this.startTime,
      endTime: Date.now()
    };
  }

  getSuccessRate(): number {
    const passed = this.results.filter(r => r.success).length;
    return this.results.length > 0 ? (passed / this.results.length) * 100 : 0;
  }
}

export const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

export const generateTestId = (): string => 
  `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
