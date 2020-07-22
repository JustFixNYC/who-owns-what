import helpers from "./helpers";

describe("jsonEqual()", () => {
  it("returns true when objects are equal", () => {
    expect(helpers.jsonEqual({ a: 1 }, { a: 1 })).toBe(true);
    expect(helpers.jsonEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  });

  it("returns false when objects are not equal", () => {
    expect(helpers.jsonEqual({ a: 1 }, { b: 2 })).toBe(false);
  });
});

test("uniq() works", () => {
  expect(helpers.uniq([1, 1, 2, 4, 4])).toEqual([1, 2, 4]);
});

describe("coerceToInt()", () => {
  it("Returns default value when input is NaN", () => {
    expect(helpers.coerceToInt(NaN, 15)).toBe(15);
  });

  it("Returns default value when input is null or undefined", () => {
    expect(helpers.coerceToInt(null, 15)).toBe(15);
    expect(helpers.coerceToInt(undefined, 15)).toBe(15);
  });

  it("Returns value when it is already a number", () => {
    expect(helpers.coerceToInt(0, 15)).toBe(0);
    expect(helpers.coerceToInt(5, 15)).toBe(5);
  });

  it("Returns parsed value when it is a string", () => {
    expect(helpers.coerceToInt("0", 15)).toBe(0);
    expect(helpers.coerceToInt("5", 15)).toBe(5);
    expect(helpers.coerceToInt("blarg", 15)).toBe(15);
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

describe("find()", () => {
  it("returns value if present", () => {
    const a = { boop: 1 };
    expect(helpers.find([{ boop: 2 }, a, { boop: 3 }], "boop", 1)).toBe(a);
  });

  it("returns null if not present", () => {
    expect(helpers.find([{ boop: 2 }, { boop: 3 }], "boop", 1)).toBe(null);
  });
});

describe("getNychaData()", () => {
  it("returns null if BBL is not a NYCHA BBL", () => {
    expect(helpers.getNychaData("blarg")).toBe(null);
  });

  it("returns data if BBL is a NYCHA BBL", () => {
    const data = helpers.getNychaData("4004770049");
    expect(data && data.development).toBe("QUEENSBRIDGE SOUTH");
  });
});

test("intersectAddrObjects() works", () => {
  expect(helpers.intersectAddrObjects({ a: 1, b: 2, c: 3, d: 9 }, { a: 5, b: 2, c: 9 })).toEqual({
    b: 2,
  });
});

test("capitalize() works", () => {
  expect(helpers.capitalize("boop jones")).toBe("Boop jones");
});

test("titleCase() works", () => {
  expect(helpers.titleCase("boop jones")).toBe("Boop Jones");
});

test("formatDate() works", () => {
  expect(helpers.formatDate("2008-01-05", { year: "numeric", month: "long" })).toBe("January 2008");
});

test("formatDate() works for month abbreviation", () => {
  expect(helpers.formatDate("2008-01-05", { month: "short" })).toBe("Jan");
});

// Note: Although there is generally good support across modern versions of the usual web browsers,
// the "locale" prop in the toLocaleDateString function is not supported until Node 13.
// Therefore, I implemented these two tests to match either the localized result or the default.
// See more here: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString

test("formatDate() works for  non-English locales", () => {
  expect(helpers.formatDate("2008-01-05", { year: "numeric", month: "long" }, "es")).toMatch(
    /Enero de 2008|January 2008/i
  );
});

test("formatDate() works for timeline in non-English locales", () => {
  expect(helpers.formatDate("2008-01-05", { month: "short" }, "es")).toMatch(/Ene|Jan/i);
});

test("formatStreetNameForHpdLink() works for directional prefixes", () => {
  expect(helpers.formatStreetNameForHpdLink("East 21st Street")).toBe("E 21st Street");
});

test("formatStreetNameForHpdLink() works for enumerations", () => {
  expect(helpers.formatStreetNameForHpdLink("Eighth Avenue")).toBe("8 Avenue");
});

test("formatStreetNameForHpdLink() works for both prefixes and enumerations at once", () => {
  expect(helpers.formatStreetNameForHpdLink("North Second Street")).toBe("N 2 Street");
});

test("formatStreetNameForHpdLink() doesn't change directionals or enumerations within names", () => {
  expect(helpers.formatStreetNameForHpdLink("Eastonfirst Avenue")).toBe("Eastonfirst Avenue");
});

test("formatStreetNameForHpdLink() still works for one-word streetnames", () => {
  expect(helpers.formatStreetNameForHpdLink("Broadway")).toBe("Broadway");
});

test("formatStreetNameForHpdLink() still works for empty streetnames", () => {
  expect(helpers.formatStreetNameForHpdLink("")).toBe("");
});
