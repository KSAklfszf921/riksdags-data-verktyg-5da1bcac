
import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { TestTube } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Database, Zap, Activity } from 'lucide-react';
import EnhancedTestRunner from '../components/EnhancedTestRunner';
import CalendarTestRunner from '../components/CalendarTestRunner';

const Testverktyg = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Testverktyg"
          description="Avancerade testverktyg för funktions- och felsökningstestning av alla analysverktyg i Riksdagskollen"
          icon={<TestTube className="w-6 h-6 text-white" />}
        />

        <div className="space-y-8">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Enhanced Test Suite v2.0</span>
              </CardTitle>
              <CardDescription>
                Förbättrade testverktyg med detaljerad felrapportering och API-validering
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="border-blue-200 mb-4">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <span className="font-medium">Nya funktioner i testverktygen:</span>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Detaljerad felklassificering (API_ERROR, DATA_ERROR, VALIDATION_ERROR)</li>
                      <li>Omfattande API-testning för alla datatyper</li>
                      <li>Dataintegritetsvalidering med specifika felrapporter</li>
                      <li>Prestanda- och konsistenstestning</li>
                      <li>Visuell felrapportering med stacktraces och debugging-information</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <Database className="w-8 h-8 mx-auto text-green-600 mb-2" />
                  <div className="font-medium text-green-800">API Testing</div>
                  <div className="text-sm text-green-700">8 API endpoints</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <Shield className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                  <div className="font-medium text-blue-800">Data Validation</div>
                  <div className="text-sm text-blue-700">4 validation suites</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <Zap className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                  <div className="font-medium text-purple-800">Error Analysis</div>
                  <div className="text-sm text-purple-700">Detailed diagnostics</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="enhanced" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="enhanced">Enhanced Test Suite</TabsTrigger>
              <TabsTrigger value="calendar">Calendar Tests</TabsTrigger>
            </TabsList>

            <TabsContent value="enhanced" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Förbättrade analysverktygstest</CardTitle>
                  <CardDescription>
                    Omfattande testning av alla API:er och datavalidering
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EnhancedTestRunner />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calendar" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Kalendertester</CardTitle>
                  <CardDescription>
                    Specifik testning av kalenderfunktionalitet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CalendarTestRunner />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Testverktyg;
