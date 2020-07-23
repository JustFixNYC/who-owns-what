// TYPES ASSOCIATED WITH INPUT DATA:

export type Borough = "MANHATTAN" | "BRONX" | "BROOKLYN" | "QUEENS" | "STATEN ISLAND";

export type WithBoroBlockLot = {
  boro: string;
  block: string;
  lot: string;
};

// TYPES ASSOCIATED WITH ADDRESS SEARCH QUERY:

type HpdOwnerContact = {
  title: string;
  value: string;
};

type AddressRecord = {
  bbl: string;
  bin: string;
  boro: Borough;
  businessaddrs: string[] | null;
  corpnames: string[] | null;
  evictions: number | null;
  housenumber: string;
  lastregistrationdate: Date;
  lastsaleacrisid: string | null;
  lastsaleamount: number | null;
  lastsaledate: Date | null;
  lat: number | null;
  lng: number | null;
  openviolations: number;
  ownernames: HpdOwnerContact[] | null;
  registrationenddate: Date;
  registrationid: string;
  rsdiff: number | null;
  rspercentchange: number | null;
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
  geosearch?: {
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
  /** Front-end interprets as number */
  age: string;
  /** Front-end interprets as number */
  avgevictions: string | null;
  /** Front-end interprets as number */
  avgrspercent: string | null;
  /** Front-end interprets as number */
  bldgs: string;
  evictionsaddr: EvictionAddress;
  /** Front-end interprets as number */
  openviolationsperbldg: string;
  /** Front-end interprets as number */
  openviolationsperresunit: string;
  rslossaddr: RentStabilizedAddress;
  /** Front-end interprets as number */
  rsproportion: string | null;
  topbusinessaddr: string | null;
  topcorp: string | null;
  topowners: string[];
  /** Front-end interprets as number */
  totalevictions: string | null;
  /** Front-end interprets as number */
  totalopenviolations: string;
  /** Front-end interprets as number */
  totalrsdiff: string | null;
  /** Front-end interprets as number */
  totalrsgain: string;
  /** Front-end interprets as number */
  totalrsloss: string;
  /** Front-end interprets as number */
  totalviolations: string;
  /** Front-end interprets as number */
  units: string;
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
  complaints_emergency: number;
  complaints_nonemergency: number;
  complaints_total: number;
  permits_total: number;
  viols_class_a: number;
  viols_class_b: number;
  viols_class_c: number;
  viols_total: number;
};

export type IndicatorsHistoryResults = {
  result: MonthlyTimelineData[];
};
