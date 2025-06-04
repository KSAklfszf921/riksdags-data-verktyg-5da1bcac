
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface CachedSpeechData {
  id: string;
  document_id: string;
  intressent_id: string | null;
  titel: string | null;
  party: string | null;
  datum: string | null;
  content_preview: string | null;
  typ: string | null;
  organ: string | null;
  beteckning: string | null;
  document_url_html: string | null;
  summary: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
}

export const fetchCachedSpeechData = async (limit = 100): Promise<CachedSpeechData[]> => {
  console.log('Fetching cached speech/document data...');
  
  const { data, error } = await supabase
    .from('document_data')
    .select('*')
    .not('content_preview', 'is', null)
    .order('datum', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching cached speech data:', error);
    throw new Error(`Failed to fetch cached speech data: ${error.message}`);
  }

  return data || [];
};

export const fetchSpeechesByParty = async (party: string): Promise<CachedSpeechData[]> => {
  console.log(`Fetching speeches for party: ${party}`);
  
  const { data, error } = await supabase
    .from('document_data')
    .select('*')
    .eq('party', party)
    .not('content_preview', 'is', null)
    .order('datum', { ascending: false });

  if (error) {
    console.error('Error fetching speeches by party:', error);
    throw new Error(`Failed to fetch speeches by party: ${error.message}`);
  }

  return data || [];
};

export const fetchSpeechesByMember = async (intressentId: string): Promise<CachedSpeechData[]> => {
  console.log(`Fetching speeches for member: ${intressentId}`);
  
  const { data, error } = await supabase
    .from('document_data')
    .select('*')
    .eq('intressent_id', intressentId)
    .not('content_preview', 'is', null)
    .order('datum', { ascending: false });

  if (error) {
    console.error('Error fetching speeches by member:', error);
    throw new Error(`Failed to fetch speeches by member: ${error.message}`);
  }

  return data || [];
};

export const fetchSpeechesByType = async (speechType: string): Promise<CachedSpeechData[]> => {
  console.log(`Fetching speeches of type: ${speechType}`);
  
  const { data, error } = await supabase
    .from('document_data')
    .select('*')
    .eq('typ', speechType)
    .not('content_preview', 'is', null)
    .order('datum', { ascending: false });

  if (error) {
    console.error('Error fetching speeches by type:', error);
    throw new Error(`Failed to fetch speeches by type: ${error.message}`);
  }

  return data || [];
};

export const searchSpeeches = async (query: string): Promise<CachedSpeechData[]> => {
  console.log(`Searching speeches with query: ${query}`);
  
  const { data, error } = await supabase
    .from('document_data')
    .select('*')
    .or(`content_preview.ilike.%${query}%, summary.ilike.%${query}%, titel.ilike.%${query}%`)
    .not('content_preview', 'is', null)
    .order('datum', { ascending: false });

  if (error) {
    console.error('Error searching speeches:', error);
    throw new Error(`Failed to search speeches: ${error.message}`);
  }

  return data || [];
};

export const getSpeechDataFreshness = async (): Promise<{ lastUpdated: string | null; isStale: boolean }> => {
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

// Utility functions for working with speech data
export const extractMetadata = (metadata: Json): any => {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata as any;
  }
  return {};
};

export const formatSpeechDate = (dateString: string | null): string => {
  if (!dateString) return 'Okänt datum';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE');
  } catch {
    return dateString;
  }
};

export const getSpeechDuration = (wordCount: number | null): string => {
  if (!wordCount) return 'Okänd längd';
  
  // Approximate reading time: 150 words per minute
  const minutes = Math.ceil(wordCount / 150);
  return `~${minutes} min`;
};

export const truncateText = (text: string | null, maxLength = 200): string => {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength).trim() + '...';
};
