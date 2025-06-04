import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Clock, Database, Settings, TrendingUp } from "lucide-react";
import ImprovedDataSyncDashboard from './ImprovedDataSyncDashboard';
import { toast } from "sonner";

interface SyncProgress {
  stage: string;
  progress: number;
  recordsProcessed: number;
  totalRecords: number;
  errors: string[];
  retryCount: number;
  estimatedTimeRemaining?: number;
  startTime?: Date;
  endTime?: Date;
}

interface SyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageDuration: number;
  lastSyncTime?: Date;
}

const ComprehensiveDataSync: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentSync, setCurrentSync] = useState<SyncProgress>({
    stage: 'Ready',
    progress: 0,
    recordsProcessed: 0,
    totalRecords: 0,
    errors: [],
    retryCount: 0
  });

  const [metrics, setMetrics] = useState<SyncMetrics>({
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    averageDuration: 0
  });

  const [lastResults, setLastResults] = useState<{
    members: number;
    votes: number;
    documents: number;
    speeches: number;
  }>({
    members: 0,
    votes: 0,
    documents: 0,
    speeches: 0
  });

  const updateMetrics = (success: boolean, duration: number) => {
    setMetrics(prev => ({
      totalSyncs: prev.totalSyncs + 1,
      successfulSyncs: prev.successfulSyncs + (success ? 1 : 0),
      failedSyncs: prev.failedSyncs + (success ? 0 : 1),
      averageDuration: ((prev.averageDuration * prev.totalSyncs) + duration) / (prev.totalSyncs + 1),
      lastSyncTime: new Date()
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Comprehensive Data Synchronization System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="improved" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="improved">Improved Sync</TabsTrigger>
              <TabsTrigger value="legacy">Legacy Sync</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="improved" className="mt-6">
              <ImprovedDataSyncDashboard />
            </TabsContent>
            
            <TabsContent value="legacy" className="mt-6">
              {/* Legacy sync interface - keeping existing functionality */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant={isActive ? "default" : "secondary"}>
                      {isActive ? "Active" : "Idle"}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      Stage: {currentSync.stage}
                    </span>
                  </div>
                  <Button
                    onClick={() => setIsActive(!isActive)}
                    disabled={isActive}
                  >
                    {isActive ? "Running..." : "Start Legacy Sync"}
                  </Button>
                </div>

                {isActive && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{currentSync.progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={currentSync.progress} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Processed:</span>
                        <div className="font-medium">{currentSync.recordsProcessed.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total:</span>
                        <div className="font-medium">{currentSync.totalRecords.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Errors:</span>
                        <div className="font-medium text-red-600">{currentSync.errors.length}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Retries:</span>
                        <div className="font-medium">{currentSync.retryCount}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="metrics" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Syncs</p>
                        <p className="text-2xl font-bold">{metrics.totalSyncs}</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Success Rate</p>
                        <p className="text-2xl font-bold text-green-600">
                          {metrics.totalSyncs > 0 ? 
                            ((metrics.successfulSyncs / metrics.totalSyncs) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                        <p className="text-2xl font-bold">{metrics.averageDuration.toFixed(1)}s</p>
                      </div>
                      <Clock className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Failed Syncs</p>
                        <p className="text-2xl font-bold text-red-600">{metrics.failedSyncs}</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {metrics.lastSyncTime && (
                <Card className="mt-4">
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-600">
                      Last sync: {metrics.lastSyncTime.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComprehensiveDataSync;
