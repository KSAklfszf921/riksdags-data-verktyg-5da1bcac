import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Lock, 
  Key, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  UserCheck,
  Activity,
  Clock,
  Globe,
  Database,
  FileText,
  Settings
} from "lucide-react";

interface SecuritySettings {
  apiRateLimit: number;
  sessionTimeout: number;
  enableTwoFactor: boolean;
  enableAuditLogging: boolean;
  enableIpWhitelist: boolean;
  requireStrongPasswords: boolean;
  enableDataEncryption: boolean;
  enableBackupEncryption: boolean;
}

const AdminSecurityPanel: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SecuritySettings>({
    apiRateLimit: 100,
    sessionTimeout: 60,
    enableTwoFactor: false,
    enableAuditLogging: true,
    enableIpWhitelist: false,
    requireStrongPasswords: true,
    enableDataEncryption: true,
    enableBackupEncryption: true
  });

  const [securityEvents] = useState([
    {
      id: '1',
      type: 'login_attempt',
      severity: 'info',
      message: 'Framgångsrik inloggning från 192.168.1.100',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      user: 'admin@exempel.se'
    },
    {
      id: '2',
      type: 'api_limit',
      severity: 'warning',
      message: 'API-gräns närmar sig för IP 10.0.0.50',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      user: 'system'
    },
    {
      id: '3',
      type: 'failed_login',
      severity: 'error',
      message: 'Misslyckad inloggning från 203.0.113.42 (3 försök)',
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      user: 'okänd'
    }
  ]);

  const handleSettingChange = (key: keyof SecuritySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    console.log('Sparar säkerhetsinställningar:', settings);
    toast({
      title: "Inställningar sparade",
      description: "Säkerhetsinställningarna har uppdaterats",
    });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login_attempt': return <UserCheck className="w-4 h-4 text-green-500" />;
      case 'api_limit': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'failed_login': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getEventBadge = (severity: string) => {
    switch (severity) {
      case 'info': return <Badge className="bg-blue-500">Info</Badge>;
      case 'warning': return <Badge className="bg-yellow-500">Varning</Badge>;
      case 'error': return <Badge className="bg-red-500">Fel</Badge>;
      default: return <Badge variant="outline">Okänd</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span>Säkerhetsöversikt</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div className="text-lg font-bold">Aktiv</div>
              <div className="text-sm text-gray-600">API-säkerhet</div>
            </div>

            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-center mb-2">
                <Lock className="w-6 h-6 text-green-500" />
              </div>
              <div className="text-lg font-bold">Säker</div>
              <div className="text-sm text-gray-600">Datakryptering</div>
            </div>

            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-center mb-2">
                <Eye className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-lg font-bold">Aktiv</div>
              <div className="text-sm text-gray-600">Auditloggning</div>
            </div>

            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-center mb-2">
                <Activity className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="text-lg font-bold">Normal</div>
              <div className="text-sm text-gray-600">Hotaktivitet</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Säkerhetsinställningar</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* API Security */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>API-säkerhet</span>
              </h4>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Max förfrågningar per minut</span>
                  <p className="text-xs text-gray-500">Begränsar API-anrop per IP-adress</p>
                </div>
                <Input
                  type="number"
                  value={settings.apiRateLimit}
                  onChange={(e) => handleSettingChange('apiRateLimit', parseInt(e.target.value))}
                  className="w-24"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Session timeout (minuter)</span>
                  <p className="text-xs text-gray-500">Automatisk utloggning</p>
                </div>
                <Input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                  className="w-24"
                />
              </div>
            </div>

            {/* Authentication */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center space-x-2">
                <Key className="w-4 h-4" />
                <span>Autentisering</span>
              </h4>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Tvåfaktorsautentisering</span>
                  <p className="text-xs text-gray-500">Kräv extra verifiering</p>
                </div>
                <Switch
                  checked={settings.enableTwoFactor}
                  onCheckedChange={(checked) => handleSettingChange('enableTwoFactor', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Starka lösenord</span>
                  <p className="text-xs text-gray-500">Kräv komplex lösenordspolicy</p>
                </div>
                <Switch
                  checked={settings.requireStrongPasswords}
                  onCheckedChange={(checked) => handleSettingChange('requireStrongPasswords', checked)}
                />
              </div>
            </div>

            {/* Data Protection */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center space-x-2">
                <Database className="w-4 h-4" />
                <span>Dataskydd</span>
              </h4>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Datakryptering</span>
                  <p className="text-xs text-gray-500">Kryptera känslig data</p>
                </div>
                <Switch
                  checked={settings.enableDataEncryption}
                  onCheckedChange={(checked) => handleSettingChange('enableDataEncryption', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Auditloggning</span>
                  <p className="text-xs text-gray-500">Logga alla åtgärder</p>
                </div>
                <Switch
                  checked={settings.enableAuditLogging}
                  onCheckedChange={(checked) => handleSettingChange('enableAuditLogging', checked)}
                />
              </div>
            </div>

            <Button onClick={handleSaveSettings} className="w-full">
              Spara säkerhetsinställningar
            </Button>
          </CardContent>
        </Card>

        {/* Security Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Säkerhetshändelser</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {securityEvents.map((event) => (
                <div key={event.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">{event.message}</p>
                      {getEventBadge(event.severity)}
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{event.timestamp.toLocaleTimeString('sv-SE')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <UserCheck className="w-3 h-3" />
                        <span>{event.user}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="outline" className="w-full">
                Visa alla säkerhetshändelser
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span>Säkerhetsrekommendationer</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!settings.enableTwoFactor && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Rekommendation:</strong> Aktivera tvåfaktorsautentisering för ökad säkerhet.
                </AlertDescription>
              </Alert>
            )}

            <Alert className="bg-blue-50 border-blue-200">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Bra gjort:</strong> Datakryptering och auditloggning är aktiverade.
              </AlertDescription>
            </Alert>

            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Säkert:</strong> API-begränsning och starka lösenord är konfigurerade.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSecurityPanel;
