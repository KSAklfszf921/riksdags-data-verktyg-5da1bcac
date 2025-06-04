
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Database, Users, BarChart3, Settings, Zap, Vote, Activity, TestTube, Server } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import EnhancedAdminDashboard from "../components/EnhancedAdminDashboard";
import EnhancedVotingTool from "../components/EnhancedVotingTool";
import ProcessMonitor from "../components/ProcessMonitor";
import SystemPerformanceDashboard from "../components/SystemPerformanceDashboard";
import ApiTestingDashboard from "../components/ApiTestingDashboard";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Admin Dashboard"
          description="Komplett systemadministration och övervakning"
          icon={<Shield className="w-6 h-6 text-white" />}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="voting" className="flex items-center space-x-2">
              <Vote className="w-4 h-4" />
              <span>Voteringar</span>
            </TabsTrigger>
            <TabsTrigger value="monitor" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Processmonitor</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center space-x-2">
              <Server className="w-4 h-4" />
              <span>Prestanda</span>
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center space-x-2">
              <TestTube className="w-4 h-4" />
              <span>API-tester</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Inställningar</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <EnhancedAdminDashboard />
          </TabsContent>

          <TabsContent value="voting">
            <EnhancedVotingTool />
          </TabsContent>

          <TabsContent value="monitor">
            <ProcessMonitor />
          </TabsContent>

          <TabsContent value="performance">
            <SystemPerformanceDashboard />
          </TabsContent>

          <TabsContent value="testing">
            <ApiTestingDashboard />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Systeminställningar</span>
                </CardTitle>
                <CardDescription>
                  Konfigurera systemomfattande inställningar och preferenser
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Datasynkronisering</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Automatisk synkronisering</span>
                          <input type="checkbox" className="rounded" defaultChecked />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Synkroniseringsintervall</span>
                          <select className="border rounded px-2 py-1 text-sm">
                            <option>Varje timme</option>
                            <option>Var 6:e timme</option>
                            <option>Dagligen</option>
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Systemövervakning</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Aktivera e-postaviseringar</span>
                          <input type="checkbox" className="rounded" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Loggnivå</span>
                          <select className="border rounded px-2 py-1 text-sm">
                            <option>Info</option>
                            <option>Varning</option>
                            <option>Fel</option>
                            <option>Debug</option>
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Säkerhetsåtgärder</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Aktivera API-begränsning</span>
                          <input type="checkbox" className="rounded" defaultChecked />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Max förfrågningar per minut</span>
                          <input type="number" className="border rounded px-2 py-1 text-sm w-20" defaultValue="100" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Prestanda</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Cache-storlek (MB)</span>
                          <input type="number" className="border rounded px-2 py-1 text-sm w-20" defaultValue="512" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Aktivera komprimering</span>
                          <input type="checkbox" className="rounded" defaultChecked />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
