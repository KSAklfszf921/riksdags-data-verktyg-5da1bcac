
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Database, 
  Users, 
  Calendar, 
  FileText, 
  Vote, 
  PartyPopper,
  AlertTriangle,
  CheckCircle,
  Play
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SyncButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  functionName: string;
  payload?: any;
  variant?: 'default' | 'outline' | 'destructive';
}

const DataSyncButtons: React.FC = () => {
  const [syncingStates, setSyncingStates] = useState<Record<string, boolean>>({});
  const [lastSyncResults, setLastSyncResults] = useState<Record<string, any>>({});

  const handleSync = async (functionName: string, payload: any = {}, buttonKey: string) => {
    setSyncingStates(prev => ({ ...prev, [buttonKey]: true }));
    
    try {
      console.log(`Starting sync: ${functionName}`, payload);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });

      if (error) {
        throw error;
      }

      console.log(`Sync completed: ${functionName}`, data);
      
      setLastSyncResults(prev => ({ 
        ...prev, 
        [buttonKey]: { 
          success: true, 
          timestamp: new Date().toISOString(),
          data 
        } 
      }));
      
      toast.success(`${buttonKey} synkronisering slutförd`);
    } catch (error) {
      console.error(`Sync failed: ${functionName}`, error);
      
      setLastSyncResults(prev => ({ 
        ...prev, 
        [buttonKey]: { 
          success: false, 
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        } 
      }));
      
      toast.error(`${buttonKey} synkronisering misslyckades: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSyncingStates(prev => ({ ...prev, [buttonKey]: false }));
    }
  };

  const syncButtons: SyncButtonProps[] = [
    {
      icon: <Users className="w-4 h-4" />,
      title: "Synkronisera Ledamöter",
      description: "Hämta och uppdatera all ledamotsinformation",
      functionName: "fetch-comprehensive-data",
      payload: { dataType: "members" }
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      title: "Synkronisera Kalender",
      description: "Uppdatera kalenderhändelser och möten",
      functionName: "fetch-comprehensive-data",
      payload: { dataType: "calendar" }
    },
    {
      icon: <FileText className="w-4 h-4" />,
      title: "Synkronisera Dokument",
      description: "Hämta nya dokument och propositioner",
      functionName: "fetch-comprehensive-data",
      payload: { dataType: "documents" }
    },
    {
      icon: <Vote className="w-4 h-4" />,
      title: "Synkronisera Voteringar",
      description: "Uppdatera röstningsdata och resultat",
      functionName: "fetch-comprehensive-data",
      payload: { dataType: "votes" }
    },
    {
      icon: <PartyPopper className="w-4 h-4" />,
      title: "Synkronisera Partier",
      description: "Uppdatera partiinformation och medlemmar",
      functionName: "fetch-party-data"
    }
  ];

  const runAllSyncs = async () => {
    toast.info("Startar fullständig datasynkronisering...");
    
    for (const button of syncButtons) {
      const buttonKey = button.title.replace(/\s+/g, '_').toLowerCase();
      await handleSync(button.functionName, button.payload, buttonKey);
      
      // Short delay between syncs to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    toast.success("Fullständig datasynkronisering slutförd!");
  };

  const getLastSyncStatus = (buttonKey: string) => {
    const result = lastSyncResults[buttonKey];
    if (!result) return null;
    
    return (
      <div className="mt-2 text-xs">
        {result.success ? (
          <Badge variant="default" className="text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            Senast: {new Date(result.timestamp).toLocaleString('sv-SE')}
          </Badge>
        ) : (
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Fel: {new Date(result.timestamp).toLocaleString('sv-SE')}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Datasynkronisering</span>
            </div>
            <Button 
              onClick={runAllSyncs}
              disabled={Object.values(syncingStates).some(Boolean)}
              className="flex items-center space-x-2"
            >
              {Object.values(syncingStates).some(Boolean) ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>Synkronisera Allt</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Datasynkronisering kan ta flera minuter att slutföra. Undvik att köra flera synkroniseringar samtidigt.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {syncButtons.map((button) => {
              const buttonKey = button.title.replace(/\s+/g, '_').toLowerCase();
              const isLoading = syncingStates[buttonKey];
              
              return (
                <Card key={buttonKey} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {button.icon}
                          <h3 className="font-medium text-sm">{button.title}</h3>
                        </div>
                        {isLoading && (
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-600">{button.description}</p>
                      
                      <Button
                        onClick={() => handleSync(button.functionName, button.payload, buttonKey)}
                        disabled={isLoading || Object.values(syncingStates).some(Boolean)}
                        variant={button.variant || "outline"}
                        size="sm"
                        className="w-full"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                            Synkroniserar...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3 mr-2" />
                            Synkronisera
                          </>
                        )}
                      </Button>
                      
                      {getLastSyncStatus(buttonKey)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataSyncButtons;
