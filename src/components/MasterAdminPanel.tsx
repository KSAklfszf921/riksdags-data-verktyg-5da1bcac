
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings, 
  Database, 
  Activity, 
  TestTube,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from "lucide-react";
import EnhancedAdminDashboard from './EnhancedAdminDashboard';
import EnhancedTestRunner from './EnhancedTestRunner';
import ComprehensiveDataSync from './ComprehensiveDataSync';
import ProcessMonitor from './ProcessMonitor';
import DataSyncButtons from './DataSyncButtons';
import SyncProgressTester from '../utils/syncProgressTester';

const MasterAdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Frisk</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500"><AlertTriangle className="w-3 h-3 mr-1" />Varning</Badge>;
      case 'critical':
        return <Badge className="bg-red-500"><AlertTriangle className="w-3 h-3 mr-1" />Kritisk</Badge>;
      default:
        return <Badge variant="outline">Okänd</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* System Status Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Master Admin Panel</span>
            </div>
            <div className="flex items-center space-x-4">
              {getStatusBadge(systemStatus)}
              <Badge variant="outline">
                <Clock className="w-3 h-3 mr-1" />
                Senast uppdaterad: {new Date().toLocaleTimeString('sv-SE')}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Centraliserad kontrollpanel för systemadministration, datasynkronisering och övervakning
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Main Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="sync">Synkronisering</TabsTrigger>
          <TabsTrigger value="monitor">Övervakning</TabsTrigger>
          <TabsTrigger value="testing">Testning</TabsTrigger>
          <TabsTrigger value="analytics">Analys</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <EnhancedAdminDashboard />
        </TabsContent>

        <TabsContent value="sync">
          <div className="space-y-6">
            <DataSyncButtons />
            <ComprehensiveDataSync />
          </div>
        </TabsContent>

        <TabsContent value="monitor">
          <ProcessMonitor />
        </TabsContent>

        <TabsContent value="testing">
          <EnhancedTestRunner />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const AnalyticsTab: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>Systemstatistik</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm">Totala tabeller</span>
            <span className="font-medium">12</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Aktiva synkroniseringar</span>
            <span className="font-medium">0</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Senaste test körning</span>
            <span className="font-medium">Aldrig</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Systemhälsa</span>
            <Badge className="bg-green-500">Frisk</Badge>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Prestandamått</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>API-svarstid</span>
              <span>Utmärkt</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '95%' }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Databasanslutning</span>
              <span>Stabil</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Synk-prestanda</span>
              <span>Bra</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '80%' }}></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default MasterAdminPanel;
