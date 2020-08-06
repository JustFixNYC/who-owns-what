import {
  BuildingInfoResults,
  AddressRecord,
  MonthlyTimelineData,
  IndicatorsHistoryResults,
} from "components/APIDataTypes";
import { IndicatorsDataFromAPI } from "components/IndicatorsTypes";

export const SAMPLE_BUILDING_INFO_RESULTS: BuildingInfoResults = {
  result: [
    {
      formatted_address: "144 COURT STREET",
      housenumber: "144",
      streetname: "COURT STREET",
      bldgclass: "O5",
      boro: "BROOKLYN",
      latitude: 40.6889099948209,
      longitude: -73.99302988771,
    },
  ],
};

export const SAMPLE_ADDRESS_RECORDS: AddressRecord[] = [
  {
    housenumber: "654",
    streetname: "PARK PLACE",
    zip: "11216",
    boro: "BROOKLYN",
    registrationid: "352819",
    lastregistrationdate: "2019-08-30",
    registrationenddate: "2020-09-01",
    bbl: "3012380016",
    bin: "3031404",
    corpnames: ["654 PARK PLACE LLC"],
    businessaddrs: ["12 SPENCER STREET 4 11205"],
    ownernames: [
      { title: "HeadOfficer", value: "MOSES GUTMAN" },
      { title: "Agent", value: "NATHAN SCHWARCZ" },
    ],
    totalviolations: 12,
    openviolations: 0,
    unitsres: 13,
    yearbuilt: 1931,
    lat: 40.6737974139504,
    lng: -73.9562781322538,
    evictions: null,
    rsunits2007: 11,
    rsunits2017: 12,
    rsdiff: 1,
    rspercentchange: 8.33,
    lastsaleacrisid: "2008012400521001",
    lastsaledate: "2008-01-17",
    lastsaleamount: 750000,
    mapType: "search",
  },
  {
    housenumber: "378",
    streetname: "LEWIS AVENUE",
    zip: "11233",
    boro: "BROOKLYN",
    registrationid: "323149",
    lastregistrationdate: "2019-08-06",
    registrationenddate: "2020-09-01",
    bbl: "3016690036",
    bin: "3046748",
    corpnames: ["378 LEWIS LLC"],
    businessaddrs: ["12 SPENCER STREET 4 11205"],
    ownernames: [
      { title: "HeadOfficer", value: "ALEX ENGELMAN" },
      { title: "Agent", value: "NAFTALI GESTETNER" },
    ],
    totalviolations: 18,
    openviolations: 1,
    unitsres: 8,
    yearbuilt: 1910,
    lat: 40.6825213771841,
    lng: -73.9352559095722,
    evictions: null,
    rsunits2007: 8,
    rsunits2017: 0,
    rsdiff: -8,
    rspercentchange: -100,
    lastsaleacrisid: "2013041200684001",
    lastsaledate: "2013-03-22",
    lastsaleamount: 1800000,
    mapType: "base",
  },
];

export const SAMPLE_TIMELINE_DATA: IndicatorsHistoryResults = {
  result: [
    {
      month: "2019-07",
      complaints_emergency: 1,
      complaints_nonemergency: 0,
      complaints_total: 1,
      permits_total: 2,
      viols_class_a: 1,
      viols_class_b: 0,
      viols_class_c: 2,
      viols_total: 3,
    },
  ],
};
