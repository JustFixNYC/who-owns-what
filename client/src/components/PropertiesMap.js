import React from 'react';
import DetailView from 'components/DetailView';
import APIClient from 'components/APIClient';
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
const DETAIL_OFFSET = 0.0001;

// compare using housenumber, streetname, boro convention
// TODO: switch to bbl
function compareAddrs(a, b) {
  return (a.housenumber === b.housenumber &&
          a.streetname === b.streetname &&
          a.boro === b.boro) ? true : false;
}


export default class PropertiesMap extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showDetailView: false,
      detailAddr: null,
      detailHasJustFixUsers: false
    };

    this.map = {
      mapCenter: [-73.96270751953125, 40.7127],
      mapZoom: [10],
      bounds: [[-74.259087, 40.477398], [-73.700172, 40.917576]],
      boundsOptions: { padding: {top:50, bottom: 100, left: 50, right: 50} }
    };


  }

  openDetailView = (addr) => {
    this.setState({
      showDetailView: true,
      detailAddr: addr
    });

    APIClient.searchForJFXUsers([addr.bbl]).then(res => {
      this.setState({
        detailHasJustFixUsers: res.hasJustFixUsers
      })
    });
  }

  closeDetailView = () => {
    this.setState({
      showDetailView: false,
      detailAddr: null
    });
  }

  render() {

    const light = 'mapbox://styles/dan-kass/cj5rsfld203472sqy1y0px42d';

    const mapUrl = light;
    let bounds = [];
    let mapProps = { style: mapUrl };
    let assocAddrs = [], userAddr = [], detailAddr = [];

    for(let i = 0; i < this.props.addrs.length; i++) {

      const addr = this.props.addrs[i];
      const pos = [parseFloat(addr.lng), parseFloat(addr.lat)];

      if(!MapHelpers.latLngIsNull(pos)) {

        // add to the bounds obj
        if(!this.state.showDetailView) bounds.push(pos);

        if(compareAddrs(addr, this.props.userAddr)) {
          userAddr.push(<Feature key={i} coordinates={pos} />);
        } else if(this.state.detailAddr && compareAddrs(addr, this.state.detailAddr)) {
          detailAddr.push(<Feature key={i} coordinates={pos} />);
        } else {
          assocAddrs.push(
            <Feature key={i} coordinates={pos} onClick={() => this.openDetailView(addr)} />
          );
        }
      }
    }

    // defaults
    if(!this.props.addrs.length) {
      mapProps.fitBounds = new MapboxGL.LngLatBounds(this.map.bounds);
      mapProps.center = mapProps.fitBounds.getCenter();

    // detail view
    } else if(this.state.detailAddr) {
      let minPos = [parseFloat(this.state.detailAddr.lng) - DETAIL_OFFSET, parseFloat(this.state.detailAddr.lat) - DETAIL_OFFSET];
      let maxPos = [parseFloat(this.state.detailAddr.lng) + DETAIL_OFFSET, parseFloat(this.state.detailAddr.lat) + DETAIL_OFFSET];
      mapProps.fitBounds = new MapboxGL.LngLatBounds([minPos, maxPos]);
      mapProps.fitBoundsOptions = { ...this.map.boundsOptions, maxZoom: 20, offset: [-125, 0] };

    // regular view
    } else {
      bounds = Helpers.uniq(bounds);
      bounds = bounds.length > 1 ? bounds : this.map.bounds;
      bounds = MapHelpers.getBoundingBox(bounds);
      mapProps.fitBounds = new MapboxGL.LngLatBounds(bounds);
      mapProps.fitBoundsOptions = this.map.boundsOptions;
    }

    return (
      <div className="PropertiesMap">
        <div className="PropertiesMap__map">
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
        { !this.state.showDetailView &&
          <div className="PropertiesMap__prompt">
            <p><i>(click on a building to view details)</i></p>
          </div>
        }
        <DetailView
          addr={this.state.detailAddr}
          hasJustFixUsers={this.state.detailHasJustFixUsers}
          userAddr={this.props.userAddr}
          showDetailView={this.state.showDetailView}
          handleCloseDetail={this.closeDetailView}
        />
      </div>

    );
  }
}
