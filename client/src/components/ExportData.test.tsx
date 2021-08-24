import { HpdComplaintCount, HpdFullContact, HpdOwnerContact } from "./APIDataTypes";
import { formatAllContacts, formatComplaintTypes, formatOwnerNames } from "./ExportData";

describe("formatOwnerNames()", () => {
  it("works when passed real data", () => {
    const owners: HpdOwnerContact[] = [
      { title: "HeadOfficer", value: "BOOP" },
      { title: "Agent", value: "BLARG" },
    ];
    expect(formatOwnerNames(owners)).toBe("BOOP (HeadOfficer), BLARG (Agent)");
  });
  it("works when passed null", () => {
    expect(formatOwnerNames(null)).toBe("");
  });
});

describe("formatComplaintTypes()", () => {
  it("works when passed real data", () => {
    const complaintsByType: HpdComplaintCount[] = [
      { type: "Roaches", count: 1000 },
      { type: "Toilet", count: 505 },
    ];
    expect(formatComplaintTypes(complaintsByType)).toBe("Roaches (1000), Toilet (505)");
  });
  it("works when passed null", () => {
    expect(formatComplaintTypes(null)).toBe("");
  });
});

describe("formatAllContacts()", () => {
  it("works when passed real data, including different kinds of addresses", () => {
    const contacts: HpdFullContact[] = [
      {
        title: "HeadOfficer",
        value: "BOOP",
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
        title: "Officer",
        value: "JONES",
        address: {
          zip: null,
          city: "HELL",
          state: "NY",
          apartment: null,
          streetname: "HUDSON RIVER",
          housenumber: null,
        },
      },
      { title: "Agent", value: "BLARG", address: null },
    ];
    expect(formatAllContacts(contacts)).toBe(
      "BOOP (HeadOfficer), 12 SPENCER STREET 4 BROOKLYN, NY 11205; JONES (Officer), HUDSON RIVER HELL, NY; BLARG (Agent)"
    );
  });
  it("works when passed null", () => {
    expect(formatAllContacts(null)).toBe("");
  });
});
