/* eslint-disable no-undef */

function searchAddress(q) {
  if (q.bbl) {
    return searchBBL({
      boro: q.bbl.slice(0,1),
      block: q.bbl.slice(1,6),
      lot: q.bbl.slice(6,10)
    });
  }
  return get(`/api/address?houseNumber=${q.housenumber}&street=${q.streetname}&borough=${q.boro}`);
}

function searchBBL(q) {
  return get(`/api/address?block=${q.block}&lot=${q.lot}&borough=${q.boro}`);
}

function getAggregate(bbl) {
  return get(`/api/address/aggregate?bbl=${bbl}`);
}

function getBuildingInfo(bbl) {
  return get(`/api/address/buildinginfo?bbl=${bbl}`);
}

function getSaleHistory(bbl) {
  return get(`/api/address/salehistory?bbl=${bbl}`);
}

function getIndicatorHistory(bbl) {
  return get(`/api/address/indicatorhistory?bbl=${bbl}`);
}

function getAddressExport(q) {
  return fetch(`/api/address/export?houseNumber=${q.housenumber}&street=${q.streetname}&borough=${q.boro}`)
    .then(checkStatus);
}

function get(url) {
  return fetch(url, { accept: "application/json" })
    .then(checkStatus)
    .then(verifyIsJson)
    .then(parseJSON);
}

function post(url, body, cb) {
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

/**
 * @param {Response} response 
 */
async function verifyIsJson(response) {
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

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  const error = new Error(`HTTP Error ${response.statusText}`);
  error.status = response.statusText;
  error.response = response;
  console.log(error); // eslint-disable-line no-console
  throw error;
}

function parseJSON(response) {
  return response.json();
}

/* Mailchimp */

function postNewSubscriber(email, list) {
  return post('/api/subscribe', { email, list });
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


