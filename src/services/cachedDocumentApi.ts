import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface CachedDocumentData {
  id: string; // Changed from number to string to match usage
  document_id: string;
  titel: string | null;
  beteckning: string | null;
  datum: string | null;
  typ: string | null;
  organ: string | null;
  intressent_id: string | null;
  party: string | null;
  hangar_id: string | null;
  document_url_text: string | null;
  document_url_html: string | null;
  dokumentstatus: string | null;
  publicerad: string | null;
  rm: string | null;
  summary: string | null;
  content_preview: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
}

export const fetchCachedDocumentData = async (limit = 100): Promise<CachedDocumentData[]> => {
  console.log('Fetching cached document data...');
  
  const { data, error } = await supabase
    .from('document_data')
    .select('*')
    .order('datum', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching cached document data:', error);
    throw new Error(`Failed to fetch cached document data: ${error.message}`);
  }

  return data?.map(item => ({
    ...item,
    id: String(item.id) // Convert to string
  })) || [];
};

export const fetchDocumentsByType = async (documentType: string): Promise<CachedDocumentData[]> => {
  console.log(`Fetching documents of type: ${documentType}`);
  
  const { data, error } = await supabase
    .from('document_data')
    .select('*')
    .eq('typ', documentType)
    .order('datum', { ascending: false });

  if (error) {
    console.error('Error fetching documents by type:', error);
    throw new Error(`Failed to fetch documents by type: ${error.message}`);
  }

  return data?.map(item => ({
    ...item,
    id: String(item.id) // Convert to string
  })) || [];
};

export const fetchDocumentsByParty = async (party: string): Promise<CachedDocumentData[]> => {
  console.log(`Fetching documents for party: ${party}`);
  
  const { data, error } = await supabase
    .from('document_data')
    .select('*')
    .eq('party', party)
    .order('datum', { ascending: false });

  if (error) {
    console.error('Error fetching documents by party:', error);
    throw new Error(`Failed to fetch documents by party: ${error.message}`);
  }

  return data?.map(item => ({
    ...item,
    id: String(item.id) // Convert to string
  })) || [];
};

export const fetchDocumentsByOrgan = async (organ: string): Promise<CachedDocumentData[]> => {
  console.log(`Fetching documents for organ: ${organ}`);
  
  const { data, error } = await supabase
    .from('document_data')
    .select('*')
    .eq('organ', organ)
    .order('datum', { ascending: false });

  if (error) {
    console.error('Error fetching documents by organ:', error);
    throw new Error(`Failed to fetch documents by organ: ${error.message}`);
  }

  return data?.map(item => ({
    ...item,
    id: String(item.id) // Convert to string
  })) || [];
};

export const searchDocuments = async (query: string): Promise<CachedDocumentData[]> => {
  console.log(`Searching documents with query: ${query}`);
  
  const { data, error } = await supabase
    .from('document_data')
    .select('*')
    .or(`titel.ilike.%${query}%, summary.ilike.%${query}%, content_preview.ilike.%${query}%`)
    .order('datum', { ascending: false });

  if (error) {
    console.error('Error searching documents:', error);
    throw new Error(`Failed to search documents: ${error.message}`);
  }

  return data?.map(item => ({
    ...item,
    id: String(item.id) // Convert to string
  })) || [];
};

export const getDocumentDataFreshness = async (): Promise<{ lastUpdated: string | null; isStale: boolean }> => {
  const { data, error } = await supabase
    .from('document_data')
    .select('updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return { lastUpdated: null, isStale: true };
  }

  const lastUpdated = data.updated_at;
  const lastUpdateTime = new Date(lastUpdated);
  const now = new Date();
  const hoursSinceUpdate = (now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60);
  
  const isStale = hoursSinceUpdate > 24;

  return { lastUpdated, isStale };
};

// Utility functions for working with document data
export const extractMetadata = (metadata: Json): any => {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata as any;
  }
  return {};
};

export const getDocumentUrl = (document: CachedDocumentData, format: 'html' | 'text' = 'html'): string | null => {
  return format === 'html' ? document.document_url_html : document.document_url_text;
};

export const formatDocumentDate = (dateString: string | null): string => {
  if (!dateString) return 'Okänt datum';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE');
  } catch {
    return dateString;
  }
};
