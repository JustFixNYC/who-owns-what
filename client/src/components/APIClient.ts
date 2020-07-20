import {
  SearchResults,
  SummaryResults,
  BuildingInfoResults,
  IndicatorsHistoryResults,
  WithBoroBlockLot,
} from "./APIDataTypes";
import { SearchAddress } from "./AddressSearch";

// API REQUESTS TO THE DATABASE:

function searchForAddress(q: SearchAddress): Promise<SearchResults> {
  if (q.bbl) {
    return searchForBBL({
      boro: q.bbl.slice(0, 1),
      block: q.bbl.slice(1, 6),
      lot: q.bbl.slice(6, 10),
    });
  }
  return get(`/api/address?houseNumber=${q.housenumber}&street=${q.streetname}&borough=${q.boro}`);
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

function getIndicatorHistory(bbl: string): Promise<IndicatorsHistoryResults> {
  return get(`/api/address/indicatorhistory?bbl=${bbl}`);
}

function getAddressExport(q: SearchAddress & WithBoroBlockLot) {
  return fetch(
    `/api/address/export?houseNumber=${q.housenumber}&street=${q.streetname}&borough=${q.boro}`
  ).then(checkStatus);
}

// OTHER API FUNCTIONS AND HELPERS:

function get(url: string) {
  return fetch(url, { headers: { accept: "application/json" } })
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
  searchForBBL,
  getAggregate,
  getBuildingInfo,
  getIndicatorHistory,
  getAddressExport,
};

export default Client;
