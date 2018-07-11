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

const MAP_STYLE = 'mapbox://styles/dan-kass/cj657o2qu601z2rqbp1jgiys5';

const BASE_CIRCLE = {
  'circle-stroke-width': 1.25,
  'circle-radius': 6,
  'circle-color': '#FF9800',
  'circle-opacity': 0.8,
  'circle-stroke-color': '#000000'
};

const DYNAMIC_ASSOC_PAINT = {
  ...BASE_CIRCLE,
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

const DYNAMIC_SELECTED_PAINT = {
  ...DYNAMIC_ASSOC_PAINT,
  'circle-stroke-color': '#d6d6d6',
  'circle-opacity': 1
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
      mapRef: null,
      addrsBounds: [[]]  // bounds are represented as a 2-dim array of lnglats
    }

    // defaults
    this.mapProps = {
      style: MAP_STYLE,
      containerStyle: { width: '100%', height: '100%' },
      onStyleLoad: (map, _) => this.setState({ mapLoading: false, mapRef: map }),
      onMouseMove: (map, e) => this.handleMouseMove(map, e),
      fitBounds: [[-74.259087, 40.477398], [-73.700172, 40.917576]],
      fitBoundsOptions: { padding: {top:50, bottom: 50, left: 200, right: 50}, maxZoom: 20, offset: [-125, 0] }
    };
  }

  componentWillReceiveProps(nextProps) {

    let addrsPos = new Set();

    if(!this.props.addrs.length && nextProps.addrs.length) {

      // if there aren't enough addrs to build a bounding box,
      // just use the default one
      if(nextProps.addrs.length === 1) {
        this.setState({ addrsBounds: this.mapProps.fitBounds });
        return;
      }

      // build a set of lnglats so we can calculate bounds
      for(let i = 0; i < nextProps.addrs.length; i++) {
        const addr = nextProps.addrs[i];
        const pos = [parseFloat(addr.lng), parseFloat(addr.lat)];

        if(!MapHelpers.latLngIsNull(pos)) {
          addrsPos.add(pos);
        }
      }

      // see getBoundingBox() for deets
      const newAddrsBounds = MapHelpers.getBoundingBox(Array.from(addrsPos));
      this.setState({ addrsBounds: newAddrsBounds });
    }

  }

  componentDidUpdate(prevProps, prevState) {
    // is this necessary?
    // meant to reconfigure after bring the tab back in focus
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

    // defaults
    let mapProps = this.mapProps;
    let assocAddrs = [], selectedAddr = [];


    if(this.props.addrs.length) {
      // cycle thru each addr and create a Feature for it

      for(let i = 0; i < this.props.addrs.length; i++) {

        const addr = this.props.addrs[i];
        const pos = [parseFloat(addr.lng), parseFloat(addr.lat)];

        if(!MapHelpers.latLngIsNull(pos)) {

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

      // detail view
      // this displays after a detail click (so not the search address) OR if only 1 addr is returned
      // i.e. the search address is the only thing to look at
      if(this.props.detailAddr && (!Helpers.addrsAreEqual(this.props.detailAddr, this.props.userAddr) || this.props.addrs.length == 1)) {
        let minPos = [parseFloat(this.props.detailAddr.lng) - DETAIL_OFFSET, parseFloat(this.props.detailAddr.lat) - DETAIL_OFFSET];
        let maxPos = [parseFloat(this.props.detailAddr.lng) + DETAIL_OFFSET, parseFloat(this.props.detailAddr.lat) + DETAIL_OFFSET];
        mapProps.fitBounds = [minPos, maxPos];

      // regular view
      } else {
        mapProps.fitBounds = this.state.addrsBounds;
      }
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
            <Layer id="assoc" type="circle" paint={DYNAMIC_ASSOC_PAINT}>
              { assocAddrs }
            </Layer>
            <Layer id="selected" type="circle" paint={DYNAMIC_SELECTED_PAINT}>
              { selectedAddr }
            </Layer>
          </Map>
          <div className="PropertiesMap__legend">
            <p>Legend</p>
            <ul>
              <li>your address</li>
              <li>associated building</li>
              <li>assoc. building w/ JustFix case</li>
            </ul>
          </div>
          <div className="PropertiesMap__prompt">
            <p><i>(click on a building to view details)</i></p>
          </div>
        </div>
    );
  }
}
