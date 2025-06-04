
export interface BatchProgress {
  totalMembers: number;
  processedMembers: number;
  successfulFetches: number;
  failedFetches: number;
  currentMember: string;
  status: 'idle' | 'running' | 'completed' | 'paused' | 'error';
  startTime: string;
  estimatedCompletion?: string;
  errors: Array<{ memberName: string; error: string }>;
  totalRssItems: number;
  currentBatchRssItems: number;
}

export interface BatchError {
  memberName: string;
  error: string;
}
