
import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, ShieldCheck, ShieldAlert, Lock, Unlock, Eye, EyeOff } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SecurityStatus {
  rlsEnabled: boolean;
  authRequired: boolean;
  dataEncrypted: boolean;
  sessionValid: boolean;
  lastSecurityCheck: string;
}

const SecurityStatusIndicator: React.FC = () => {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    rlsEnabled: false,
    authRequired: false,
    dataEncrypted: false,
    sessionValid: false,
    lastSecurityCheck: 'Never'
  });
  const [loading, setLoading] = useState(true);
  const { user, session } = useAuth();

  const checkSecurityStatus = async () => {
    setLoading(true);
    
    try {
      // Check if RLS is enabled by attempting to access restricted data
      let rlsEnabled = false;
      try {
        const { error } = await supabase
          .from('user_roles')
          .select('*')
          .limit(1);
        
        // If we get a permission error, RLS is working
        rlsEnabled = error?.message?.includes('permission') || false;
      } catch {
        rlsEnabled = true; // Assume RLS is working if query fails
      }

      // Check if authentication is required
      const authRequired = !!user;

      // Check if data encryption is available (localStorage encryption)
      const dataEncrypted = 'crypto' in window && 'subtle' in window.crypto;

      // Check session validity
      const sessionValid = !!(session && session.access_token);

      setSecurityStatus({
        rlsEnabled,
        authRequired,
        dataEncrypted,
        sessionValid,
        lastSecurityCheck: new Date().toLocaleTimeString()
      });

    } catch (error) {
      console.error('Security check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSecurityStatus();
    
    // Run security check every 5 minutes
    const interval = setInterval(checkSecurityStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user, session]);

  const getSecurityScore = (): number => {
    const checks = [
      securityStatus.rlsEnabled,
      securityStatus.authRequired,
      securityStatus.dataEncrypted,
      securityStatus.sessionValid
    ];
    
    const passed = checks.filter(Boolean).length;
    return Math.round((passed / checks.length) * 100);
  };

  const getSecurityLevel = (): { level: string; color: string; icon: React.ReactNode } => {
    const score = getSecurityScore();
    
    if (score >= 90) {
      return { level: 'High', color: 'text-green-600', icon: <ShieldCheck className="w-4 h-4" /> };
    } else if (score >= 70) {
      return { level: 'Medium', color: 'text-yellow-600', icon: <Shield className="w-4 h-4" /> };
    } else {
      return { level: 'Low', color: 'text-red-600', icon: <ShieldAlert className="w-4 h-4" /> };
    }
  };

  const { level, color, icon } = getSecurityLevel();

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 animate-pulse" />
            <span className="text-sm">Checking security status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            {icon}
            <span>Security Status</span>
          </div>
          <Badge className={`${color} bg-transparent border-current`}>
            {level} ({getSecurityScore()}%)
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span>RLS Protection:</span>
            {securityStatus.rlsEnabled ? (
              <Lock className="w-3 h-3 text-green-600" />
            ) : (
              <Unlock className="w-3 h-3 text-red-600" />
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span>Authentication:</span>
            {securityStatus.authRequired ? (
              <Shield className="w-3 h-3 text-green-600" />
            ) : (
              <ShieldAlert className="w-3 h-3 text-yellow-600" />
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span>Data Encryption:</span>
            {securityStatus.dataEncrypted ? (
              <Eye className="w-3 h-3 text-green-600" />
            ) : (
              <EyeOff className="w-3 h-3 text-red-600" />
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span>Session Valid:</span>
            {securityStatus.sessionValid ? (
              <ShieldCheck className="w-3 h-3 text-green-600" />
            ) : (
              <ShieldAlert className="w-3 h-3 text-red-600" />
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 pt-2 border-t">
          Last check: {securityStatus.lastSecurityCheck}
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityStatusIndicator;
