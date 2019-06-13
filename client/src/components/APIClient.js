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

function getSaleHistory(bbl) {
  return get(`/api/address/salehistory?bbl=${bbl}`);
}

function getViolsHistory(bbl) {
  return get(`/api/address/violshistory?bbl=${bbl}`);
}

function getComplaintsHistory(bbl) {
  return get(`/api/address/complaintshistory?bbl=${bbl}`);
}

function getPermitsHistory(bbl) {
  return get(`/api/address/permitshistory?bbl=${bbl}`);
}

function getAddressExport(q) {
  return fetch(`/api/address/export?houseNumber=${q.housenumber}&street=${q.streetname}&borough=${q.boro}`)
    .then(checkStatus);
}

function get(url) {
  return fetch(url, { accept: "application/json" })
    .then(checkStatus)
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
    .then(parseJSON);
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
  getSaleHistory,
  getViolsHistory,
  getComplaintsHistory,
  getPermitsHistory,
  getAddressExport,
  postNewSubscriber
};

export default Client;


