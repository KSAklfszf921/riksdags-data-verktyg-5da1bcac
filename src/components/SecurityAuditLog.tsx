
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Search,
  Filter,
  Download,
  Eye,
  Lock,
  UserCheck,
  Activity
} from "lucide-react";

interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'failed_login' | 'api_limit' | 'permission_denied' | 'data_access' | 'system_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  user: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
}

const SecurityAuditLog: React.FC = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<SecurityEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    // Simulate loading security events
    const mockEvents: SecurityEvent[] = [
      {
        id: '1',
        type: 'login_attempt',
        severity: 'low',
        message: 'Framgångsrik inloggning från 192.168.1.100',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        user: 'admin@exempel.se',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        id: '2',
        type: 'api_limit',
        severity: 'medium',
        message: 'API-gräns närmar sig för IP 10.0.0.50',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        user: 'system',
        ip_address: '10.0.0.50'
      },
      {
        id: '3',
        type: 'failed_login',
        severity: 'high',
        message: 'Misslyckad inloggning från 203.0.113.42 (3 försök)',
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
        user: 'okänd',
        ip_address: '203.0.113.42'
      },
      {
        id: '4',
        type: 'permission_denied',
        severity: 'medium',
        message: 'Obehörig åtkomst till admin-panel blockerad',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        user: 'user@exempel.se',
        ip_address: '10.0.0.25'
      },
      {
        id: '5',
        type: 'system_change',
        severity: 'critical',
        message: 'Säkerhetsinställningar ändrade',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        user: 'admin@exempel.se',
        ip_address: '192.168.1.100'
      }
    ];
    setEvents(mockEvents);
    setFilteredEvents(mockEvents);
  }, []);

  useEffect(() => {
    let filtered = events;

    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.ip_address && event.ip_address.includes(searchTerm))
      );
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(event => event.severity === severityFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(event => event.type === typeFilter);
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, severityFilter, typeFilter]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login_attempt': return <UserCheck className="w-4 h-4 text-green-500" />;
      case 'failed_login': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'api_limit': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'permission_denied': return <Lock className="w-4 h-4 text-orange-500" />;
      case 'data_access': return <Eye className="w-4 h-4 text-blue-500" />;
      case 'system_change': return <Shield className="w-4 h-4 text-purple-500" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const handleExport = () => {
    const csvContent = [
      'Tidpunkt,Typ,Allvarlighetsgrad,Meddelande,Användare,IP-adress',
      ...filteredEvents.map(event => 
        `${event.timestamp.toISOString()},${event.type},${event.severity},${event.message},${event.user},${event.ip_address || ''}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security_audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast({
      title: "Export slutförd",
      description: "Säkerhetsloggen har exporterats som CSV-fil",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Säkerhetsauditlogg</span>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportera
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Sök i händelser..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Allvarlighetsgrad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla nivåer</SelectItem>
                <SelectItem value="low">Låg</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">Hög</SelectItem>
                <SelectItem value="critical">Kritisk</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Händelsetyp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla typer</SelectItem>
                <SelectItem value="login_attempt">Inloggningsförsök</SelectItem>
                <SelectItem value="failed_login">Misslyckad inloggning</SelectItem>
                <SelectItem value="api_limit">API-gräns</SelectItem>
                <SelectItem value="permission_denied">Behörighet nekad</SelectItem>
                <SelectItem value="data_access">Dataåtkomst</SelectItem>
                <SelectItem value="system_change">Systemändring</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Events List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredEvents.map((event) => (
              <div key={event.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-shrink-0 mt-1">
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{event.message}</p>
                    <Badge className={getSeverityColor(event.severity)}>
                      {event.severity}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{event.timestamp.toLocaleString('sv-SE')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <UserCheck className="w-3 h-3" />
                      <span>{event.user}</span>
                    </div>
                    {event.ip_address && (
                      <div className="flex items-center space-x-1">
                        <Activity className="w-3 h-3" />
                        <span>{event.ip_address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredEvents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Inga säkerhetshändelser hittades</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityAuditLog;
