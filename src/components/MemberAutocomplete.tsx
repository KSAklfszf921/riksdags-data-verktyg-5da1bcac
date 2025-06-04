
import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { RiksdagMember } from '../services/riksdagApi';
import { useMemberSuggestions } from '../hooks/useMembers';

interface MemberAutocompleteProps {
  onSelectMember: (member: RiksdagMember | null) => void;
  placeholder?: string;
  className?: string;
}

const MemberAutocomplete = ({ onSelectMember, placeholder = "Sök ledamot...", className }: MemberAutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<RiksdagMember | null>(null);
  
  const { suggestions, loading } = useMemberSuggestions(query);

  const handleSelect = (member: RiksdagMember) => {
    setSelectedMember(member);
    setOpen(false);
    onSelectMember(member);
  };

  const handleClear = () => {
    setSelectedMember(null);
    setQuery('');
    onSelectMember(null);
  };

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedMember 
              ? `${selectedMember.tilltalsnamn} ${selectedMember.efternamn} (${selectedMember.parti})`
              : placeholder
            }
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput 
              placeholder="Sök ledamot..." 
              value={query}
              onValueChange={setQuery}
            />
            <CommandEmpty>
              {loading ? "Laddar..." : "Inga ledamöter hittades."}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto">
              {suggestions.map((member) => (
                <CommandItem
                  key={member.intressent_id}
                  value={`${member.tilltalsnamn} ${member.efternamn}`}
                  onSelect={() => handleSelect(member)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedMember?.intressent_id === member.intressent_id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{member.tilltalsnamn} {member.efternamn}</span>
                    <span className="text-sm text-gray-500">{member.parti} • {member.valkrets}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedMember && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
        >
          ×
        </Button>
      )}
    </div>
  );
};

export default MemberAutocomplete;
