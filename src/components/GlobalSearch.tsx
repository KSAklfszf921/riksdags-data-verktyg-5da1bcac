
import { useState, useRef, useEffect } from 'react';
import { Search, User, FileText, MessageSquare, Vote, ExternalLink } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { useGlobalSearch, SearchResult } from '../hooks/useGlobalSearch';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useNavigate } from 'react-router-dom';
import { partyInfo } from '../data/mockMembers';

const GlobalSearch = () => {
  const navigate = useNavigate();
  const { query, setQuery, results, loading, isOpen, setIsOpen } = useGlobalSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'member':
        return <User className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'speech':
        return <MessageSquare className="w-4 h-4" />;
      case 'vote':
        return <Vote className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'member':
        return 'bg-blue-100 text-blue-800';
      case 'document':
        return 'bg-green-100 text-green-800';
      case 'speech':
        return 'bg-purple-100 text-purple-800';
      case 'vote':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPartyColor = (party: string) => {
    return partyInfo[party]?.color || '#6B7280';
  };

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    
    switch (result.type) {
      case 'member':
        navigate('/ledamoter');
        break;
      case 'document':
        navigate('/dokument');
        break;
      case 'speech':
        navigate('/anforanden');
        break;
      case 'vote':
        navigate('/voteringar');
        break;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('sv-SE');
    } catch {
      return dateString;
    }
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const typeLabels = {
    member: 'Ledamöter',
    document: 'Dokument',
    speech: 'Anföranden',
    vote: 'Voteringar'
  };

  return (
    <div className="relative">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              ref={inputRef}
              placeholder="Sök ledamöter, dokument, voteringar..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="pl-10 pr-4 w-80 bg-white border border-gray-200 rounded-lg"
            />
          </div>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-80 p-0 bg-white border border-gray-200 shadow-lg z-50" 
          align="start"
          side="bottom"
        >
          <Command>
            <CommandList className="max-h-96 overflow-y-auto">
              {loading && (
                <div className="p-4 text-center text-sm text-gray-500">
                  Söker...
                </div>
              )}
              
              {!loading && results.length === 0 && query.length >= 2 && (
                <CommandEmpty className="py-6 text-center text-sm">
                  Inga resultat hittades för "{query}"
                </CommandEmpty>
              )}
              
              {!loading && query.length > 0 && query.length < 2 && (
                <div className="p-4 text-center text-sm text-gray-500">
                  Skriv minst 2 tecken för att söka
                </div>
              )}
              
              {Object.entries(groupedResults).map(([type, items]) => (
                <CommandGroup key={type} heading={typeLabels[type as keyof typeof typeLabels]}>
                  {items.map((result) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => handleResultClick(result)}
                      className="p-3 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-start space-x-3 w-full">
                        {/* Icon or Avatar */}
                        <div className="flex-shrink-0">
                          {result.type === 'member' && result.image ? (
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={result.image} alt={result.title} />
                              <AvatarFallback className="text-xs">
                                {result.title.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getTypeColor(result.type)}`}>
                              {getTypeIcon(result.type)}
                            </div>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {result.title}
                            </p>
                            {result.party && (
                              <Badge 
                                variant="secondary" 
                                className="text-xs"
                                style={{
                                  backgroundColor: getPartyColor(result.party),
                                  color: 'white'
                                }}
                              >
                                {result.subtitle}
                              </Badge>
                            )}
                            {!result.party && result.subtitle && (
                              <Badge variant="outline" className="text-xs">
                                {result.subtitle}
                              </Badge>
                            )}
                          </div>
                          
                          {result.description && (
                            <p className="text-xs text-gray-500 truncate mt-1">
                              {result.description}
                            </p>
                          )}
                          
                          {result.date && (
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(result.date)}
                            </p>
                          )}
                        </div>
                        
                        {/* External link indicator */}
                        {result.url && (
                          <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default GlobalSearch;
