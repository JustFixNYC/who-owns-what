import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import 'styles/NotRegisteredPage.css';


const NotRegisteredPage = (props) => {

  const geoclient = props.location.state.geoclient;
  const searchAddress = props.location.state.searchAddress;

  let bbl = '', boro, block, lot;

  if(geoclient && geoclient.bbl) {
    bbl = geoclient.bbl.split('');
    boro = bbl.slice(0,1).join('');
    block = bbl.slice(1,6).join('');
    lot = bbl.slice(6,10).join('');
  }

  return (
    <div>
      <div className="HomePage__search NotRegisteredPage">
        <p className="mt-10 text-danger text-bold text-large">No results found for <u>{searchAddress.housenumber} {searchAddress.streetname}, {searchAddress.boro}</u>! It's likely that its not properly registered with HPD...</p>
        { geoclient && geoclient.bbl &&
          <div className="more-info-links">
            <p>Here are some useful links to research more on the building:</p>
            <a href={`http://a836-acris.nyc.gov/bblsearch/bblsearch.asp?borough=${boro}&block=${block}&lot=${lot}`} target="_blank" className="btn btn-block">View documents on ACRIS &#8599;</a>
            <a href={`http://webapps.nyc.gov:8084/CICS/fin1/find001i?FFUNC=C&FBORO=${boro}&FBLOCK=${block}&FLOT=${lot}`} target="_blank" className="btn btn-block">DOF Property Tax Bills &#8599;</a>
            <a href={`http://a810-bisweb.nyc.gov/bisweb/PropertyProfileOverviewServlet?boro=${boro}&block=${block}&lot=${lot}`} target="_blank" className="btn btn-block">DOB Building Profile &#8599;</a>
            <a href={`https://hpdonline.hpdnyc.org/HPDonline/Provide_address.aspx?p1=${boro}&p2=${searchAddress.housenumber}&p3=${searchAddress.streetname}&SearchButton=Search`} target="_blank" className="btn btn-block">HPD Complaints/Violations &#8599;</a>
          </div>
        }
        <Link className="btn btn-primary btn-block" to="/">
          Search for a different address
        </Link>
      </div>
    </div>
  );
}

export default NotRegisteredPage;
