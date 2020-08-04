process.env.REACT_APP_API_BASE_URL = "https://wowapi";

window.Rollbar = {
  error() {
    console.error.apply(this, arguments);
  },
};

require("jest-fetch-mock").enableMocks();
