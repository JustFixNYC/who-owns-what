/* eslint-disable no-undef */
function searchAddress(q) {
  return get(`/api/address?houseNumber=${q.housenumber}&street=${q.streetname}&borough=${q.boro}`);
}

function searchBBL(q) {
  return get(`/api/address?block=${q.block}&lot=${q.lot}&borough=${q.boro}`);
}

function getAggregate(bbl) {
  return get(`/api/address/aggregate?bbl=${bbl}`);
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

const Client = {
  searchAddress,
  searchBBL,
  getAggregate,
  getAddressExport
};
export default Client;
