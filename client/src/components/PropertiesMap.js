import React, { Component } from 'react';
import ReactMapboxGl, { Layer, Feature, ZoomControl } from 'react-mapbox-gl';
import * as MapboxGL from 'mapbox-gl';
import Helpers from 'util/helpers';
import MapHelpers from 'util/mapping';

import Loader from 'components/Loader';

import 'styles/PropertiesMap.css';

const Map = ReactMapboxGl({
  accessToken: 'pk.eyJ1IjoiZGFuLWthc3MiLCJhIjoiY2lsZTFxemtxMGVpdnVoa3BqcjI3d3Q1cCJ9.IESJdCy8fmykXbb626NVEw'
});

const BASE_CIRCLE = {
  'circle-stroke-width': 1,
  'circle-radius': 6,
  'circle-color': '#FF9800',
  'circle-opacity': 1,
  'circle-stroke-color': '#000000'
};

const ASSOC_CIRCLE_PAINT = {
  ...BASE_CIRCLE,
  'circle-opacity': 0.8
};

const DETAIL_CIRCLE_PAINT = {
  ...BASE_CIRCLE,
  'circle-color': '#FF5722'
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
  // return (a.housenumber === b.housenumber &&
  //         a.streetname === b.streetname &&
  //         a.boro === b.boro) ? true : false;
  return (a.bbl === b.bbl) ? true : false;
}

export default class PropertiesMap extends Component {
  constructor(props) {
    super(props);

    this.state = {
      mapLoading: true
    }

    this.mapDefaults = {
      mapCenter: [-73.96270751953125, 40.7127],
      mapZoom: [10],
      bounds: [[-74.259087, 40.477398], [-73.700172, 40.917576]],
      boundsOptions: { padding: {top:50, bottom: 100, left: 50, right: 50} }
    };
  }

  handleMapLoad = () => {
    this.setState({
      mapLoading: false
    });
  }

  render() {
    const light = 'mapbox://styles/dan-kass/cj5rsfld203472sqy1y0px42d';
    const terminal = 'mapbox://styles/dan-kass/cj657o2qu601z2rqbp1jgiys5';
    const terminal2 = 'mapbox://styles/dan-kass/cj65hlk5v69z42rql5xtunc5s';
    const mapUrl = terminal;

    let bounds = [];
    let mapProps = {
      style: mapUrl,
      onStyleLoad: this.handleMapLoad
    };

    let assocAddrs = [], userAddr = [], detailAddr = [];

    for(let i = 0; i < this.props.addrs.length; i++) {

      const addr = this.props.addrs[i];
      const pos = [parseFloat(addr.lng), parseFloat(addr.lat)];

      if(!MapHelpers.latLngIsNull(pos)) {

        // add to the bounds obj
        if(!this.props.detailAddr) bounds.push(pos);

        if(compareAddrs(addr, this.props.userAddr)) {
          userAddr.push(<Feature key={i} coordinates={pos} />);
        } else if(this.props.detailAddr && compareAddrs(addr, this.props.detailAddr)) {
          detailAddr.push(<Feature key={i} coordinates={pos} />);
        } else {
          assocAddrs.push(
            <Feature key={i} coordinates={pos} onClick={() => this.props.onOpenDetail(addr)} />
          );
        }
      }
    }

    // defaults
    if(!this.props.addrs.length) {
      mapProps.fitBounds = new MapboxGL.LngLatBounds(this.mapDefaults.bounds);
      mapProps.center = mapProps.fitBounds.getCenter();

    // detail view
    } else if(this.props.detailAddr) {
      let minPos = [parseFloat(this.props.detailAddr.lng) - DETAIL_OFFSET, parseFloat(this.props.detailAddr.lat) - DETAIL_OFFSET];
      let maxPos = [parseFloat(this.props.detailAddr.lng) + DETAIL_OFFSET, parseFloat(this.props.detailAddr.lat) + DETAIL_OFFSET];
      mapProps.fitBounds = new MapboxGL.LngLatBounds([minPos, maxPos]);
      mapProps.fitBoundsOptions = { ...this.mapDefaults.boundsOptions, maxZoom: 20, offset: [-125, 0] };

    // regular view
    } else {
      bounds = Helpers.uniq(bounds);
      bounds = bounds.length > 1 ? bounds : this.mapDefaults.bounds;
      bounds = MapHelpers.getBoundingBox(bounds);
      mapProps.fitBounds = new MapboxGL.LngLatBounds(bounds);
      mapProps.fitBoundsOptions = this.mapDefaults.boundsOptions;
    }

    // <Loader loading={mapLoading} classNames={"Loader-map"}>


    return (
        <div className="PropertiesMap">
          <Loader loading={this.state.mapLoading} classNames="Loader-map">Loading</Loader>
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
}
