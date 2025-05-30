
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { DocumentSearchParams } from '../services/riksdagApi';

interface DocumentSearchFiltersProps {
  selectedParties: string[];
  onToggleParty: (party: string) => void;
}

const DocumentSearchFilters = ({ selectedParties, onToggleParty }: DocumentSearchFiltersProps) => {
  const parties = ['S', 'M', 'L', 'KD', 'V', 'SD', 'C', 'MP'];
  const partyNames = {
    'S': 'Socialdemokraterna',
    'M': 'Moderata samlingspartiet', 
    'L': 'Liberalerna',
    'KD': 'Kristdemokraterna',
    'V': 'Vänsterpartiet',
    'SD': 'Sverigedemokraterna',
    'C': 'Centerpartiet',
    'MP': 'Miljöpartiet'
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Partier
      </label>
      <div className="flex flex-wrap gap-2">
        {parties.map((party) => (
          <Button
            key={party}
            variant={selectedParties.includes(party) ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToggleParty(party)}
          >
            {party}
          </Button>
        ))}
      </div>
      {selectedParties.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {selectedParties.map((party) => (
            <Badge key={party} variant="secondary">
              {partyNames[party as keyof typeof partyNames]} ({party})
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentSearchFilters;
