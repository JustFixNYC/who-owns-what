import React, { Component } from 'react';
import { Map, Circle, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import './PropertiesMap.css';
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

function AssociatedAddrMarker(props) {
  const position = [parseFloat(props.addr.lat), parseFloat(props.addr.lng)];

  // need to check if either lat or lng is NaN. Occurs for ~0.5% of addresses
  if (position.filter(isNaN).length) {
    console.log('no latlng', props.addr);
    return (null);
  } else {
    return (
      <Circle center={position} radius={75} color={'#FFA500'} weight={2} fillOpacity={0.8}>
          <Popup>
            <div className="card">
              <div className="card-image">
                <img src={`https://maps.googleapis.com/maps/api/streetview?size=960x200&location=${props.addr.lat},${props.addr.lng}&key=AIzaSyCJKZm-rRtfREo2o-GNC-feqpbSvfHNB5s`} className="img-responsive"  />
              </div>
              <div className="card-header">
                <h4 className="card-title">{props.addr.housenumber} {props.addr.streetname}</h4>
              </div>
              <div className="card-body">
                <b>Corporation Name:</b> {props.addr.corporationname ? props.addr.corporationname : (<em>n/a</em>)}
                <br />
                <b>Owner Name:</b> { (props.addr.firstname && props.addr.lastname) ?
                  props.addr.firstname + ' ' + props.addr.lastname
                  : (<em>n/a</em>)}
              </div>
            </div>
          </Popup>
      </Circle>
    );
  }
}

function CurrentAddrMarker(props) {
  const position = [parseFloat(props.addr.lat), parseFloat(props.addr.lng)];

  // see above
  if (position.filter(isNaN).length) {
    console.log('no latlng', props.addr);
    return (null);
  } else {
    return (
      <Marker position={position}></Marker>
    );
  }
}



export default class PropertiesMap extends React.Component {
  constructor() {
    super();

    this.state = {
      mapCenter: [40.7127, -73.96270751953125],
      bounds: [[40.477398, -74.259087], [40.917576, -73.700172]]
    };
  }


  render() {

    const githubMapUrl = 'https://{s}.tiles.mapbox.com/v4/github.kedo1cp3/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZ2l0aHViIiwiYSI6IjEzMDNiZjNlZGQ5Yjg3ZjBkNGZkZWQ3MTIxN2FkODIxIn0.o0lbEdOfJYEOaibweUDlzA';
    let mapCenter = this.state.mapCenter;

    // LatLngBounds doesn't like a single LatLng. needs > 1.
    let bounds = this.props.addrs.length > 1 ? [] : this.state.bounds;

    const addrs = this.props.addrs.map((addr, idx) => {
      bounds.push([parseFloat(addr.lat), parseFloat(addr.lng)]);
      if(compareAddrs(addr, this.props.currentAddr)) {
        // mapCenter = [parseFloat(addr.lat), parseFloat(addr.lng)];
        return  <CurrentAddrMarker key={idx} addr={addr}  />;
      } else {
        return  <AssociatedAddrMarker key={idx} addr={addr}  />;
      }
    });

    return (
      <Map center={mapCenter} zoom={13} bounds={bounds}>
        <TileLayer
          url={githubMapUrl}
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        {addrs}
      </Map>
    );
  }
}
