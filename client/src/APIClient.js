/* eslint-disable no-undef */

function getContacts(q, cb) {
  return ajax(`api/contacts?housenum=${q.housenum}&streetname=${q.streetname}&boro=${q.boro}`, cb);
}

function getBizAddresses(q, cb) {
  return ajax(`api/bizaddresses?housenum=${q.housenum}&streetname=${q.streetname}&boro=${q.boro}`, cb);
}

function ajax(q, cb) {
  return fetch(q, { accept: "application/json" })
    .then(checkStatus)
    .then(parseJSON)
    .then(cb);
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
  getBizAddresses
};
export default Client;
