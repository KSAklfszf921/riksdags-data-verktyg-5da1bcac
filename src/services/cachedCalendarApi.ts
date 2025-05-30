
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface CachedCalendarData {
  id: string;
  event_id: string;
  datum: string | null;
  tid: string | null;
  plats: string | null;
  aktivitet: string | null;
  typ: string | null;
  organ: string | null;
  summary: string | null;
  description: string | null;
  status: string | null;
  url: string | null;
  sekretess: string | null;
  participants: Json | null;
  related_documents: Json | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
}

export const fetchCachedCalendarData = async (limit = 100): Promise<CachedCalendarData[]> => {
  console.log('Fetching cached calendar data...');
  
  const { data, error } = await supabase
    .from('calendar_data')
    .select('*')
    .order('datum', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching cached calendar data:', error);
    throw new Error(`Failed to fetch cached calendar data: ${error.message}`);
  }

  return data || [];
};

export const fetchUpcomingEvents = async (daysAhead = 30): Promise<CachedCalendarData[]> => {
  console.log(`Fetching upcoming events for next ${daysAhead} days`);
  
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);
  
  const { data, error } = await supabase
    .from('calendar_data')
    .select('*')
    .gte('datum', today.toISOString().split('T')[0])
    .lte('datum', futureDate.toISOString().split('T')[0])
    .order('datum', { ascending: true });

  if (error) {
    console.error('Error fetching upcoming events:', error);
    throw new Error(`Failed to fetch upcoming events: ${error.message}`);
  }

  return data || [];
};

export const fetchEventsByOrgan = async (organ: string): Promise<CachedCalendarData[]> => {
  console.log(`Fetching events for organ: ${organ}`);
  
  const { data, error } = await supabase
    .from('calendar_data')
    .select('*')
    .eq('organ', organ)
    .order('datum', { ascending: false });

  if (error) {
    console.error('Error fetching events by organ:', error);
    throw new Error(`Failed to fetch events by organ: ${error.message}`);
  }

  return data || [];
};

export const fetchEventsByType = async (eventType: string): Promise<CachedCalendarData[]> => {
  console.log(`Fetching events of type: ${eventType}`);
  
  const { data, error } = await supabase
    .from('calendar_data')
    .select('*')
    .eq('typ', eventType)
    .order('datum', { ascending: false });

  if (error) {
    console.error('Error fetching events by type:', error);
    throw new Error(`Failed to fetch events by type: ${error.message}`);
  }

  return data || [];
};

export const fetchEventsByDateRange = async (fromDate: string, toDate: string): Promise<CachedCalendarData[]> => {
  console.log(`Fetching events from ${fromDate} to ${toDate}`);
  
  const { data, error } = await supabase
    .from('calendar_data')
    .select('*')
    .gte('datum', fromDate)
    .lte('datum', toDate)
    .order('datum', { ascending: true });

  if (error) {
    console.error('Error fetching events by date range:', error);
    throw new Error(`Failed to fetch events by date range: ${error.message}`);
  }

  return data || [];
};

export const searchEvents = async (query: string): Promise<CachedCalendarData[]> => {
  console.log(`Searching events with query: ${query}`);
  
  const { data, error } = await supabase
    .from('calendar_data')
    .select('*')
    .or(`summary.ilike.%${query}%, description.ilike.%${query}%, aktivitet.ilike.%${query}%`)
    .order('datum', { ascending: false });

  if (error) {
    console.error('Error searching events:', error);
    throw new Error(`Failed to search events: ${error.message}`);
  }

  return data || [];
};

export const getCalendarDataFreshness = async (): Promise<{ lastUpdated: string | null; isStale: boolean }> => {
  const { data, error } = await supabase
    .from('calendar_data')
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

// Utility functions for working with calendar data
export const extractParticipants = (participants: Json): string[] => {
  if (Array.isArray(participants)) {
    return participants.filter((item): item is string => typeof item === 'string');
  }
  return [];
};

export const extractRelatedDocuments = (documents: Json): any[] => {
  if (Array.isArray(documents)) {
    return documents;
  }
  return [];
};

export const extractMetadata = (metadata: Json): any => {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata as any;
  }
  return {};
};

export const formatEventDate = (dateString: string | null): string => {
  if (!dateString) return 'Okänt datum';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

export const formatEventTime = (timeString: string | null): string => {
  if (!timeString) return '';
  
  try {
    // Handle both full datetime and time-only strings
    if (timeString.includes('T')) {
      const date = new Date(timeString);
      return date.toLocaleTimeString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return timeString;
    }
  } catch {
    return timeString;
  }
};

export const isEventToday = (dateString: string | null): boolean => {
  if (!dateString) return false;
  
  try {
    const eventDate = new Date(dateString);
    const today = new Date();
    
    return eventDate.toDateString() === today.toDateString();
  } catch {
    return false;
  }
};

export const isEventUpcoming = (dateString: string | null): boolean => {
  if (!dateString) return false;
  
  try {
    const eventDate = new Date(dateString);
    const today = new Date();
    
    return eventDate > today;
  } catch {
    return false;
  }
};
