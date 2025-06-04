
import { useState, useEffect } from 'react';
import { fetchMembers } from '../services/riksdagApi';

export interface TopListMember {
  id: string;
  name: string;
  party: string;
  activityCount: number;
}

interface TopListsData {
  mostActiveMembers: TopListMember[];
  recentDocuments: any[];
  upcomingEvents: any[];
  loading: boolean;
  error: string | null;
}

export const useTopListsData = (): TopListsData => {
  const [data, setData] = useState<TopListsData>({
    mostActiveMembers: [],
    recentDocuments: [],
    upcomingEvents: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const loadTopListsData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));
        
        // Fetch members for most active list
        const membersResult = await fetchMembers(1, 10, 'current');
        
        // For now, just use the fetched members as "most active"
        // In a real implementation, this would be based on activity metrics
        const mostActiveMembers: TopListMember[] = membersResult.members.slice(0, 5).map(member => ({
          id: member.intressent_id,
          name: `${member.tilltalsnamn} ${member.efternamn}`,
          party: member.parti,
          activityCount: Math.floor(Math.random() * 100) + 50 // Mock data
        }));

        setData({
          mostActiveMembers,
          recentDocuments: [], // Would be populated from document API
          upcomingEvents: [], // Would be populated from calendar API
          loading: false,
          error: null
        });
      } catch (err) {
        setData(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        }));
      }
    };

    loadTopListsData();
  }, []);

  return data;
};
