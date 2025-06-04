
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Database, 
  TestTube, 
  AlertTriangle,
  CheckCircle,
  Play,
  Square
} from "lucide-react";

const AdminQuickActions: React.FC = () => {
  const handleQuickSync = () => {
    console.log('Startar snabbsynkronisering...');
    // Implementera snabbsynkronisering
  };

  const handleSystemCheck = () => {
    console.log('Kör systemkontroll...');
    // Implementera systemkontroll
  };

  const handleEmergencyStop = () => {
    console.log('Nödstopp aktiverat...');
    // Implementera nödstopp
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Snabbåtgärder</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button 
            onClick={handleQuickSync}
            className="flex flex-col items-center space-y-2 h-20"
            variant="outline"
          >
            <RefreshCw className="w-6 h-6" />
            <span className="text-xs">Snabbsynk</span>
          </Button>

          <Button 
            onClick={handleSystemCheck}
            className="flex flex-col items-center space-y-2 h-20"
            variant="outline"
          >
            <TestTube className="w-6 h-6" />
            <span className="text-xs">Systemtest</span>
          </Button>

          <Button 
            className="flex flex-col items-center space-y-2 h-20"
            variant="outline"
          >
            <Database className="w-6 h-6" />
            <span className="text-xs">DB-status</span>
          </Button>

          <Button 
            onClick={handleEmergencyStop}
            className="flex flex-col items-center space-y-2 h-20"
            variant="destructive"
          >
            <Square className="w-6 h-6" />
            <span className="text-xs">Nödstopp</span>
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <Badge className="bg-green-500">Aktiv</Badge>
            </div>
            <span className="text-sm text-gray-600">API-status</span>
          </div>

          <div className="text-center p-3 border rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <Badge className="bg-green-500">OK</Badge>
            </div>
            <span className="text-sm text-gray-600">Databas</span>
          </div>

          <div className="text-center p-3 border rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <Badge className="bg-yellow-500">Varning</Badge>
            </div>
            <span className="text-sm text-gray-600">Cache</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminQuickActions;
