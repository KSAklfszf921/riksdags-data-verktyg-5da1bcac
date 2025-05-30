
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, Loader2 } from 'lucide-react';
import { DocumentSearchParams } from '../services/riksdagApi';
import { useDocumentTypes } from '../hooks/useDocumentTypes';
import DocumentSearchFilters from './DocumentSearchFilters';

// Available committees - updated to match API
const COMMITTEES = [
  { value: 'AU', label: 'Arbetsmarknadsutskottet' },
  { value: 'BoU', label: 'Bostadsutskottet' },
  { value: 'CU', label: 'Civilutskottet' },
  { value: 'EU', label: 'EES-utskottet' },
  { value: 'eun', label: 'EU-nämnden' },
  { value: 'FiU', label: 'Finansutskottet' },
  { value: 'FöU', label: 'Försvarsutskottet' },
  { value: 'JoU', label: 'Jordbruksutskottet' },
  { value: 'JuU', label: 'Justitieutskottet' },
  { value: 'KU', label: 'Konstitutionsutskottet' },
  { value: 'KrU', label: 'Kulturutskottet' },
  { value: 'LU', label: 'Lagutskottet' },
  { value: 'MjU', label: 'Miljö- och jordbruksutskottet' },
  { value: 'NU', label: 'Näringsutskottet' },
  { value: 'SkU', label: 'Skatteutskottet' },
  { value: 'SfU', label: 'Socialförsäkringsutskottet' },
  { value: 'SoU', label: 'Socialutskottet' },
  { value: 'TU', label: 'Trafikutskottet' },
  { value: 'UbU', label: 'Utbildningsutskottet' },
  { value: 'UU', label: 'Utrikesutskottet' }
];

// Available riksmöte years
const RIKSMOTE_YEARS = [
  '2024/25', '2023/24', '2022/23', '2021/22', '2020/21', '2019/20', 
  '2018/19', '2017/18', '2016/17', '2015/16', '2014/15', '2013/14',
  '2012/13', '2011/12', '2010/11', '2009/10', '2008/09', '2007/08'
];

const SORT_OPTIONS = [
  { value: 'rel', label: 'Relevans' },
  { value: 'datum', label: 'Datum' },
  { value: 'systemdatum', label: 'Systemdatum' },
  { value: 'bet', label: 'Beteckning' },
  { value: 'debattdag', label: 'Debattdag' },
  { value: 'debattdagtid', label: 'Debattdagtid' },
  { value: 'beslutsdag', label: 'Beslutsdag' },
  { value: 'publiceringsdatum', label: 'Publiceringsdatum' }
];

interface DocumentSearchFormProps {
  searchParams: DocumentSearchParams;
  selectedParties: string[];
  loading: boolean;
  hasSearched: boolean;
  onUpdateSearchParams: (key: keyof DocumentSearchParams, value: any) => void;
  onToggleParty: (party: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

const DocumentSearchForm = ({
  searchParams,
  selectedParties,
  loading,
  hasSearched,
  onUpdateSearchParams,
  onToggleParty,
  onSearch,
  onReset
}: DocumentSearchFormProps) => {
  const { documentTypes, loading: typesLoading } = useDocumentTypes();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5" />
          <span>Dokumentsökning</span>
        </CardTitle>
        <CardDescription>
          Sök och filtrera riksdagsdokument med avancerade kriterier
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Grundläggande sökning */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sökord
            </label>
            <Input
              placeholder="Ange sökord..."
              value={searchParams.searchTerm || ''}
              onChange={(e) => onUpdateSearchParams('searchTerm', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dokumenttyp {typesLoading && <span className="text-xs text-gray-500">(laddar...)</span>}
            </label>
            <Select 
              value={searchParams.doktyp || 'all'} 
              onValueChange={(value) => onUpdateSearchParams('doktyp', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj dokumenttyp" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="all">Alla typer</SelectItem>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label} ({type.count.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Utskott/Organ
            </label>
            <Select 
              value={searchParams.org || 'all'} 
              onValueChange={(value) => onUpdateSearchParams('org', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj utskott" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="all">Alla utskott</SelectItem>
                {COMMITTEES.map((committee) => (
                  <SelectItem key={committee.value} value={committee.value}>
                    {committee.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Datum och identifierare */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Från datum
            </label>
            <Input
              type="date"
              value={searchParams.fromDate || ''}
              onChange={(e) => onUpdateSearchParams('fromDate', e.target.value || undefined)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Till datum
            </label>
            <Input
              type="date"
              value={searchParams.toDate || ''}
              onChange={(e) => onUpdateSearchParams('toDate', e.target.value || undefined)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beteckning
            </label>
            <Input
              placeholder="ex. 2023/24:1"
              value={searchParams.bet || ''}
              onChange={(e) => onUpdateSearchParams('bet', e.target.value || undefined)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Riksmöte
            </label>
            <Select 
              value={searchParams.rm || 'all'} 
              onValueChange={(value) => onUpdateSearchParams('rm', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj riksmöte" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="all">Alla riksmöten</SelectItem>
                {RIKSMOTE_YEARS.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Partier */}
        <DocumentSearchFilters
          selectedParties={selectedParties}
          onToggleParty={onToggleParty}
        />

        {/* Sortering */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sortera efter
            </label>
            <Select 
              value={searchParams.sort || 'datum'} 
              onValueChange={(value: any) => onUpdateSearchParams('sort', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ordning
            </label>
            <Select 
              value={searchParams.sortorder || 'desc'} 
              onValueChange={(value: any) => onUpdateSearchParams('sortorder', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="desc">Fallande (nyast först)</SelectItem>
                <SelectItem value="asc">Stigande (äldst först)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button onClick={onSearch} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            Sök dokument
          </Button>
          <Button variant="outline" onClick={onReset}>
            Rensa
          </Button>
        </div>

        {!hasSearched && !loading && (
          <div className="text-center py-4 text-gray-500">
            <p>Fyll i sökkriterier och klicka på "Sök dokument" för att börja</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentSearchForm;
