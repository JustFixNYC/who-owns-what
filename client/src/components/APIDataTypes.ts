// TYPES ASSOCIATED WITH INPUT DATA:

type Borough = "MANHATTAN" | "BRONX" | "BROOKLYN" | "QUEENS" | "STATEN ISLAND";

export type WithBoroBlockLot = {
  boro: string;
  block: string;
  lot: string;
};

export type AddressInput = {
  bbl?: string;
  housenumber: string;
  streetname: string;
  boro: Borough;
};

// TYPES ASSOCIATED WITH ADDRESS SEARCH QUERY:

type HpdOwnerContact = {
  title: string;
  value: string;
};

type AddressRecord = {
  bbl: string;
  bin: number; // Should be string
  boro: Borough;
  businessaddrs: string[] | null;
  corpnames: string[] | null;
  evictions: number | null;
  housenumber: string;
  lastregistrationdate: Date;
  lastsaleacrisid: string | null;
  lastsaleamount: string | null; // Should be number
  lastsaledate: Date | null;
  lat: number | null;
  lng: number | null;
  openviolations: number;
  ownernames: HpdOwnerContact[] | null;
  registrationenddate: Date;
  registrationid: number; // Should be string
  rsdiff: number | null;
  rspercentchange: string | null; // Should be number
  rsunits2007: number | null;
  rsunits2017: number | null;
  streetname: string;
  totalviolations: number;
  unitsres: number | null;
  yearbuilt: number | null;
  zip: string | null;
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
  boro: Borough;
  housenumber: string;
  lat: number;
  lng: number;
  streetname: string;
};

type EvictionAddress = AddressLocation & {
  evictions: number | null;
};

type RentStabilizedAddress = AddressLocation & {
  rsdiff: number | null;
};

type HpdViolationsAddress = AddressLocation & {
  openviolations: number | null;
};

type SummaryStatsRecord = {
  age: string; // Should be number
  avgevictions: string | null; // Should be number
  avgrspercent: string | null; // Should be number
  bldgs: string; // Should be number
  evictionsaddr: EvictionAddress;
  openviolationsperbldg: string; // Should be number
  openviolationsperresunit: string; // Should be number
  rslossaddr: RentStabilizedAddress;
  rsproportion: string | null; // Should be number
  topbusinessaddr: string | null;
  topcorp: string | null;
  topowners: string[];
  totalevictions: string | null; // Should be number
  totalopenviolations: string; // Should be number
  totalrsdiff: string | null; // Should be number
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
