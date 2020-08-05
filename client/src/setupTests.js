process.env.REACT_APP_API_BASE_URL = "https://wowapi";

window.Rollbar = {
  error() {
    console.error.apply(this, arguments);
  },
};

require("jest-fetch-mock").enableMocks();

// We need to "mock" this function here as Jest doesn't work well with MapBox GL.
// Read more here: https://github.com/mapbox/mapbox-gl-js/issues/3436#issuecomment-421117409
window.URL.createObjectURL = function () {};
