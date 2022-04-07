import { createAddressPageRoutes } from "routes";

describe("createAddressPageRoutes()", () => {
  it("prefixes with string when given one", () => {
    expect(createAddressPageRoutes("/boop").timeline).toBe("/boop/timeline");
  });

  it("prefixes with address page params when given one", () => {
    expect(
      createAddressPageRoutes({
        boro: "BROOKLYN",
        housenumber: "654",
        streetname: "PARK PLACE",
      }).timeline
    ).toBe("/address/BROOKLYN/654/PARK%20PLACE/timeline");
  });

  it("prefixes with address page params and locale when given one", () => {
    expect(
      createAddressPageRoutes({
        boro: "BROOKLYN",
        housenumber: "654",
        streetname: "PARK PLACE",
        locale: "es",
      }).timeline
    ).toBe("/es/address/BROOKLYN/654/PARK%20PLACE/timeline");
  });

  it("correctly sets the right path when route is specified as a legacy route", () => {
    expect(
      createAddressPageRoutes(
        {
          boro: "BROOKLYN",
          housenumber: "654",
          streetname: "PARK PLACE",
          locale: "es",
        },
        true
      ).timeline
    ).toBe("/es/legacy/address/BROOKLYN/654/PARK%20PLACE/timeline");
  });
});
