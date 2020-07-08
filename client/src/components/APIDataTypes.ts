// TYPES ASSOCIATED WITH INPUT DATA:

export type WithBoroBlockLot = {
  boro: string;
  block: string;
  lot: string;
};

export type AddressInput = {
  bbl?: string;
  housenumber: string;
  streetname: string;
  boro: string;
};

// TYPES ASSOCIATED WITH ADDRESS SEARCH QUERY:

type HpdOwnerContact = {
  title: string;
  value: string;
};

type AddressRecord = {
  bbl: string;
  bin: number; // Should be string
  boro: string;
  businessaddrs: string[];
  corpnames: string[];
  evictions: number | null; // Should be just number
  housenumber: string;
  lastregistrationdate: Date;
  lastsaleacrisid: string | null;
  lastsaleamount: string | null; // Should be number
  lastsaledate: Date | null;
  lat: number;
  lng: number;
  mapType: string; // What is this??
  openviolations: number;
  ownernames: HpdOwnerContact[];
  registrationenddate: Date;
  registrationid: number; // Should be string
  rsdiff: number | null;
  rspercentchange: string | null; // Should be number
  rsunits2007: number | null;
  rsunits2017: number | null;
  streetname: string;
  totalviolations: number;
  unitsres: number;
  yearbuilt: number;
  zip: string;
};

export type SearchResults = {
  addrs: AddressRecord[];
  geosearch: {
    geosupportReturnCode: string;
    bbl: string;
  };
};

// TYPES ASSOCIATED WITH SUMMARY AGGREGATE QUERY:

type AddressLocation = {
  boro: string;
  housenumber: string;
  lat: number;
  lng: number;
  streetname: string;
};

type EvictionAddress = AddressLocation & {
  evictions: number;
};

type RentStabilizedAddress = AddressLocation & {
  rsdiff: number;
};

type HpdViolationsAddress = AddressLocation & {
  openviolations: number;
};

type SummaryStatsRecord = {
  age: string; // Should be number
  avgevictions: string; // Should be number
  avgrspercent: string; // Should be number
  bldgs: string; // Should be number
  evictionsaddr: EvictionAddress;
  openviolationsperbldg: string; // Should be number
  openviolationsperresunit: string; // Should be number
  rslossaddr: RentStabilizedAddress;
  rsproportion: string; // Should be number
  topbusinessaddr: string;
  topcorp: string;
  topowners: string[];
  totalevictions: string; // Should be number
  totalopenviolations: string; // Should be number
  totalrsdiff: string; // Should be number
  totalrsgain: string; // Should be number
  totalrsloss: string; // Should be number
  totalviolations: string; // Should be number
  units: string; // Should be number
  violationsaddr: HpdViolationsAddress;
};

export type SummaryResults = {
  result: SummaryStatsRecord[];
};

// TYPES ASSOCIATED BUILDING INFO QUERY:

type BuildingInfoRecord = AddressLocation & {
  bldgclass: string;
  formatted_address: string;
};

export type BuildingInfoResults = {
  result: BuildingInfoRecord[];
};

// TYPES ASSOCIATED WITH INDICATORS (TIMELINE TAB) QUERY:

type MonthlyTimelineData = {
  month: string;
  complaints_emergency: string; // Should be number
  complaints_nonemergency: string; // Should be number
  complaints_total: string; // Should be number
  permits_total: string; // Should be number
  viols_class_a: string; // Should be number
  viols_class_b: string; // Should be number
  viols_class_c: string; // Should be number
  viols_total: string; // Should be number
};

export type IndicatorsHistoryResults = {
  result: MonthlyTimelineData[];
};
