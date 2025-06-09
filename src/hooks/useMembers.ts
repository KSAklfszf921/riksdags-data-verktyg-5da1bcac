
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SupabaseDataService } from '../services/supabaseDataService';

export interface MemberSearchParams {
  p?: number;
  kategori?: string;
  organ?: string;
  parti?: string;
  utformat?: string;
}

export interface MembersQueryResult {
  members: any[];
  totalCount: number;
  hasMore: boolean;
}

export interface CachedMemberData {
  id: string;
  firstName: string;
  lastName: string;
  party: string;
  constituency: string;
  imageUrl: string;
  isActive: boolean;
}

export interface RiksdagMember {
  intressent_id: string;
  tilltalsnamn: string;
  efternamn: string;
  parti: string;
  valkrets: string;
  kon: string;
  fodd_ar: string;
}

// Fetch members from Supabase
const fetchMembers = async (params: MemberSearchParams): Promise<{ members: any[], totalCount: number }> => {
  console.log('Fetching members with params:', params);
  
  try {
    // Use SupabaseDataService to get member data
    const supabaseMembers = await SupabaseDataService.getMemberData();
    
    // Transform Supabase data to expected format with proper defaults
    const transformedMembers = supabaseMembers.map((member: any) => ({
      id: member.member_id,
      firstName: member.first_name || '',
      lastName: member.last_name || '',
      party: member.party || '',
      constituency: member.constituency || '',
      imageUrl: getImageUrl(member.image_urls),
      isActive: member.is_active ?? true,
      committees: member.current_committees || [],
      assignments: member.assignments || [],
      activityScore: 0, // Default value
      speeches: [], // Add default empty array
      votes: [], // Add default empty array
      proposals: [], // Add default empty array
      motions: 0, // Add default value
      interpellations: 0, // Add default value
      writtenQuestions: 0, // Add default value
      birthYear: member.birth_year || new Date().getFullYear() - 40, // Default age
      email: generateEmail(member.first_name || '', member.last_name || ''),
      profession: '' // Add default profession
    }));

    // Apply filtering based on params
    let filteredMembers = transformedMembers;
    
    if (params.kategori === 'nuvarande') {
      filteredMembers = filteredMembers.filter(member => member.isActive);
    } else if (params.kategori === 'avslutade') {
      filteredMembers = filteredMembers.filter(member => !member.isActive);
    }
    
    if (params.parti) {
      filteredMembers = filteredMembers.filter(member => member.party === params.parti);
    }
    
    if (params.organ) {
      filteredMembers = filteredMembers.filter(member => 
        member.committees?.includes(params.organ)
      );
    }

    const totalCount = filteredMembers.length;
    
    return {
      members: filteredMembers,
      totalCount
    };
  } catch (error) {
    console.error('Error fetching members:', error);
    return {
      members: [],
      totalCount: 0
    };
  }
};

// Helper function to safely extract image URL
const getImageUrl = (imageUrls: any): string => {
  if (!imageUrls || typeof imageUrls !== 'object') return '';
  
  if (typeof imageUrls === 'string') return imageUrls;
  
  return imageUrls.max || imageUrls['192'] || imageUrls['80'] || '';
};

// Helper function to generate email
const generateEmail = (firstName: string, lastName: string): string => {
  if (!firstName || !lastName) return '';
  
  const cleanFirst = firstName.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/ä/g, 'a')
    .replace(/å/g, 'a')
    .replace(/ö/g, 'o');
  const cleanLast = lastName.toLowerCase()
    .replace(/ä/g, 'a')
    .replace(/å/g, 'a')
    .replace(/ö/g, 'o');
  return `${cleanFirst}.${cleanLast}@riksdagen.se`;
};

// Fetch member details
const fetchMemberDetails = async (memberId: string) => {
  try {
    const member = await SupabaseDataService.getMemberById(memberId);
    if (!member) return null;
    
    return {
      id: member.member_id,
      firstName: member.first_name || '',
      lastName: member.last_name || '',
      party: member.party || '',
      constituency: member.constituency || '',
      imageUrl: getImageUrl(member.image_urls),
      isActive: member.is_active ?? true,
      committees: member.current_committees || [],
      assignments: member.assignments || [],
      activityData: member.activity_data || {},
      speeches: [], // Add default empty array
      votes: [], // Add default empty array
      proposals: [], // Add default empty array
      motions: 0,
      interpellations: 0,
      writtenQuestions: 0,
      birthYear: member.birth_year || new Date().getFullYear() - 40,
      email: generateEmail(member.first_name || '', member.last_name || ''),
      profession: ''
    };
  } catch (error) {
    console.error('Error fetching member details:', error);
    return null;
  }
};

// Fetch member suggestions for autocomplete
const fetchMemberSuggestions = async (searchTerm: string): Promise<RiksdagMember[]> => {
  if (!searchTerm || searchTerm.length < 2) return [];
  
  try {
    const members = await SupabaseDataService.getMemberData();
    
    const filtered = members
      .filter(member => {
        const fullName = `${member.first_name || ''} ${member.last_name || ''}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
      })
      .slice(0, 10)
      .map(member => ({
        intressent_id: member.member_id,
        tilltalsnamn: member.first_name || '',
        efternamn: member.last_name || '',
        parti: member.party || '',
        valkrets: member.constituency || '',
        kon: member.gender || '',
        fodd_ar: member.birth_year?.toString() || ''
      }));
    
    return filtered;
  } catch (error) {
    console.error('Error fetching member suggestions:', error);
    return [];
  }
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
    queryFn: async (): Promise<MembersQueryResult> => {
      console.log('useMembers queryFn called with:', { currentPage, pageSize, memberStatus, committee });
      
      const params: MemberSearchParams = {
        p: currentPage,
        utformat: 'json'
      };

      if (memberStatus === 'current') {
        params.kategori = 'nuvarande';
      } else if (memberStatus === 'former') {
        params.kategori = 'avslutade';
      }

      if (committee) {
        params.organ = committee;
      }

      const { members, totalCount } = await fetchMembers(params);
      
      // Implement pagination
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedMembers = members.slice(startIndex, endIndex);
      const hasMore = endIndex < totalCount;

      console.log('Query result:', { 
        totalMembers: members.length, 
        paginatedMembers: paginatedMembers.length, 
        totalCount, 
        hasMore 
      });

      return {
        members: paginatedMembers,
        totalCount,
        hasMore
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useMemberById = (memberId: string) => {
  return useQuery({
    queryKey: ['member', memberId],
    queryFn: async () => {
      if (!memberId) return null;
      return fetchMemberDetails(memberId);
    },
    enabled: !!memberId,
  });
};

export const useMembersByParty = (party: string) => {
  return useQuery({
    queryKey: ['members', 'party', party],
    queryFn: async () => {
      if (!party) return [];
      const members = await SupabaseDataService.getMembersByParty(party);
      return members.map((member: any) => ({
        id: member.member_id,
        firstName: member.first_name,
        lastName: member.last_name,
        party: member.party,
        constituency: member.constituency,
        imageUrl: member.image_urls?.max || '',
        isActive: member.is_active
      }));
    },
    enabled: !!party,
  });
};

export const useMembersByCommittee = (committee: string) => {
  return useQuery({
    queryKey: ['members', 'committee', committee],
    queryFn: async () => {
      if (!committee) return [];
      const { members } = await fetchMembers({ organ: committee, kategori: 'nuvarande', utformat: 'json' });
      return members;
    },
    enabled: !!committee,
  });
};

export default useMembers;
