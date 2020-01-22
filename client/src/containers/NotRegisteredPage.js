import React, { Component } from 'react';
import { LocaleLink as Link } from '../i18n';
import Modal from 'components/Modal';
import LegalFooter from 'components/LegalFooter';
import Helpers from 'util/helpers';
import APIClient from 'components/APIClient';
import SocialShare from 'components/SocialShare';

import 'styles/NotRegisteredPage.css';
import { Trans } from '@lingui/macro';

export default class NotRegisteredPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showModal: false,
      buildingInfo: null
    }
  }

  componentDidMount() {
    if(this.props.geosearch && this.props.geosearch.bbl && !this.state.buildingInfo) {
      const bbl = this.props.geosearch.bbl;
      APIClient.getBuildingInfo(bbl)
        .then(results => this.setState({ buildingInfo: results.result }))
        .catch(err => {window.Rollbar.error("API error on Not Registered page: Building Info", err, bbl);}
      );
    }
  }

  render() {
    const geosearch = this.props.geosearch;
    const searchAddress = this.props.searchAddress;
    const buildingInfo = (this.state.buildingInfo && this.state.buildingInfo.length > 0 ? this.state.buildingInfo[0] : null);

    const usersInputAddress = 
      (searchAddress && searchAddress.boro && (searchAddress.housenumber || searchAddress.streetname) ?
        { 
          boro: searchAddress.boro,
          housenumber: (searchAddress.housenumber || ' '),
          streetname: (searchAddress.streetname || ' ') 
        } :
        buildingInfo && buildingInfo.boro && (buildingInfo.housenumber || buildingInfo.streetname) ?
        { 
          boro: buildingInfo.boro,
          housenumber: (buildingInfo.housenumber || ' '),
          streetname: (buildingInfo.streetname || ' ') 
        } : 
        null );
    
    const failedToRegisterLink = 
      <div className="text-center">
        <button className="is-link" onClick={() => this.setState({ showModal: true })}
        ><Trans>What happens if the landlord has failed to register?</Trans></button>
      </div>;

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
                <h6 className="mt-10 text-center text-bold text-large">
                  <p className="text-center">
                    <Trans>This seems like a smaller residential building. If the landlord doesn't reside there, it should be registered with HPD.</Trans>{" "}
                    <nobr>(<i><a href={`http://www1.nyc.gov/assets/finance/jump/hlpbldgcode.html#${generalBldgCat.charAt(0)}`} target="_blank" rel="noopener noreferrer"><Trans>Building Classification</Trans></a>: {buildingInfo.bldgclass}</i>)</nobr>
                  </p>
                </h6>
                {failedToRegisterLink}
              </div>
            );
            break;
          case 'C':
            buildingTypeMessage = (
              <div>
                <h6 className="mt-10 text-center text-bold text-large">
                  <p className="text-center">
                    <Trans render="b">This building seems like it should be registered with HPD!</Trans>{" "}
                    <nobr>(<i><a href={`http://www1.nyc.gov/assets/finance/jump/hlpbldgcode.html#${generalBldgCat.charAt(0)}`} target="_blank" rel="noopener noreferrer"><Trans>Building Classification</Trans></a>: {buildingInfo.bldgclass}</i>)</nobr>
                  </p>
                </h6>
                {failedToRegisterLink}
              </div>
            );
            break;
          default:
            buildingTypeMessage = (
              <h6 className="mt-10 text-center text-bold text-large">
                <p className="text-center"><Trans>It doesn't seem like this property is required to register with HPD.</Trans>{" "}
                <nobr>(<i><a href={`http://www1.nyc.gov/assets/finance/jump/hlpbldgcode.html#${generalBldgCat.charAt(0)}`} target="_blank" rel="noopener noreferrer"><Trans render="u">Building Classification</Trans></a>: {buildingInfo.bldgclass}</i>)</nobr></p>
              </h6>
            );
            break;
        };
      }
    }


    if(!geosearch && !buildingInfo) {
      return (
        <div className="NotRegisteredPage Page">
          <div className="HomePage__content">
            <div className="HomePage__search">
              <h5 className="mt-10 text-danger text-center text-bold text-large">
                <Trans>No address found</Trans>
              </h5>
            </div>
         `</div>
        </div>
      );
    }

    const usersInputAddressFragment = usersInputAddress ? <>
      {(usersInputAddress.housenumber === ' ' ? '' : (usersInputAddress.housenumber + ' '))}
      {(usersInputAddress.streetname !== ' ' && (usersInputAddress.streetname))}
    </> : null;

    return (
      <div className="NotRegisteredPage Page">
        <div className="HomePage__content">
          <div className="HomePage__search">
            <h5 className="mt-10 text-danger text-center text-bold text-large">
              {usersInputAddress ? (
                <Trans>No registration found for {usersInputAddressFragment}!</Trans>
              ) : (
                <Trans>No registration found!</Trans>
              )}
            </h5>
            {buildingTypeMessage}
            <div className="wrapper">
                { buildingInfo && buildingInfo.latitude && buildingInfo.longitude &&
              <img src={`https://maps.googleapis.com/maps/api/streetview?size=800x200&location=${buildingInfo.latitude},${buildingInfo.longitude}&key=${process.env.REACT_APP_STREETVIEW_API_KEY}`}
                  alt="Google Street View" className="streetview img-responsive"  />
                }
              <div className="bbl-link">
                { geosearch && geosearch.bbl && buildingInfo ? (<span>Boro-Block-Lot (BBL): <nobr><a href={"https://zola.planning.nyc.gov/lot/"+boro + "/" + block + "/" + lot} target="_blank" rel="noopener noreferrer">{boro}{bblDash}{block}{bblDash}{lot}</a></nobr></span>):(<span></span>) }
              </div>
              <br />
              { geosearch && geosearch.bbl && buildingInfo && buildingInfo.housenumber && buildingInfo.streetname &&
                <div>
                  <Trans render="p">Useful links:</Trans>
                  <div>
                    <div className="btn-group btn-group-block">
                      <a href={`http://a836-acris.nyc.gov/bblsearch/bblsearch.asp?borough=${boro}&block=${block}&lot=${lot}`} target="_blank" rel="noopener noreferrer" className="btn"><Trans>View documents on ACRIS</Trans> &#8599;</a>
                      <a href={`http://webapps.nyc.gov:8084/CICS/fin1/find001i?FFUNC=C&FBORO=${boro}&FBLOCK=${block}&FLOT=${lot}`} target="_blank" rel="noopener noreferrer" className="btn"><Trans>DOF Property Tax Bills</Trans> &#8599;</a>
                    </div>
                    <div className="btn-group btn-group-block">
                      <a href={`http://a810-bisweb.nyc.gov/bisweb/PropertyProfileOverviewServlet?boro=${boro}&block=${block}&lot=${lot}`} target="_blank" rel="noopener noreferrer" className="btn"><Trans>DOB Building Profile</Trans> &#8599;</a>
                      <a href={`https://hpdonline.hpdnyc.org/HPDonline/Provide_address.aspx?p1=${boro}&p2=${buildingInfo.housenumber}&p3=${buildingInfo.streetname}&SearchButton=Search`} target="_blank" rel="noopener noreferrer" className="btn"><Trans>HPD Complaints/Violations</Trans> &#8599;</a>
                    </div>
                  </div>
                </div>
              }

              <div className="social-share">
                <p><Trans>Share this page with your neighbors</Trans></p>
                <SocialShare 
                  location="nycha-page"
                  url={usersInputAddress && encodeURI('https://whoownswhat.justfix.nyc/address/' + usersInputAddress.boro + '/' + usersInputAddress.housenumber + '/' + usersInputAddress.streetname).replace(" ", "%20")} // Support for Android
                  />
              </div>

              <br />
              {/* <div className="toast toast-error">
                <u>Note:</u> We're currently experiencing some difficulties due to an official NYC data service failing. We're working on it. If a search returns with "no results found", try it again in a minute or so!
              </div> */}
              <br />

              <Link className="btn btn-primary btn-block" to="/">
                &lt;-- <Trans>Search for a different address</Trans>
              </Link>
            </div>
            <Modal
              width={60}
              showModal={this.state.showModal}
              onClose={() => this.setState({ showModal: false })}>
              <Trans render="h5">Failure to register a building with HPD</Trans>
              <Trans render="p">
                Buildings without valid property registration are subject to the following:
              </Trans>
              <ul>
                <Trans render="li">Civil penalties of $250-$500</Trans>
                <Trans render="li">May be issued official Orders</Trans>
                <Trans render="li">Ineligible to certify violations</Trans>
                <Trans render="li">Unable to request Code Violation Dismissals</Trans>
                <Trans render="li">Unable to initiate a court action for nonpayment of rent.</Trans>
              </ul>
              <a className="btn" href="https://www1.nyc.gov/site/hpd/services-and-information/register-your-property.page" target="_blank" rel="noopener noreferrer"><Trans>Click here to learn more.</Trans> &#8599;</a>
            </Modal>
          </div>
         </div>
        <LegalFooter />
      </div>
    );
    
  }
}
