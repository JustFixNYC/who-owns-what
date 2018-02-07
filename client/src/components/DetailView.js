import React, { Component } from 'react';
import { CSSTransitionGroup } from 'react-transition-group';
import { Link } from 'react-router-dom';
import { StreetViewPanorama } from 'react-google-maps';
import { STREET_VIEW_PANORAMA } from 'react-google-maps/lib/constants';
import Helpers from 'util/helpers';
import Modal from 'components/Modal';

import 'styles/DetailView.css';

export default class DetailView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      coordinates: null,
      heading: 0,
      showCompareModal: false
    }

    this.detailSlideLength = 300;
  }

  // we need to trigger an ajax call (the streetViewService) when props
  // receives a new address. this computes the street view heading
  // srsly tho google, why not point to the latlng automatically?
  componentDidUpdate(prevProps, prevState) {

    // this says: if the component is getting the addr for the first time OR
    //            if the component already has an addr but is getting a new one
    if((!prevProps.addr && this.props.addr) ||
        (prevProps.addr && (prevProps.addr.bbl !== this.props.addr.bbl))) {

      let coordinates = new window.google.maps.LatLng(this.props.addr.lat, this.props.addr.lng);
      let streetViewService = new window.google.maps.StreetViewService();

      streetViewService.getPanoramaByLocation(coordinates, 50, (panoData) => {
        if (panoData !== null) {
          let panoCoordinates = panoData.location.latLng;
          this.setState({
            heading: window.google.maps.geometry.spherical.computeHeading(panoCoordinates, coordinates),
            coordinates: coordinates
          });
        }
      });
    }
  }



  render() {

    let boro, block, lot, ownernames, userOwnernames;
    if(this.props.addr) {
      ({ boro, block, lot } = Helpers.splitBBL(this.props.addr.bbl));
      if(this.props.addr.ownernames.length) ownernames = Helpers.uniq(this.props.addr.ownernames);
      if(this.props.userAddr.ownernames.length) userOwnernames = Helpers.uniq(this.props.userAddr.ownernames);
    }

    return (
      <div className="DetailView">
        <div className="DetailView__wrapper">
            { this.props.addr &&
              <div className="DetailView__card card">
                <div className="card-image">
                  <StreetViewPanorama
                    containerElement={<div style={{ width: `100%`, height: `300px` }} />}
                    position={this.state.coordinates}
                    pov={{ heading: this.state.heading, pitch: 15 }}
                    zoom={0.5}
                    options={{
                      disableDefaultUI: true,
                      panControl: true,
                      fullscreenControl: true
                    }}
                  />
                </div>
                <div className="card-header">
                  <h4 className="card-title">{this.props.addr.housenumber} {this.props.addr.streetname}, {this.props.addr.boro}</h4>
                  { !Helpers.addrsAreEqual(this.props.addr, this.props.userAddr) &&
                    <a onClick={() => this.setState({ showCompareModal: true })}>
                      <i>How is this building associated?</i>
                    </a>
                  }
                </div>
                <div className="card-body">
                  { this.props.hasJustFixUsers &&
                    <p className="text-bold text-justfix">
                      This building has at least one active JustFix.nyc user! <a href={`mailto:hello@justfix.nyc?subject=Outreach request for ${this.props.addr.housenumber} ${this.props.addr.streetname}, ${this.props.addr.boro}`} target="_blank">Click here</a> to get connected.
                    </p>
                  }
                  <table className="card-body-table">
                    <tbody>
                      <tr>
                        <td className="double" title="This is the official identifer for the building according to the Dept. of Finance tax records.">
                          <label>Boro-Block-Lot (BBL)</label>
                          {boro}-{block}-{lot}
                        </td>
                        <td title="The year that this building was originally constructed, according to the Dept. of City Planning.">
                          <label>Year Built</label>
                          { this.props.addr.yearbuilt !== 0 ?  this.props.addr.yearbuilt : 'N/A' }
                        </td>
                        <td title="The number of residential units in this building, according to the Dept. of City Planning.">
                          <label>Units</label>
                          { this.props.addr.unitsres }
                        </td>
                      </tr>
                      <tr>
                        <td title="The number of open HPD violations for this building, updated monthly. Click the HPD Complaints/Violations button for the most up-to-date information.">
                          <label>Open Violations</label>
                          { this.props.addr.openviolations }
                        </td>
                        <td  title="This represents the total number of HPD Violations (both open & closed) filed since 2015.">
                          <label>Total Violations</label>
                          { this.props.addr.totalviolations }
                        </td>
                        <td title="Eviction filings (not judgements) made in housing court from January 2013 to June 2015. This information was provided by the Office of the Public Advocate.">
                          <label>Evictions</label>
                          { this.props.addr.evictions !== null ? this.props.addr.evictions : 'N/A' }
                        </td>
                        <td title="The current number of rent stabilized apartments in this building (as of 2016). The &Delta; symbol (i.e. &quot;Change&quot;) represents how many RS apts have been lost or gained since 2007. These are estimated from the DOF Property Tax Bills.">
                          <label>RS Units (&Delta;)</label>
                          { this.props.addr.rsunits2016 !== null
                            ? `${this.props.addr.rsunits2016} (${this.props.addr.rsdiff > 0 ? `+${this.props.addr.rsdiff}` : `${this.props.addr.rsdiff}`})`
                            : 'N/A'
                          }
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <span className="float-right"><i>(hover over a box to learn more)</i></span>
                  <div className="card-body-landlord">
                      <div className="columns">
                        <div className="column col-xs-12 col-6">
                          <b>Shell Companies:</b>
                          <ul>
                            {this.props.addr.corpnames && this.props.addr.corpnames.map((corp, idx) => <li key={idx}>{corp}</li> )}
                          </ul>
                        </div>
                        <div className="column col-xs-12 col-6">
                          <b>Business Addresses:</b>
                          <ul>
                            {this.props.addr.businessaddrs && this.props.addr.businessaddrs.map((rba, idx) => <li key={idx}>{rba}</li> )}
                          </ul>
                        </div>
                      </div>
                    <div>
                      <b>People:</b>
                      <ul>
                        {ownernames.map((owner, idx) => <li key={idx}>{owner.title.split(/(?=[A-Z])/).join(" ")}: {owner.value}</li> )}
                      </ul>
                    </div>
                  </div>

                  <div className="card-body-links columns">
                    <div className="column col-lg-12 col-6">
                      <a href={`http://a836-acris.nyc.gov/bblsearch/bblsearch.asp?borough=${boro}&block=${block}&lot=${lot}`} target="_blank" className="btn btn-block">View documents on ACRIS &#8599;</a>
                    </div>
                    <div className="column col-lg-12 col-6">
                      <a href={`http://webapps.nyc.gov:8084/CICS/fin1/find001i?FFUNC=C&FBORO=${boro}&FBLOCK=${block}&FLOT=${lot}`} target="_blank" className="btn btn-block">DOF Property Tax Bills &#8599;</a>
                    </div>
                    <div className="column col-lg-12 col-6">
                      <a href={`http://a810-bisweb.nyc.gov/bisweb/PropertyProfileOverviewServlet?boro=${boro}&block=${block}&lot=${lot}`} target="_blank" className="btn btn-block">DOB Building Profile &#8599;</a>
                    </div>
                    <div className="column col-lg-12 col-6">
                      <a href={`https://hpdonline.hpdnyc.org/HPDonline/Provide_address.aspx?p1=${boro}&p2=${this.props.addr.housenumber}&p3=${this.props.addr.streetname}&SearchButton=Search`} target="_blank" className="btn btn-block">HPD Complaints/Violations &#8599;</a>
                    </div>
                  </div>
                </div>
              </div>
            }
            { this.props.addr && <Modal
              showModal={this.state.showCompareModal}
              width={60}
              onClose={() => this.setState({ showCompareModal: false })}>
              <h6><b>How is this building associated?</b></h6>
              <p>We compare your search address with a database of over 200k buildings to identify a landlord or management company's portfolio. To learn more, check out the <Link to="/how-it-works">How it Works page</Link>.</p>
              <table className="DetailView__compareTable">
                <thead>
                  <tr>
                    <th>{this.props.addr.housenumber} {this.props.addr.streetname}, {this.props.addr.boro}</th>
                    <th>{this.props.userAddr.housenumber} {this.props.userAddr.streetname}, {this.props.userAddr.boro}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div>Shell Companies:</div>
                      <ul>
                        {this.props.addr.corpnames && this.props.addr.corpnames.map((corp, idx) => <li key={idx}>{corp}</li> )}
                      </ul>
                    </td>
                    <td>
                      <div>Shell Companies:</div>
                      <ul>
                        {this.props.userAddr.corpnames && this.props.userAddr.corpnames.map((corp, idx) => <li key={idx}>{corp}</li> )}
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div>Business Addresses:</div>
                      <ul>
                        {this.props.addr.businessaddrs && this.props.addr.businessaddrs.map((rba, idx) => <li key={idx}>{rba}</li> )}
                      </ul>
                    </td>
                    <td>
                      <div>Business Addresses:</div>
                      <ul>
                        {this.props.userAddr.businessaddrs && this.props.userAddr.businessaddrs.map((rba, idx) => <li key={idx}>{rba}</li> )}
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div>People:</div>
                      <ul>
                        {ownernames.map((owner, idx) => <li key={idx}>{owner.title.split(/(?=[A-Z])/).join(" ")}: {owner.value}</li> )}
                      </ul>
                    </td>
                    <td>
                      <div>People:</div>
                      <ul>
                        {userOwnernames.map((owner, idx) => <li key={idx}>{owner.title.split(/(?=[A-Z])/).join(" ")}: {owner.value}</li> )}
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Modal>
          }
        </div>
      </div>
    );

  }
}
