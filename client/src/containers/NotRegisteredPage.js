import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Modal from 'components/Modal';
import LegalFooter from 'components/LegalFooter';
import Helpers from 'util/helpers';
import APIClient from 'components/APIClient';

import 'styles/NotRegisteredPage.css';

export default class NotRegisteredPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showModal: false,
      buildingInfo: null
    }
  }

  componentDidMount() {
    if(this.props.location.state.geosearch && this.props.location.state.geosearch.bbl && !this.state.buildingInfo) {
      const bbl = this.props.location.state.geosearch.bbl;
      APIClient.getBuildingInfo(bbl)
        .then(results => this.setState({ buildingInfo: results.result }))
        .catch(err => {window.Rollbar.error("API error: Building Info", err, bbl);}
      );
    }
  }

  render() {
    const geosearch = this.props.location.state.geosearch;
    const searchAddress = this.props.location.state.searchAddress;
    const buildingInfo = (this.state.buildingInfo && this.state.buildingInfo.length > 0 ? this.state.buildingInfo[0] : null);

    const usersInputAddress = 
      (searchAddress && (searchAddress.housenumber || searchAddress.streetname) ?
        (searchAddress.housenumber || '') + (searchAddress.housenumber && searchAddress.streetname ? ' ' : '') + (searchAddress.streetname || '') :
      buildingInfo ?
        buildingInfo.formatted_address :
      null );
    const bblDash = <span className="unselectable" unselectable="on">-</span>;

    let boro, block, lot;
    let buildingTypeMessage;

    if(geosearch) {

      if(geosearch.bbl) {
        ({ boro, block, lot } = Helpers.splitBBL(geosearch.bbl));
      }

      if(buildingInfo && buildingInfo.bldgclass) {
        const generalBldgCat = (buildingInfo.bldgclass).replace(/[0-9]/g, '');
        switch(generalBldgCat) {
          case 'B':
            buildingTypeMessage = (
              <div>
                <p className="text-center">
                  This seems like a smaller residential building. If the landlord doesn't reside there, it should be registered with HPD. (<i><a href={`http://www1.nyc.gov/assets/finance/jump/hlpbldgcode.html#${generalBldgCat.charAt(0)}`} target="_blank" rel="noopener noreferrer"><u>Building Classification</u></a>: {buildingInfo.bldgclass}</i>)
                  <a // eslint-disable-line jsx-a11y/anchor-is-valid
                    className="btn btn-block btn-link"
                    onClick={() => this.setState({ showModal: true })}
                  >What happens if the landlord has failed to register?</a>
                </p>
              </div>
            );
            break;
          case 'C':
            buildingTypeMessage = (
              <div>
                <p className="text-center">
                  <b>This building seems like it should be registered with HPD!</b> (<i><a href={`http://www1.nyc.gov/assets/finance/jump/hlpbldgcode.html#${generalBldgCat.charAt(0)}`} target="_blank" rel="noopener noreferrer"><u>Building Classification</u></a>: {buildingInfo.bldgclass}</i>)
                  <a // eslint-disable-line jsx-a11y/anchor-is-valid
                    className="btn btn-block btn-link"
                    onClick={() => this.setState({ showModal: true })}
                  >What happens if the landlord has failed to register?</a>
                </p>
              </div>
            );
            break;
          default:
            buildingTypeMessage = (<p className="text-center">It doesn't seem like this is a residential building that is required to register with HPD. (<i><a href={`http://www1.nyc.gov/assets/finance/jump/hlpbldgcode.html#${generalBldgCat.charAt(0)}`} target="_blank" rel="noopener noreferrer"><u>Building Classification</u></a>: {buildingInfo.bldgclass}</i>)</p>);
            break;
        };
      }
    }

    return (
      <div className="NotRegisteredPage Page">
        <div className="HomePage__content">
          <div className="HomePage__search">
            <h5 className="mt-10 text-danger text-center text-bold text-large">
              No results found
              {usersInputAddress ? (
                 <span> for {usersInputAddress}</span>
              ) : (
                <span></span>
              )}!
            </h5>
            <h6 className="mt-10 text-center text-bold text-large">
              { geosearch && geosearch.bbl && buildingInfo ? (<span>Boro-Block-Lot (BBL): <a href={"https://zola.planning.nyc.gov/lot/"+boro + "/" + block + "/" + lot} target="_blank" rel="noopener noreferrer">{boro}{bblDash}{block}{bblDash}{lot}</a></span>):(<span></span>) }
            </h6>
              { buildingInfo && buildingInfo.latitude && buildingInfo.longitude &&
            <img src={`https://maps.googleapis.com/maps/api/streetview?size=800x200&location=${buildingInfo.latitude},${buildingInfo.longitude}&key=${process.env.REACT_APP_STREETVIEW_API_KEY}`}
                 alt="Google Street View" className="img-responsive"  />
              }
          {buildingTypeMessage}
            <br />
            { geosearch && geosearch.bbl && buildingInfo && buildingInfo.housenumber && buildingInfo.streetname &&
              <div>
                <p>Here are some useful links to learn more about this building:</p>
                <div>
                  <div className="btn-group btn-group-block">
                    <a href={`http://a836-acris.nyc.gov/bblsearch/bblsearch.asp?borough=${boro}&block=${block}&lot=${lot}`} target="_blank" rel="noopener noreferrer" className="btn">View documents on ACRIS &#8599;</a>
                    <a href={`http://webapps.nyc.gov:8084/CICS/fin1/find001i?FFUNC=C&FBORO=${boro}&FBLOCK=${block}&FLOT=${lot}`} target="_blank" rel="noopener noreferrer" className="btn">DOF Property Tax Bills &#8599;</a>
                  </div>
                  <div className="btn-group btn-group-block">
                    <a href={`http://a810-bisweb.nyc.gov/bisweb/PropertyProfileOverviewServlet?boro=${boro}&block=${block}&lot=${lot}`} target="_blank" rel="noopener noreferrer" className="btn">DOB Building Profile &#8599;</a>
                    <a href={`https://hpdonline.hpdnyc.org/HPDonline/Provide_address.aspx?p1=${boro}&p2=${buildingInfo.housenumber}&p3=${buildingInfo.streetname}&SearchButton=Search`} target="_blank" rel="noopener noreferrer" className="btn">HPD Complaints/Violations &#8599;</a>
                  </div>
                </div>
              </div>
            }

            <br />
            {/* <div className="toast toast-error">
              <u>Note:</u> We're currently experiencing some difficulties due to an official NYC data service failing. We're working on it. If a search returns with "no results found", try it again in a minute or so!
            </div> */}
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
            <a className="btn" href="http://www1.nyc.gov/site/hpd/owners/compliance-register-your-property.page" target="_blank" rel="noopener noreferrer">Click here to learn more. &#8599;</a>
          </Modal>
        </div>
        <LegalFooter />
      </div>
    );
  }
}
