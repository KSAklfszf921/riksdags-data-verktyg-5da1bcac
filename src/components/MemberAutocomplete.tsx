
import { useState, useRef, useEffect } from 'react';
import { Input } from './ui/input';
import { useMemberSuggestions } from '../hooks/useMembers';
import { RiksdagMember } from '../services/riksdagApi';
import { Card, CardContent } from './ui/card';
import { User, Loader2 } from 'lucide-react';

interface MemberAutocompleteProps {
  onSelectMember: (member: RiksdagMember | null) => void;
  placeholder?: string;
  className?: string;
}

const MemberAutocomplete = ({ onSelectMember, placeholder = "Sök ledamot...", className }: MemberAutocompleteProps) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<RiksdagMember | null>(null);
  const { suggestions, loading, searchMembers } = useMemberSuggestions();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchMembers(query);
    }, 200); // Reduced delay for faster response

    return () => clearTimeout(timeoutId);
  }, [query, searchMembers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    
    if (value === '') {
      setSelectedMember(null);
      onSelectMember(null);
    }
  };

  const handleSelectMember = (member: RiksdagMember) => {
    setSelectedMember(member);
    // Convert the member to ensure it has all required properties
    const convertedMember: RiksdagMember = {
      id: member.intressent_id,
      intressent_id: member.intressent_id,
      fnamn: member.tilltalsnamn || '',
      enamn: member.efternamn || '',
      tilltalsnamn: member.tilltalsnamn || '',
      efternamn: member.efternamn || '',
      parti: member.parti,
      valkrets: member.valkrets,
      fodd_ar: member.fodd_ar,
      kon: member.kon,
      status: member.status
    };
    
    const displayName = convertedMember.fnamn && convertedMember.enamn 
      ? `${convertedMember.fnamn} ${convertedMember.enamn} (${convertedMember.parti})`
      : `${member.tilltalsnamn || ''} ${member.efternamn || ''} (${member.parti})`;
    setQuery(displayName);
    setIsOpen(false);
    onSelectMember(convertedMember);
  };

  const clearSelection = () => {
    setQuery('');
    setSelectedMember(null);
    setIsOpen(false);
    onSelectMember(null);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pr-8"
        />
        {loading && (
          <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
        )}
        {selectedMember && !loading && (
          <button
            onClick={clearSelection}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto">
          <CardContent className="p-0">
            {suggestions.map((member) => (
              <div
                key={member.intressent_id}
                className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                onClick={() => handleSelectMember(member)}
              >
                <User className="w-4 h-4 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">
                    {member.tilltalsnamn || ''} {member.efternamn || ''}
                  </div>
                  <div className="text-xs text-gray-500">
                    {member.parti} • {member.valkrets}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {isOpen && query.length >= 1 && suggestions.length === 0 && !loading && (
        <Card className="absolute z-50 w-full mt-1">
          <CardContent className="p-3 text-sm text-gray-500 text-center">
            Inga ledamöter hittades
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MemberAutocomplete;
