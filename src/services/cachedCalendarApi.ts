
import { supabase } from '@/integrations/supabase/client';

export interface CachedCalendarData {
  id: string;
  event_id: string;
  datum: string;
  typ: string;
  organ: string;
  summary: string;
  description?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
  participants: any[];
  agenda_items: any[];
  metadata: any;
  created_at: string;
  updated_at: string;
}

// Export individual functions that components expect
export const fetchCachedCalendarData = async (limit: number = 50): Promise<CachedCalendarData[]> => {
  return CachedCalendarApi.getAllEvents();
};

export const fetchUpcomingEvents = async (limit: number = 10): Promise<CachedCalendarData[]> => {
  return CachedCalendarApi.getUpcomingEvents(limit);
};

export const fetchEventsByOrgan = async (organ: string): Promise<CachedCalendarData[]> => {
  try {
    const { data, error } = await supabase
      .from('calendar_data')
      .select('*')
      .eq('organ', organ)
      .order('datum', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching events by organ:', error);
      return [];
    }

    return data?.map(item => ({
      id: item.id,
      event_id: item.event_id,
      datum: item.datum,
      typ: item.typ || '',
      organ: item.organ || '',
      summary: item.summary || '',
      description: item.description,
      location: item.location,
      start_time: item.start_time,
      end_time: item.end_time,
      participants: item.participants as any[] || [],
      agenda_items: item.agenda_items as any[] || [],
      metadata: item.metadata as any || {},
      created_at: item.created_at,
      updated_at: item.updated_at
    })) || [];
  } catch (error) {
    console.error('Error in fetchEventsByOrgan:', error);
    return [];
  }
};

export const fetchEventsByType = async (eventType: string): Promise<CachedCalendarData[]> => {
  try {
    const { data, error } = await supabase
      .from('calendar_data')
      .select('*')
      .eq('typ', eventType)
      .order('datum', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching events by type:', error);
      return [];
    }

    return data?.map(item => ({
      id: item.id,
      event_id: item.event_id,
      datum: item.datum,
      typ: item.typ || '',
      organ: item.organ || '',
      summary: item.summary || '',
      description: item.description,
      location: item.location,
      start_time: item.start_time,
      end_time: item.end_time,
      participants: item.participants as any[] || [],
      agenda_items: item.agenda_items as any[] || [],
      metadata: item.metadata as any || {},
      created_at: item.created_at,
      updated_at: item.updated_at
    })) || [];
  } catch (error) {
    console.error('Error in fetchEventsByType:', error);
    return [];
  }
};

export const fetchEventsByDateRange = async (startDate: string, endDate: string): Promise<CachedCalendarData[]> => {
  return CachedCalendarApi.getEventsByDateRange(startDate, endDate);
};

export const searchEvents = async (query: string): Promise<CachedCalendarData[]> => {
  try {
    const { data, error } = await supabase
      .from('calendar_data')
      .select('*')
      .or(`summary.ilike.%${query}%,description.ilike.%${query}%,organ.ilike.%${query}%`)
      .order('datum', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error searching events:', error);
      return [];
    }

    return data?.map(item => ({
      id: item.id,
      event_id: item.event_id,
      datum: item.datum,
      typ: item.typ || '',
      organ: item.organ || '',
      summary: item.summary || '',
      description: item.description,
      location: item.location,
      start_time: item.start_time,
      end_time: item.end_time,
      participants: item.participants as any[] || [],
      agenda_items: item.agenda_items as any[] || [],
      metadata: item.metadata as any || {},
      created_at: item.created_at,
      updated_at: item.updated_at
    })) || [];
  } catch (error) {
    console.error('Error in searchEvents:', error);
    return [];
  }
};

// Add the missing export
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

// Format functions
export const formatEventDate = (dateString: string | null): string => {
  if (!dateString) return 'Okänt datum';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', {
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
    // Handle both time formats: "HH:MM:SS" and "HH:MM"
    const timeParts = timeString.split(':');
    if (timeParts.length >= 2) {
      return `${timeParts[0]}:${timeParts[1]}`;
    }
    return timeString;
  } catch {
    return timeString || '';
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

export class CachedCalendarApi {
  static async getUpcomingEvents(limit: number = 10): Promise<CachedCalendarData[]> {
    try {
      const { data, error } = await supabase
        .from('calendar_data')
        .select('*')
        .gte('datum', new Date().toISOString().split('T')[0])
        .order('datum', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching upcoming events:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        event_id: item.event_id,
        datum: item.datum,
        typ: item.typ || '',
        organ: item.organ || '',
        summary: item.summary || '',
        description: item.description,
        location: item.location,
        start_time: item.start_time,
        end_time: item.end_time,
        participants: item.participants as any[] || [],
        agenda_items: item.agenda_items as any[] || [],
        metadata: item.metadata as any || {},
        created_at: item.created_at,
        updated_at: item.updated_at
      })) || [];
    } catch (error) {
      console.error('Error in getUpcomingEvents:', error);
      return [];
    }
  }

  static async getEventsByDateRange(startDate: string, endDate: string): Promise<CachedCalendarData[]> => {
    try {
      const { data, error } = await supabase
        .from('calendar_data')
        .select('*')
        .gte('datum', startDate)
        .lte('datum', endDate)
        .order('datum', { ascending: true });

      if (error) {
        console.error('Error fetching events by date range:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        event_id: item.event_id,
        datum: item.datum,
        typ: item.typ || '',
        organ: item.organ || '',
        summary: item.summary || '',
        description: item.description,
        location: item.location,
        start_time: item.start_time,
        end_time: item.end_time,
        participants: item.participants as any[] || [],
        agenda_items: item.agenda_items as any[] || [],
        metadata: item.metadata as any || {},
        created_at: item.created_at,
        updated_at: item.updated_at
      })) || [];
    } catch (error) {
      console.error('Error in getEventsByDateRange:', error);
      return [];
    }
  }

  static async getEventsByType(eventType: string, limit: number = 20): Promise<CachedCalendarData[]> => {
    try {
      const { data, error } = await supabase
        .from('calendar_data')
        .select('*')
        .eq('typ', eventType)
        .order('datum', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching events by type:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        event_id: item.event_id,
        datum: item.datum,
        typ: item.typ || '',
        organ: item.organ || '',
        summary: item.summary || '',
        description: item.description,
        location: item.location,
        start_time: item.start_time,
        end_time: item.end_time,
        participants: item.participants as any[] || [],
        agenda_items: item.agenda_items as any[] || [],
        metadata: item.metadata as any || {},
        created_at: item.created_at,
        updated_at: item.updated_at
      })) || [];
    } catch (error) {
      console.error('Error in getEventsByType:', error);
      return [];
    }
  }

  static async getAllEvents(): Promise<CachedCalendarData[]> => {
    try {
      const { data, error } = await supabase
        .from('calendar_data')
        .select('*')
        .order('datum', { ascending: false });

      if (error) {
        console.error('Error fetching all events:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        event_id: item.event_id,
        datum: item.datum,
        typ: item.typ || '',
        organ: item.organ || '',
        summary: item.summary || '',
        description: item.description,
        location: item.location,
        start_time: item.start_time,
        end_time: item.end_time,
        participants: item.participants as any[] || [],
        agenda_items: item.agenda_items as any[] || [],
        metadata: item.metadata as any || {},
        created_at: item.created_at,
        updated_at: item.updated_at
      })) || [];
    } catch (error) {
      console.error('Error in getAllEvents:', error);
      return [];
    }
  }
}
