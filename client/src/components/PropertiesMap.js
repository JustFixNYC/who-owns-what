import React, { Component } from 'react';
import { Map, Circle, Marker, Popup, TileLayer } from 'react-leaflet';
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
    <Circle
        center={props.pos}
        radius={75}
        color={'#FFA500'}
        weight={2}
        fillOpacity={0.8}
        onClick={() => props.onClick(props.addr)}
      >
    </Circle>
  );
}

function DetailView(props) {
  return (
    <div className="PropertiesMap__detail">
      <div className="card">
        <div className="card-image">
          <img src={`https://maps.googleapis.com/maps/api/streetview?size=960x200&location=${props.addr.lat},${props.addr.lng}&key=AIzaSyCJKZm-rRtfREo2o-GNC-feqpbSvfHNB5s`} className="img-responsive"  />
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
    </div>
  );
}

export default class PropertiesMap extends React.Component {
  constructor() {
    super();

    this.state = {
      mapCenter: [40.7127, -73.96270751953125],
      bounds: [[40.477398, -74.259087], [40.917576, -73.700172]],
      showDetailView: false,
      detailAddr: null
    };
  }

  toggleDetailView = (addr) => {
    this.setState({
      showDetailView: true,
      detailAddr: addr
    });
  }


  render() {

    const githubMapUrl = 'https://{s}.tiles.mapbox.com/v4/github.kedo1cp3/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZ2l0aHViIiwiYSI6IjEzMDNiZjNlZGQ5Yjg3ZjBkNGZkZWQ3MTIxN2FkODIxIn0.o0lbEdOfJYEOaibweUDlzA';
    let mapCenter = this.state.mapCenter;

    // LatLngBounds doesn't like a single LatLng. needs > 1.
    let bounds = this.props.addrs.length > 1 ? [] : this.state.bounds;

    const addrs = this.props.addrs.map((addr, idx) => {

      let pos = [parseFloat(addr.lat), parseFloat(addr.lng)];

      if(latLngIsNull(pos)) {
        return ( null );
      } else {

        bounds.push(pos);

        if(compareAddrs(addr, this.props.userAddr)) {
          // mapCenter = [parseFloat(addr.lat), parseFloat(addr.lng)];
          return  <Marker key={idx} position={pos}></Marker>;
        } else {
          return  <AssociatedAddrMarker key={idx} pos={pos} addr={addr} onClick={this.toggleDetailView} />;
        }

      }
    });

    return (
      <div className="PropertiesMap">
        <div className="PropertiesMap__map">
          <Map center={mapCenter} zoom={13} bounds={bounds}>
            <TileLayer
              url={githubMapUrl}
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
            {addrs}
          </Map>
        </div>
        {this.state.showDetailView ?
          <DetailView
            addr={this.state.detailAddr}
            userAddr={this.props.userAddr}
          /> : null
        }
      </div>

    );
  }
}
