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

// const ASSOC_CIRCLE_LAYOUT = {
//   ''
// }

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
const DETAIL_OFFSET = 0.0007;

export default class PropertiesMap extends Component {
  constructor(props) {
    super(props);

    this.state = {
      mapLoading: true
    }

    this.mapDefaults = {
      mapCenter: [-73.96270751953125, 40.7127],
      mapZoom: [20],
      bounds: [[-74.259087, 40.477398], [-73.700172, 40.917576]],
      boundsOptions: { padding: {top:50, bottom: 50, left: 200, right: 50} }
    };
  }

  handleMapLoad = () => {
    this.setState({
      mapLoading: false
    });
  }

  handleMouseMove = (map, e) => {
      let features = map.queryRenderedFeatures(e.point, { layers: ["layer-1"] });
      // console.log(features);
      if(features.length) {
        map.getCanvas().style.cursor = 'pointer';
      } else {
        map.getCanvas().style.cursor = '';
      }
      //
      //
      // let mousein = this.state.mousein;
      // if (!cluster.length) {
      //     map.getCanvas().style.cursor = '';
      //     mousein = false;
      // } else if (!mousein) {
      //
      //     mousein = true;
      //     // var pointsInCluster = this.props.cams.items.filter((f) => {
      //     //     var pointPixels = map.project([f.lng, f.lat])
      //     //     var pixelDistance = Math.sqrt(
      //     //         Math.pow(e.point.x - pointPixels.x, 2) +
      //     //         Math.pow(e.point.y - pointPixels.y, 2)
      //     //     );
      //     // return Math.abs(pixelDistance) <= 50;
      //     // });
      //     // //this.setState({hidden: false});
      //     // console.log(cluster, pointsInCluster);
      // }
      // if (mousein !== this.state.mousein) {
      //     console.log(mousein);
      //     this.setState({mousein: mousein});
      // }
  }

  render() {
    const light = 'mapbox://styles/dan-kass/cj5rsfld203472sqy1y0px42d';
    const terminal = 'mapbox://styles/dan-kass/cj657o2qu601z2rqbp1jgiys5';
    const terminal2 = 'mapbox://styles/dan-kass/cj65hlk5v69z42rql5xtunc5s';
    const mapUrl = terminal;

    let bounds = new Set();
    let mapProps = {
      style: mapUrl,
      onStyleLoad: () => this.setState({ mapLoading: false }),
      onMouseMove: (map, e) => this.handleMouseMove(map, e)
    };

    let assocAddrs = [], userAddr = [], detailAddr = [];

    for(let i = 0; i < this.props.addrs.length; i++) {

      const addr = this.props.addrs[i];
      const pos = [parseFloat(addr.lng), parseFloat(addr.lat)];

      if(!MapHelpers.latLngIsNull(pos)) {

        bounds.add(pos);

        if(Helpers.addrsAreEqual(addr, this.props.userAddr)) {
          userAddr.push(<Feature key={i} coordinates={pos} />);
        } else if(this.props.detailAddr && Helpers.addrsAreEqual(addr, this.props.detailAddr)) {
          detailAddr.push(<Feature key={i} coordinates={pos} />);
        } else {
          assocAddrs.push(
            <Feature key={i} coordinates={pos} properties={{ mapdatapoint: addr.evictions }} onClick={() => this.props.onOpenDetail(addr)} />
            // <Feature key={i} coordinates={pos} properties={{ mapdatapoint: addr.openviolations }} onClick={() => this.props.onOpenDetail(addr)} />
          );
        }
      }
    }

    let vMin = 0, vMax = 0;
    let eMin = 0, eMax = 0;
    if(this.props.addrs.length > 1) {
      let openviolations = this.props.addrs.map(a => (a.openviolations / a.unitsres)).filter(isFinite);
      vMax = Math.max(...openviolations);
      vMin = Math.min(...openviolations);

      // let evictions = this.props.addrs.map(a => (a.evictions / a.unitsres)).filter(isFinite);
      let evictions = this.props.addrs.map(a => a.evictions).filter(isFinite);
      eMax = Math.max(...evictions);
      eMin = Math.min(...evictions);
    }

    const dynamic_assoc_paint = {
      ...ASSOC_CIRCLE_PAINT,
      'circle-color': {
        property: 'mapdatapoint',
        default: '#acb3c2',
        stops: [
          // [vMin, '#fde0dd'],
          // [(vMax-vMin)/2, '#fa9fb5'],
          // [vMax, '#c51b8a']

          [eMin, '#fde0dd'],
          [(eMax-eMin)/2, '#fa9fb5'],
          [eMax, '#c51b8a']


          // [vMin, '#f7fcb9'],
          // [(vMax-vMin)/2, '#addd8e'],
          // [vMax, '#31a354']




        ]
      }
    };


    // defaults
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
            <Layer type="circle" paint={dynamic_assoc_paint}>
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
