import React from 'react';
import { CSSTransitionGroup } from 'react-transition-group';

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

  let bbl, boro, block, lot;
  if(props.addr) {
    bbl = props.addr.bbl.split('');
    boro = bbl.slice(0,1).join('');
    block = bbl.slice(1,6).join('');
    lot= bbl.slice(6,10).join('');
  }

  return (
    <SlideTransition length={detailSlideLength}>
      { props.addr &&
        <div key={props.addr} className="DetailView">
          <div className="DetailView__wrapper">
            <div className="DetailView__close">
              <button className="btn btn-link" onClick={props.onCloseDetail}>[ x ]</button>
            </div>
            <div className="DetailView__card card">
              <div className="card-image">
                <img src={`https://maps.googleapis.com/maps/api/streetview?size=960x300&location=${props.addr.lat},${props.addr.lng}&key=AIzaSyCJKZm-rRtfREo2o-GNC-feqpbSvfHNB5s`} alt="Google Street View" className="img-responsive"  />
              </div>
              <div className="card-header">
                <h4 className="card-title">{props.addr.housenumber} {props.addr.streetname}</h4>
              </div>
              <div className="card-body">
                <p>This building is also registered at <b>{props.addr.assocRba}</b>.</p>
                {props.hasJustFixUsers &&
                  <p className="text-bold text-danger">This building has at least one active JustFix.nyc case!</p>
                }
                <b>Shell Companies:</b>
                <ul>
                  {props.addr.corpnames.map((corp, idx) => <li key={idx}>{corp}</li> )}
                </ul>
                <b>People:</b>
                <ul>
                  {props.addr.ownernames.map((owner, idx) => <li key={idx}>{owner.title.split(/(?=[A-Z])/).join(" ")}: {owner.value}</li> )}
                </ul>
                <div className="card-body-links">
                  <a href={`http://a836-acris.nyc.gov/bblsearch/bblsearch.asp?borough=${boro}&block=${block}&lot=${lot}`} target="_blank" className="btn btn-block">View documents on ACRIS &#8599;</a>
                  <a href={`http://webapps.nyc.gov:8084/CICS/fin1/find001i?FFUNC=C&FBORO=${boro}&FBLOCK=${block}&FLOT=${lot}`} target="_blank" className="btn btn-block">DOF Property Tax Bills &#8599;</a>
                  <a href={`http://a810-bisweb.nyc.gov/bisweb/PropertyProfileOverviewServlet?boro=${boro}&block=${block}&lot=${lot}`} target="_blank" className="btn btn-block">DOB Building Profile &#8599;</a>
                  <a href={`https://hpdonline.hpdnyc.org/HPDonline/Provide_address.aspx?p1=${boro}&p2=${props.addr.housenumber}&p3=${props.addr.streetname}&SearchButton=Search`} target="_blank" className="btn btn-block">HPD Complaints/Violations &#8599;</a>
                </div>
              </div>
            </div>
            <div className="clearfix">
              <button className="btn btn-link float-left" onClick={props.handleCloseDetail}>close detail view --&gt;</button>
            </div>
          </div>
        </div>
      }
    </SlideTransition>
  );
}
export default DetailView;
