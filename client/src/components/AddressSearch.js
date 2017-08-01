import React, { Component } from 'react';
import Geosuggest from 'react-geosuggest';

import 'styles/AddressSearch.css';

const AddressSearch = (props) => {

  const geosuggestBounds = new window.google.maps.LatLngBounds(
    new window.google.maps.LatLng(40.477398, -74.259087),
    new window.google.maps.LatLng(40.917576, -73.700172)
  );

  const handleGeosuggest = (suggest) => {
    const components = suggest.gmaps.address_components;
    const housenumber = components.find(e => e.types.indexOf('street_number') !== -1).long_name;
    const streetname = components.find(e => e.types.indexOf('route') !== -1).long_name.toUpperCase();
    const boro = components.find(e => e.types.indexOf('sublocality_level_1') !== -1).long_name.toUpperCase();
    props.onFormSubmit({ housenumber, streetname, boro });
  }

  return (
    <div className="AddressSearch">
      <div className="form-group col-xs-12">
        <Geosuggest
          bounds={geosuggestBounds}
          onSuggestSelect={handleGeosuggest}
          inputClassName="form-input"
          />
      </div>
    </div>
  );
}

export default AddressSearch;
