import { getLoginMapImageUrl, LOGIN_MAP_HEIGHT, LOGIN_MAP_WIDTH } from "./LoginMap";

describe("getLoginMapImageUrl", () => {
  const originalToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

  afterEach(() => {
    process.env.REACT_APP_MAPBOX_ACCESS_TOKEN = originalToken;
  });

  it("builds a Mapbox static image URL for the building coordinates", () => {
    process.env.REACT_APP_MAPBOX_ACCESS_TOKEN = "test-token";
    const url = getLoginMapImageUrl(-73.993, 40.689);
    expect(url).toBe(
      `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+e31c3d(-73.993,40.689)/-73.993,40.689,15.25,0,0/${LOGIN_MAP_WIDTH}x${LOGIN_MAP_HEIGHT}@2x?access_token=test-token`
    );
  });

  it("returns undefined when the Mapbox token is missing", () => {
    delete process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
    expect(getLoginMapImageUrl(-73.993, 40.689)).toBeUndefined();
  });
});
