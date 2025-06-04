
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDataQualityMetrics, useMemberDataMigration } from '@/hooks/useEnhancedMemberProfiles';
import { CheckCircle, AlertTriangle, Users, Image, Mail, Database, RefreshCw, Info } from "lucide-react";
import { toast } from "sonner";

const DataQualityDashboard: React.FC = () => {
  const { metrics, loading, error } = useDataQualityMetrics();
  const { migrationStatus, runMigration } = useMemberDataMigration();
  const [refreshing, setRefreshing] = useState(false);

  const handleMigration = async () => {
    try {
      const migratedCount = await runMigration();
      toast.success(`Migration completed! ${migratedCount} members migrated to enhanced profiles.`);
      // Refresh the page to show updated metrics
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast.error('Migration failed. Please check the logs.');
      console.error('Migration error:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Force reload by triggering a re-render
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Loading data quality metrics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <span>{error || 'Could not load data quality metrics'}</span>
          </div>
          <div className="mt-4">
            <Button 
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Retry</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if enhanced_member_profiles table is empty or has very few records
  const isEnhancedTableEmpty = metrics.totalMembers === 0;
  const hasLowDataCount = metrics.totalMembers > 0 && metrics.totalMembers < 50; // Threshold for "needs migration"

  const qualityColor = metrics.averageCompleteness >= 80 ? 'green' : 
                     metrics.averageCompleteness >= 60 ? 'yellow' : 'red';

  return (
    <div className="space-y-6">
      {/* Enhanced profiles migration notice */}
      {(isEnhancedTableEmpty || hasLowDataCount) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Info className="w-5 h-5" />
              <span>
                {isEnhancedTableEmpty 
                  ? 'Enhanced Member Profiles Not Set Up' 
                  : 'Enhanced Member Profiles Need Data Migration'
                }
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700 mb-4">
              {isEnhancedTableEmpty 
                ? 'The enhanced member profiles system is not yet populated with data. Run the migration below to transfer existing member data to the new enhanced system for improved data quality tracking.'
                : `Only ${metrics.totalMembers} enhanced member profiles found. Run the migration to ensure all member data is properly transferred to the enhanced system.`
              }
            </p>
            <Button 
              onClick={handleMigration}
              disabled={migrationStatus.running}
              className="flex items-center space-x-2"
            >
              {migrationStatus.running ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Migrating...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>
                    {isEnhancedTableEmpty ? 'Set Up Enhanced Profiles' : 'Complete Migration'}
                  </span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main metrics - always show if we have data */}
      {!isEnhancedTableEmpty && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                  <div className="text-2xl font-bold">{metrics.totalMembers}</div>
                  {hasLowDataCount && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      Migration needed
                    </Badge>
                  )}
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Completeness</p>
                  <div className="text-2xl font-bold">{metrics.averageCompleteness}%</div>
                  <Progress value={metrics.averageCompleteness} className="mt-2" />
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  qualityColor === 'green' ? 'bg-green-100 text-green-600' :
                  qualityColor === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {qualityColor === 'green' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Missing Images</p>
                  <div className="text-2xl font-bold">{metrics.missingImageCount}</div>
                  <Badge variant={metrics.missingImageCount > 0 ? "destructive" : "secondary"} className="mt-2">
                    {((metrics.missingImageCount / metrics.totalMembers) * 100).toFixed(1)}%
                  </Badge>
                </div>
                <Image className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Missing Contact</p>
                  <div className="text-2xl font-bold">{metrics.missingContactCount}</div>
                  <Badge variant={metrics.missingContactCount > 0 ? "destructive" : "secondary"} className="mt-2">
                    {((metrics.missingContactCount / metrics.totalMembers) * 100).toFixed(1)}%
                  </Badge>
                </div>
                <Mail className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Quality Issues - only show if we have data and issues */}
      {!isEnhancedTableEmpty && metrics.membersWithIssues > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-800">
              <AlertTriangle className="w-5 h-5" />
              <span>Data Quality Issues Detected</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700">
              {metrics.membersWithIssues} members have data quality issues that need attention.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Migration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Data Migration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {isEnhancedTableEmpty 
              ? "Set up the enhanced member profiles system for improved data quality and performance."
              : hasLowDataCount
              ? "Complete the migration to ensure all member data is in the enhanced system."
              : "The enhanced member profiles system is set up and contains member data."
            }
          </p>
          
          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleMigration}
              disabled={migrationStatus.running}
              variant={isEnhancedTableEmpty || hasLowDataCount ? "default" : "outline"}
              className="flex items-center space-x-2"
            >
              {migrationStatus.running ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Migrating...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>
                    {isEnhancedTableEmpty 
                      ? 'Set Up System' 
                      : hasLowDataCount 
                      ? 'Complete Migration' 
                      : 'Re-run Migration'
                    }
                  </span>
                </>
              )}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>

          {migrationStatus.completed && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-green-800">Migration Completed</h4>
                  <p className="text-xs text-green-600">
                    {migrationStatus.migratedCount} members successfully migrated to enhanced profiles.
                  </p>
                </div>
              </div>
            </div>
          )}

          {migrationStatus.error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Migration Failed</h4>
                  <p className="text-xs text-red-600">{migrationStatus.error}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Sync Info - only show if we have data */}
      {!isEnhancedTableEmpty && metrics.lastSyncTime && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Data Sync</p>
                <p className="text-sm">{new Date(metrics.lastSyncTime).toLocaleString()}</p>
              </div>
              <Badge variant="outline">
                {Math.round((Date.now() - new Date(metrics.lastSyncTime).getTime()) / (1000 * 60 * 60))}h ago
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DataQualityDashboard;
