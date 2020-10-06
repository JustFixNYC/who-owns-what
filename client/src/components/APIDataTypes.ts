// TYPES ASSOCIATED WITH INPUT DATA:

import { SearchAddress } from "./AddressSearch";

export type Borough = "MANHATTAN" | "BRONX" | "BROOKLYN" | "QUEENS" | "STATEN ISLAND";

export type WithBoroBlockLot = {
  boro: string;
  block: string;
  lot: string;
};

export type SearchAddressWithoutBbl = Omit<SearchAddress, "bbl">;

// TYPES ASSOCIATED WITH ADDRESS SEARCH QUERY:

type HpdOwnerContact = {
  title: string;
  value: string;
};

/** Date fields that come from our API Data are strings with the format YYYY-MM-DD */
type APIDate = string;

export type GeoSearchData = {
  bbl: string;
};

export type AddressRecord = {
  bbl: string;
  bin: string;
  boro: Borough;
  businessaddrs: string[] | null;
  corpnames: string[] | null;
  evictions: number | null;
  housenumber: string;
  lastregistrationdate: APIDate;
  lastsaleacrisid: string | null;
  lastsaleamount: number | null;
  lastsaledate: APIDate | null;
  lat: number | null;
  lng: number | null;
  /** This property gets assigned in the PropertiesMap component, not from our API */
  mapType?: "base" | "search";
  openviolations: number;
  ownernames: HpdOwnerContact[] | null;
  registrationenddate: APIDate;
  registrationid: string;
  rsdiff: number | null;
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
  geosearch?: GeoSearchData;
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

export type SummaryStatsRecord = {
  age: number | null;
  avgevictions: number | null;
  bldgs: number;
  evictionsaddr: EvictionAddress;
  openviolationsperbldg: number;
  openviolationsperresunit: number;
  rslossaddr: RentStabilizedAddress;
  rsproportion: number | null;
  topbusinessaddr: string | null;
  topcorp: string | null;
  topowners: string[];
  totalevictions: number | null;
  totalopenviolations: number;
  totalrsdiff: number | null;
  totalrsgain: number;
  totalrsloss: number;
  totalviolations: number;
  units: number;
  violationsaddr: HpdViolationsAddress;
};

export type SummaryResults = {
  result: SummaryStatsRecord[];
};

// TYPES ASSOCIATED BUILDING INFO QUERY:

export type BuildingInfoRecord = {
  boro: Borough;
  housenumber: string;
  latitude: number;
  longitude: number;
  streetname: string;
  bldgclass: string;
  formatted_address: string;
};

export type BuildingInfoResults = {
  result: BuildingInfoRecord[];
};

// TYPES ASSOCIATED WITH INDICATORS (TIMELINE TAB) QUERY:

export type MonthlyTimelineData = {
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
