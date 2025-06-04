
import { useState, useEffect } from 'react';
import { RiksdagMember, fetchAllMembers } from '../services/riksdagApi';

export interface MemberAssignment {
  organ_kod: string;
  roll: string;
  status: string;
  from: string;
  tom: string;
  typ: string;
  ordning: string; // Changed from number to string to match API
  uppgift: string;
}

export interface EnhancedMember extends RiksdagMember {
  assignments?: MemberAssignment[];
  currentCommittees?: string[];
  isActive?: boolean;
}

export const useMembers = () => {
  const [members, setMembers] = useState<EnhancedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const fetchedMembers = await fetchAllMembers();
        
        // Map to enhanced members
        const enhancedMembers: EnhancedMember[] = fetchedMembers.map(member => ({
          ...member,
          assignments: [],
          currentCommittees: [],
          isActive: member.status === 'tjanst'
        }));
        
        setMembers(enhancedMembers);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        console.error('Error loading members:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, []);

  return { members, loading, error };
};
