import {
  SearchResults,
  BuildingInfoResults,
  IndicatorsHistoryResults,
  WithBoroBlockLot,
} from "./APIDataTypes";
import { GeoSearchRequester } from "@justfixnyc/geosearch-requester";
import {
  indicatorsInitialDataStructure,
  IndicatorsDataFromAPI,
  IndicatorsData,
  IndicatorsDatasetId,
  indicatorsDatasetIds,
} from "./IndicatorsTypes";
import helpers from "util/helpers";
import { NetworkError, HTTPError } from "error-reporting";

// API REQUESTS TO THE DATABASE:

function searchForAddressWithGeosearch(
  q: {
    housenumber?: string;
    streetname: string;
    boro: string;
  },
  useNewPortfolioMethod: boolean = false
): Promise<SearchResults> {
  let addr = `${q.streetname}, ${q.boro}`;
  if (q.housenumber) {
    addr = `${q.housenumber} ${addr}`;
  }

  return new Promise<SearchResults>((resolve, reject) => {
    const req = new GeoSearchRequester({
      onError(e) {
        reject(new NetworkError(e.message));
      },
      onResults(results) {
        const firstBoroResult = results.features.filter(
          (bldg) => bldg.properties.borough.toUpperCase() === q.boro.toUpperCase()
        )[0];
        if (!firstBoroResult)
          return resolve({
            addrs: [],
            geosearch: undefined,
          });
        resolve(
          searchForBBL(
            helpers.splitBBL(firstBoroResult.properties.addendum.pad.bbl),
            useNewPortfolioMethod
          )
        );
      },
      throttleMs: 0,
    });
    req.changeSearchRequest(addr);
  });
}

/** Reorganizes raw data from API call and then returns an object that matches the data stucture in state  */
function createVizData(rawJSON: any, vizType: IndicatorsDatasetId): IndicatorsData {
  // Generate object to hold data for viz
  // Note: keys in "values" object need to match exact key names in data from API call
  var vizData: IndicatorsData = Object.assign({}, indicatorsInitialDataStructure[vizType]);

  vizData.labels = [];
  for (const column in vizData.values) {
    vizData.values[column] = [];
  }

  // Generate arrays of data for chart.js visualizations:
  // Default grouping is by MONTH

  const rawJSONLength = rawJSON.length;

  for (let i = 0; i < rawJSONLength; i++) {
    vizData.labels.push(rawJSON[i].month);

    for (const column in vizData.values) {
      const vizTypePlusColumn = vizType + "_" + column;
      const values = vizData.values[column];
      if (!values)
        throw new Error(`Column "${column}" of visualization "${vizType}" is not an array!`);
      values.push(parseInt(rawJSON[i][vizTypePlusColumn]));
    }
  }
  return vizData;
}

function searchForBBL(
  q: WithBoroBlockLot,
  useNewPortfolioMethod?: boolean
): Promise<SearchResults> {
  return getApiJson(
    `/api/address${useNewPortfolioMethod ? "/wowza" : ""}?block=${q.block}&lot=${q.lot}&borough=${
      q.boro
    }`
  );
}

function getBuildingInfo(bbl: string): Promise<BuildingInfoResults> {
  return getApiJson(`/api/address/buildinginfo?bbl=${bbl}`);
}

async function getIndicatorHistory(bbl: string): Promise<IndicatorsDataFromAPI> {
  const apiData: Promise<IndicatorsHistoryResults> = getApiJson(
    `/api/address/indicatorhistory?bbl=${bbl}`
  );
  const rawIndicatorData = (await apiData).result;
  const structuredIndicatorData = Object.assign({}, indicatorsInitialDataStructure);

  for (const indicator of indicatorsDatasetIds) {
    var inputData = createVizData(rawIndicatorData, indicator);
    // TO DO: Fix this "any" typecasting
    structuredIndicatorData[indicator] = inputData as any;
  }
  return structuredIndicatorData;
}

// OTHER API FUNCTIONS AND HELPERS:

/**
 * Like `fetch()`, but raises a `NetworkError` if there's
 * a network error or the response's HTTP status code isn't
 * in the range 200-299.
 */
const friendlyFetch: typeof fetch = async (input, init) => {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (e) {
    if (e instanceof Error) {
      throw new NetworkError(e.message);
    } else {
      throw new Error("Unexpected error");
    }
  }
  if (!response.ok) {
    throw new HTTPError(response);
  }
  return response;
};

/**
 * Rebase a url like `/api/boop` to start with our API base URL,
 * if it's available.
 */
function apiURL(url: string): string {
  return `${process.env.REACT_APP_API_BASE_URL || ""}${url}`;
}

/**
 * Return the parsed JSON response from our API server at the given
 * URL, e.g. `/api/boop`.
 */
async function getApiJson(url: string): Promise<any> {
  const res = await friendlyFetch(apiURL(url), { headers: { accept: "application/json" } });
  const contentType = res.headers.get("Content-Type");
  if (!(contentType && /^application\/json/.test(contentType))) {
    throw new NetworkError(`Expected JSON response but got ${contentType} from ${res.url}`, true);
  }
  try {
    return await res.json();
  } catch (e) {
    if (e instanceof Error) {
      throw new NetworkError(e.message);
    } else {
      throw new Error("Unexpected error");
    }
  }
}

const Client = {
  searchForAddressWithGeosearch,
  searchForBBL,
  getBuildingInfo,
  getIndicatorHistory,
};

export default Client;
