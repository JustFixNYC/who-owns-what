export const LOGIN_MAP_WIDTH = 464;
export const LOGIN_MAP_HEIGHT = 200;
const LOGIN_MAP_ZOOM = "15.25";
const LOGIN_MAPBOX_STYLE = "mapbox/streets-v12";

export const getLoginMapImageUrl = (lng: number, lat: number): string | undefined => {
  const accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
  if (!accessToken) return undefined;
  const longLat = `${lng},${lat}`;
  const marker = `pin-s+e31c3d(${longLat})`;
  return `https://api.mapbox.com/styles/v1/${LOGIN_MAPBOX_STYLE}/static/${marker}/${longLat},${LOGIN_MAP_ZOOM},0,0/${LOGIN_MAP_WIDTH}x${LOGIN_MAP_HEIGHT}@2x?access_token=${accessToken}`;
};
