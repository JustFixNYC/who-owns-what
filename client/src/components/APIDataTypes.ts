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

export type HpdContactAddress = {
  housenumber: string | null;
  streetname: string;
  apartment: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
};

export type HpdFullContact = HpdOwnerContact & {
  address: HpdContactAddress | null;
};

export type HpdComplaintCount = {
  type: string;
  count: number;
};

/** Date fields that come from our API Data are strings with the format YYYY-MM-DD */
type APIDate = string;

export type GeoSearchData = {
  bbl: string;
};

export type AddressRecord = {
  allcontacts: HpdFullContact[] | null;
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
  recentcomplaints: number;
  /** Note: this property will never be an empty array. Either null, or an array of length 1 or more */
  recentcomplaintsbytype: HpdComplaintCount[] | null;
  registrationenddate: APIDate;
  registrationid: string;
  rsdiff: number | null;
  rsunits2007: number | null;
  rsunitslatest: number | null;
  rsunitslatestyear: number;
  streetname: string;
  totalcomplaints: number;
  totalviolations: number;
  unitsres: number | null;
  yearbuilt: number | null;
  zip: string | null;
};

// TODO: make this type definition more descriptive
export type RawPortfolioJson = {
  title: string;
  nodes: any[];
  edges: any[];
};

export type SearchResults = {
  addrs: AddressRecord[];
  geosearch?: GeoSearchData;
  graph?: RawPortfolioJson;
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

// TYPES ASSOCIATED WITH BUILDING INFO QUERY:

export type BuildingInfoRecord = {
  boro: Borough;
  housenumber: string;
  latitude: number;
  longitude: number;
  streetname: string;
  bldgclass: string;
  formatted_address: string;
  /** The name of the NYCHA development (e.g. "SOTOMAYOR HOUSES").
   * NULL if building is not part of NYCHA */
  nycha_development: string | null;
  /** Total executed residential evictions (since 2017) accross the building's entire NYCHA development.
   * NULL values either mean 0 evictions took place across the development or building is not part of NYCHA. */
  nycha_dev_evictions: number | null;
  /** Total residential units accross the building's entire NYCHA development.
   * NULL values either mean PLUTO listed 0 residential units across the development or building is not part of NYCHA. */
  nycha_dev_unitsres: number | null;
};

export type BuildingInfoResults = {
  result: BuildingInfoRecord[];
};

// TYPES ASSOCIATED WITH INDICATORS (TIMELINE TAB) QUERY:

export type MonthlyTimelineData = {
  month: string;
  hpdcomplaints_emergency: number;
  hpdcomplaints_nonemergency: number;
  hpdcomplaints_total: number;
  dobpermits_total: number;
  hpdviolations_class_a: number;
  hpdviolations_class_b: number;
  hpdviolations_class_c: number;
  hpdviolations_total: number;
  dobviolations_regular: number;
  dobviolations_ecb: number;
  dobviolations_total: number;
};

export type IndicatorsHistoryResults = {
  result: MonthlyTimelineData[];
};
