
import React from 'react';
import { PageHeader } from "../components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, TrendingUp, Users, BarChart3 } from "lucide-react";
import { useResponsive } from "../hooks/use-responsive";

const SprakAnalys = () => {
  const { isMobile } = useResponsive();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 py-0' : 'px-4 sm:px-6 lg:px-8 py-8'}`}>
        <PageHeader
          title="Språkanalys"
          description="Analys av språkbruk och kommunikationsmönster i svenska riksdagen"
          icon={<MessageSquare className="w-6 h-6 text-white" />}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Språktrender</span>
              </CardTitle>
              <CardDescription>
                Analys av ordfrekvens och språkliga trender över tid
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Språkanalysverktyg kommer snart att implementeras för att analysera anföranden och dokument från riksdagen.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Kommunikationsstilar</span>
              </CardTitle>
              <CardDescription>
                Jämförelse av olika partiers och ledamöters språkbruk
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Verktyg för att jämföra språkliga mönster mellan olika politiska grupper.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Sentimentanalys</span>
              </CardTitle>
              <CardDescription>
                Analys av känslomässiga toner i politiska anföranden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Kommande funktionalitet för att analysera sentiment och känslomässiga toner.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SprakAnalys;
