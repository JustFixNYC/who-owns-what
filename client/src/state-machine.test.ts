import { wowMachine, WowEvent } from "./state-machine";
import { interpret } from "xstate";
import { GEO_AUTOCOMPLETE_URL } from "@justfixnyc/geosearch-requester";
import { waitUntilStateMatches } from "tests/test-util";
import GEOCODING_EXAMPLE_SEARCH from "./tests/geocoding-example-search.json";

const SEARCH_EVENT: WowEvent = {
  type: "SEARCH",
  address: {
    housenumber: "150",
    streetname: "court st",
    boro: "BROOKLYN",
  },
};

const SEARCH_URL = `${GEO_AUTOCOMPLETE_URL}?text=150%20court%20st%2C%20BROOKLYN`;

describe("wowMachine", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should start w/ no data", () => {
    const wm = interpret(wowMachine).start();
    expect(wm.state.value).toBe("noData");
  });

  it("should deal w/ geosearch network errors", async () => {
    fetchMock.mockIf(SEARCH_URL, async (req) => ({
      status: 500,
    }));
    const wm = interpret(wowMachine).start();
    wm.send(SEARCH_EVENT);
    await waitUntilStateMatches(wm, "networkErrorOccurred");
  });

  it("should deal w/ invalid addresses", async () => {
    fetchMock.mockIf(SEARCH_URL, async (req) => ({
      body: JSON.stringify({ features: [] }),
      status: 200,
    }));
    const wm = interpret(wowMachine).start();
    wm.send(SEARCH_EVENT);
    await waitUntilStateMatches(wm, "bblNotFound");
  });

  it("should deal w/ unregistered addresses", async () => {
    fetchMock.mockResponse(async (req) => {
      if (req.url === SEARCH_URL) {
        return {
          body: JSON.stringify(GEOCODING_EXAMPLE_SEARCH),
          headers: { "Content-Type": "application/json" },
          status: 200,
        };
      }
      if (req.url === "https://wowapi/api/address?block=00292&lot=0026&borough=3") {
        return {
          body: JSON.stringify({
            addrs: [],
            geosearch: {
              geosupportReturnCode: "00",
              bbl: "3002920026",
            },
          }),
          headers: { "Content-Type": "application/json" },
          status: 200,
        };
      }
      if (req.url === "https://wowapi/api/address/buildinginfo?bbl=3002920026") {
        return {
          body: JSON.stringify({
            result: [
              {
                formatted_address: "144 COURT STREET",
                housenumber: "144",
                streetname: "COURT STREET",
                bldgclass: "O5",
                boro: "BROOKLYN",
                latitude: 40.6889099948209,
                longitude: -73.99302988771,
              },
            ],
          }),
          headers: { "Content-Type": "application/json" },
          status: 200,
        };
      }
      return {
        status: 500,
      };
    });

    const wm = interpret(wowMachine).start();
    wm.send(SEARCH_EVENT);
    await waitUntilStateMatches(wm, "unregisteredFound");
  });
});
