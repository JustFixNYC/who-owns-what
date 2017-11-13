import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Modal from 'components/Modal';
import Helpers from 'util/helpers';

import 'styles/NotRegisteredPage.css';

export default class NotRegisteredPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showModal: false
    }
  }

  render() {
    const geoclient = this.props.location.state.geoclient;
    const searchAddress = this.props.location.state.searchAddress;

    let boro, block, lot;
    let buildingTypeMessage;

    if(geoclient) {

      if(geoclient.bbl) {
        ({ boro, block, lot } = Helpers.splitBBL(geoclient.bbl));
      }

      if(geoclient.rpadBuildingClassificationCode) {
        const generalBldgCat = geoclient.rpadBuildingClassificationCode.replace(/[0-9]/g, '');
        switch(generalBldgCat) {
          case 'B':
            buildingTypeMessage = (
              <div>
                <p>
                  This seems like a smaller residential building. If the landlord doesn't reside there, it should be registered with HPD. (<i><a href={`http://www1.nyc.gov/assets/finance/jump/hlpbldgcode.html#${geoclient.rpadBuildingClassificationCode.charAt(0)}`} target="_blank"><u>Building Classification</u></a>: {geoclient.rpadBuildingClassificationCode}</i>)
                  <a className="btn btn-block btn-link" onClick={() => this.setState({ showModal: true })}>What happens if the landlord has failed to register?</a>
                </p>
              </div>
            );
            break;
          case 'C':
            buildingTypeMessage = (
              <div>
                <p>
                  This building seems like it should be registered with HPD. (<i><a href={`http://www1.nyc.gov/assets/finance/jump/hlpbldgcode.html#${geoclient.rpadBuildingClassificationCode.charAt(0)}`} target="_blank"><u>Building Classification</u></a>: {geoclient.rpadBuildingClassificationCode}</i>)
                  <a className="btn btn-block btn-link" onClick={() => this.setState({ showModal: true })}>What happens if the landlord has failed to register?</a>
                </p>
              </div>
            );
            break;
          default:
            buildingTypeMessage = (<p>It doesn't seem like this is a residential building that is required to register with HPD. (<i><a href={`http://www1.nyc.gov/assets/finance/jump/hlpbldgcode.html#${geoclient.rpadBuildingClassificationCode.charAt(0)}`} target="_blank"><u>Building Classification</u></a>: {geoclient.rpadBuildingClassificationCode}</i>)</p>);
            break;
        };
      }
    }

    return (
      <div>
        <div className="HomePage__search NotRegisteredPage">
          <h5 className="mt-10 text-danger text-center text-bold text-large">No results found for <u>{searchAddress.housenumber} {searchAddress.streetname}{searchAddress.boro ? `, ${searchAddress.boro}`: ''}</u>!</h5>
          { geoclient && geoclient.latitude && geoclient.longitude &&
            <img src={`https://maps.googleapis.com/maps/api/streetview?size=800x200&location=${geoclient.latitude},${geoclient.longitude}&key=AIzaSyCJKZm-rRtfREo2o-GNC-feqpbSvfHNB5s`}
                 alt="Google Street View" className="img-responsive"  />
          }
          {buildingTypeMessage}
          <br />
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
          <br />
          <Link className="btn btn-primary btn-block" to="/">
            &lt;-- Search for a different address
          </Link>
        </div>
        <Modal
          width={60}
          showModal={this.state.showModal}
          onClose={() => this.setState({ showModal: false })}>
          <h5>Failure to register a building with HPD</h5>
          <p>
            Buildings without valid property registration are subject to the following:
          </p>
          <ul>
            <li>Civil penalties of $250-$500</li>
            <li>May be issued official Orders</li>
            <li>Ineligible to certify violations</li>
            <li>Unable to request Code Violation Dismissals</li>
            <li>Unable to initiate a court action for nonpayment of rent.</li>
          </ul>
          <a className="btn" href="http://www1.nyc.gov/site/hpd/owners/compliance-register-your-property.page" target="_blank">Click here to learn more. &#8599;</a>
        </Modal>
      </div>
    );
  }
}
