export type LatLng = [number, number];

export type BoundingBox = [LatLng, LatLng];

export default {
  // need to check if either lat or lng is NaN. Occurs for ~0.5% of addresses
  latLngIsNull(latlng: LatLng): boolean {
    return latlng.filter(isNaN).length > 0;
  },

  getBoundingBox(latlngs: LatLng[], defaultBox: BoundingBox): BoundingBox {
    if (latlngs.length === 0) {
      return defaultBox;
    }

    let bs = {
      xMin: Infinity,
      yMin: Infinity,
      xMax: -Infinity,
      yMax: -Infinity,
    };
    let coords, latitude, longitude;

    for (let i = 0; i < latlngs.length; i++) {
      coords = latlngs[i];

      longitude = coords[0];
      latitude = coords[1];
      bs.xMin = bs.xMin < longitude ? bs.xMin : longitude;
      bs.xMax = bs.xMax > longitude ? bs.xMax : longitude;
      bs.yMin = bs.yMin < latitude ? bs.yMin : latitude;
      bs.yMax = bs.yMax > latitude ? bs.yMax : latitude;
    }

    return [
      [bs.xMin, bs.yMin],
      [bs.xMax, bs.yMax],
    ];
  },

  hasWebGLContext(): boolean {
    var canvas = document.createElement("canvas");
    // Get WebGLRenderingContext from canvas element.
    var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    // Report the result.
    if (gl && gl instanceof WebGLRenderingContext) {
      // alert("Congratulations! Your browser supports WebGL.");
      return true;
    } else {
      // alert("Your browser or device may not support WebGL.");
      return false;
    }
  },
};
