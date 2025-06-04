
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthSecurityUtils } from '@/utils/authSecurityUtils';
import { secureStorage } from '@/utils/secureStorage';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const EnhancedAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Migrate sensitive data to secure storage on first load
    AuthSecurityUtils.migrateSensitiveData();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change:', event);
        
        if (session && AuthSecurityUtils.validateSession(session)) {
          // Check for suspicious activity
          if (AuthSecurityUtils.checkSuspiciousActivity(session.user)) {
            console.warn('🚨 Suspicious activity detected, signing out...');
            await supabase.auth.signOut();
            return;
          }

          setSession(session);
          setUser(session.user);
          
          // Check admin status
          try {
            const { data: isAdminResult } = await supabase.rpc('is_admin');
            setIsAdmin(!!isAdminResult);
          } catch (error) {
            console.warn('Failed to check admin status:', error);
            setIsAdmin(false);
          }

          // Store session data securely
          await secureStorage.setSecureItem('session_data', {
            sessionId: AuthSecurityUtils.generateSecureSessionId(),
            userId: session.user.id,
            timestamp: Date.now()
          });
        } else {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          
          if (event === 'SIGNED_OUT') {
            AuthSecurityUtils.secureCleanup();
          }
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && AuthSecurityUtils.validateSession(session)) {
        setSession(session);
        setUser(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // Rate limiting
    if (!AuthSecurityUtils.checkRateLimit(email)) {
      return { error: { message: 'Too many login attempts. Please try again later.' } };
    }

    // Sanitize input
    const sanitizedEmail = AuthSecurityUtils.sanitizeInput(email);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password
    });

    if (error) {
      console.error('🚨 Sign in error:', error);
    }

    return { error };
  };

  const signUp = async (email: string, password: string) => {
    // Rate limiting
    if (!AuthSecurityUtils.checkRateLimit(email)) {
      return { error: { message: 'Too many signup attempts. Please try again later.' } };
    }

    // Sanitize input
    const sanitizedEmail = AuthSecurityUtils.sanitizeInput(email);
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      console.error('🚨 Sign up error:', error);
    }

    return { error };
  };

  const signOut = async () => {
    console.log('🔓 Signing out...');
    
    // Perform secure cleanup before signing out
    AuthSecurityUtils.secureCleanup();
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('🚨 Sign out error:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
