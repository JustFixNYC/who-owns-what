import { SAMPLE_ADDRESS_RECORDS } from "state-machine-sample-data";
import { AddressRecord } from "./APIDataTypes";
import {
  calculateAggDataFromAddressList,
  extractLocationDataFromAddr,
  getTopComplaintTypesInPortfolio,
  NUM_COMPLAINT_TYPES_TO_SHOW,
} from "./SummaryCalculation";

describe("extractLocationDataFromAddr()", () => {
  it("get's precisely the five address-related fields from an AddressRecord", () => {
    expect(extractLocationDataFromAddr(SAMPLE_ADDRESS_RECORDS[0])).toEqual({
      housenumber: "654",
      streetname: "PARK PLACE",
      boro: "BROOKLYN",
      lat: 40.6737974139504,
      lng: -73.9562781322538,
    });
  });
});

describe("calculateAggDataFromAddressList()", () => {
  const agg = calculateAggDataFromAddressList(SAMPLE_ADDRESS_RECORDS);
  it("calculates sums", () => {
    expect(agg.units).toBe(21);
  });
  it("calculates sums with nulls", () => {
    expect(agg.totalevictions).toBe(0);
  });
  it("calculates sums with filtering", () => {
    expect(agg.totalrsloss).toBe(-8);
  });
  it("calculates proportions", () => {
    expect(agg.openviolationsperresunit).toBeCloseTo(0.05);
  });
  it("is able to find top addresses", () => {
    expect(agg.violationsaddr.streetname).toBe("LEWIS AVENUE");
  });
  it("is able to find most common names, in order", () => {
    expect(agg.topowners[0]).toBe("MOSES GUTMAN");
  });
});

const SAMPLE_ADDRESS_RECORDS_NO_COMPLAINTS: AddressRecord[] = [
  {
    ...SAMPLE_ADDRESS_RECORDS[0],
    recentcomplaintsbytype: null,
  },
  {
    ...SAMPLE_ADDRESS_RECORDS[1],
    recentcomplaintsbytype: null,
  },
];

const SAMPLE_ADDRESS_RECORDS_NULLS_MIXED_IN: AddressRecord[] = [
  SAMPLE_ADDRESS_RECORDS[1],
  SAMPLE_ADDRESS_RECORDS[1],
  {
    ...SAMPLE_ADDRESS_RECORDS[1],
    recentcomplaintsbytype: null,
  },
];

const SAMPLE_ADDRESS_RECORDS_WITH_MANY_COMPLAINT_CATEGORIES: AddressRecord[] = [
  SAMPLE_ADDRESS_RECORDS[0],
  {
    ...SAMPLE_ADDRESS_RECORDS[1],
    recentcomplaintsbytype: [
      { count: 4, type: "HEAT/HOT WATER" },
      { count: 2, type: "PESTS" },
      { count: 6, type: "BOOPS" },
      { count: 5, type: "FROGS" },
      { count: 2, type: "RATS" },
      { count: 1, type: "LICE" },
      { count: 2, type: "PLAGUE" },
    ],
  },
];

describe("getTopComplaintTypesInPortfolio()", () => {
  it("finds the most frequent complaint types across a portfolio", () => {
    expect(getTopComplaintTypesInPortfolio(SAMPLE_ADDRESS_RECORDS)).toEqual([
      { count: 4, type: "HEAT/HOT WATER" },
      { count: 2, type: "PESTS" },
    ]);
  });
  it("returns no more than a predefined number of top complaint types", () => {
    const complaintTypes = getTopComplaintTypesInPortfolio(
      SAMPLE_ADDRESS_RECORDS_WITH_MANY_COMPLAINT_CATEGORIES
    );
    expect(complaintTypes.length).toEqual(NUM_COMPLAINT_TYPES_TO_SHOW);
    expect(complaintTypes[0]).toEqual({ count: 7, type: "HEAT/HOT WATER" });
    expect(complaintTypes[1]).toEqual({ count: 6, type: "BOOPS" });
  });
  it("returns an empty array if there are no complaint types to be aggregated", () => {
    expect(getTopComplaintTypesInPortfolio(SAMPLE_ADDRESS_RECORDS_NO_COMPLAINTS)).toEqual([]);
  });
  it("still finds most recent complaint types even if some individual addresses have a null list of recentcomplaintsbytype", () => {
    expect(getTopComplaintTypesInPortfolio(SAMPLE_ADDRESS_RECORDS_NULLS_MIXED_IN)).toEqual([
      { type: "PESTS", count: 4 },
      { type: "HEAT/HOT WATER", count: 2 },
    ]);
  });
});
