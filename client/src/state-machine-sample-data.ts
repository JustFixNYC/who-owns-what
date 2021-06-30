import {
  BuildingInfoResults,
  AddressRecord,
  SummaryResults,
  IndicatorsHistoryResults,
} from "components/APIDataTypes";

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
      nycha_development: null,
      nycha_dev_evictions: null,
      nycha_dev_unitsres: null,
    },
  ],
};

export const SAMPLE_NYCHA_BUILDING_INFO_RESULTS: BuildingInfoResults = {
  result: [
    {
      formatted_address: "1755 BRUCKNER BOULEVARD",
      housenumber: "1755",
      streetname: "BRUCKNER BOULEVARD",
      bldgclass: "D3",
      boro: "BRONX",
      latitude: 40.826506542075805,
      longitude: -73.86649903642933,
      nycha_development: "SOTOMAYOR HOUSES",
      nycha_dev_evictions: 14,
      nycha_dev_unitsres: 1506,
    },
  ],
};

const SAMPLE_ADDRESS_RECORDS1: AddressRecord[] = [
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
    allcontacts: [
      {
        title: "Agent",
        value: "NATHAN SCHWARCZ",
        address: {
          zip: "11205",
          city: "BROOKLYN",
          state: "NY",
          apartment: "4",
          streetname: "SPENCER STREET",
          housenumber: "12",
        },
      },
      {
        title: "HeadOfficer",
        value: "MOSES GUTMAN",
        address: {
          zip: "11205",
          city: "BROOKLYN",
          state: "NY",
          apartment: "4",
          streetname: "SPENCER STREET",
          housenumber: "12",
        },
      },
      {
        title: "Corporation",
        value: "654 PARK PLACE LLC",
        address: {
          zip: "11205",
          city: "BROOKLYN",
          state: "NY",
          apartment: "4",
          streetname: "SPENCER STREET",
          housenumber: "12",
        },
      },
    ],
    totalviolations: 12,
    openviolations: 0,
    recentcomplaints: 1,
    totalcomplaints: 2,
    recentcomplaintsbytype: [{ type: "HEAT/HOT WATER", count: 1 }],
    unitsres: 13,
    yearbuilt: 1931,
    lat: 40.6737974139504,
    lng: -73.9562781322538,
    evictions: null,
    rsunits2007: 11,
    rsunitslatest: 12,
    rsunitslatestyear: 2017,
    rsdiff: 1,
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
    allcontacts: [
      {
        title: "Agent",
        value: "NAFTALI GESTETNER",
        address: {
          zip: "11205",
          city: "BROOKLYN",
          state: "NY",
          apartment: "4",
          streetname: "SPENCER STREET",
          housenumber: "12",
        },
      },
      {
        title: "HeadOfficer",
        value: "ALEX ENGELMAN",
        address: {
          zip: "11205",
          city: "BROOKLYN",
          state: "NY",
          apartment: "4",
          streetname: "SPENCER STREET",
          housenumber: "12",
        },
      },
      {
        title: "Corporation",
        value: "378 LEWIS LLC",
        address: {
          zip: "11205",
          city: "BROOKLYN",
          state: "NY",
          apartment: "4",
          streetname: "SPENCER STREET",
          housenumber: "12",
        },
      },
    ],
    totalviolations: 18,
    openviolations: 1,
    totalcomplaints: 3,
    recentcomplaints: 3,
    recentcomplaintsbytype: [
      { type: "PESTS", count: 2 },
      { type: "HEAT/HOT WATER", count: 1 },
    ],
    unitsres: 8,
    yearbuilt: 1910,
    lat: 40.6825213771841,
    lng: -73.9352559095722,
    evictions: null,
    rsunits2007: 8,
    rsunitslatest: 0,
    rsunitslatestyear: 2017,
    rsdiff: -8,
    lastsaleacrisid: "2013041200684001",
    lastsaledate: "2013-03-22",
    lastsaleamount: 1800000,
    mapType: "base",
  },
];

export const SAMPLE_ADDRESS_RECORDS = SAMPLE_ADDRESS_RECORDS1.concat(SAMPLE_ADDRESS_RECORDS1)
  .concat(SAMPLE_ADDRESS_RECORDS1)
  .concat(SAMPLE_ADDRESS_RECORDS1)
  .concat(SAMPLE_ADDRESS_RECORDS1)
  .concat(SAMPLE_ADDRESS_RECORDS1)
  .concat(SAMPLE_ADDRESS_RECORDS1);

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

export const SAMPLE_SUMMARY_DATA: SummaryResults = {
  result: [
    {
      bldgs: 170,
      units: 1501,
      age: 86,
      topowners: [
        "YOEL GOLDMAN",
        "NATHAN SCHWARCZ",
        "NAFTALI GESTETNER",
        "MOSHE ENGEL",
        "HECTOR PENA",
      ],
      topcorp: "NORTH BROOKLYN MANAGEMENT LLC",
      topbusinessaddr: "12 SPENCER STREET 4 11205",
      totalopenviolations: 501,
      totalviolations: 7346,
      openviolationsperbldg: 2.9,
      openviolationsperresunit: 0.3,
      totalevictions: 16,
      avgevictions: 0.1,
      totalrsgain: 121,
      totalrsloss: -307,
      totalrsdiff: -186,
      rsproportion: 12.4,
      rslossaddr: {
        housenumber: "160",
        streetname: "HAVEMEYER STREET",
        boro: "BROOKLYN",
        lat: 40.7114809355843,
        lng: -73.9578477410413,
        rsdiff: -18,
      },
      evictionsaddr: {
        housenumber: "1104",
        streetname: "BUSHWICK AVENUE",
        boro: "BROOKLYN",
        lat: 40.6897931410334,
        lng: -73.9192530710074,
        evictions: 3,
      },
      violationsaddr: {
        housenumber: "188",
        streetname: "SOUTH THIRD STREET",
        boro: "BROOKLYN",
        lat: 40.7114873132789,
        lng: -73.9603474392426,
        openviolations: 55,
      },
    },
  ],
};
