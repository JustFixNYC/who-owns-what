import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import 'styles/NotRegisteredPage.css';


const NotRegisteredPage = (props) => {

  const geoclient = props.location.state.geoclient;
  const searchAddress = props.location.state.searchAddress;

  let bbl = '', boro, block, lot;
  let buildingTypeMessage;

  if(geoclient) {

    if(geoclient.bbl) {
      bbl = geoclient.bbl.split('');
      boro = bbl.slice(0,1).join('');
      block = bbl.slice(1,6).join('');
      lot = bbl.slice(6,10).join('');
    }

    if(geoclient.rpadBuildingClassificationCode) {
      const generalBldgCat = geoclient.rpadBuildingClassificationCode.replace(/[0-9]/g, '');
      switch(generalBldgCat) {
        case 'B':
          buildingTypeMessage = (<p>This seems like a smaller residential building. If the landlord doesn't reside there, it should be registered with HPD. Click <a href="http://www1.nyc.gov/site/hpd/owners/compliance-register-your-property.page" target="_blank">here</a> for more information. </p>);
          break;
        case 'C':
          buildingTypeMessage = (<p>This building seems like it should be registered with HPD... click <a href="http://www1.nyc.gov/site/hpd/owners/compliance-register-your-property.page" target="_blank">here</a> for more information.</p>);
          break;
        default:
          buildingTypeMessage = (<p>It doesn't seem like this is a residential building that is required to register with HPD. (<i><a href="http://www1.nyc.gov/assets/finance/jump/hlpbldgcode.html" target="_blank"><u>Building Classification</u></a>: {geoclient.rpadBuildingClassificationCode}</i>)</p>);
          break;
      };
    }
  }

  return (
    <div>
      <div className="HomePage__search NotRegisteredPage">
        <h5 className="mt-10 text-danger text-center text-bold text-large">No results found for <u>{searchAddress.housenumber} {searchAddress.streetname}, {searchAddress.boro}</u>!</h5>
        {buildingTypeMessage}
        { geoclient && geoclient.bbl &&
          <div>
            <p>Here are some useful links to learn more about this building:</p>
            <div>
              <div className="btn-group btn-group-block">
                <a href={`http://a836-acris.nyc.gov/bblsearch/bblsearch.asp?borough=${boro}&block=${block}&lot=${lot}`} target="_blank" className="btn">View documents on ACRIS &#8599;</a>
                <a href={`http://webapps.nyc.gov:8084/CICS/fin1/find001i?FFUNC=C&FBORO=${boro}&FBLOCK=${block}&FLOT=${lot}`} target="_blank" className="btn">DOF Property Tax Bills &#8599;</a>
              </div>
              <div className="btn-group btn-group-block">
                <a href={`http://a810-bisweb.nyc.gov/bisweb/PropertyProfileOverviewServlet?boro=${boro}&block=${block}&lot=${lot}`} target="_blank" className="btn">DOB Building Profile &#8599;</a>
                <a href={`https://hpdonline.hpdnyc.org/HPDonline/Provide_address.aspx?p1=${boro}&p2=${searchAddress.housenumber}&p3=${searchAddress.streetname}&SearchButton=Search`} target="_blank" className="btn">HPD Complaints/Violations &#8599;</a>
              </div>
            </div>
          </div>
        }
        <br />
        <Link className="btn btn-primary btn-block" to="/">
          &lt;-- Search for a different address
        </Link>
      </div>
    </div>
  );
}

export default NotRegisteredPage;
