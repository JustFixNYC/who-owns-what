export default class MapHelpers {
  // need to check if either lat or lng is NaN. Occurs for ~0.5% of addresses
  static latLngIsNull(latlng) {
    return latlng.filter(isNaN).length;
  }

  static getBoundingBox(latlngs) {
    let bs = {}, coords, latitude, longitude;

    for (let i = 0; i < latlngs.length; i++) {
      coords = latlngs[i];

      longitude = coords[0];
      latitude = coords[1];
      bs.xMin = bs.xMin < longitude ? bs.xMin : longitude;
      bs.xMax = bs.xMax > longitude ? bs.xMax : longitude;
      bs.yMin = bs.yMin < latitude ? bs.yMin : latitude;
      bs.yMax = bs.yMax > latitude ? bs.yMax : latitude;
    }

    return [[bs.xMin, bs.yMin],[bs.xMax, bs.yMax]];
  }
}
