
import { useState, useEffect } from 'react';
import { SupabaseDataService } from '../services/supabaseDataService';

export const usePartyData = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const parties = await SupabaseDataService.getPartyData();
        setData(parties);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch party data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error, refetch: () => window.location.reload() };
};

export const useMemberData = (limit?: number) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const members = await SupabaseDataService.getMemberData(limit);
        setData(members);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch member data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [limit]);

  return { data, loading, error, refetch: () => window.location.reload() };
};

export const useCalendarData = (limit?: number) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const events = await SupabaseDataService.getUpcomingEvents(limit || 10);
        setData(events);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch calendar data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [limit]);

  return { data, loading, error, refetch: () => window.location.reload() };
};

export const useDocumentData = (filters?: any) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const documents = await SupabaseDataService.getDocuments(filters);
        setData(documents);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch document data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error, refetch: () => window.location.reload() };
};

export const useSpeechData = (filters?: any) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const speeches = await SupabaseDataService.getSpeeches(filters);
        setData(speeches);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch speech data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error, refetch: () => window.location.reload() };
};

export const useVoteData = (filters?: any) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const votes = await SupabaseDataService.getVotes(filters);
        setData(votes);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch vote data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { data, loading, error, refetch: () => window.location.reload() };
};
