
import { useState, useEffect } from 'react';
import { fetchAllMembers, fetchMemberSuggestions, RiksdagMember } from '../services/riksdagApi';
import { Member } from '../types/member';

const mapRiksdagMemberToMember = (riksdagMember: RiksdagMember): Member => {
  return {
    id: riksdagMember.intressent_id,
    firstName: riksdagMember.tilltalsnamn,
    lastName: riksdagMember.efternamn,
    party: riksdagMember.parti,
    constituency: riksdagMember.valkrets,
    imageUrl: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face`,
    email: `${riksdagMember.tilltalsnamn.toLowerCase()}.${riksdagMember.efternamn.toLowerCase()}@riksdag.se`,
    birthYear: parseInt(riksdagMember.fodd_ar) || 1970,
    profession: 'Riksdagsledamot',
    committees: [],
    speeches: [],
    votes: [],
    proposals: [],
    activityScore: Math.random() * 10
  };
};

export const useMembers = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true);
        const riksdagMembers = await fetchAllMembers();
        const mappedMembers = riksdagMembers.map(mapRiksdagMemberToMember);
        setMembers(mappedMembers);
        setError(null);
      } catch (err) {
        setError('Kunde inte ladda ledamöter');
        console.error('Error loading members:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, []);

  return { members, loading, error };
};

export const useMemberSuggestions = () => {
  const [suggestions, setSuggestions] = useState<RiksdagMember[]>([]);
  const [loading, setLoading] = useState(false);

  const searchMembers = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const results = await fetchMemberSuggestions(query);
      setSuggestions(results);
    } catch (error) {
      console.error('Error fetching member suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  return { suggestions, loading, searchMembers };
};
