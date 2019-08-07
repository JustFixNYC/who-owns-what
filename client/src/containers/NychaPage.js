import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Modal from 'components/Modal';
import LegalFooter from 'components/LegalFooter';
import Helpers from 'util/helpers';
import APIClient from 'components/APIClient';

import 'styles/NotRegisteredPage.css';
import 'styles/DetailView.css';

export default class NychaPage extends Component {
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

    // const usersInputAddress = 
    //   (searchAddress && (searchAddress.housenumber || searchAddress.streetname) ?
    //     (searchAddress.housenumber || '') + (searchAddress.housenumber && searchAddress.streetname ? ' ' : '') + (searchAddress.streetname || '') :
    //   buildingInfo ?
    //     buildingInfo.formatted_address :
    //   null );
    const bblDash = <span className="unselectable" unselectable="on">-</span>;

    let boro, block, lot;
    
    if(geosearch && geosearch.bbl) {
      ({ boro, block, lot } = Helpers.splitBBL(geosearch.bbl));
    }

    if(!geosearch && !buildingInfo) {
      return (
        <div className="NotRegisteredPage Page">
          <div className="HomePage__content">
            <div className="HomePage__search">
              <h5 className="mt-10 text-danger text-center text-bold text-large">
                No address found
              </h5>
            </div>
         `</div>
        </div>
      );
    }

    return (
      <div className="NotRegisteredPage Page">
        <div className="HomePage__content">
          <div className="HomePage__search">
            <h5 className="mt-10 text-center text-bold text-large">
              {this.props.nychaData && this.props.nychaData.development}: Public Housing Development
            </h5>
            <h6 className="mt-10 text-center text-bold text-large">
              This building is owned and managed by the NYC Housing Authority (NYCHA)
            </h6>
            <div className="card-body">
                        <div className="card-body-table">
                            <div className="table-row">
                              <div className="double" title="This is the official identifer for the building according to the Dept. of Finance tax records.">
                                <label>Boro{bblDash}Block{bblDash}Lot (BBL)</label>
                                {boro}{bblDash}{block}{bblDash}{lot}
                              </div>
                              <div title="The year that this building was originally constructed, according to the Dept. of City Planning.">
                                <label>2018 Evictions</label>
                                { this.props.nychaData.dev_evictions }
                              </div>
                              <div title="The number of residential units in this building, according to the Dept. of City Planning.">
                                <label>Units</label>
                                { this.props.nychaData.dev_unitsres }
                              </div>
                            </div>
                        </div>
                      </div>
              { buildingInfo && buildingInfo.latitude && buildingInfo.longitude &&
            <img src={`https://maps.googleapis.com/maps/api/streetview?size=800x200&location=${buildingInfo.latitude},${buildingInfo.longitude}&key=${process.env.REACT_APP_STREETVIEW_API_KEY}`}
                 alt="Google Street View" className="img-responsive"  />
              }
            <div className="bbl-link">
              { geosearch && geosearch.bbl && buildingInfo ? (<span>Boro-Block-Lot (BBL): <nobr><a href={"https://zola.planning.nyc.gov/lot/"+boro + "/" + block + "/" + lot} target="_blank" rel="noopener noreferrer">{boro}{bblDash}{block}{bblDash}{lot}</a></nobr></span>):(<span></span>) }
            </div>
            <br />
            { geosearch && geosearch.bbl && buildingInfo && buildingInfo.housenumber && buildingInfo.streetname &&
              <div>
                <p>Here are some useful links to learn more about this building:</p>
                <div>
                  <div className="btn-group btn-group-block">
                    <a href={`https://www1.nyc.gov/assets/nycha/downloads/pdf/Development-Guide-01142019.pdf`} target="_blank" rel="noopener noreferrer" className="btn">NYCHA Facility Directory &#8599;</a>
                    <a href={`https://www1.nyc.gov/site/nycha/mynycha/mynycha-landing.page`} target="_blank" rel="noopener noreferrer" className="btn">MyNYCHA App &#8599;</a>
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
