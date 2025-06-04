
import React from 'react';
import { PageHeader } from '../components/PageHeader';
import CalendarTestRunner from '../components/CalendarTestRunner';
import { TestTube } from 'lucide-react';

const CalendarTest = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Calendar Test Suite"
          description="Comprehensive testing for the Riksdag calendar functionality"
          icon={<TestTube className="w-6 h-6 text-white" />}
        />

        <CalendarTestRunner />
      </div>
    </div>
  );
};

export default CalendarTest;
