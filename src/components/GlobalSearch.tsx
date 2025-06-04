
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X, Users, Vote, FileText, MessageSquare, Calendar, Loader2, TrendingUp } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useResponsive } from "@/hooks/use-responsive";
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  type: 'member' | 'vote' | 'document' | 'speech' | 'event';
  description: string;
  url: string;
  metadata?: {
    party?: string;
    date?: string;
    relevance?: number;
  };
}

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onResultSelect?: (result: SearchResult) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  className = "",
  placeholder = "Sök ledamöter, voteringar, dokument...",
  autoFocus = false,
  onResultSelect
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('riksdagskollen-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load recent searches:', e);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((search: string) => {
    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('riksdagskollen-recent-searches', JSON.stringify(updated));
  }, [recentSearches]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mock search function - in real app this would call actual APIs
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock results based on query
    const mockResults: SearchResult[] = [];
    
    if (searchQuery.toLowerCase().includes('annie')) {
      mockResults.push({
        id: '1',
        title: 'Annie Lööf',
        type: 'member',
        description: 'Centerpartiet, Partiledare',
        url: '/ledamoter?search=annie',
        metadata: { party: 'C', relevance: 0.95 }
      });
    }
    
    if (searchQuery.toLowerCase().includes('budget')) {
      mockResults.push({
        id: '2',
        title: 'Budgetproposition 2024',
        type: 'document',
        description: 'Regeringens förslag till statsbudget',
        url: '/dokument?search=budget',
        metadata: { date: '2024-09-20', relevance: 0.88 }
      });
    }
    
    if (searchQuery.toLowerCase().includes('miljö')) {
      mockResults.push({
        id: '3',
        title: 'Miljöutskottets betänkande',
        type: 'vote',
        description: 'Votering om klimatmål',
        url: '/voteringar?search=miljö',
        metadata: { date: '2024-11-15', relevance: 0.82 }
      });
    }

    // Add some general results
    mockResults.push(
      {
        id: '4',
        title: `Sökresultat för "${searchQuery}"`,
        type: 'document',
        description: 'Visa alla dokument som matchar din sökning',
        url: `/dokument?search=${encodeURIComponent(searchQuery)}`,
        metadata: { relevance: 0.6 }
      },
      {
        id: '5',
        title: `Ledamöter: "${searchQuery}"`,
        type: 'member',
        description: 'Sök bland alla riksdagsledamöter',
        url: `/ledamoter?search=${encodeURIComponent(searchQuery)}`,
        metadata: { relevance: 0.6 }
      }
    );
    
    setResults(mockResults.slice(0, 5));
    setIsLoading(false);
  }, []);

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setQuery(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  }, [performSearch]);

  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(query);
    setShowResults(false);
    setQuery("");
    
    if (onResultSelect) {
      onResultSelect(result);
    } else {
      navigate(result.url);
    }
  };

  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
    performSearch(search);
  };

  const handleInputFocus = () => {
    setShowResults(true);
    if (!query && recentSearches.length > 0) {
      // Show recent searches when focusing empty input
    }
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'member': return Users;
      case 'vote': return Vote;
      case 'document': return FileText;
      case 'speech': return MessageSquare;
      case 'event': return Calendar;
      default: return Search;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'member': return 'Ledamot';
      case 'vote': return 'Votering';
      case 'document': return 'Dokument';
      case 'speech': return 'Anförande';
      case 'event': return 'Händelse';
      default: return 'Resultat';
    }
  };

  const clear = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <div ref={searchRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={handleInputFocus}
          autoFocus={autoFocus}
          className={cn(
            "pl-10 pr-10",
            isMobile ? 'text-base h-12' : 'h-10'
          )}
        />
        
        {query && (
          <button
            onClick={clear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
        )}
      </div>

      {/* Search Results */}
      {showResults && (query || recentSearches.length > 0) && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 border border-gray-200 dark:border-gray-700 shadow-lg max-h-96 overflow-hidden">
          <CardContent className="p-0">
            {query && results.length > 0 && (
              <div className="border-b border-gray-100 dark:border-gray-700">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                  Sökresultat
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {results.map((result) => {
                    const TypeIcon = getTypeIcon(result.type);
                    return (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="w-full px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-50 dark:border-gray-800 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <TypeIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                {result.title}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {getTypeLabel(result.type)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                              {result.description}
                            </p>
                            {result.metadata?.party && (
                              <span className="inline-block mt-1 text-xs text-blue-600 dark:text-blue-400">
                                {result.metadata.party}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {!query && recentSearches.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Senaste sökningar
                </div>
                <div className="max-h-32 overflow-y-auto">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(search)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-50 dark:border-gray-800 last:border-b-0"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {query && results.length === 0 && !isLoading && (
              <div className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Inga resultat hittades</p>
                <p className="text-xs mt-1">Prova ett annat sökord</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GlobalSearch;
