import { SAMPLE_ADDRESS_RECORDS } from "state-machine-sample-data";
import { calculateAggDataFromAddressList, extractLocationDataFromAddr } from "./SummaryCalculation";

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
