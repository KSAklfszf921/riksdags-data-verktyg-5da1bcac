
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X, Filter, Clock } from "lucide-react";
import { useResponsive } from "@/hooks/use-responsive";

interface SearchFilter {
  id: string;
  label: string;
  value: string;
}

interface EnhancedSearchProps {
  placeholder?: string;
  onSearch: (query: string, filters: SearchFilter[]) => void;
  availableFilters?: SearchFilter[];
  recentSearches?: string[];
  onRecentSearchSelect?: (search: string) => void;
  loading?: boolean;
  className?: string;
}

const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  placeholder = "Sök...",
  onSearch,
  availableFilters = [],
  recentSearches = [],
  onRecentSearchSelect,
  loading = false,
  className = ""
}) => {
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<SearchFilter[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const { isMobile } = useResponsive();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowRecent(false);
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      onSearch(query, activeFilters);
      setShowRecent(false);
    }
  }, [query, activeFilters, onSearch]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const addFilter = (filter: SearchFilter) => {
    if (!activeFilters.find(f => f.id === filter.id)) {
      setActiveFilters([...activeFilters, filter]);
    }
    setShowFilters(false);
  };

  const removeFilter = (filterId: string) => {
    setActiveFilters(activeFilters.filter(f => f.id !== filterId));
  };

  const clearAll = () => {
    setQuery("");
    setActiveFilters([]);
  };

  const handleInputFocus = () => {
    if (recentSearches.length > 0 && !query) {
      setShowRecent(true);
    }
  };

  const handleRecentSelect = (search: string) => {
    setQuery(search);
    setShowRecent(false);
    onRecentSearchSelect?.(search);
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="flex">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={handleInputFocus}
              className={`pl-10 pr-4 ${isMobile ? 'text-base' : ''}`}
            />
          </div>
          
          {availableFilters.length > 0 && (
            <Button
              variant="outline"
              size={isMobile ? "default" : "default"}
              onClick={() => setShowFilters(!showFilters)}
              className="ml-2 flex items-center space-x-1"
            >
              <Filter className="w-4 h-4" />
              {!isMobile && <span>Filter</span>}
              {activeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          )}
          
          <Button
            onClick={handleSearch}
            disabled={!query.trim() || loading}
            className="ml-2"
            size={isMobile ? "default" : "default"}
          >
            {isMobile ? <Search className="w-4 h-4" /> : "Sök"}
          </Button>
        </div>

        {/* Clear button */}
        {(query || activeFilters.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {activeFilters.map((filter) => (
            <Badge key={filter.id} variant="secondary" className="flex items-center space-x-1">
              <span className="text-xs">{filter.label}: {filter.value}</span>
              <button
                onClick={() => removeFilter(filter.id)}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Available Filters Dropdown */}
      {showFilters && availableFilters.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 border border-gray-200 shadow-lg">
          <CardContent className="p-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 px-2 py-1">Tillgängliga filter:</p>
              {availableFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => addFilter(filter)}
                  disabled={activeFilters.some(f => f.id === filter.id)}
                  className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                >
                  {filter.label}: {filter.value}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Searches */}
      {showRecent && recentSearches.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 border border-gray-200 shadow-lg">
          <CardContent className="p-2">
            <div className="space-y-1">
              <div className="flex items-center space-x-1 px-2 py-1">
                <Clock className="w-3 h-3 text-gray-500" />
                <p className="text-sm font-medium text-gray-700">Senaste sökningar:</p>
              </div>
              {recentSearches.slice(0, 5).map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSelect(search)}
                  className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded truncate"
                >
                  {search}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedSearch;
