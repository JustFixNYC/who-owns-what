jest.mock("../components/DistrictMap", () => ({
  DistrictMap: () => null,
}));

import { buildDistrictLoginLocation } from "./DistrictAlertsPage";

const sampleDistrict = [
  {
    areaLabel: "11201",
    areaValue: "11201",
    typeLabel: "Zip Code",
    typeValue: "zipcode",
  },
];

describe("DistrictAlertsPage login redirect", () => {
  it("preserves district state on the locale-prefixed login path", () => {
    expect(buildDistrictLoginLocation("en", sampleDistrict)).toEqual({
      pathname: "/en/account/login",
      state: { district: sampleDistrict },
    });
    expect(buildDistrictLoginLocation("es", sampleDistrict).pathname).toBe("/es/account/login");
  });

  it("does not double-prefix the locale", () => {
    expect(buildDistrictLoginLocation("en", sampleDistrict).pathname).not.toBe(
      "/enen/account/login"
    );
  });
});
