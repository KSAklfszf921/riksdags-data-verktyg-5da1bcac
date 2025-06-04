
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Users, 
  BarChart3,
  RefreshCw,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { LanguageAnalysisService, DataValidationResult } from '../services/languageAnalysisService';

const DataValidationDashboard = () => {
  const [validationData, setValidationData] = useState<DataValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastValidation, setLastValidation] = useState<string | null>(null);

  useEffect(() => {
    loadValidationData();
  }, []);

  const loadValidationData = async () => {
    setLoading(true);
    try {
      const data = await LanguageAnalysisService.validateDataAvailability();
      setValidationData(data);
      setLastValidation(new Date().toLocaleString('sv-SE'));
    } catch (error) {
      console.error('Error loading validation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDataQualityScore = (): number => {
    if (!validationData) return 0;
    
    const memberCoverage = (validationData.membersWithValidContent / validationData.totalMembers) * 100;
    const speechQuality = validationData.avgSpeechLength > 500 ? 100 : (validationData.avgSpeechLength / 500) * 100;
    const questionQuality = validationData.avgQuestionLength > 200 ? 100 : (validationData.avgQuestionLength / 200) * 100;
    const emptyContentPenalty = Math.max(0, 100 - (validationData.emptyContentCount / validationData.totalMembers) * 50);
    
    return Math.round((memberCoverage + speechQuality + questionQuality + emptyContentPenalty) / 4);
  };

  const getQualityLevel = (score: number): { level: string; color: string } => {
    if (score >= 80) return { level: 'Utmärkt', color: 'text-green-700 bg-green-50' };
    if (score >= 60) return { level: 'Bra', color: 'text-blue-700 bg-blue-50' };
    if (score >= 40) return { level: 'Acceptabel', color: 'text-yellow-700 bg-yellow-50' };
    return { level: 'Behöver förbättras', color: 'text-red-700 bg-red-50' };
  };

  if (loading && !validationData) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Validerar datatillgänglighet...</p>
        </CardContent>
      </Card>
    );
  }

  const qualityScore = getDataQualityScore();
  const qualityLevel = getQualityLevel(qualityScore);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Datatillgänglighet & Kvalitet</span>
            </div>
            <Button
              onClick={loadValidationData}
              disabled={loading}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Uppdatera</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {lastValidation && (
            <div className="text-sm text-gray-600 mb-4">
              Senast validerad: {lastValidation}
            </div>
          )}

          {validationData && (
            <>
              {/* Overall Quality Score */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Datakvalitetspoäng</span>
                  </div>
                  <Badge className={qualityLevel.color}>
                    {qualityLevel.level}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-blue-600">{qualityScore}/100</span>
                  </div>
                  <Progress value={qualityScore} className="h-3" />
                </div>
              </div>

              {/* Data Coverage Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{validationData.totalMembers}</div>
                  <div className="text-sm text-blue-800">Totalt ledamöter</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{validationData.membersWithValidContent}</div>
                  <div className="text-sm text-green-800">Med analysbar text</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{validationData.membersWithSpeeches}</div>
                  <div className="text-sm text-purple-800">Med anföranden</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">{validationData.membersWithQuestions}</div>
                  <div className="text-sm text-orange-800">Med skriftliga frågor</div>
                </div>
              </div>

              {/* Content Quality Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Anföranden</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Genomsnittlig längd:</span>
                        <span className="font-medium">{validationData.avgSpeechLength} tecken</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Kvalitetsnivå:</span>
                        <Badge className={validationData.avgSpeechLength > 500 ? 'bg-green-100 text-green-800' : 
                                        validationData.avgSpeechLength > 300 ? 'bg-yellow-100 text-yellow-800' : 
                                        'bg-red-100 text-red-800'}>
                          {validationData.avgSpeechLength > 500 ? 'Bra' : 
                           validationData.avgSpeechLength > 300 ? 'Acceptabel' : 'Kort'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Skriftliga frågor</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Genomsnittlig längd:</span>
                        <span className="font-medium">{validationData.avgQuestionLength} tecken</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Kvalitetsnivå:</span>
                        <Badge className={validationData.avgQuestionLength > 200 ? 'bg-green-100 text-green-800' : 
                                        validationData.avgQuestionLength > 120 ? 'bg-yellow-100 text-yellow-800' : 
                                        'bg-red-100 text-red-800'}>
                          {validationData.avgQuestionLength > 200 ? 'Bra' : 
                           validationData.avgQuestionLength > 120 ? 'Acceptabel' : 'Kort'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Data Issues */}
              {(validationData.emptyContentCount > 0 || validationData.shortContentCount > 0) && (
                <Alert className="border-orange-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <span className="font-medium">Identifierade dataproblem:</span>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {validationData.emptyContentCount > 0 && (
                          <li>{validationData.emptyContentCount} tomma textfält hittades</li>
                        )}
                        {validationData.shortContentCount > 0 && (
                          <li>{validationData.shortContentCount} för korta texter (under minimigräns)</li>
                        )}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Rekommendationer</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {validationData.recommendations.map((recommendation, index) => (
                      <Alert key={index} className="border-blue-200">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription className="text-blue-700">
                          {recommendation}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Coverage Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Datatäckning</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Ledamöter med analysbar text</span>
                      <span className="text-sm text-gray-600">
                        {validationData.membersWithValidContent}/{validationData.totalMembers} 
                        ({Math.round((validationData.membersWithValidContent / validationData.totalMembers) * 100)}%)
                      </span>
                    </div>
                    <Progress 
                      value={(validationData.membersWithValidContent / validationData.totalMembers) * 100} 
                      className="h-2" 
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Anföranden tillgängliga</span>
                      <span className="text-sm text-gray-600">
                        {validationData.membersWithSpeeches}/{validationData.totalMembers} 
                        ({Math.round((validationData.membersWithSpeeches / validationData.totalMembers) * 100)}%)
                      </span>
                    </div>
                    <Progress 
                      value={(validationData.membersWithSpeeches / validationData.totalMembers) * 100} 
                      className="h-2" 
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Skriftliga frågor tillgängliga</span>
                      <span className="text-sm text-gray-600">
                        {validationData.membersWithQuestions}/{validationData.totalMembers} 
                        ({Math.round((validationData.membersWithQuestions / validationData.totalMembers) * 100)}%)
                      </span>
                    </div>
                    <Progress 
                      value={(validationData.membersWithQuestions / validationData.totalMembers) * 100} 
                      className="h-2" 
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataValidationDashboard;
