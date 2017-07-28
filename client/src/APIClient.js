/* eslint-disable no-undef */

function getContacts(q) {
  return get(`api/contacts?housenumber=${q.housenumber}&streetname=${q.streetname}&boro=${q.boro}`);
}

function getLandlords(q) {
  return get(`api/landlord?housenumber=${q.housenumber}&streetname=${q.streetname}&boro=${q.boro}`);
}

function searchForJFXUsers(bbls) {
  return post('https://beta.justfix.nyc/api/data/bblslookup', { bbls: bbls });
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
  getContacts,
  getLandlords,
  searchForJFXUsers
};
export default Client;
