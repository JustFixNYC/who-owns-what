import { wowMachine, WowEvent } from "./state-machine";
import { interpret } from "xstate";
import { GEO_AUTOCOMPLETE_URL } from "@justfixnyc/geosearch-requester";
import { waitUntilStateMatches, mockJsonResponse, mockResponses } from "tests/test-util";
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

const ADDRESS_URL = "https://wowapi/api/address?block=00292&lot=0026&borough=3";

const BUILDINGINFO_URL = "https://wowapi/api/address/buildinginfo?bbl=3002920026";

describe("wowMachine", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should start w/ no data", () => {
    const wm = interpret(wowMachine).start();
    expect(wm.state.value).toBe("noData");
  });

  it("should deal w/ geosearch network errors", async () => {
    mockResponses({ [SEARCH_URL]: { status: 500 } });
    const wm = interpret(wowMachine).start();
    wm.send(SEARCH_EVENT);
    await waitUntilStateMatches(wm, "networkErrorOccurred");
  });

  it("should deal w/ invalid addresses", async () => {
    mockResponses({ [SEARCH_URL]: mockJsonResponse({ features: [] }) });
    const wm = interpret(wowMachine).start();
    wm.send(SEARCH_EVENT);
    await waitUntilStateMatches(wm, "bblNotFound");
  });

  it("should deal w/ unregistered addresses", async () => {
    mockResponses({
      [SEARCH_URL]: mockJsonResponse(GEOCODING_EXAMPLE_SEARCH),
      [ADDRESS_URL]: mockJsonResponse({
        addrs: [],
        geosearch: {
          geosupportReturnCode: "00",
          bbl: "3002920026",
        },
      }),
      [BUILDINGINFO_URL]: mockJsonResponse({
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
    });

    const wm = interpret(wowMachine).start();
    wm.send(SEARCH_EVENT);
    await waitUntilStateMatches(wm, "unregisteredFound");
  });
});
