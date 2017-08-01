import React from 'react';
import { Map, CircleMarker, Marker, TileLayer } from 'react-leaflet';
import { CSSTransitionGroup } from 'react-transition-group';
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
};

function AssociatedAddrMarker(props) {
  return (
    <CircleMarker
        center={props.pos}
        radius={7.5}
        color={props.isDetailAddr ? '#0096d7' : '#FFA500'}
        weight={2}
        fillOpacity={0.8}
        onClick={() => props.onClick(props.addr)}
      >
    </CircleMarker>
  );
}

function DetailView(props) {
  return (
    <div className="PropertiesMap__detail">
      <div className="card">
        <div className="card-image">
          <img src={`https://maps.googleapis.com/maps/api/streetview?size=960x300&location=${props.addr.lat},${props.addr.lng}&key=AIzaSyCJKZm-rRtfREo2o-GNC-feqpbSvfHNB5s`} alt="Google Street View" className="img-responsive"  />
        </div>
        <div className="card-header">
          <h4 className="card-title">{props.addr.housenumber} {props.addr.streetname}</h4>
        </div>
        <div className="card-body">
          This property is also registered at <b>{props.addr.assocRba}</b>.
          <br />
          <br />
          <b>Corporate Owners:</b>
          <ul>
            {props.addr.corpnames.map((corp, idx) => <li key={idx}>{corp}</li> )}
          </ul>
          <b>Owners:</b>
          <ul>
            {props.addr.ownernames.map((owner, idx) => <li key={idx}>{owner.title.split(/(?=[A-Z])/).join(" ")}: {owner.value}</li> )}
          </ul>
        </div>
      </div>
      <div className="clearfix">
        <button className="btn btn-link float-left" onClick={props.handleCloseDetail}>close detail view --&gt;</button>
      </div>
    </div>
  );
}

// see: https://facebook.github.io/react/docs/animation.html#rendering-a-single-child
function FirstChild(props) {
  const childrenArray = React.Children.toArray(props.children);
  return childrenArray[0] || null;
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

export default class PropertiesMap extends React.Component {
  constructor() {
    super();

    this.state = {
      mapCenter: [40.7127, -73.96270751953125],
      mapZoom: 18,
      bounds: [[40.477398, -74.259087], [40.917576, -73.700172]],
      showDetailView: false,
      detailAddr: null
    };

    this.detailSlideLength = 300;
  }

  // don't need it atm, but here it is
  // handleViewportChanged = (viewport) => {
  //   this.setState({
  //     viewport: viewport
  //   });
  // }

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

    const mapboxLight = 'https://api.mapbox.com/styles/v1/dan-kass/cj5rsfld203472sqy1y0px42d/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZGFuLWthc3MiLCJhIjoiY2lsZTFxemtxMGVpdnVoa3BqcjI3d3Q1cCJ9.IESJdCy8fmykXbb626NVEw';

    const mapUrl = mapboxLight;

    let mapCenter = this.state.mapCenter;

    // LatLngBounds doesn't like a single LatLng. needs > 1.
    let bounds = this.props.addrs.length > 1 ? [] : this.state.bounds;

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

    return (
      <div className="PropertiesMap">
        <div className="PropertiesMap__map">
          <Map ref="map"
            center={mapCenter}
            zoom={this.state.mapZoom}
            bounds={bounds}
            boundsOptions={{padding: [50, 50]}}
            onViewportChanged={this.handleViewportChanged}>
              <TileLayer
                url={mapUrl}
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              />
              { this.props.addrs.length && addrs}
          </Map>
        </div>
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
