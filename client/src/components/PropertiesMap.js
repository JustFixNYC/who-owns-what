import React from 'react';
import ReactMapboxGl, { Layer, Feature, ZoomControl } from 'react-mapbox-gl';
import * as MapboxGL from 'mapbox-gl';
import Helpers from 'util/helpers';
import MapHelpers from 'util/mapping';

import 'styles/PropertiesMap.css';

const Map = ReactMapboxGl({
  accessToken: "pk.eyJ1IjoiZGFuLWthc3MiLCJhIjoiY2lsZTFxemtxMGVpdnVoa3BqcjI3d3Q1cCJ9.IESJdCy8fmykXbb626NVEw"
});

const BASE_CIRCLE = {
  'circle-stroke-width': 1,
  'circle-radius': 6,
  'circle-color': '#FFA500',
  'circle-opacity': 1,
  'circle-stroke-color': '#000000'
};

const ASSOC_CIRCLE_PAINT = {
  ...BASE_CIRCLE,
  'circle-opacity': 0.7
};

const DETAIL_CIRCLE_PAINT = {
  ...BASE_CIRCLE,
  'circle-color': '#FF8D00'
};

const USER_MARKER_PAINT = {
  ...BASE_CIRCLE,
  'circle-color': '#0096d7'
};

// due to the wonky way react-mapboxgl works, we can just specify a center/zoom combo
// instead we use this offset value to create a fake bounding box around the detail center point
// TODO: probably a non-hack way to do this?
const DETAIL_OFFSET = 0.0001;

// compare using housenumber, streetname, boro convention
// TODO: switch to bbl
function compareAddrs(a, b) {
  return (a.housenumber === b.housenumber &&
          a.streetname === b.streetname &&
          a.boro === b.boro) ? true : false;
}

const PropertiesMap = (props) => {

  const mapDefaults = {
    mapCenter: [-73.96270751953125, 40.7127],
    mapZoom: [10],
    bounds: [[-74.259087, 40.477398], [-73.700172, 40.917576]],
    boundsOptions: { padding: {top:50, bottom: 100, left: 50, right: 50} }
  };

  const light = 'mapbox://styles/dan-kass/cj5rsfld203472sqy1y0px42d';
  const mapUrl = light;

  let bounds = [];
  let mapProps = { style: mapUrl };
  let assocAddrs = [], userAddr = [], detailAddr = [];

  for(let i = 0; i < props.addrs.length; i++) {

    const addr = props.addrs[i];
    const pos = [parseFloat(addr.lng), parseFloat(addr.lat)];

    if(!MapHelpers.latLngIsNull(pos)) {

      // add to the bounds obj
      if(!props.detailAddr) bounds.push(pos);

      if(compareAddrs(addr, props.userAddr)) {
        userAddr.push(<Feature key={i} coordinates={pos} />);
      } else if(props.detailAddr && compareAddrs(addr, props.detailAddr)) {
        detailAddr.push(<Feature key={i} coordinates={pos} />);
      } else {
        assocAddrs.push(
          <Feature key={i} coordinates={pos} onClick={() => props.onOpenDetail(addr)} />
        );
      }
    }
  }

  // defaults
  if(!props.addrs.length) {
    mapProps.fitBounds = new MapboxGL.LngLatBounds(mapDefaults.bounds);
    mapProps.center = mapProps.fitBounds.getCenter();

  // detail view
  } else if(props.detailAddr) {
    let minPos = [parseFloat(props.detailAddr.lng) - DETAIL_OFFSET, parseFloat(props.detailAddr.lat) - DETAIL_OFFSET];
    let maxPos = [parseFloat(props.detailAddr.lng) + DETAIL_OFFSET, parseFloat(props.detailAddr.lat) + DETAIL_OFFSET];
    mapProps.fitBounds = new MapboxGL.LngLatBounds([minPos, maxPos]);
    mapProps.fitBoundsOptions = { ...mapDefaults.boundsOptions, maxZoom: 20, offset: [-125, 0] };

  // regular view
  } else {
    bounds = Helpers.uniq(bounds);
    bounds = bounds.length > 1 ? bounds : mapDefaults.bounds;
    bounds = MapHelpers.getBoundingBox(bounds);
    mapProps.fitBounds = new MapboxGL.LngLatBounds(bounds);
    mapProps.fitBoundsOptions = mapDefaults.boundsOptions;
  }

  return (
    <div className="PropertiesMap">
      <Map { ...mapProps }>
        <ZoomControl position="topLeft" style={{
            'boxShadow': 'none',
            'opacity': 1,
            'backgroundColor': '#ffffff',
            'borderColor': '#727e96'
          }} />
        <Layer type="circle" paint={ASSOC_CIRCLE_PAINT}>
          { assocAddrs }
        </Layer>
        <Layer type="circle" paint={DETAIL_CIRCLE_PAINT}>
          { detailAddr }
        </Layer>
        <Layer type="circle" paint={USER_MARKER_PAINT}>
          { userAddr }
        </Layer>
      </Map>
    </div>
  );
}
export default PropertiesMap;
