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
    property: 'mapType',
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
      addrsBounds: [[]],  // bounds are represented as a 2d array of lnglats
      assocAddrs: [],    // array of Features
      mapProps: {
        style: MAP_STYLE,
        containerStyle: { width: '100%', height: '100%' },
        onStyleLoad: (map, _) => this.setState({ mapLoading: false, mapRef: map }),
        onMouseMove: (map, e) => this.handleMouseMove(map, e),
        fitBounds: [[-74.259087, 40.477398], [-73.700172, 40.917576]],
        fitBoundsOptions: { padding: {top:50, bottom: 50, left: 200, right: 50 }, maxZoom: 20, offset: [-125, 0] }
      }
    }

    // defaults
    // this.mapProps = {
    //   style: MAP_STYLE,
    //   containerStyle: { width: '100%', height: '100%' },
    //   onStyleLoad: (map, _) => this.setState({ mapLoading: false, mapRef: map }),
    //   onMouseMove: (map, e) => this.handleMouseMove(map, e),
    //   fitBounds: [[-74.259087, 40.477398], [-73.700172, 40.917576]],
    //   fitBoundsOptions: { padding: {top:50, bottom: 50, left: 200, right: 50 }, maxZoom: 20, offset: [-125, 0] }
    // };
  }

  componentWillReceiveProps(nextProps) {

    // addrs are being populated for the first time, so lets initialize things
    if(!this.props.addrs.length && nextProps.addrs.length) {

      // set of addr positions to determine custom bounds
      let addrsPos = new Set();
      let newAssocAddrs = [];

      // if there aren't enough addrs to build a bounding box,
      // just use the default one
      if(nextProps.addrs.length === 1) {
        this.setState({ addrsBounds: this.state.mapProps.fitBounds });
        return;
      }

      // cycle through addrs, adding them to the set and categorizing them
      nextProps.addrs.map((addr, i) => {

        const pos = [parseFloat(addr.lng), parseFloat(addr.lat)];

        if(!MapHelpers.latLngIsNull(pos)) {
          addrsPos.add(pos);

          // presuming that nextProps.userAddr is in sync with nextProps.addrs
          if(Helpers.addrsAreEqual(addr, nextProps.userAddr)) {
            addr.mapType = 'search';
          } else if(addr.hasjustfix) {
            addr.mapType = 'justfix';
          } else {
            addr.mapType = 'base';
          }
        }

        // push a new Feature for the map
        newAssocAddrs.push(
          <Feature key={i}
            coordinates={pos}
            properties={{ mapType: addr.mapType }}
            onClick={(e) => this.handleAddrSelect(addr, e)}
          />
        );

        return addr;
      });

      // see getBoundingBox() for deets
      const newAddrsBounds = MapHelpers.getBoundingBox(Array.from(addrsPos));

      // sets things up, including initial portfolio level map view
      this.setState({
        addrsBounds: newAddrsBounds,
        assocAddrs: newAssocAddrs
        // ,
        // mapProps: {
        //   ...this.state.mapProps,
        //   fitBounds: newAddrsBounds
        // }
      }, () => {
        // yeah, this sucks, but it seems to be more consistent with
        // getting mapbox to render properly. essentially wait another cycle before
        // reframing the map
        this.setState({
          mapProps: {
            ...this.state.mapProps,
            fitBounds: this.state.addrsBounds
          }
        });
      });
    }

    // reset map to portfolio level if we're removing the detailAddr
    if(this.props.detailAddr && !nextProps.detailAddr) {
      this.setState({
        mapProps: {
          ...this.state.mapProps,
          fitBounds: this.state.addrsBounds
        }
      });
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

  handleAddrSelect = (addr, e) => {

    // build a bounding box around our new detail addr
    let minPos = [parseFloat(addr.lng) - DETAIL_OFFSET, parseFloat(addr.lat) - DETAIL_OFFSET];
    let maxPos = [parseFloat(addr.lng) + DETAIL_OFFSET, parseFloat(addr.lat) + DETAIL_OFFSET];
    this.setState({ mapProps: {
      ...this.state.mapProps,
      fitBounds: [minPos, maxPos]
    }});

    this.props.onOpenDetail(addr);
  }


  render() {
    return (
        <div className="PropertiesMap">
          <Loader loading={this.state.mapLoading} classNames="Loader-map">Loading</Loader>
          <Map { ...this.state.mapProps }>
            <ZoomControl position="topLeft" style={{
                'boxShadow': 'none',
                'opacity': 1,
                'backgroundColor': '#ffffff',
                'borderColor': '#727e96',
                'top': '10px',
                'left': '10px'
              }} />
            <Layer id="assoc" type="circle" paint={DYNAMIC_ASSOC_PAINT}>
              {this.state.assocAddrs.length && this.state.assocAddrs }
            </Layer>
            <Layer id="selected" type="circle" paint={DYNAMIC_SELECTED_PAINT}>
              {/*
                we need to lookup the property pe of this feature from the main addrs array
                this affects the color of the marker while still outlining it as "selected"
                */}
              { this.props.detailAddr && (
                <Feature
                  properties={{ mapType: this.props.addrs.find(a => Helpers.addrsAreEqual(a,this.props.detailAddr)).mapType }}
                  coordinates={[parseFloat(this.props.detailAddr.lng), parseFloat(this.props.detailAddr.lat)]} />
              )}
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
