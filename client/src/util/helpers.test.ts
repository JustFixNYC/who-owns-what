import helpers, { searchAddrsAreEqual } from "./helpers";
import { SearchAddressWithoutBbl } from "components/APIDataTypes";
import { SAMPLE_ADDRESS_RECORDS } from "state-machine-sample-data";

describe("searchAddrsAreEqual()", () => {
  const searchAddr1: SearchAddressWithoutBbl = {
    boro: "BRONX",
    streetname: "BWAY",
    housenumber: "1",
  };

  const searchAddr2: SearchAddressWithoutBbl = {
    boro: "MANHATTAN",
    streetname: "SEWER",
  };
  it("returns true when addrs are equal", () => {
    expect(searchAddrsAreEqual(searchAddr1, searchAddr1)).toBe(true);
  });
  it("still works if housenumber is not defined", () => {
    expect(searchAddrsAreEqual(searchAddr2, searchAddr2)).toBe(true);
  });
  it("returns false when addrs are different", () => {
    expect(searchAddrsAreEqual(searchAddr1, searchAddr2)).toBe(false);
  });
});

test("uniq() works", () => {
  expect(helpers.uniq([1, 1, 2, 4, 4])).toEqual([1, 2, 4]);
});

describe("find()", () => {
  it("returns value if present", () => {
    const a = { boop: 1 };
    expect(helpers.find([{ boop: 2 }, a, { boop: 3 }], "boop", 1)).toBe(a);
  });

  it("returns null if not present", () => {
    expect(helpers.find([{ boop: 2 }, { boop: 3 }], "boop", 1)).toBe(null);
  });
});

describe("maxArray()", () => {
  it("returns 0 for arrays with negative numbers", () => {
    expect(helpers.maxArray([-1, -2])).toBe(0);
  });

  it("returns max positive number", () => {
    expect(helpers.maxArray([1, 501, 3])).toBe(501);
  });

  it("returns 0 for empty arrays", () => {
    expect(helpers.maxArray([])).toBe(0);
  });
});

describe("flattenArray()", () => {
  it("unpacks any elements that are themselves arrays", () => {
    expect(helpers.flattenArray([1, [2, 3], 4])).toEqual([1, 2, 3, 4]);
  });

  it("keeps doubly-nested arrays intact", () => {
    expect(helpers.flattenArray([1, [[2, 3], 4]])).toEqual([1, [2, 3], 4]);
  });

  it("returns the same array if no nested elements are themselves arrays", () => {
    expect(helpers.flattenArray([1, 2, 3, 4])).toEqual([1, 2, 3, 4]);
  });

  it("returns empty arrays when given empty arrays", () => {
    expect(helpers.flattenArray([])).toEqual([]);
  });
});

describe("getMostCommonElementsInArray()", () => {
  it("works", () => {
    expect(helpers.getMostCommonElementsInArray(["red", "green", "green", "blue"], 1)).toEqual([
      "green",
    ]);
  });

  it("works even if trying to return more top elements than exist", () => {
    expect(helpers.getMostCommonElementsInArray(["red", "green", "green"], 5)).toEqual([
      "green",
      "red",
    ]);
  });

  it("works with empty arrays", () => {
    expect(helpers.getMostCommonElementsInArray([], 1)).toEqual([]);
  });
});

describe("getLandlordNameFromAddress()", () => {
  it("returns an empty array when there are no ownernames", () => {
    expect(
      helpers.getLandlordNameFromAddress({
        ...SAMPLE_ADDRESS_RECORDS[0],
        ownernames: null,
      })
    ).toEqual([]);
  });

  it("returns an array with 1 landlord's name for addresses with one landlord", () => {
    expect(
      helpers.getLandlordNameFromAddress({
        ...SAMPLE_ADDRESS_RECORDS[0],
      })
    ).toEqual(["MOSES GUTMAN"]);
  });

  it("returns an array with multiple landlord's name for addresses with more than one landlord", () => {
    expect(
      helpers.getLandlordNameFromAddress({
        ...SAMPLE_ADDRESS_RECORDS[0],
        ownernames: [
          { title: "HeadOfficer", value: "MOSES GUTMAN" },
          { title: "HeadOfficer", value: "BOOP GUTMAN" },
          { title: "JointOwner", value: "BOOP JONES" },
          { title: "Agent", value: "NATHAN SCHWARCZ" },
        ],
      })
    ).toEqual(["MOSES GUTMAN", "BOOP GUTMAN", "BOOP JONES"]);
  });

  it("can detect all three types of landlord contact records", () => {
    expect(
      helpers.getLandlordNameFromAddress({
        ...SAMPLE_ADDRESS_RECORDS[0],
        ownernames: [
          { title: "HeadOfficer", value: "SAM" },
          { title: "CorporateOwner", value: "SAMARA" },
          { title: "IndividualOwner", value: "TAHNEE" },
        ],
      })
    ).toEqual(["SAM", "SAMARA", "TAHNEE"]);
  });

  it("filters out duplicate landlord names", () => {
    expect(
      helpers.getLandlordNameFromAddress({
        ...SAMPLE_ADDRESS_RECORDS[0],
        ownernames: [
          { title: "HeadOfficer", value: "MOSES GUTMAN" },
          { title: "CorporateOwner", value: "MOSES GUTMAN" },
          { title: "Agent", value: "NATHAN SCHWARCZ" },
        ],
      })
    ).toEqual(["MOSES GUTMAN"]);
  });
});

test("splitBBL() works", () => {
  expect(helpers.splitBBL("3012380016")).toEqual({
    boro: "3",
    block: "01238",
    lot: "0016",
  });
});

test("addrsAreEqual() works", () => {
  expect(helpers.addrsAreEqual({ bbl: "boop" }, { bbl: "boop" })).toBe(true);
  expect(helpers.addrsAreEqual({ bbl: "yes" }, { bbl: "no" })).toBe(false);
});

describe("formatPrice()", () => {
  it("works with no locale provided", () => {
    expect(helpers.formatPrice(1000000)).toBe("1,000,000");
  });
  it("works with specified locales", () => {
    expect(helpers.formatPrice(1000000, "es")).toMatch(/1.000.000|1,000,000/i);
  });
});

test("createTakeActionURL() works", () => {
  expect(
    helpers.createTakeActionURL({ boro: "QUEENS", streetname: "BOOP RD", housenumber: "1" }, "boop")
  ).toBe(
    "https://app.justfix.org/ddo?address=1%20BOOP%20RD&borough=QUEENS&utm_source=whoownswhat&utm_content=take_action&utm_medium=boop"
  );
});

test("capitalize() works", () => {
  expect(helpers.capitalize("boop jones")).toBe("Boop jones");
});

test("titleCase() works", () => {
  expect(helpers.titleCase("boop jones")).toBe("Boop Jones");
});

describe("formatDate()", () => {
  it("works", () => {
    expect(helpers.formatDate("2008-01-05", { year: "numeric", month: "long" })).toBe(
      "January 2008"
    );
  });

  it("works for month abbreviation", () => {
    expect(helpers.formatDate("2008-01-05", { month: "short" })).toBe("Jan");
  });

  // Note: Although there is generally good support across modern versions of the usual web browsers,
  // the "locale" prop in the toLocaleDateString function is not supported until Node 13.
  // Therefore, I implemented these two tests to match either the localized result or the default.
  // See more here: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString

  it("works for non-English locales", () => {
    expect(helpers.formatDate("2008-01-05", { year: "numeric", month: "long" }, "es")).toMatch(
      /Enero de 2008|January 2008/i
    );
  });

  it("works for month abbreviation in non-English locales", () => {
    expect(helpers.formatDate("2008-01-05", { month: "short" }, "es")).toMatch(/Ene|Jan/i);
  });
});

describe("getMonthRangeFromQuarter()", () => {
  it("works with no locale provided", () => {
    expect(helpers.getMonthRangeFromQuarter("1")).toBe("Jan - Mar");
  });
  it("works with specified locales", () => {
    expect(helpers.getMonthRangeFromQuarter("1", "es")).toMatch(/Ene - Mar|Jan - Mar/i);
  });
});

describe("formatHpdContactAddress(), ()", () => {
  it("works with fully populated addresses", () => {
    expect(
      helpers.formatHpdContactAddress({
        zip: "11205",
        city: "Brooklyn",
        state: "NY",
        apartment: "d",
        streetname: "BOOP STREET",
        housenumber: "1",
      })
    ).toStrictEqual({
      addressLine1: "1 BOOP STREET D",
      addressLine2: "BROOKLYN, NY 11205",
    });
  });

  it("works with addresses with missing parts", () => {
    expect(
      helpers.formatHpdContactAddress({
        zip: "11205",
        city: null,
        state: null,
        apartment: null,
        streetname: "BOOP STREET",
        housenumber: "1",
      })
    ).toStrictEqual({
      addressLine1: "1 BOOP STREET",
      addressLine2: "11205",
    });
  });
});
