import React from 'react';
import { PageHeader } from '../components/PageHeader';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Wrench } from 'lucide-react';
import CalendarDataManager from '../components/CalendarDataManager';
import DatabaseInitializer from '../components/DatabaseInitializer';
import EnhancedTestRunner from '../components/EnhancedTestRunner';
import CalendarTestRunner from '../components/CalendarTestRunner';
import BatchNewsRunner from '../components/BatchNewsRunner';

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Adminpanel"
          description="Hantera databaser, schemalägg datahämtning och kör tester"
          icon={<Wrench className="w-6 h-6 text-white" />}
        />
        <Tabs defaultValue="data" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="data">Datahantering</TabsTrigger>
            <TabsTrigger value="tests">Testverktyg</TabsTrigger>
            <TabsTrigger value="rss">Batch RSS</TabsTrigger>
          </TabsList>
          <TabsContent value="data" className="space-y-8">
            <CalendarDataManager />
            <DatabaseInitializer />
          </TabsContent>
          <TabsContent value="tests" className="space-y-4">
            <EnhancedTestRunner />
            <CalendarTestRunner />
          </TabsContent>
          <TabsContent value="rss" className="space-y-4">
            <BatchNewsRunner />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
