
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
