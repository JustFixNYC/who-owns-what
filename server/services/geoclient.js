const rp = require('request-promise'),
      Promise = require('bluebird');

const request = (type, params) => {
  const opts = {
    url: `https://api.cityofnewyork.us/geoclient/v1/${type}.json`,
    qs: {
      ...params,
      app_id: process.env.GEOCLIENT_ID,
      app_key: process.env.GEOCLIENT_KEY,
    },
    json: true
  }
  return rp(opts);
}

module.exports = {
  requestAddress: (addrQuery) => request('address', addrQuery),
  requestBBL: (bblQuery) => request('bbl', bblQuery)
};
