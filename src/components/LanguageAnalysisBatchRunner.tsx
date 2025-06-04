
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, AlertCircle } from "lucide-react";

const LanguageAnalysisBatchRunner: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Batch språkanalys</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Batch språkanalys-funktionen är för närvarande inte tillgänglig. 
            Denna funktion kommer att utvecklas i framtida versioner för att 
            analysera flera ledamöter samtidigt.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default LanguageAnalysisBatchRunner;
