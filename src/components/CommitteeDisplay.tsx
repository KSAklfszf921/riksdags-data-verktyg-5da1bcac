
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Users, Clock } from "lucide-react";

interface CommitteeDisplayProps {
  committees?: string[] | null;
  assignments?: any[] | null;
  variant?: 'compact' | 'detailed';
  maxDisplay?: number;
}

const COMMITTEE_MAPPING: { [key: string]: string } = {
  'AU': 'Arbetsmarknadsutskottet',
  'CU': 'Civilutskottet',
  'FiU': 'Finansutskottet',
  'FöU': 'Försvarsutskottet',
  'JuU': 'Justitieutskottet',
  'KU': 'Konstitutionsutskottet',
  'KrU': 'Kulturutskottet',
  'MjU': 'Miljö- och jordbruksutskottet',
  'NU': 'Näringsutskottet',
  'SkU': 'Skatteutskottet',
  'SfU': 'Socialförsäkringsutskottet',
  'SoU': 'Socialutskottet',
  'TU': 'Trafikutskottet',
  'UbU': 'Utbildningsutskottet',
  'UU': 'Utrikesutskottet',
  'UFöU': 'Sammansatta utrikes- och försvarsutskottet',
  'EUN': 'EU-nämnden',
  'SäU': 'Säkerhetsutskottet'
};

const CommitteeDisplay: React.FC<CommitteeDisplayProps> = ({
  committees,
  assignments,
  variant = 'compact',
  maxDisplay = 2
}) => {
  // Get committees from either committees array or assignments
  const getCommitteeList = () => {
    if (committees && committees.length > 0) {
      return committees;
    }
    
    if (assignments && Array.isArray(assignments)) {
      return assignments
        .filter(assignment => assignment.organ_kod || assignment.organ)
        .map(assignment => assignment.organ_kod || assignment.organ)
        .filter(Boolean);
    }
    
    return [];
  };

  const committeeList = getCommitteeList();

  if (!committeeList || committeeList.length === 0) {
    return (
      <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
        <Users className="w-3 h-3" />
        <span className="text-xs">Inga utskott</span>
      </div>
    );
  }

  const displayCommittees = committeeList.slice(0, maxDisplay);
  const remainingCount = Math.max(0, committeeList.length - maxDisplay);

  const getCommitteeName = (code: string) => {
    return COMMITTEE_MAPPING[code] || code;
  };

  const getCommitteeAbbreviation = (code: string) => {
    const fullName = COMMITTEE_MAPPING[code];
    if (!fullName) return code;
    
    // Create abbreviation from full name
    return fullName
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 3)
      .toUpperCase();
  };

  if (variant === 'detailed') {
    return (
      <div className="space-y-1">
        {displayCommittees.map((committee, index) => (
          <div key={index} className="flex items-center space-x-2 text-xs">
            <Users className="w-3 h-3 text-blue-500" />
            <span className="font-medium">{committee}</span>
            <span className="text-gray-600 dark:text-gray-400">
              {getCommitteeName(committee)}
            </span>
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="text-xs text-gray-500">
            +{remainingCount} till
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1 flex-wrap">
      <Users className="w-3 h-3 text-blue-500 flex-shrink-0" />
      {displayCommittees.map((committee, index) => (
        <Badge 
          key={index} 
          variant="outline" 
          className="text-xs px-1 py-0"
          title={getCommitteeName(committee)}
        >
          {getCommitteeAbbreviation(committee)}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs px-1 py-0">
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
};

export default CommitteeDisplay;
