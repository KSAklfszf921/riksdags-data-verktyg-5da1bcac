
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

export const useMembers = (limit?: number) => {
  return useQuery({
    queryKey: ['members', limit],
    queryFn: async () => {
      // Implementation would go here
      return [];
    },
    staleTime: 5 * 60 * 1000,
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
