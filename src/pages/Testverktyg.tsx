import React from 'react';
import PageHeader from '../components/PageHeader';
import CalendarTestRunner from '../components/CalendarTestRunner';
import EnhancedTestRunner from '../components/EnhancedTestRunner';
import VoteAnalysisTestRunner from '../components/VoteAnalysisTestRunner';
import DocumentAnalysisTestRunner from '../components/DocumentAnalysisTestRunner';
import SpeechAnalysisTestRunner from '../components/SpeechAnalysisTestRunner';
import MemberAnalysisTestRunner from '../components/MemberAnalysisTestRunner';
import LanguageAnalysisBatchRunner from '../components/LanguageAnalysisBatchRunner';
import NewsManagementTool from '../components/NewsManagementTool';

const Testverktyg = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Testverktyg för riksdagsdata" 
        subtitle="Verktyg för att testa och validera olika datakällor från riksdagens API"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8">
          {/* News Management Tool */}
          <NewsManagementTool />
          
          {/* Calendar Test Runner */}
          <CalendarTestRunner />
          {/* Enhanced Test Runner */}
          <EnhancedTestRunner />
          {/* Vote Analysis Test Runner */}
          <VoteAnalysisTestRunner />
          {/* Document Analysis Test Runner */}
          <DocumentAnalysisTestRunner />
          {/* Speech Analysis Test Runner */}
          <SpeechAnalysisTestRunner />
          {/* Member Analysis Test Runner */}
          <MemberAnalysisTestRunner />
          {/* Language Analysis Batch Runner */}
          <LanguageAnalysisBatchRunner />
        </div>
      </div>
    </div>
  );
};

export default Testverktyg;
