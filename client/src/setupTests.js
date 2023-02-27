process.env.REACT_APP_API_BASE_URL = "https://wowapi";
process.env.REACT_APP_AUTH_SERVER_BASE_URL = "https://jfauth";

require("jest-fetch-mock").enableMocks();

// NOTE: there is some piece of the MapBox GL library that doesn't mesh well with our Jest testing platform.
// Therefore, to fix this, we needed to "mock" this function here so Jest stops complaining.
// Read more: https://github.com/mapbox/mapbox-gl-js/issues/3436#issuecomment-421117409
window.URL.createObjectURL = function () {};
