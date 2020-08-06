import { wowMachine, WowEvent } from "./state-machine";
import { interpret } from "xstate";
import { GEO_AUTOCOMPLETE_URL } from "@justfixnyc/geosearch-requester";
import { waitUntilStateMatches, mockJsonResponse, mockResponses } from "tests/test-util";
import GEOCODING_EXAMPLE_SEARCH from "./tests/geocoding-example-search.json";
import { SearchResults, BuildingInfoResults } from "components/APIDataTypes";
import helpers from "util/helpers";
import {
  SAMPLE_BUILDING_INFO_RESULTS,
  SAMPLE_ADDRESS_RECORDS,
  SAMPLE_TIMELINE_DATA,
} from "state-machine-sample-data";
import { IndicatorsDataFromAPI } from "components/IndicatorsTypes";

const SEARCH_EVENT: WowEvent = {
  type: "SEARCH",
  address: {
    housenumber: "150",
    streetname: "court st",
    boro: "BROOKLYN",
  },
};

function generateMockRequestStuff(bbl: string) {
  const bblBits = helpers.splitBBL(bbl);
  const newGeocodingExample = JSON.parse(JSON.stringify(GEOCODING_EXAMPLE_SEARCH));
  newGeocodingExample.features[0].properties.pad_bbl = bbl;
  return {
    GEOCODING_EXAMPLE_SEARCH: newGeocodingExample,
    ADDRESS_URL: `https://wowapi/api/address?block=${bblBits.block}&lot=${bblBits.lot}&borough=${bblBits.boro}`,
    BUILDINGINFO_URL: `https://wowapi/api/address/buildinginfo?bbl=${bbl}`,
    INDICATORS_URL: `https://wowapi/api/address/indicatorhistory?bbl=${bbl}`,
    SUMMARY_URL: `https://wowapi/api/address/aggregate?bbl=${bbl}`,
  };
}

const SEARCH_URL = `${GEO_AUTOCOMPLETE_URL}?text=150%20court%20st%2C%20BROOKLYN`;

const NOT_REG_URLS = generateMockRequestStuff("3002920026");
const NYCHA_URLS = generateMockRequestStuff("3004040001");
const PORTFOLIO_URLS = generateMockRequestStuff("3012380016");

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
      [SEARCH_URL]: mockJsonResponse(NOT_REG_URLS.GEOCODING_EXAMPLE_SEARCH),
      [NOT_REG_URLS.ADDRESS_URL]: mockJsonResponse<SearchResults>({
        addrs: [],
        geosearch: {
          geosupportReturnCode: "00",
          bbl: "3002920026",
        },
      }),
      [NOT_REG_URLS.BUILDINGINFO_URL]: mockJsonResponse<BuildingInfoResults>(
        SAMPLE_BUILDING_INFO_RESULTS
      ),
    });

    const wm = interpret(wowMachine).start();
    wm.send(SEARCH_EVENT);
    await waitUntilStateMatches(wm, "unregisteredFound");
  });

  it("should deal w/ nycha addresses", async () => {
    mockResponses({
      [SEARCH_URL]: mockJsonResponse(NYCHA_URLS.GEOCODING_EXAMPLE_SEARCH),
      [NYCHA_URLS.ADDRESS_URL]: mockJsonResponse<SearchResults>({
        addrs: [],
        geosearch: {
          geosupportReturnCode: "00",
          bbl: "3004040001",
        },
      }),
      [NYCHA_URLS.BUILDINGINFO_URL]: mockJsonResponse<BuildingInfoResults>(
        SAMPLE_BUILDING_INFO_RESULTS
      ),
    });

    const wm = interpret(wowMachine).start();
    wm.send(SEARCH_EVENT);
    await waitUntilStateMatches(wm, "nychaFound");
  });

  it("should deal w/ addresses with portfolios", async () => {
    mockResponses({
      [SEARCH_URL]: mockJsonResponse(PORTFOLIO_URLS.GEOCODING_EXAMPLE_SEARCH),
      [PORTFOLIO_URLS.ADDRESS_URL]: mockJsonResponse<SearchResults>({
        addrs: SAMPLE_ADDRESS_RECORDS,
        geosearch: {
          geosupportReturnCode: "00",
          bbl: "3012380016",
        },
      }),
    });

    const wm = interpret(wowMachine).start();
    wm.send(SEARCH_EVENT);
    await waitUntilStateMatches(wm, "portfolioFound");
  });
  it("should deal w/ viewing timeline data", async () => {
    mockResponses({
      [SEARCH_URL]: mockJsonResponse(PORTFOLIO_URLS.GEOCODING_EXAMPLE_SEARCH),
      [PORTFOLIO_URLS.ADDRESS_URL]: mockJsonResponse<SearchResults>({
        addrs: SAMPLE_ADDRESS_RECORDS,
        geosearch: {
          geosupportReturnCode: "00",
          bbl: "3012380016",
        },
      }),
      [PORTFOLIO_URLS.INDICATORS_URL]: mockJsonResponse<IndicatorsDataFromAPI>(
        SAMPLE_TIMELINE_DATA
      ),
    });

    const wm = interpret(wowMachine).start();
    wm.send(SEARCH_EVENT);
    await waitUntilStateMatches(wm, "portfolioFound");
    wm.send({type: "VIEW_TIMELINE"});
    await waitUntilStateMatches(wm, { portfolioFound: { timeline: "success" } });
  });
});
