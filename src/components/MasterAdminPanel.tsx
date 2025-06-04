
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Database, Activity, Settings, Monitor } from "lucide-react";
import ComprehensiveDataSync from './ComprehensiveDataSync';
import MemberDataSynchronizer from './MemberDataSynchronizer';
import SystemHealthMonitor from './SystemHealthMonitor';
import EnhancedAdminQuickActions from './EnhancedAdminQuickActions';
import DataSyncHealthMonitor from './DataSyncHealthMonitor';

const MasterAdminPanel: React.FC = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="comprehensive" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="comprehensive" className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Förbättrad Synkronisering</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Medlemsdata</span>
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center space-x-2">
            <Monitor className="w-4 h-4" />
            <span>Hälsomonitor</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Systemhälsa</span>
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Admin Verktyg</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comprehensive" className="mt-6">
          <ComprehensiveDataSync />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <MemberDataSynchronizer />
        </TabsContent>

        <TabsContent value="health" className="mt-6">
          <DataSyncHealthMonitor />
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <SystemHealthMonitor />
        </TabsContent>

        <TabsContent value="admin" className="mt-6">
          <EnhancedAdminQuickActions />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MasterAdminPanel;
