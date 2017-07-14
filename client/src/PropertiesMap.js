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


// "bbl": "3002710045",
// "housenumber": "88",
// "streetname": "SCHERMERHORN STREET",
// "zip": "11201",
// "boro": "BROOKLYN",
// "lat": "40.690352795899997",
// "lng": "-73.990416656299999",
// "registrationid": 352819,
// "registrationcontactid": 35281905,
// "registrationcontacttype": "HeadOfficer",
// "contactdescription": "LLC",
// "corporationname": null,
// "title": null,
// "firstname": "MOSES",
// "middleinitial": null,
// "lastname": "GUTMAN",
// "businesshousenumber": "277",
// "businessstreetname": "CLASSON AVENUE",
// "businessapartment": "B",
// "businesscity": "BROOKLYN",
// "businessstate": "NY",
// "businesszip": "11205"

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
            <p>
              {props.addr.housenumber} {props.addr.streetname}
            </p>
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
      <Marker position={position}>
          /*
          <Popup>
            <p>
              {props.addr.housenumber} {props.addr.streetname}
            </p>
          </Popup>
          */
      </Marker>
    );
  }
}



export default class PropertiesMap extends React.Component {


  render() {

    let mapCenter = [40.7127, -73.96270751953125];
    const githubMapUrl = 'https://{s}.tiles.mapbox.com/v4/github.kedo1cp3/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZ2l0aHViIiwiYSI6IjEzMDNiZjNlZGQ5Yjg3ZjBkNGZkZWQ3MTIxN2FkODIxIn0.o0lbEdOfJYEOaibweUDlzA'

    const addrs = this.props.addrs.map((addr, idx) => {
      if(compareAddrs(addr, this.props.currentAddr)) {
        mapCenter = [parseFloat(addr.lat), parseFloat(addr.lng)];
        return  <CurrentAddrMarker key={idx} addr={addr}  />;
      } else {
        return  <AssociatedAddrMarker key={idx} addr={addr}  />;
      }
    });

    return (
      <Map center={mapCenter} zoom={13}>
        <TileLayer
          url={githubMapUrl}
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        {addrs}
      </Map>
    );
  }
}
