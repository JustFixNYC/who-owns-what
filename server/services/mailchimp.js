// NOTE: This Server export is deprecated! 
// We will be removing from the codebase soon.

const rp = require("request-promise");
const rollbar = require("rollbar");

const API_KEY = process.env.MAILCHIMP_API_KEY || "";

if (!API_KEY) {
  console.warn("WARNING: MAILCHIMP_API_KEY is not defined, so mailchimp integration will fail.");
}

// region is the last 4 characters of the api key: usXX
const REGION = API_KEY.substr(-4, API_KEY.length - 1);
const API_URL = `https://${REGION}.api.mailchimp.com/3.0`;

module.exports = {
  subscribe: (email, listName) => {
    const data = {
      email_address: email,
      status: "subscribed",
    };

    const opts = {
      method: "POST",
      uri: `${API_URL}/lists/${listName}/members`,
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`apikey:${API_KEY}`).toString("base64")}`,
      },
      body: data,
      json: true,
    };

    return rp(opts);
  },
};
