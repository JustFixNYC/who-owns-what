import {
  SearchResults,
  SummaryResults,
  BuildingInfoResults,
  IndicatorsHistoryResults,
  WithBoroBlockLot,
} from "./APIDataTypes";
import { SearchAddress } from "./AddressSearch";
import { GeoSearchRequester } from "@justfixnyc/geosearch-requester";
import {
  indicatorsInitialState,
  indicatorsInitialDataStructure,
  IndicatorsDataFromAPI,
  IndicatorsData,
} from "./IndicatorsTypes";
import helpers from "util/helpers";
import { IndicatorsDatasetId } from "./IndicatorsDatasets";

// API REQUESTS TO THE DATABASE:

function searchForAddressWithGeosearch(q: {
  housenumber?: string;
  streetname: string;
  boro: string;
}): Promise<SearchResults> {
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
        const firstResult = results.features[0];
        if (!firstResult)
          return resolve({
            addrs: [],
            geosearch: undefined,
          });
        resolve(searchForBBL(helpers.splitBBL(firstResult.properties.pad_bbl)));
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

function searchForAddress(q: SearchAddress): Promise<SearchResults> {
  if (q.bbl) {
    return searchForBBL(helpers.splitBBL(q.bbl));
  }
  return searchForAddressWithGeosearch(q);
}

function searchForBBL(q: WithBoroBlockLot): Promise<SearchResults> {
  return getJSON(`/api/address?block=${q.block}&lot=${q.lot}&borough=${q.boro}`);
}

function getAggregate(bbl: string): Promise<SummaryResults> {
  return getJSON(`/api/address/aggregate?bbl=${bbl}`);
}

function getBuildingInfo(bbl: string): Promise<BuildingInfoResults> {
  return getJSON(`/api/address/buildinginfo?bbl=${bbl}`);
}

async function getIndicatorHistory(bbl: string): Promise<IndicatorsDataFromAPI> {
  const apiData: Promise<IndicatorsHistoryResults> = getJSON(
    `/api/address/indicatorhistory?bbl=${bbl}`
  );
  const rawIndicatorData = (await apiData).result;
  const structuredIndicatorData = Object.assign({}, indicatorsInitialDataStructure);

  for (const indicator of indicatorsInitialState.indicatorList) {
    var inputData = createVizData(rawIndicatorData, indicator);
    // TO DO: Fix this "any" typecasting
    structuredIndicatorData[indicator] = inputData as any;
  }
  return structuredIndicatorData;
}

const friendlyFetch: typeof fetch = async (input, init) => {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (e) {
    throw new NetworkError(e.message);
  }
  if (!response.ok) {
    throw new HTTPError(response);
  }
  return response;
};

function getAddressExport(bbl: string) {
  return friendlyFetch(apiURL(`/api/address/export?bbl=${bbl}`));
}

// OTHER API FUNCTIONS AND HELPERS:

function apiURL(url: string): string {
  return `${process.env.REACT_APP_API_BASE_URL || ""}${url}`;
}

async function getJSON(url: string): Promise<any> {
  const res = await friendlyFetch(apiURL(url), { headers: { accept: "application/json" } });
  try {
    return await res.json();
  } catch (e) {
    throw new NetworkError(e.message);
  }
}

/**
 * A generic network error. It could be because the network is down, or because
 * a server returned a HTTP response like 404 or 500.
 *
 * Note that we need to define this ourselves because `fetch()` will actually
 * reject with a `TypeError` on network failure, which is awfully ambiguous.
 */
export class NetworkError extends Error {}

/**
 * A network error that happened because the HTTP status code is not in
 * the range 200-299.
 */
export class HTTPError extends NetworkError {
  status: string;

  constructor(readonly response: Response) {
    super(`HTTP Error ${response.statusText}`);
    this.status = response.statusText;
  }
}

const Client = {
  searchForAddress,
  searchForAddressWithGeosearch,
  searchForBBL,
  getAggregate,
  getBuildingInfo,
  getIndicatorHistory,
  getAddressExport,
};

export default Client;
