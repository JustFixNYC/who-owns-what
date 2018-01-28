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
  'circle-stroke-width': 1.25,
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

// due to the wonky way react-mapboxgl works, we can't just specify a center/zoom combo
// instead we use this offset value to create a fake bounding box around the detail center point
// TODO: probably a non-hack way to do this?
// const DETAIL_OFFSET = 0.0007;
const DETAIL_OFFSET = 0.0015;

export default class PropertiesMap extends Component {
  constructor(props) {
    super(props);

    this.state = {
      mapLoading: true,
      mapRef: null
    }

    this.mapDefaults = {
      mapCenter: [-73.96270751953125, 40.7127],
      mapZoom: [20],
      bounds: [[-74.259087, 40.477398], [-73.700172, 40.917576]],
      boundsOptions: { padding: {top:50, bottom: 50, left: 200, right: 50} }
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if(!prevProps.isVisible && this.props.isVisible) {
      if(this.state.mapRef) this.state.mapRef.resize();
    }
  }

  handleMouseMove = (map, e) => {
      let features = map.queryRenderedFeatures(e.point, { layers: ["assoc"] });
      if(features.length) {
        map.getCanvas().style.cursor = 'pointer';
      } else {
        map.getCanvas().style.cursor = '';
      }
  }


  render() {
    const light = 'mapbox://styles/dan-kass/cj5rsfld203472sqy1y0px42d';
    const terminal = 'mapbox://styles/dan-kass/cj657o2qu601z2rqbp1jgiys5';
    const terminal2 = 'mapbox://styles/dan-kass/cj65hlk5v69z42rql5xtunc5s';
    const mapUrl = terminal;

    // defaults
    let bounds = new Set();
    let mapProps = {
      style: mapUrl,
      containerStyle: { width: '100%', height: '100%' },
      onStyleLoad: (map, _) => this.setState({ mapLoading: false, mapRef: map }),
      onMouseMove: (map, e) => this.handleMouseMove(map, e)
    };


    // cycle thru each addr and create a Feature for it
    let assocAddrs = [], selectedAddr = [];
    for(let i = 0; i < this.props.addrs.length; i++) {

      const addr = this.props.addrs[i];
      const pos = [parseFloat(addr.lng), parseFloat(addr.lat)];

      if(!MapHelpers.latLngIsNull(pos)) {

        // this is only used for the default, "portfolio" view
        bounds.add(pos);


        // else if(this.props.detailAddr && Helpers.addrsAreEqual(addr, this.props.detailAddr)) {
        //   detailAddr.push(<Feature key={i} coordinates={pos} />);
        // }

        let type;
        if(Helpers.addrsAreEqual(addr, this.props.userAddr)) {
          type = 'search';
        } else if(addr.hasjustfix) {
          type = 'justfix';
        } else {
          type = 'base';
        }

        if(this.props.detailAddr && Helpers.addrsAreEqual(addr, this.props.detailAddr)) {
          selectedAddr.push(<Feature key={i} properties={{ type: type }} coordinates={pos} />);
        } else {
          assocAddrs.push(
            <Feature key={i} coordinates={pos} properties={{ type: type }} onClick={() => this.props.onOpenDetail(addr)} />
          );
        }
      }
    }

    const dynamic_assoc_paint = {
      ...ASSOC_CIRCLE_PAINT,
      'circle-color': {
        property: 'type',
        type: 'categorical',
        default: '#acb3c2',
        stops: [
          ['base', '#FF9800'],
          ['justfix', '#0096d7'],
          ['search', '#FF5722']
        ]
      }
    };

    const dynamic_select_paint = {
      ...dynamic_assoc_paint,
      'circle-stroke-color': '#d6d6d6',
      'circle-opacity': 1
    };

    // defaults. this seems to be necessary to est a base state
    if(!this.props.addrs.length) {
      mapProps.fitBounds = new MapboxGL.LngLatBounds(this.mapDefaults.bounds);
      mapProps.center = mapProps.fitBounds.getCenter();

    // detail view
    // this displays after a detail click (so not the search address) OR if only 1 addr is returned
    // i.e. the search address is the only thing to look at
    } else if(this.props.detailAddr && (!Helpers.addrsAreEqual(this.props.detailAddr, this.props.userAddr) || this.props.addrs.length == 1)) {
      let minPos = [parseFloat(this.props.detailAddr.lng) - DETAIL_OFFSET, parseFloat(this.props.detailAddr.lat) - DETAIL_OFFSET];
      let maxPos = [parseFloat(this.props.detailAddr.lng) + DETAIL_OFFSET, parseFloat(this.props.detailAddr.lat) + DETAIL_OFFSET];
      mapProps.fitBounds = new MapboxGL.LngLatBounds([minPos, maxPos]);
      mapProps.fitBoundsOptions = { ...this.mapDefaults.boundsOptions, maxZoom: 20, offset: [-125, 0] };

    // regular view
    } else {
      bounds = Array.from(bounds);
      bounds = bounds.length > 1 ? bounds : this.mapDefaults.bounds;
      bounds = MapHelpers.getBoundingBox(bounds);
      mapProps.fitBounds = new MapboxGL.LngLatBounds(bounds);
      mapProps.fitBoundsOptions = { ...this.mapDefaults.boundsOptions, maxZoom: 20, offset: [-125, 0] };
    }

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
            <Layer id="assoc" type="circle" paint={dynamic_assoc_paint}>
              { assocAddrs }
            </Layer>
            <Layer id="selected" type="circle" paint={dynamic_select_paint}>
              { selectedAddr }
            </Layer>
          </Map>
          <div className="PropertiesMap__prompt">
            <p><i>(click on a building to view details)</i></p>
          </div>
        </div>
    );
  }
}
