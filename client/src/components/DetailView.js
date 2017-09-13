import React from 'react';
import { CSSTransitionGroup } from 'react-transition-group';
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

const DetailView = (props) => {

  const detailSlideLength = 300;

  let boro, block, lot, ownernames;
  if(props.addr) {
    ({ boro, block, lot } = Helpers.splitBBL(props.addr.bbl));
    if(props.addr.ownernames.length) ownernames = Helpers.uniq(props.addr.ownernames);
  }
  // else return (null);

  return (
    <div className="DetailView">
      <div className="DetailView__wrapper">
        { props.addr &&
          <div className="DetailView__card card">
            <div className="card-image">
              {
                // <img src={`https://maps.googleapis.com/maps/api/streetview?size=960x300&location=${props.addr.lat},${props.addr.lng}&key=AIzaSyCJKZm-rRtfREo2o-GNC-feqpbSvfHNB5s`} alt="Google Street View" className="img-responsive"  />
              }

              {
                <iframe
                width="100%"
                height="300"
                frameBorder="0" style={{border:0}}
                src={`https://www.google.com/maps/embed/v1/streetview?location=${props.addr.lat},${props.addr.lng}&key=AIzaSyCuf0Ca1EvxogvbZQKOBl_40y0UWm4Fk30`}>
              </iframe>
            }
            </div>
            <div className="card-header">
              <h4 className="card-title">{props.addr.housenumber} {props.addr.streetname}, {props.addr.boro}</h4>
            </div>
            <div className="card-body">
              { props.hasJustFixUsers &&
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
                      { props.addr.yearbuilt }
                    </td>
                    <td>
                      <label>Units</label>
                      { props.addr.unitsres }
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <label>Open Violations</label>
                      { props.addr.openviolations }
                    </td>
                    <td>
                      <label>Total Violations</label>
                      { props.addr.totalviolations }
                    </td>
                    <td>
                      <label>Evictions</label>
                      { props.addr.evictions ? props.addr.evictions : 'N/A' }
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
                        {props.addr.corpnames && props.addr.corpnames.map((corp, idx) => <li key={idx}>{corp}</li> )}
                      </ul>
                    </div>
                    <div className="column col-xs-12 col-6">
                      <b>Business Addresses:</b>
                      <ul>
                        {props.addr.businessaddrs && props.addr.businessaddrs.map((rba, idx) => <li key={idx}>{rba}</li> )}
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
                  <a href={`https://hpdonline.hpdnyc.org/HPDonline/Provide_address.aspx?p1=${boro}&p2=${props.addr.housenumber}&p3=${props.addr.streetname}&SearchButton=Search`} target="_blank" className="btn btn-block">HPD Complaints/Violations &#8599;</a>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  );


}
export default DetailView;
