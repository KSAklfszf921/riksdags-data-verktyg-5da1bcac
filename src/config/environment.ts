
// Environment configuration
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://zqhpbclqvhjcyrgvgaon.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaHBiY2xxdmhqY3lyZ3ZnYW9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NDA1NDEsImV4cCI6MjA2NDIxNjU0MX0.cUnZNOYFmfS-dK5GPhNZjCkvduXzR8DyswWfE0bIG1A'
  },
  cors: {
    proxyUrl: import.meta.env.VITE_CORS_PROXY_URL || ''
  }
};

// Validate required environment variables
export const validateEnvironment = () => {
  const errors: string[] = [];
  
  if (!config.supabase.url) {
    errors.push('VITE_SUPABASE_URL is required');
  }
  
  if (!config.supabase.anonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }
  
  if (errors.length > 0) {
    console.warn('Environment validation warnings:', errors);
  }
  
  return errors.length === 0;
};
