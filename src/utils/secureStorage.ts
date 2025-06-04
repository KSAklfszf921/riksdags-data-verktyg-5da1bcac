
// Secure storage utility for sensitive client-side data
class SecureStorage {
  private static instance: SecureStorage;
  private encryptionKey: string | null = null;

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  private async generateKey(): Promise<string> {
    // Generate a simple key based on session and user agent
    const sessionId = crypto.randomUUID();
    const userAgent = navigator.userAgent;
    const combined = `${sessionId}-${userAgent}`;
    
    // Simple encoding (not cryptographically secure, but better than plaintext)
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async getOrCreateKey(): Promise<string> {
    if (!this.encryptionKey) {
      // Try to get existing key from session storage
      this.encryptionKey = sessionStorage.getItem('_sk') || await this.generateKey();
      sessionStorage.setItem('_sk', this.encryptionKey);
    }
    return this.encryptionKey;
  }

  private simpleEncrypt(text: string, key: string): string {
    // Simple XOR encryption (not secure for production, but better than plaintext)
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const keyChar = key.charCodeAt(i % key.length);
      const textChar = text.charCodeAt(i);
      result += String.fromCharCode(textChar ^ keyChar);
    }
    return btoa(result); // Base64 encode
  }

  private simpleDecrypt(encryptedText: string, key: string): string {
    try {
      const decoded = atob(encryptedText); // Base64 decode
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        const keyChar = key.charCodeAt(i % key.length);
        const encryptedChar = decoded.charCodeAt(i);
        result += String.fromCharCode(encryptedChar ^ keyChar);
      }
      return result;
    } catch {
      return '';
    }
  }

  async setSecureItem(key: string, value: any): Promise<void> {
    try {
      const encryptionKey = await this.getOrCreateKey();
      const serialized = JSON.stringify(value);
      const encrypted = this.simpleEncrypt(serialized, encryptionKey);
      localStorage.setItem(`sec_${key}`, encrypted);
    } catch (error) {
      console.warn('Failed to store secure item:', error);
      // Fallback to regular storage with warning
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  async getSecureItem(key: string): Promise<any> {
    try {
      const encryptionKey = await this.getOrCreateKey();
      const encrypted = localStorage.getItem(`sec_${key}`);
      
      if (!encrypted) {
        // Try fallback to regular storage
        const fallback = localStorage.getItem(key);
        return fallback ? JSON.parse(fallback) : null;
      }
      
      const decrypted = this.simpleDecrypt(encrypted, encryptionKey);
      return decrypted ? JSON.parse(decrypted) : null;
    } catch (error) {
      console.warn('Failed to retrieve secure item:', error);
      // Fallback to regular storage
      const fallback = localStorage.getItem(key);
      return fallback ? JSON.parse(fallback) : null;
    }
  }

  async removeSecureItem(key: string): Promise<void> {
    localStorage.removeItem(`sec_${key}`);
    localStorage.removeItem(key); // Also remove any fallback
  }

  clearAllSecureItems(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('sec_')) {
        localStorage.removeItem(key);
      }
    });
    sessionStorage.removeItem('_sk');
    this.encryptionKey = null;
  }
}

export const secureStorage = SecureStorage.getInstance();
