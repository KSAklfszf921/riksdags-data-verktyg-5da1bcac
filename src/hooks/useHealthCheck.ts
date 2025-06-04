
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HealthMetrics {
  activeProcesses: number;
  recentFailures: number;
  averageResponseTime: number;
  dataFreshness: {
    members: string | null;
    documents: string | null;
    votes: string | null;
    calendar: string | null;
  };
  systemLoad: 'low' | 'medium' | 'high';
}

interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'critical';
  score: number;
  metrics: HealthMetrics;
  issues: string[];
  recommendations: string[];
}

export const useHealthCheck = () => {
  const [healthData, setHealthData] = useState<HealthCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const performHealthCheck = useCallback(async (): Promise<HealthCheckResult> => {
    setIsChecking(true);
    console.log('🏥 Starting system health check...');

    const result: HealthCheckResult = {
      status: 'healthy',
      score: 100,
      metrics: {
        activeProcesses: 0,
        recentFailures: 0,
        averageResponseTime: 0,
        dataFreshness: {
          members: null,
          documents: null,
          votes: null,
          calendar: null
        },
        systemLoad: 'low'
      },
      issues: [],
      recommendations: []
    };

    try {
      // Check active processes
      const { data: activeProcesses } = await supabase
        .from('automated_sync_status')
        .select('*')
        .eq('status', 'running');

      result.metrics.activeProcesses = activeProcesses?.length || 0;

      // Check recent failures (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentFailures } = await supabase
        .from('automated_sync_status')
        .select('*')
        .eq('status', 'failed')
        .gte('started_at', oneDayAgo);

      result.metrics.recentFailures = recentFailures?.length || 0;

      // Check data freshness
      const tables = ['member_data', 'document_data', 'vote_data', 'calendar_data'];
      for (const table of tables) {
        try {
          const { data } = await supabase
            .from(table)
            .select('updated_at')
            .order('updated_at', { ascending: false })
            .limit(1);

          const key = table.replace('_data', '') as keyof typeof result.metrics.dataFreshness;
          result.metrics.dataFreshness[key] = data?.[0]?.updated_at || null;
        } catch (error) {
          console.warn(`Could not check freshness for ${table}:`, error);
        }
      }

      // Calculate system load based on active processes
      if (result.metrics.activeProcesses === 0) {
        result.metrics.systemLoad = 'low';
      } else if (result.metrics.activeProcesses <= 3) {
        result.metrics.systemLoad = 'medium';
      } else {
        result.metrics.systemLoad = 'high';
      }

      // Analyze health status
      let scoreDeduction = 0;

      // Deduct points for active processes (indication of load)
      if (result.metrics.activeProcesses > 5) {
        result.issues.push('High number of active processes detected');
        result.recommendations.push('Consider spacing out sync operations');
        scoreDeduction += 20;
      }

      // Deduct points for recent failures
      if (result.metrics.recentFailures > 10) {
        result.issues.push('High failure rate in recent operations');
        result.recommendations.push('Review error logs and fix underlying issues');
        scoreDeduction += 30;
      } else if (result.metrics.recentFailures > 5) {
        result.issues.push('Moderate failure rate detected');
        result.recommendations.push('Monitor system stability');
        scoreDeduction += 15;
      }

      // Check data staleness
      const now = new Date();
      Object.entries(result.metrics.dataFreshness).forEach(([key, lastUpdate]) => {
        if (lastUpdate) {
          const updateTime = new Date(lastUpdate);
          const hoursSinceUpdate = (now.getTime() - updateTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceUpdate > 48) {
            result.issues.push(`${key} data is stale (${Math.round(hoursSinceUpdate)}h old)`);
            result.recommendations.push(`Trigger ${key} sync operation`);
            scoreDeduction += 10;
          }
        } else {
          result.issues.push(`No ${key} data found`);
          result.recommendations.push(`Initialize ${key} data sync`);
          scoreDeduction += 15;
        }
      });

      // Calculate final score and status
      result.score = Math.max(0, 100 - scoreDeduction);
      
      if (result.score >= 80) {
        result.status = 'healthy';
      } else if (result.score >= 60) {
        result.status = 'warning';
      } else {
        result.status = 'critical';
      }

      console.log(`🏥 Health check complete. Status: ${result.status}, Score: ${result.score}`);

    } catch (error) {
      console.error('❌ Health check failed:', error);
      result.status = 'critical';
      result.score = 0;
      result.issues.push('Health check system failure');
      result.recommendations.push('Contact system administrator');
    } finally {
      setIsChecking(false);
    }

    setHealthData(result);
    return result;
  }, []);

  // Auto-refresh health data every 5 minutes
  useEffect(() => {
    performHealthCheck();
    const interval = setInterval(performHealthCheck, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [performHealthCheck]);

  return {
    healthData,
    performHealthCheck,
    isChecking
  };
};
