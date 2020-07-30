import {
  SearchResults,
  SummaryResults,
  BuildingInfoResults,
  IndicatorsHistoryResults,
  WithBoroBlockLot,
} from "./APIDataTypes";
import { SearchAddress } from "./AddressSearch";
import { GeoSearchRequester } from "@justfixnyc/geosearch-requester";

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
  console.log("searching for", addr);

  return new Promise<SearchResults>((resolve, reject) => {
    const req = new GeoSearchRequester({
      onError: reject,
      onResults(results) {
        const firstResult = results.features[0];
        if (!firstResult) return resolve({
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

function getIndicatorHistory(bbl: string): Promise<IndicatorsHistoryResults> {
  return get(`/api/address/indicatorhistory?bbl=${bbl}`);
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
