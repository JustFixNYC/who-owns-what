import {
  SearchResults,
  SummaryResults,
  BuildingInfoResults,
  IndicatorsHistoryResults,
  WithBoroBlockLot,
} from "./APIDataTypes";
import { SearchAddress } from "./AddressSearch";
import { GeoSearchRequester } from "@justfixnyc/geosearch-requester";
import { IndicatorsDatasetId } from "./IndicatorsDatasets";
import {
  IndicatorsData,
  indicatorsInitialState,
  indicatorsInitialDataStrucutre,
  IndicatorsDataFromAPI,
} from "./IndicatorsTypes";

// API REQUESTS TO THE DATABASE:

/** Reorganizes raw data from API call and then returns an object that matches the data stucture in state  */
function createVizData(rawJSON: any, vizType: IndicatorsDatasetId): IndicatorsData {
  // Generate object to hold data for viz
  // Note: keys in "values" object need to match exact key names in data from API call
  var vizData: IndicatorsData = Object.assign({}, indicatorsInitialDataStrucutre[vizType]);

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
      onError: reject,
      onResults(results) {
        const firstResult = results.features[0];
        if (!firstResult)
          return resolve({
            addrs: [],
            geosearch: undefined,
          });
        resolve(searchForBBL(splitBBL(firstResult.properties.pad_bbl)));
      },
      throttleMs: 0,
    });
    req.changeSearchRequest(addr);
  });
}

function splitBBL(bbl: string): { boro: string; block: string; lot: string } {
  return {
    boro: bbl.slice(0, 1),
    block: bbl.slice(1, 6),
    lot: bbl.slice(6, 10),
  };
}

function searchForAddress(q: SearchAddress): Promise<SearchResults> {
  if (q.bbl) {
    return searchForBBL(splitBBL(q.bbl));
  }
  return searchForAddressWithGeosearch(q);
}

function searchForBBL(q: WithBoroBlockLot): Promise<SearchResults> {
  return get(`/api/address?block=${q.block}&lot=${q.lot}&borough=${q.boro}`);
}

function getAggregate(bbl: string): Promise<SummaryResults> {
  return get(`/api/address/aggregate?bbl=${bbl}`);
}

function getBuildingInfo(bbl: string): Promise<BuildingInfoResults> {
  return get(`/api/address/buildinginfo?bbl=${bbl}`);
}

async function getIndicatorHistory(bbl: string): Promise<IndicatorsDataFromAPI> {
  const apiData: Promise<IndicatorsHistoryResults> = get(
    `/api/address/indicatorhistory?bbl=${bbl}`
  );
  const boop = (await apiData).result;
  const obj = Object.assign({}, indicatorsInitialDataStrucutre);

  for (const indicator of indicatorsInitialState.indicatorList) {
    var inputData = createVizData(boop, indicator);
    obj[indicator] = inputData as any;
  }
  return obj;
}

function getAddressExport(bbl: string) {
  return fetch(apiURL(`/api/address/export?bbl=${bbl}`)).then(checkStatus);
}

// OTHER API FUNCTIONS AND HELPERS:

function apiURL(url: string): string {
  return `${process.env.REACT_APP_API_BASE_URL || ""}${url}`;
}

function get(url: string) {
  return fetch(apiURL(url), { headers: { accept: "application/json" } })
    .then(checkStatus)
    .then(verifyIsJson)
    .then(parseJSON);
}

async function verifyIsJson(response: Response) {
  const contentType = response.headers.get("Content-Type");
  if (contentType && /^application\/json/.test(contentType)) {
    return response;
  }
  const text = await response.text();
  const msg = `Expected JSON response but got ${contentType} from ${response.url}`;
  window.Rollbar.error(msg, {
    text,
    contentType,
    url: response.url,
  });
  throw new Error(msg);
}

function checkStatus(response: Response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  const error = new HTTPError(response);
  console.log(error); // eslint-disable-line no-console
  throw error;
}

class HTTPError extends Error {
  status: string;

  constructor(readonly response: Response) {
    super(`HTTP Error ${response.statusText}`);
    this.status = response.statusText;
  }
}

function parseJSON(response: Response) {
  return response.json();
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
