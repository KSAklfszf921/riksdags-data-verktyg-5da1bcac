
import React, { useState } from 'react';
import { Shield } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import MasterAdminPanel from "../components/MasterAdminPanel";

const Admin = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Förbättrad Admin Dashboard"
          description="Komplett master kontrollpanel för systemadministration och förbättrad datahantering"
          icon={<Shield className="w-6 h-6 text-white" />}
        />

        <MasterAdminPanel />
      </div>
    </div>
  );
};

export default Admin;
