const rp = require('request-promise'),
      Promise = require('bluebird');

module.exports = {
  request: (housenumber, streetname, boro) => {

    const opts = {
      url: 'https://api.cityofnewyork.us/geoclient/v1/address.json',
      qs: {
        street: streetname,
        houseNumber: housenumber,
        borough: boro,
        app_id: process.env.GEOCLIENT_ID,
        app_key: process.env.GEOCLIENT_KEY,
      },
      json: true
    }
    
    return rp(opts);
  }
};
