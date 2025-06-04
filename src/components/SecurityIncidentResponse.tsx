
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  CheckCircle, 
  X,
  Play,
  Pause,
  FileText,
  Users,
  Bell
} from "lucide-react";

interface SecurityIncident {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'contained' | 'resolved';
  description: string;
  detectedAt: Date;
  assignedTo?: string;
  estimatedImpact: string;
  responseActions: string[];
}

const SecurityIncidentResponse: React.FC = () => {
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<SecurityIncident[]>([
    {
      id: '1',
      title: 'Misstänkt brute-force attack',
      severity: 'high',
      status: 'investigating',
      description: 'Multipla misslyckade inloggningsförsök från samma IP-adress upptäckta.',
      detectedAt: new Date(Date.now() - 30 * 60 * 1000),
      assignedTo: 'admin@exempel.se',
      estimatedImpact: 'Potentiell obehörig åtkomst',
      responseActions: [
        'IP-adress blockerad automatiskt',
        'Affected accounts låsta',
        'Säkerhetsteam notifierat'
      ]
    },
    {
      id: '2',
      title: 'Onormal API-aktivitet',
      severity: 'medium',
      status: 'open',
      description: 'Hög frekvens av API-anrop från okänd källa.',
      detectedAt: new Date(Date.now() - 45 * 60 * 1000),
      estimatedImpact: 'Möjlig DoS eller data harvesting',
      responseActions: []
    }
  ]);

  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [responseNote, setResponseNote] = useState('');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-blue-100 text-blue-800';
      case 'contained': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="w-4 h-4" />;
      case 'investigating': return <Play className="w-4 h-4" />;
      case 'contained': return <Pause className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleStatusChange = (incidentId: string, newStatus: SecurityIncident['status']) => {
    setIncidents(prev => prev.map(incident => 
      incident.id === incidentId 
        ? { ...incident, status: newStatus }
        : incident
    ));

    toast({
      title: "Status uppdaterad",
      description: `Incident status ändrad till ${newStatus}`,
    });
  };

  const handleAddResponse = (incidentId: string) => {
    if (!responseNote.trim()) return;

    setIncidents(prev => prev.map(incident => 
      incident.id === incidentId 
        ? { 
            ...incident, 
            responseActions: [...incident.responseActions, responseNote]
          }
        : incident
    ));

    setResponseNote('');
    toast({
      title: "Åtgärd tillagd",
      description: "Responsåtgärd har lagts till incident",
    });
  };

  const handleEscalate = (incident: SecurityIncident) => {
    toast({
      title: "Incident eskalerad",
      description: `${incident.title} har eskalerats till säkerhetsteam`,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <span>Säkerhetsincidenter</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {incidents.map((incident) => (
              <div key={incident.id} className="bg-white p-4 rounded-lg border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg">{incident.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Badge className={getSeverityColor(incident.severity)}>
                      {incident.severity}
                    </Badge>
                    <Badge className={getStatusColor(incident.status)}>
                      {getStatusIcon(incident.status)}
                      <span className="ml-1">{incident.status}</span>
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="text-sm">
                    <span className="font-medium">Upptäckt:</span> {incident.detectedAt.toLocaleString('sv-SE')}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Tilldelad:</span> {incident.assignedTo || 'Ej tilldelad'}
                  </div>
                  <div className="text-sm md:col-span-2">
                    <span className="font-medium">Uppskattad påverkan:</span> {incident.estimatedImpact}
                  </div>
                </div>

                {incident.responseActions.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-sm mb-2">Vidtagna åtgärder:</h5>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {incident.responseActions.map((action, index) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {incident.status !== 'investigating' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusChange(incident.id, 'investigating')}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Påbörja utredning
                    </Button>
                  )}
                  
                  {incident.status === 'investigating' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusChange(incident.id, 'contained')}
                    >
                      <Pause className="w-4 h-4 mr-1" />
                      Markera som inringad
                    </Button>
                  )}

                  {incident.status === 'contained' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusChange(incident.id, 'resolved')}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Markera som löst
                    </Button>
                  )}

                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEscalate(incident)}
                  >
                    <Bell className="w-4 h-4 mr-1" />
                    Eskalera
                  </Button>

                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setSelectedIncident(incident)}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Lägg till åtgärd
                  </Button>
                </div>
              </div>
            ))}

            {incidents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Inga aktiva säkerhetsincidenter</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Response Action Modal */}
      {selectedIncident && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Lägg till responsåtgärd</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedIncident(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Incident:</strong> {selectedIncident.title}
                </AlertDescription>
              </Alert>

              <Textarea
                placeholder="Beskriv den åtgärd som vidtagits..."
                value={responseNote}
                onChange={(e) => setResponseNote(e.target.value)}
                rows={4}
              />

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedIncident(null)}
                >
                  Avbryt
                </Button>
                <Button 
                  onClick={() => handleAddResponse(selectedIncident.id)}
                  disabled={!responseNote.trim()}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Lägg till åtgärd
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SecurityIncidentResponse;
