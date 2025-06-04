
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, AlertCircle } from "lucide-react";

const LanguageAnalysisIntegration: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="w-5 h-5" />
          <span>Individuell språkanalys</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Språkanalys-funktionen är för närvarande inte tillgänglig. 
            Denna funktion kommer att utvecklas i framtida versioner.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default LanguageAnalysisIntegration;
