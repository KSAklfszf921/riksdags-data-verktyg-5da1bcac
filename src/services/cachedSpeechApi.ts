import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface CachedSpeechData {
  id: string;
  speech_id: string;
  anforande_id: string | null;
  intressent_id: string | null;
  rel_dok_id: string | null;
  namn: string | null;
  party: string | null;
  anforandedatum: string | null;
  anforandetext: string | null;
  anforandetyp: string | null;
  kammaraktivitet: string | null;
  anforande_nummer: string | null;
  talare: string | null;
  rel_dok_titel: string | null;
  rel_dok_beteckning: string | null;
  anf_klockslag: string | null;
  anforande_url_html: string | null;
  content_summary: string | null;
  word_count: number | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
}

export const fetchCachedSpeechData = async (limit = 100): Promise<CachedSpeechData[]> => {
  console.log('Fetching cached speech data...');
  
  const { data, error } = await supabase
    .from('speech_data')
    .select('*')
    .order('anforandedatum', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching cached speech data:', error);
    throw new Error(`Failed to fetch cached speech data: ${error.message}`);
  }

  return data?.map(item => ({
    id: item.id,
    speech_id: item.speech_id,
    anforande_id: item.anforande_id,
    intressent_id: item.intressent_id,
    rel_dok_id: item.rel_dok_id,
    namn: item.namn,
    party: item.party,
    anforandedatum: item.anforandedatum,
    anforandetext: item.anforandetext,
    anforandetyp: item.anforandetyp,
    kammaraktivitet: item.kammaraktivitet,
    anforande_nummer: item.anforande_nummer?.toString() || null,
    talare: item.talare,
    rel_dok_titel: item.rel_dok_titel,
    rel_dok_beteckning: item.rel_dok_beteckning,
    anf_klockslag: item.anf_klockslag,
    anforande_url_html: item.anforande_url_html,
    content_summary: item.content_summary,
    word_count: item.word_count,
    metadata: item.metadata,
    created_at: item.created_at,
    updated_at: item.updated_at
  })) || [];
};

export const fetchSpeechesByParty = async (party: string): Promise<CachedSpeechData[]> => {
  console.log(`Fetching speeches for party: ${party}`);
  
  const { data, error } = await supabase
    .from('speech_data')
    .select('*')
    .eq('party', party)
    .order('anforandedatum', { ascending: false });

  if (error) {
    console.error('Error fetching speeches by party:', error);
    throw new Error(`Failed to fetch speeches by party: ${error.message}`);
  }

  return data?.map(item => ({
    id: item.id,
    speech_id: item.speech_id,
    anforande_id: item.anforande_id,
    intressent_id: item.intressent_id,
    rel_dok_id: item.rel_dok_id,
    namn: item.namn,
    party: item.party,
    anforandedatum: item.anforandedatum,
    anforandetext: item.anforandetext,
    anforandetyp: item.anforandetyp,
    kammaraktivitet: item.kammaraktivitet,
    anforande_nummer: item.anforande_nummer?.toString() || null,
    talare: item.talare,
    rel_dok_titel: item.rel_dok_titel,
    rel_dok_beteckning: item.rel_dok_beteckning,
    anf_klockslag: item.anf_klockslag,
    anforande_url_html: item.anforande_url_html,
    content_summary: item.content_summary,
    word_count: item.word_count,
    metadata: item.metadata,
    created_at: item.created_at,
    updated_at: item.updated_at
  })) || [];
};

export const fetchSpeechesByMember = async (intressentId: string): Promise<CachedSpeechData[]> => {
  console.log(`Fetching speeches for member: ${intressentId}`);
  
  const { data, error } = await supabase
    .from('speech_data')
    .select('*')
    .eq('intressent_id', intressentId)
    .order('anforandedatum', { ascending: false });

  if (error) {
    console.error('Error fetching speeches by member:', error);
    throw new Error(`Failed to fetch speeches by member: ${error.message}`);
  }

  return data?.map(item => ({
    id: item.id,
    speech_id: item.speech_id,
    anforande_id: item.anforande_id,
    intressent_id: item.intressent_id,
    rel_dok_id: item.rel_dok_id,
    namn: item.namn,
    party: item.party,
    anforandedatum: item.anforandedatum,
    anforandetext: item.anforandetext,
    anforandetyp: item.anforandetyp,
    kammaraktivitet: item.kammaraktivitet,
    anforande_nummer: item.anforande_nummer?.toString() || null,
    talare: item.talare,
    rel_dok_titel: item.rel_dok_titel,
    rel_dok_beteckning: item.rel_dok_beteckning,
    anf_klockslag: item.anf_klockslag,
    anforande_url_html: item.anforande_url_html,
    content_summary: item.content_summary,
    word_count: item.word_count,
    metadata: item.metadata,
    created_at: item.created_at,
    updated_at: item.updated_at
  })) || [];
};

export const fetchSpeechesByType = async (speechType: string): Promise<CachedSpeechData[]> => {
  console.log(`Fetching speeches of type: ${speechType}`);
  
  const { data, error } = await supabase
    .from('speech_data')
    .select('*')
    .eq('anforandetyp', speechType)
    .order('anforandedatum', { ascending: false });

  if (error) {
    console.error('Error fetching speeches by type:', error);
    throw new Error(`Failed to fetch speeches by type: ${error.message}`);
  }

  return data?.map(item => ({
    id: item.id,
    speech_id: item.speech_id,
    anforande_id: item.anforande_id,
    intressent_id: item.intressent_id,
    rel_dok_id: item.rel_dok_id,
    namn: item.namn,
    party: item.party,
    anforandedatum: item.anforandedatum,
    anforandetext: item.anforandetext,
    anforandetyp: item.anforandetyp,
    kammaraktivitet: item.kammaraktivitet,
    anforande_nummer: item.anforande_nummer?.toString() || null,
    talare: item.talare,
    rel_dok_titel: item.rel_dok_titel,
    rel_dok_beteckning: item.rel_dok_beteckning,
    anf_klockslag: item.anf_klockslag,
    anforande_url_html: item.anforande_url_html,
    content_summary: item.content_summary,
    word_count: item.word_count,
    metadata: item.metadata,
    created_at: item.created_at,
    updated_at: item.updated_at
  })) || [];
};

export const searchSpeeches = async (query: string): Promise<CachedSpeechData[]> => {
  console.log(`Searching speeches with query: ${query}`);
  
  const { data, error } = await supabase
    .from('speech_data')
    .select('*')
    .or(`anforandetext.ilike.%${query}%, content_summary.ilike.%${query}%, rel_dok_titel.ilike.%${query}%`)
    .order('anforandedatum', { ascending: false });

  if (error) {
    console.error('Error searching speeches:', error);
    throw new Error(`Failed to search speeches: ${error.message}`);
  }

  return data?.map(item => ({
    id: item.id,
    speech_id: item.speech_id,
    anforande_id: item.anforande_id,
    intressent_id: item.intressent_id,
    rel_dok_id: item.rel_dok_id,
    namn: item.namn,
    party: item.party,
    anforandedatum: item.anforandedatum,
    anforandetext: item.anforandetext,
    anforandetyp: item.anforandetyp,
    kammaraktivitet: item.kammaraktivitet,
    anforande_nummer: item.anforande_nummer?.toString() || null,
    talare: item.talare,
    rel_dok_titel: item.rel_dok_titel,
    rel_dok_beteckning: item.rel_dok_beteckning,
    anf_klockslag: item.anf_klockslag,
    anforande_url_html: item.anforande_url_html,
    content_summary: item.content_summary,
    word_count: item.word_count,
    metadata: item.metadata,
    created_at: item.created_at,
    updated_at: item.updated_at
  })) || [];
};

export const getSpeechDataFreshness = async (): Promise<{ lastUpdated: string | null; isStale: boolean }> => {
  const { data, error } = await supabase
    .from('speech_data')
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
