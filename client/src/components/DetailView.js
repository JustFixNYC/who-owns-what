import React, { Component } from 'react';
import { CSSTransitionGroup } from 'react-transition-group';
import { StreetViewPanorama } from 'react-google-maps';
import { STREET_VIEW_PANORAMA } from 'react-google-maps/lib/constants';
import Helpers from 'util/helpers';

import 'styles/DetailView.css';

function SlideTransition(props) {
  return (
    <CSSTransitionGroup
      { ...props }
      component={FirstChild}
      transitionName="slide"
      transitionEnterTimeout={props.length}
      transitionLeaveTimeout={props.length}>
    </CSSTransitionGroup>
  );
}

// see: https://facebook.github.io/react/docs/animation.html#rendering-a-single-child
function FirstChild(props) {
  const childrenArray = React.Children.toArray(props.children);
  return childrenArray[0] || null;
}

export default class DetailView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      coordinates: null,
      heading: 0
    }

    this.detailSlideLength = 300;
  }

  // we need to trigger an ajax call (the streetViewService) when props
  // receives a new address. this computes the street view heading
  // srsly tho google, why not point to the latlng automatically?
  componentDidUpdate(prevProps, prevState) {

    // this says, if the component is getting the addr for the first time OR
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

    let boro, block, lot, ownernames;
    if(this.props.addr) {
      ({ boro, block, lot } = Helpers.splitBBL(this.props.addr.bbl));
      if(this.props.addr.ownernames.length) ownernames = Helpers.uniq(this.props.addr.ownernames);
    }

    return (
      <div className="DetailView">
        <div className="DetailView__wrapper">
            {
              // <div className="DetailView__close">
              //   <button className="btn btn-link" onClick={this.props.onCloseDetail}>[ x ]</button>
              // </div>
            }
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
                      panControl: true
                    }}
                  />
                </div>
                <div className="card-header">
                  <h4 className="card-title">{this.props.addr.housenumber} {this.props.addr.streetname}, {this.props.addr.boro}</h4>
                </div>
                <div className="card-body">
                  { this.props.hasJustFixUsers &&
                    <p className="text-bold text-danger">This building has at least one active JustFix.nyc case!</p>
                  }
                  <table className="card-body-table">
                    <tbody>
                      <tr>
                        <td className="double">
                          <label>Boro-Block-Lot (BBL)</label>
                          {boro}-{block}-{lot}
                        </td>
                        <td>
                          <label>Year Built</label>
                          { this.props.addr.yearbuilt !== 0 ?  this.props.addr.yearbuilt : 'N/A' }
                        </td>
                        <td>
                          <label>Units</label>
                          { this.props.addr.unitsres }
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <label>Open Violations</label>
                          { this.props.addr.openviolations }
                        </td>
                        <td>
                          <label>Total Violations</label>
                          { this.props.addr.totalviolations }
                        </td>
                        <td>
                          <label title="hi">Evictions</label>
                          { this.props.addr.evictions ? this.props.addr.evictions : 'N/A' }
                        </td>
                        <td>
                          <label>Change in RS</label>
                          N/A
                        </td>
                      </tr>
                    </tbody>
                  </table>
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
        </div>
      </div>
    );

  }
}
