
import React from 'react';
import DatabaseInitializer from '../components/DatabaseInitializer';
import CalendarDataManager from '../components/CalendarDataManager';

const DatabaseManager = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Databashantering
        </h1>
        <p className="text-gray-600">
          Hantera och övervaka alla Supabase-databaser och datahämtning från Riksdagens API
        </p>
      </div>
      
      <div className="space-y-8">
        <CalendarDataManager />
        <DatabaseInitializer />
      </div>
    </div>
  );
};

export default DatabaseManager;
