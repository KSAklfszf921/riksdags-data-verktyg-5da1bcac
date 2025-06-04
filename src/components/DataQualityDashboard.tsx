
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Database,
  RefreshCw,
  Users,
  FileText
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface DataQualityIssue {
  id: string;
  type: 'missing_data' | 'invalid_format' | 'duplicate' | 'outdated';
  severity: 'high' | 'medium' | 'low';
  table: string;
  description: string;
  count: number;
  resolved: boolean;
}

interface QualityMetrics {
  overallScore: number;
  totalRecords: number;
  validRecords: number;
  issuesCount: number;
  lastCheck: string;
}

const DataQualityDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<QualityMetrics>({
    overallScore: 0,
    totalRecords: 0,
    validRecords: 0,
    issuesCount: 0,
    lastCheck: ''
  });
  const [issues, setIssues] = useState<DataQualityIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRunningCheck, setIsRunningCheck] = useState(false);

  useEffect(() => {
    runQualityCheck();
  }, []);

  const runQualityCheck = async () => {
    setIsRunningCheck(true);
    setLoading(true);

    try {
      // Check member data quality
      const { data: members } = await supabase
        .from('enhanced_member_profiles')
        .select('*');

      // Check document data quality
      const { data: documents } = await supabase
        .from('document_data')
        .select('*');

      // Analyze data quality
      const qualityIssues: DataQualityIssue[] = [];
      let totalRecords = 0;
      let validRecords = 0;

      if (members) {
        totalRecords += members.length;
        
        // Check for missing essential data
        const membersWithMissingData = members.filter(m => 
          !m.first_name || !m.last_name || !m.party || !m.constituency
        );
        
        if (membersWithMissingData.length > 0) {
          qualityIssues.push({
            id: 'members_missing_data',
            type: 'missing_data',
            severity: 'high',
            table: 'enhanced_member_profiles',
            description: 'Ledamöter saknar grundläggande information',
            count: membersWithMissingData.length,
            resolved: false
          });
        }

        // Check for low data completeness scores
        const membersWithLowScores = members.filter(m => 
          (m.data_completeness_score || 0) < 70
        );
        
        if (membersWithLowScores.length > 0) {
          qualityIssues.push({
            id: 'members_low_completeness',
            type: 'missing_data',
            severity: 'medium',
            table: 'enhanced_member_profiles',
            description: 'Ledamöter med låg datakompletthetspoäng',
            count: membersWithLowScores.length,
            resolved: false
          });
        }

        validRecords += members.filter(m => 
          m.first_name && m.last_name && m.party && (m.data_completeness_score || 0) >= 70
        ).length;
      }

      if (documents) {
        totalRecords += documents.length;
        
        // Check for missing content
        const documentsWithoutContent = documents.filter(d => 
          !d.content_preview || d.content_preview.length < 100
        );
        
        if (documentsWithoutContent.length > 0) {
          qualityIssues.push({
            id: 'documents_missing_content',
            type: 'missing_data',
            severity: 'medium',
            table: 'document_data',
            description: 'Dokument saknar innehåll eller har för kort innehåll',
            count: documentsWithoutContent.length,
            resolved: false
          });
        }

        // Check for missing metadata
        const documentsWithoutMetadata = documents.filter(d => 
          !d.titel || !d.datum || !d.typ
        );
        
        if (documentsWithoutMetadata.length > 0) {
          qualityIssues.push({
            id: 'documents_missing_metadata',
            type: 'missing_data',
            severity: 'high',
            table: 'document_data',
            description: 'Dokument saknar viktiga metadata',
            count: documentsWithoutMetadata.length,
            resolved: false
          });
        }

        validRecords += documents.filter(d => 
          d.content_preview && d.content_preview.length >= 100 && d.titel && d.datum
        ).length;
      }

      const overallScore = totalRecords > 0 ? Math.round((validRecords / totalRecords) * 100) : 0;

      setMetrics({
        overallScore,
        totalRecords,
        validRecords,
        issuesCount: qualityIssues.length,
        lastCheck: new Date().toLocaleString('sv-SE')
      });

      setIssues(qualityIssues);

    } catch (error) {
      console.error('Error running quality check:', error);
    } finally {
      setLoading(false);
      setIsRunningCheck(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-red-500">Hög</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Medel</Badge>;
      case 'low':
        return <Badge className="bg-blue-500">Låg</Badge>;
      default:
        return <Badge variant="outline">Okänd</Badge>;
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-500">Utmärkt</Badge>;
    if (score >= 75) return <Badge className="bg-blue-500">Bra</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-500">Medel</Badge>;
    return <Badge className="bg-red-500">Behöver förbättring</Badge>;
  };

  if (loading && !isRunningCheck) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Laddar datakvalitetsanalys...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Datakvalitetsdashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              {getScoreBadge(metrics.overallScore)}
              <Button
                onClick={runQualityCheck}
                disabled={isRunningCheck}
                variant="outline"
                size="sm"
              >
                {isRunningCheck ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Kontrollerar...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Kör kontroll
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{metrics.overallScore}%</div>
              <div className="text-sm text-gray-600">Övergripande poäng</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{metrics.validRecords.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Giltiga poster</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{metrics.totalRecords.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Totala poster</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{metrics.issuesCount}</div>
              <div className="text-sm text-gray-600">Identifierade problem</div>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span>Datakvalitet</span>
              <span>{metrics.overallScore}%</span>
            </div>
            <Progress value={metrics.overallScore} className="w-full" />
            <div className="text-xs text-gray-500">
              Senaste kontroll: {metrics.lastCheck}
            </div>
          </div>

          {issues.length > 0 && (
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {issues.length} kvalitetsproblem identifierade. Granska och åtgärda för bättre datakvalitet.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Identifierade kvalitetsproblem</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {issues.map((issue) => (
                <div key={issue.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Database className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{issue.description}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getSeverityBadge(issue.severity)}
                      <Badge variant="outline">{issue.count} poster</Badge>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    Tabell: <code className="bg-gray-100 px-1 rounded">{issue.table}</code>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Typ: <span className="capitalize">{issue.type.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {issues.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-green-700 mb-2">
              Inga kvalitetsproblem identifierade!
            </h3>
            <p className="text-gray-600">
              Dina data håller hög kvalitet. Fortsätt med regelbundna kontroller.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DataQualityDashboard;
