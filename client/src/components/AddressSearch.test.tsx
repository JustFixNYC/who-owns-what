import { searchAddressToString } from "./AddressSearch";

describe("searchAddressToString()", () => {
  it("works when housenumber is a string", () => {
    expect(
      searchAddressToString({
        bbl: "1234567890",
        housenumber: "150",
        streetname: "COURT STREET",
        boro: "BROOKLYN",
      })
    ).toBe("150 COURT STREET, BROOKLYN");
  });

  it("works when housenumber is undefined", () => {
    expect(
      searchAddressToString({
        bbl: "1234567890",
        streetname: "GOWANUS HOUSES",
        boro: "BROOKLYN",
      })
    ).toBe("GOWANUS HOUSES, BROOKLYN");
  });
});
