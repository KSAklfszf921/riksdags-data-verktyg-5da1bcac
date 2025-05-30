
export interface DocumentType {
  value: string;
  label: string;
}

export const DOCUMENT_TYPES: DocumentType[] = [
  { value: 'kam-ad', label: 'Aktuell debatt' },
  { value: 'kam-al', label: 'Allmänpolitisk debatt' },
  { value: 'bet', label: 'Betänkande' },
  { value: 'kam-bu', label: 'Budgetdebatt' },
  { value: 'kam-eu', label: 'EU-debatt' },
  { value: 'kom', label: 'EU-förslag' },
  { value: 'ip', label: 'Interpellation' },
  { value: 'kam-ip', label: 'Interpellationsdebatt' },
  { value: 'mot', label: 'Motion' },
  { value: 'prop', label: 'Proposition' },
  { value: 'prot', label: 'Protokoll' },
  { value: 'kam-rf', label: 'Regeringsförklaring' },
  { value: 'rskr', label: 'Riksdagsskrivelse' },
  { value: 'fr', label: 'Skriftlig fråga' },
  { value: 'frs', label: 'Svar på skriftlig fråga' },
  { value: 'kam-sf', label: 'Statsministerns frågestund' },
  { value: 'sou', label: 'Statens offentliga utredning' },
  { value: 'kam-sd', label: 'Särskild debatt' },
  { value: 'uprotokoll', label: 'Utskottens protokoll' },
  { value: 'votering', label: 'Votering' },
  { value: 'yttr', label: 'Yttrande' }
];

export interface Committee {
  value: string;
  label: string;
}

export const COMMITTEES: Committee[] = [
  { value: 'AU', label: 'Arbetsmarknadsutskottet' },
  { value: 'BoU', label: 'Bostadsutskottet' },
  { value: 'CU', label: 'Civilutskottet' },
  { value: 'eun', label: 'EU-nämnden' },
  { value: 'FiU', label: 'Finansutskottet' },
  { value: 'FöU', label: 'Försvarsutskottet' },
  { value: 'JuU', label: 'Justitieutskottet' },
  { value: 'KU', label: 'Konstitutionsutskottet' },
  { value: 'KrU', label: 'Kulturutskottet' },
  { value: 'MjU', label: 'Miljö- och jordbruksutskottet' },
  { value: 'NU', label: 'Näringsutskottet' },
  { value: 'SkU', label: 'Skatteutskottet' },
  { value: 'SfU', label: 'Socialförsäkringsutskottet' },
  { value: 'SoU', label: 'Socialutskottet' },
  { value: 'TU', label: 'Trafikutskottet' },
  { value: 'UbU', label: 'Utbildningsutskottet' },
  { value: 'UU', label: 'Utrikesutskottet' }
];

export const SORT_OPTIONS = [
  { value: 'rel', label: 'Relevans' },
  { value: 'datum', label: 'Datum' },
  { value: 'systemdatum', label: 'Systemdatum' },
  { value: 'bet', label: 'Beteckning' },
  { value: 'debattdag', label: 'Debattdag' },
  { value: 'debattdagtid', label: 'Debattdagtid' },
  { value: 'beslutsdag', label: 'Beslutsdag' }
];
