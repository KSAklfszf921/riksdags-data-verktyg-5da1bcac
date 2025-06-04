
import React, { useState } from 'react';
import { Shield } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import MasterTestRunner from "../components/MasterTestRunner";

const Admin = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Admin Dashboard"
          description="Komplett master kontrollpanel för systemadministration och datahantering"
          icon={<Shield className="w-6 h-6 text-white" />}
        />

        <MasterTestRunner />
      </div>
    </div>
  );
};

export default Admin;
