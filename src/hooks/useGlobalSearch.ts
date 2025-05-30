
import { useState, useEffect } from 'react';
import { searchDocuments, searchSpeeches, searchVotes, Member } from '../services/riksdagApi';
import { mockMembers } from '../data/mockMembers';

export interface SearchResult {
  id: string;
  type: 'member' | 'document' | 'speech' | 'vote';
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  party?: string;
  date?: string;
  url?: string;
  data?: any;
}

export const useGlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const searchMembers = (searchTerm: string): SearchResult[] => {
    if (!searchTerm) return [];
    
    return mockMembers
      .filter(member => 
        member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.party.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.constituency.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 3)
      .map(member => ({
        id: member.id,
        type: 'member' as const,
        title: `${member.firstName} ${member.lastName}`,
        subtitle: member.party.toUpperCase(),
        description: member.constituency,
        image: member.imageUrl,
        party: member.party,
        data: member
      }));
  };

  const searchAllData = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    
    try {
      const memberResults = searchMembers(searchTerm);
      let allResults: SearchResult[] = [...memberResults];

      // Search documents
      try {
        const docResult = await searchDocuments({
          searchTerm,
          sz: 3
        });
        
        const documentResults: SearchResult[] = docResult.documents.map(doc => ({
          id: doc.id,
          type: 'document' as const,
          title: doc.titel,
          subtitle: doc.typ,
          description: `${doc.rm} - ${doc.beteckning}`,
          date: doc.datum,
          url: doc.dokument_url_html,
          data: doc
        }));
        
        allResults = [...allResults, ...documentResults];
      } catch (err) {
        console.log('Document search failed:', err);
      }

      // Search speeches
      try {
        const speechResult = await searchSpeeches({
          searchTerm,
          pageSize: 3
        });
        
        const speechResults: SearchResult[] = speechResult.speeches.map(speech => ({
          id: speech.anforande_id,
          type: 'speech' as const,
          title: `Anförande av ${speech.talare}`,
          subtitle: speech.parti.toUpperCase(),
          description: speech.kammaraktivitet,
          date: speech.anforandedatum,
          party: speech.parti,
          data: speech
        }));
        
        allResults = [...allResults, ...speechResults];
      } catch (err) {
        console.log('Speech search failed:', err);
      }

      // Search votes
      try {
        const voteResult = await searchVotes({
          beteckning: searchTerm,
          pageSize: 3
        });
        
        const voteResults: SearchResult[] = voteResult.votes
          .reduce((acc, vote) => {
            const existing = acc.find(v => v.data.beteckning === vote.beteckning);
            if (!existing) {
              acc.push({
                id: vote.beteckning,
                type: 'vote' as const,
                title: `Votering ${vote.beteckning}`,
                subtitle: 'Riksdagsvotering',
                description: vote.avser,
                date: vote.systemdatum,
                data: vote
              });
            }
            return acc;
          }, [] as SearchResult[])
          .slice(0, 2);
        
        allResults = [...allResults, ...voteResults];
      } catch (err) {
        console.log('Vote search failed:', err);
      }

      setResults(allResults);
    } catch (error) {
      console.error('Global search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 2) {
        searchAllData(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return {
    query,
    setQuery,
    results,
    loading,
    isOpen,
    setIsOpen
  };
};
