
// Enhanced test utilities for comprehensive API and data testing
export interface DetailedTestResult {
  name: string;
  success: boolean;
  message: string;
  duration: number;
  data?: any;
  errorType?: 'API_ERROR' | 'DATA_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN_ERROR';
  errorDetails?: {
    statusCode?: number;
    errorMessage?: string;
    apiEndpoint?: string;
    expectedData?: any;
    actualData?: any;
    stackTrace?: string;
  };
}

export interface EnhancedTestSuite {
  name: string;
  results: DetailedTestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    successRate: number;
    totalDuration: number;
    averageDuration: number;
  };
  startTime: number;
  endTime?: number;
}

export class EnhancedTester {
  protected results: DetailedTestResult[] = [];
  protected startTime: number = 0;
  protected suiteName: string;

  constructor(suiteName: string) {
    this.startTime = Date.now();
    this.suiteName = suiteName;
  }

  async runTest(name: string, testFn: () => Promise<any>): Promise<DetailedTestResult> {
    const start = Date.now();
    
    try {
      console.log(`🧪 Running test: ${name}`);
      const data = await testFn();
      const duration = Date.now() - start;
      
      const result: DetailedTestResult = {
        name,
        success: true,
        message: 'Test passed successfully',
        duration,
        data
      };
      
      this.results.push(result);
      console.log(`✅ ${name} - PASSED (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      // Enhanced error analysis
      let errorType: DetailedTestResult['errorType'] = 'UNKNOWN_ERROR';
      let errorDetails: DetailedTestResult['errorDetails'] = {};
      
      if (error instanceof Error) {
        errorDetails.errorMessage = error.message;
        errorDetails.stackTrace = error.stack;
        
        // Classify error types
        if (error.message.includes('fetch') || error.message.includes('network')) {
          errorType = 'API_ERROR';
        } else if (error.message.includes('access') || error.message.includes('permission')) {
          errorType = 'DATA_ERROR';
        } else if (error.message.includes('validation') || error.message.includes('invalid')) {
          errorType = 'VALIDATION_ERROR';
        }
      }
      
      const result: DetailedTestResult = {
        name,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        duration,
        errorType,
        errorDetails
      };
      
      this.results.push(result);
      console.error(`❌ ${name} - FAILED (${duration}ms):`, error);
      return result;
    }
  }

  async testApiEndpoint(
    name: string, 
    apiCall: () => Promise<any>,
    validation?: (data: any) => boolean,
    expectedStructure?: any
  ): Promise<DetailedTestResult> {
    return this.runTest(name, async () => {
      const data = await apiCall();
      
      // Validate data structure if provided
      if (expectedStructure && !this.validateDataStructure(data, expectedStructure)) {
        throw new Error(`Data structure validation failed. Expected: ${JSON.stringify(expectedStructure)}, Actual: ${JSON.stringify(data)}`);
      }
      
      // Custom validation if provided
      if (validation && !validation(data)) {
        throw new Error('Custom validation failed');
      }
      
      return data;
    });
  }

  private validateDataStructure(data: any, expected: any): boolean {
    if (Array.isArray(expected)) {
      return Array.isArray(data);
    }
    
    if (typeof expected === 'object' && expected !== null) {
      if (typeof data !== 'object' || data === null) return false;
      
      for (const key in expected) {
        if (!(key in data)) return false;
      }
    }
    
    return true;
  }

  getSummary(): EnhancedTestSuite {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.length - passed;
    
    return {
      name: this.suiteName,
      results: this.results,
      summary: {
        total: this.results.length,
        passed,
        failed,
        successRate: this.results.length > 0 ? (passed / this.results.length) * 100 : 0,
        totalDuration,
        averageDuration: this.results.length > 0 ? totalDuration / this.results.length : 0
      },
      startTime: this.startTime,
      endTime
    };
  }
}

export const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

export const generateTestId = (): string => 
  `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
