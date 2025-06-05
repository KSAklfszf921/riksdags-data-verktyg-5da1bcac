
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { RiksdagMember } from '../services/riksdagApi';

// Define missing types
interface CachedMemberData {
  id: string;
  name: string;
  party: string;
  constituency?: string;
}

// Helper function to extract image URLs
const extractImageUrls = (member: any) => {
  if (member.bild_url_192) {
    return {
      '192': member.bild_url_192,
      '80': member.bild_url_80,
      'max': member.bild_url_max
    };
  }
  return null;
};

// Helper function to extract committee assignments (renamed from extractCommitteeAssignments)
const getMemberCommitteeAssignments = (member: any) => {
  if (member.assignments && Array.isArray(member.assignments)) {
    return member.assignments.filter((assignment: any) => 
      assignment.typ === 'kammaruppdrag' || assignment.typ === 'kommittéuppdrag'
    );
  }
  return [];
};

// Mock committees data
const mockCommittees = [
  'Arbetsmarknadsutskottet',
  'Civilutskottet',
  'Finansutskottet',
  'Försvarsutskottet',
  'Justitieutskottet',
  'Kulturutskottet',
  'Miljö- och jordbruksutskottet',
  'Näringsutskottet',
  'Socialutskottet',
  'Trafikutskottet',
  'Utbildningsutskottet',
  'Utrikesutskottet'
];

// Committee name to code mapping
const committeeCodeMap: Record<string, string> = {
  'Arbetsmarknadsutskottet': 'AU',
  'Civilutskottet': 'CU',
  'Finansutskottet': 'FiU',
  'Försvarsutskottet': 'FöU',
  'Justitieutskottet': 'JuU',
  'Kulturutskottet': 'KrU',
  'Miljö- och jordbruksutskottet': 'MJU',
  'Näringsutskottet': 'NU',
  'Socialutskottet': 'SoU',
  'Trafikutskottet': 'TU',
  'Utbildningsutskottet': 'UbU',
  'Utrikesutskottet': 'UU'
};

// Mock implementation for missing functions
const fetchMembersWithCommittees = async () => {
  // This would normally fetch from an API
  return [];
};

const fetchCachedMemberData = async (): Promise<CachedMemberData[]> => {
  // This would normally fetch cached data
  return [];
};

const fetchMemberSuggestions = async (query: string) => {
  // This would normally fetch member suggestions
  return [];
};

// Export committee helper functions
export const getCommitteeName = (code: string): string => {
  const entry = Object.entries(committeeCodeMap).find(([name, c]) => c === code);
  return entry ? entry[0] : code;
};

export const getCommitteeCode = (name: string): string => {
  return committeeCodeMap[name] || name;
};

// Export committees hook
export const useCommittees = () => {
  return {
    committees: mockCommittees,
    loading: false,
    error: null
  };
};

// Export member suggestions hook
export const useMemberSuggestions = () => {
  const [suggestions, setSuggestions] = useState<RiksdagMember[]>([]);
  const [loading, setLoading] = useState(false);

  const searchMembers = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const results = await fetchMemberSuggestions(query);
      setSuggestions(results);
    } catch (error) {
      console.error('Error searching members:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    suggestions,
    loading,
    searchMembers
  };
};

export const useMembers = (
  currentPage: number = 1,
  pageSize: number = 20,
  memberStatus: 'current' | 'all' | 'former' = 'current',
  committee?: string
) => {
  return useQuery({
    queryKey: ['members', currentPage, pageSize, memberStatus, committee],
    queryFn: async () => {
      // Mock implementation - would fetch real data from API
      return [];
    },
    staleTime: 5 * 60 * 1000,
    select: (data: any[]) => ({
      members: data,
      loading: false,
      error: null,
      totalCount: data.length,
      hasMore: false
    })
  });
};

export const useMemberById = (memberId: string) => {
  return useQuery({
    queryKey: ['member', memberId],
    queryFn: async () => {
      // Implementation would go here
      return null;
    },
    enabled: !!memberId,
  });
};

export const useMembersByParty = (party: string) => {
  return useQuery({
    queryKey: ['members', 'party', party],
    queryFn: async () => {
      // Implementation would go here
      return [];
    },
    enabled: !!party,
  });
};

export const useMemberSearch = (searchTerm: string) => {
  return useQuery({
    queryKey: ['members', 'search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) {
        return [];
      }
      return fetchMemberSuggestions(searchTerm);
    },
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 2 * 60 * 1000,
  });
};

export const useMembersByCommittee = (committee: string) => {
  return useQuery({
    queryKey: ['members', 'committee', committee],
    queryFn: async () => {
      return fetchMembersWithCommittees();
    },
    enabled: !!committee,
  });
};

export default useMembers;
