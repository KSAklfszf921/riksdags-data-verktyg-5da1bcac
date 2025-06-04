
export interface DetailedTestResult {
  name: string;
  success: boolean;
  message: string;
  duration: number;
  errorType?: 'API_ERROR' | 'DATA_ERROR' | 'VALIDATION_ERROR' | 'SYSTEM_ERROR';
  errorDetails?: {
    errorMessage?: string;
    apiEndpoint?: string;
    statusCode?: number;
    stackTrace?: string;
  };
  data?: any;
}

export interface TestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  successRate: number;
  totalDuration: number;
  averageDuration: number;
}

export interface EnhancedTestSuite {
  name: string;
  results: DetailedTestResult[];
  summary: TestSuiteSummary;
  startTime: Date;
  endTime?: Date;
}

export const createTestSuite = (name: string): EnhancedTestSuite => ({
  name,
  results: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    successRate: 0,
    totalDuration: 0,
    averageDuration: 0
  },
  startTime: new Date()
});

export const calculateSummary = (results: DetailedTestResult[]): TestSuiteSummary => {
  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = total - passed;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  return {
    total,
    passed,
    failed,
    successRate: total > 0 ? (passed / total) * 100 : 0,
    totalDuration,
    averageDuration: total > 0 ? totalDuration / total : 0
  };
};

export class EnhancedTester {
  protected testSuite: EnhancedTestSuite;
  protected results: DetailedTestResult[] = [];

  constructor(suiteName: string) {
    this.testSuite = createTestSuite(suiteName);
  }

  async runTest(name: string, testFn: () => Promise<any>): Promise<DetailedTestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 Running test: ${name}`);
      const data = await testFn();
      const duration = Date.now() - startTime;
      
      const result: DetailedTestResult = {
        name,
        success: true,
        message: 'Test passed successfully',
        duration,
        data
      };
      
      this.results.push(result);
      this.testSuite.results = this.results;
      console.log(`✅ ${name} - PASSED (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const result: DetailedTestResult = {
        name,
        success: false,
        message: errorMessage,
        duration,
        errorType: 'SYSTEM_ERROR',
        errorDetails: {
          errorMessage,
          stackTrace: error instanceof Error ? error.stack : undefined
        }
      };
      
      this.results.push(result);
      this.testSuite.results = this.results;
      console.error(`❌ ${name} - FAILED (${duration}ms):`, error);
      return result;
    }
  }

  getSummary(): EnhancedTestSuite {
    this.testSuite.summary = calculateSummary(this.results);
    this.testSuite.endTime = new Date();
    return this.testSuite;
  }

  getResults(): DetailedTestResult[] {
    return this.results;
  }
}
