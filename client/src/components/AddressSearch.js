import React from 'react';
import Geosuggest from 'react-geosuggest';

import 'styles/AddressSearch.css';

const AddressSearch = (props) => {

  const geosuggestBounds = new window.google.maps.LatLngBounds(
    new window.google.maps.LatLng(40.477398, -74.259087),
    new window.google.maps.LatLng(40.917576, -73.700172)
  );

  const handleGeosuggest = (suggest) => {

    let error = false;

    let housenumber, streetname, boro;
    const formatted_address = suggest.gmaps.formatted_address;

    if(!suggest.gmaps || !suggest.gmaps.address_components) {
      error = true;
    } else {

      const components = suggest.gmaps.address_components;


      const housenumberObj = components.find(e => e.types.indexOf('street_number') !== -1);
      if(!housenumberObj) {
        error = true;
      } else {
        housenumber = housenumberObj.long_name;
      }

      const streetnameSuffix = /(.+)(\d+)(TH|RD|ND|ST) (.+)$/g;

      // our system doesn't mess around with 34rd, 61st, 12th, etc. so we just grab the number
      const streetnameObj = components.find(e => e.types.indexOf('route') !== -1);
      if(!streetnameObj) {
        error = true;
      } else {
        streetname = streetnameObj.long_name.toUpperCase();

        if(streetnameSuffix.test(streetname)) {
          streetname = streetname.replace(streetnameSuffix, "$1$2 $4");
        }
      }

      const boroObj = components.find(e => e.types.indexOf('sublocality_level_1') !== -1);
      if(!boroObj) {
        error = true;
      } else {
        boro = boroObj.long_name.toUpperCase();
      }

    }



    props.onFormSubmit({ housenumber, streetname, boro, formatted_address }, error);
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
