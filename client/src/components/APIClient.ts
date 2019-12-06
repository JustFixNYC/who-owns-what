/* eslint-disable no-undef */

type WithBoroBlockLot = {
  boro: string,
  block: string,
  lot: string,
};

type Q = {
  bbl?: string,
  housenumber: string,
  streetname: string,
} & WithBoroBlockLot;

function searchAddress(q: Q) {
  if (q.bbl) {
    return searchBBL({
      boro: q.bbl.slice(0,1),
      block: q.bbl.slice(1,6),
      lot: q.bbl.slice(6,10)
    });
  }
  return get(`/api/address?houseNumber=${q.housenumber}&street=${q.streetname}&borough=${q.boro}`);
}

function searchBBL(q: WithBoroBlockLot) {
  return get(`/api/address?block=${q.block}&lot=${q.lot}&borough=${q.boro}`);
}

function getAggregate(bbl: string) {
  return get(`/api/address/aggregate?bbl=${bbl}`);
}

function getBuildingInfo(bbl: string) {
  return get(`/api/address/buildinginfo?bbl=${bbl}`);
}

function getSaleHistory(bbl: string) {
  return get(`/api/address/salehistory?bbl=${bbl}`);
}

function getIndicatorHistory(bbl: string) {
  return get(`/api/address/indicatorhistory?bbl=${bbl}`);
}

function getAddressExport(q: Q) {
  return fetch(`/api/address/export?houseNumber=${q.housenumber}&street=${q.streetname}&borough=${q.boro}`)
    .then(checkStatus);
}

function get(url: string) {
  return fetch(url, { headers: { accept: "application/json" } })
    .then(checkStatus)
    .then(verifyIsJson)
    .then(parseJSON);
}

function post(url: string, body: any) {
  return fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      mode: 'cors',
      body: JSON.stringify(body)
    })
    .then(checkStatus)
    .then(verifyIsJson)
    .then(parseJSON);
}

async function verifyIsJson(response: Response) {
  const contentType = response.headers.get('Content-Type');
  if (contentType && /^application\/json/.test(contentType)) {
    return response;
  }
  const text = await response.text();
  const msg = `Expected JSON response but got ${contentType} from ${response.url}`;
  window.Rollbar.error(msg, {
    text,
    contentType,
    url: response.url
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

/* Mailchimp */

function postNewSubscriber(email: string) {
  return post('/api/subscribe', { email });
}

const Client = {
  searchAddress,
  searchBBL,
  getAggregate,
  getBuildingInfo,
  getSaleHistory,
  getIndicatorHistory,
  getAddressExport,
  postNewSubscriber
};

export default Client;


