
import { secureStorage } from './secureStorage';

// Security utilities for authentication and session management
export class AuthSecurityUtils {
  private static readonly SENSITIVE_KEYS = [
    'user_preferences',
    'admin_settings',
    'temp_tokens',
    'session_data'
  ];

  // Migrate existing localStorage data to secure storage
  static async migrateSensitiveData(): Promise<void> {
    console.log('🔒 Migrating sensitive data to secure storage...');
    
    for (const key of this.SENSITIVE_KEYS) {
      const existingData = localStorage.getItem(key);
      if (existingData) {
        try {
          const parsed = JSON.parse(existingData);
          await secureStorage.setSecureItem(key, parsed);
          localStorage.removeItem(key);
          console.log(`✅ Migrated ${key} to secure storage`);
        } catch (error) {
          console.warn(`⚠️ Failed to migrate ${key}:`, error);
        }
      }
    }
  }

  // Validate session integrity
  static validateSession(session: any): boolean {
    if (!session) return false;
    
    // Check for required session properties
    const requiredProps = ['access_token', 'user'];
    for (const prop of requiredProps) {
      if (!session[prop]) {
        console.warn(`🚨 Invalid session: missing ${prop}`);
        return false;
      }
    }

    // Check token expiration
    if (session.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000);
      const now = new Date();
      if (now >= expiresAt) {
        console.warn('🚨 Session expired');
        return false;
      }
    }

    return true;
  }

  // Sanitize user input to prevent XSS
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  // Check for suspicious activity patterns
  static checkSuspiciousActivity(user: any): boolean {
    if (!user) return false;

    // Check for unusual role assignments
    if (user.app_metadata?.roles && Array.isArray(user.app_metadata.roles)) {
      const roles = user.app_metadata.roles;
      if (roles.includes('admin') && roles.includes('service_role')) {
        console.warn('🚨 Suspicious role combination detected');
        return true;
      }
    }

    // Check for recent login attempts
    const lastLogin = user.last_sign_in_at;
    if (lastLogin) {
      const loginTime = new Date(lastLogin);
      const now = new Date();
      const timeDiff = now.getTime() - loginTime.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      // Flag if login was more than 24 hours ago but session is still active
      if (hoursDiff > 24) {
        console.warn('🚨 Potentially stale session detected');
        return true;
      }
    }

    return false;
  }

  // Generate secure session ID
  static generateSecureSessionId(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Rate limiting for authentication attempts
  private static attemptCounts = new Map<string, { count: number; lastAttempt: number }>();

  static checkRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 300000): boolean {
    const now = Date.now();
    const attempts = this.attemptCounts.get(identifier);

    if (!attempts) {
      this.attemptCounts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }

    // Reset if window has passed
    if (now - attempts.lastAttempt > windowMs) {
      this.attemptCounts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }

    // Check if limit exceeded
    if (attempts.count >= maxAttempts) {
      console.warn(`🚨 Rate limit exceeded for ${identifier}`);
      return false;
    }

    // Increment count
    attempts.count++;
    attempts.lastAttempt = now;
    return true;
  }

  // Clean up security data on logout
  static secureCleanup(): void {
    console.log('🧹 Performing secure cleanup...');
    
    // Clear all secure storage
    secureStorage.clearAllSecureItems();
    
    // Clear sensitive session storage
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach(key => {
      if (key.startsWith('_') || key.includes('token') || key.includes('auth')) {
        sessionStorage.removeItem(key);
      }
    });

    // Clear rate limiting data
    this.attemptCounts.clear();

    console.log('✅ Security cleanup completed');
  }
}
