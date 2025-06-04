
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Database, Users, BarChart3, Settings } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import MasterSyncTool from "../components/MasterSyncTool";
import DataValidationDashboard from "../components/DataValidationDashboard";
import DataQualityDashboard from "../components/DataQualityDashboard";
import DatabaseInitializer from "../components/DatabaseInitializer";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("sync");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Admin Dashboard"
          description="Systemadministration och datahantering"
          icon={<Shield className="w-6 h-6 text-white" />}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="sync" className="flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span>Data Sync</span>
            </TabsTrigger>
            <TabsTrigger value="quality" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Data Quality</span>
            </TabsTrigger>
            <TabsTrigger value="validation" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Validation</span>
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span>Database</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sync">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Master Data Synchronization</span>
                </CardTitle>
                <CardDescription>
                  Synchronize all data from Riksdag API including members, documents, speeches, and votes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MasterSyncTool />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quality">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Data Quality Monitoring</span>
                </CardTitle>
                <CardDescription>
                  Monitor and improve data completeness, accuracy, and consistency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataQualityDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="validation">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Data Validation</span>
                </CardTitle>
                <CardDescription>
                  Run comprehensive validation tests on all data sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataValidationDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Database Management</span>
                </CardTitle>
                <CardDescription>
                  Initialize and manage database schema and indexes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DatabaseInitializer />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>System Settings</span>
                </CardTitle>
                <CardDescription>
                  Configure system-wide settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>System settings panel coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
