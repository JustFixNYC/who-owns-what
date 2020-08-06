import { getFullBblFromPageParams, BBLPageParams, isValidBblFormat } from "./BBLPage";

const pageParamsWithFullBbl: BBLPageParams = {
  bbl: "1003450021",
};

const pageParamsWithBblBits: BBLPageParams = {
  boro: "2",
  block: "43",
  lot: "1",
};

const incompletePageParams: BBLPageParams = {
  boro: "3",
  lot: "1",
};

describe("getFullBblFromPageParams()", () => {
  it("returns true when objects are equal", () => {
    expect(getFullBblFromPageParams(pageParamsWithFullBbl)).toBe("1003450021");
  });

  it("returns false when objects are not equal", () => {
    expect(getFullBblFromPageParams(pageParamsWithBblBits)).toBe("2000430001");
  });

  it("throws error if params are incomplete", () => {
    expect(() => getFullBblFromPageParams(incompletePageParams)).toThrowError(
      "Invalid params, expected either a BBL or boro/block/lot!"
    );
  });
});

describe("isValidBblFormat()", () => {
  it("returns true for a valid bbl", () => {
    expect(isValidBblFormat("1003450021")).toBe(true);
  });

  it("returns false if bbl is not the right number of digits", () => {
    expect(isValidBblFormat("100345003")).toBe(false);
  });

  it("returns false if bbl contains non-numeric characters", () => {
    expect(isValidBblFormat("100345003X")).toBe(false);
  });
});
