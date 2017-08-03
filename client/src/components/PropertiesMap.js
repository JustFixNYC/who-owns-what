import React from 'react';
import DetailView from 'components/DetailView';
import { CSSTransitionGroup } from 'react-transition-group';
import { Map, CircleMarker, Marker, TileLayer } from 'react-leaflet';
import { uniq } from 'util/helpers';

import L from 'leaflet';

import 'styles/PropertiesMap.css';
import 'leaflet/dist/leaflet.css';

// resolve import issues with marker assets from lefleat.css
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// compare using housenumber, streetname, boro convention
// TODO: switch to bbl
function compareAddrs(a, b) {
  return (a.housenumber === b.housenumber &&
          a.streetname === b.streetname &&
          a.boro === b.boro) ? true : false;
}

// need to check if either lat or lng is NaN. Occurs for ~0.5% of addresses
function latLngIsNull(latlng) {
  return latlng.filter(isNaN).length;
}

function SlideTransition(props) {
  return (
    <CSSTransitionGroup
      { ...props }
      component={FirstChild}
      transitionName="slide"
      transitionEnterTimeout={props.detailSlideLength}
      transitionLeaveTimeout={props.detailSlideLength}>
    </CSSTransitionGroup>
  );
}

// see: https://facebook.github.io/react/docs/animation.html#rendering-a-single-child
function FirstChild(props) {
  const childrenArray = React.Children.toArray(props.children);
  return childrenArray[0] || null;
}

function AssociatedAddrMarker(props) {
  return (
    <CircleMarker
        center={props.pos}
        radius={7.5}
        color={'#000000'}
        fillColor={props.isDetailAddr ? '#0096d7' : '#FFA500'}
        weight={1}
        fillOpacity={0.8}
        onClick={() => props.onClick(props.addr)}
      >
    </CircleMarker>
  );
}

export default class PropertiesMap extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      mapCenter: [40.7127, -73.96270751953125],
      mapZoom: 18,
      bounds: [[40.477398, -74.259087], [40.917576, -73.700172]],
      showDetailView: false,
      detailAddr: null
    };

    this.detailSlideLength = 300;
  }

  openDetailView = (addr) => {

    // very fancy stuff to make the map "animate" on slide
    let mapRefresh = setInterval(() => { this.refs.map.leafletElement.invalidateSize(); }, 30);
    setTimeout(() => { clearInterval(mapRefresh) }, this.detailSlideLength);

    this.setState({
      showDetailView: true,
      detailAddr: addr
    });
  }

  closeDetailView = () => {

    // very fancy stuff to make the map "animate" on slide
    let mapRefresh = setInterval(() => { this.refs.map.leafletElement.invalidateSize(); }, 30);
    setTimeout(() => { clearInterval(mapRefresh) }, this.detailSlideLength);

    this.setState({
      showDetailView: false,
      detailAddr: null
    });
  }

  render() {

    const light = 'https://api.mapbox.com/styles/v1/dan-kass/cj5rsfld203472sqy1y0px42d/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZGFuLWthc3MiLCJhIjoiY2lsZTFxemtxMGVpdnVoa3BqcjI3d3Q1cCJ9.IESJdCy8fmykXbb626NVEw';
    const stamen = 'http://a.tile.stamen.com/toner/{z}/{x}/{y}.png';

    const mapUrl = light;
    let mapCenter = this.state.mapCenter;
    let bounds = [];

    if(this.state.detailAddr) {
      mapCenter = [parseFloat(this.state.detailAddr.lat), parseFloat(this.state.detailAddr.lng)];
      bounds = null;
    }

    const addrs = this.props.addrs.map((addr, idx) => {

      let pos = [parseFloat(addr.lat), parseFloat(addr.lng)];

      if(!latLngIsNull(pos)) {

        // add to the bounds obj
        if(!this.state.showDetailView) bounds.push(pos);

        // users makrer or assoc marker?
        if(compareAddrs(addr, this.props.userAddr)) {
          return  <Marker key={idx} position={pos}></Marker>;
        } else {
          return (
                  <AssociatedAddrMarker
                    key={idx} pos={pos} addr={addr}
                    onClick={this.openDetailView}
                    isDetailAddr={this.state.detailAddr ? compareAddrs(addr,this.state.detailAddr) : false}
                  />
                );
        }
      } else {
        return ( null );
      }
    });

    if(bounds) {
      bounds = uniq(bounds);
      bounds = bounds.length > 1 ? bounds : this.state.bounds;
    }

    return (
      <div className="PropertiesMap">
        <div className="PropertiesMap__map">
          <Map ref="map"
            center={mapCenter}
            zoom={this.state.mapZoom}
            bounds={bounds}
            boundsOptions={{padding: [0, 0]}}
            onViewportChanged={this.handleViewportChanged}>
              <TileLayer
                url={mapUrl}
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              />
              { this.props.addrs.length && addrs}
          </Map>
        </div>
        { !this.state.showDetailView &&
          <div className="PropertiesMap__prompt">
            <p><i>(click on a building to view details)</i></p>
          </div>
        }
        <SlideTransition detailSlideLength={this.detailSlideLength}>
          { this.state.showDetailView &&
            <DetailView
              key={this.state.detailAddr}
              addr={this.state.detailAddr}
              userAddr={this.props.userAddr}
              handleCloseDetail={this.closeDetailView}
            />
          }
        </SlideTransition>
      </div>

    );
  }
}
