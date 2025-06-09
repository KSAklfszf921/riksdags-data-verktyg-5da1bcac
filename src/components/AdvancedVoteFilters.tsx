
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarIcon, Filter, X } from "lucide-react";
import { VoteSearchParams } from '../services/riksdagApi';
import { partyInfo } from "../data/mockMembers";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface AdvancedVoteFiltersProps {
  searchParams: VoteSearchParams;
  onParamsChange: (params: VoteSearchParams) => void;
  onClearFilters: () => void;
}

const AdvancedVoteFilters = ({ searchParams, onParamsChange, onClearFilters }: AdvancedVoteFiltersProps) => {
  const [dateFrom, setDateFrom] = React.useState<Date>();
  const [dateTo, setDateTo] = React.useState<Date>();
  
  const riksmoten = [
    '2024/25', '2023/24', '2022/23', '2021/22', '2020/21', '2019/20', '2018/19',
    '2017/18', '2016/17', '2015/16', '2014/15', '2013/14', '2012/13', '2011/12',
    '2010/11', '2009/10', '2008/09', '2007/08', '2006/07', '2005/06', '2004/05',
    '2003/04', '2002/03'
  ];

  const parties = ['C', 'FP', 'L', 'KD', 'MP', 'M', 'S', 'SD', 'V', '-'];

  const valkretsar = [
    'Blekinge län', 'Dalarnas län', 'Gotlands län', 'Gävleborgs län',
    'Göteborgs kommun', 'Hallands län', 'Jämtlands län', 'Jönköpings län',
    'Kalmar län', 'Kronobergs län', 'Malmö kommun', 'Norrbottens län',
    'Skåne läns norra och östra', 'Skåne läns södra', 'Skåne läns västra',
    'Stockholms kommun', 'Stockholms län', 'Södermanlands län', 'Uppsala län',
    'Värmlands län', 'Västerbottens län', 'Västernorrlands län', 'Västmanlands län',
    'Västra Götalands läns norra', 'Västra Götalands läns södra',
    'Västra Götalands läns västra', 'Västra Götalands läns östra',
    'Örebro län', 'Östergötlands län'
  ];

  const handleRmChange = (rm: string, checked: boolean) => {
    const currentRm = Array.isArray(searchParams.rm) ? searchParams.rm : (searchParams.rm ? [searchParams.rm] : []);
    if (checked) {
      onParamsChange({
        ...searchParams,
        rm: [...currentRm, rm]
      });
    } else {
      onParamsChange({
        ...searchParams,
        rm: currentRm.filter(r => r !== rm)
      });
    }
  };

  const handlePartyChange = (party: string, checked: boolean) => {
    const currentParties = searchParams.party || [];
    if (checked) {
      onParamsChange({
        ...searchParams,
        party: [...currentParties, party]
      });
    } else {
      onParamsChange({
        ...searchParams,
        party: currentParties.filter(p => p !== party)
      });
    }
  };

  const getPartyName = (party: string) => {
    return partyInfo[party]?.fullName || party;
  };

  const activeFiltersCount = [
    searchParams.beteckning,
    searchParams.punkt,
    searchParams.valkrets,
    searchParams.rost,
    Array.isArray(searchParams.rm) ? searchParams.rm.length : (searchParams.rm ? 1 : 0),
    searchParams.party?.length,
    searchParams.gruppering,
    dateFrom,
    dateTo
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4" />
          <h3 className="font-medium">Avancerade filter</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount} aktiva</Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          <X className="w-4 h-4 mr-1" />
          Rensa alla
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="beteckning-advanced">Beteckning</Label>
          <Input
            id="beteckning-advanced"
            placeholder="ex. AU1, TU3"
            value={searchParams.beteckning || ''}
            onChange={(e) => onParamsChange({
              ...searchParams,
              beteckning: e.target.value
            })}
          />
        </div>
        
        <div>
          <Label htmlFor="punkt-advanced">Förslagspunkt</Label>
          <Input
            id="punkt-advanced"
            placeholder="ex. 2"
            value={searchParams.punkt || ''}
            onChange={(e) => onParamsChange({
              ...searchParams,
              punkt: e.target.value
            })}
          />
        </div>

        <div>
          <Label htmlFor="valkrets-advanced">Valkrets</Label>
          <Select 
            value={searchParams.valkrets || 'all'} 
            onValueChange={(value) => onParamsChange({
              ...searchParams,
              valkrets: value === 'all' ? undefined : value
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Välj valkrets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla valkretsar</SelectItem>
              {valkretsar.map((valkrets) => (
                <SelectItem key={valkrets} value={valkrets}>
                  {valkrets}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="rost-advanced">Röst</Label>
          <Select 
            value={searchParams.rost || 'all'} 
            onValueChange={(value) => onParamsChange({
              ...searchParams,
              rost: value === 'all' ? undefined : value as any
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Alla röster" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla</SelectItem>
              <SelectItem value="Ja">Ja</SelectItem>
              <SelectItem value="Nej">Nej</SelectItem>
              <SelectItem value="Avstår">Avstår</SelectItem>
              <SelectItem value="Frånvarande">Frånvarande</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Datum från</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, 'PPP', { locale: sv }) : 'Välj datum'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label>Datum till</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, 'PPP', { locale: sv }) : 'Välj datum'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div>
        <Label>Riksmöte</Label>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-2">
          {riksmoten.slice(0, 12).map((rm) => (
            <div key={rm} className="flex items-center space-x-2">
              <Checkbox
                id={`rm-advanced-${rm}`}
                checked={Array.isArray(searchParams.rm) ? searchParams.rm.includes(rm) : searchParams.rm === rm}
                onCheckedChange={(checked) => handleRmChange(rm, checked as boolean)}
              />
              <Label htmlFor={`rm-advanced-${rm}`} className="text-sm">
                {rm}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Parti</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {parties.map((party) => (
            <div key={party} className="flex items-center space-x-2">
              <Checkbox
                id={`party-advanced-${party}`}
                checked={searchParams.party?.includes(party) || false}
                onCheckedChange={(checked) => handlePartyChange(party, checked as boolean)}
              />
              <Label htmlFor={`party-advanced-${party}`} className="text-sm">
                {getPartyName(party)} ({party})
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="gruppering-advanced">Gruppering</Label>
        <Select 
          value={searchParams.gruppering || 'none'} 
          onValueChange={(value) => onParamsChange({
            ...searchParams,
            gruppering: value === 'none' ? undefined : value as any
          })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Ingen gruppering" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Ingen gruppering</SelectItem>
            <SelectItem value="iid">Ledamot - ID</SelectItem>
            <SelectItem value="namn">Ledamot - namn</SelectItem>
            <SelectItem value="parti">Parti</SelectItem>
            <SelectItem value="valkrets">Valkrets</SelectItem>
            <SelectItem value="rm">Riksmöte</SelectItem>
            <SelectItem value="votering_id">Votering (ID)</SelectItem>
            <SelectItem value="bet">Votering (bet + punkt)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default AdvancedVoteFilters;
