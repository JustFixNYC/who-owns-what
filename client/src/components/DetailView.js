import React from 'react';

import 'styles/DetailView.css';

const DetailView = (props) => {

  console.log(props.addr);

  let bbl = props.addr.bbl.split('');
  let boro = bbl.slice(0,1).join('');
  let block = bbl.slice(1,6).join('');
  let lot= bbl.slice(6,10).join('');

  console.log(boro, block, lot);

  return (
    <div className="DetailView">
      <div className="card">
        <div className="card-image">
          <img src={`https://maps.googleapis.com/maps/api/streetview?size=960x300&location=${props.addr.lat},${props.addr.lng}&key=AIzaSyCJKZm-rRtfREo2o-GNC-feqpbSvfHNB5s`} alt="Google Street View" className="img-responsive"  />
        </div>
        <div className="card-header">
          <h4 className="card-title">{props.addr.housenumber} {props.addr.streetname}</h4>
        </div>
        <div className="card-body">
          This property is also registered at <b>{props.addr.assocRba}</b>.
          <br />
          <br />
          <b>Corporate Owners:</b>
          <ul>
            {props.addr.corpnames.map((corp, idx) => <li key={idx}>{corp}</li> )}
          </ul>
          <b>Owners:</b>
          <ul>
            {props.addr.ownernames.map((owner, idx) => <li key={idx}>{owner.title.split(/(?=[A-Z])/).join(" ")}: {owner.value}</li> )}
          </ul>
          <a href={`http://a836-acris.nyc.gov/bblsearch/bblsearch.asp?borough=${boro}&block=${block}&lot=${lot}`} target="_blank" className="btn btn-block">View property on ACRIS</a>
          <a href={`http://a810-bisweb.nyc.gov/bisweb/PropertyProfileOverviewServlet?boro=${boro}&block=${block}&lot=${lot}`} target="_blank" className="btn btn-block">DOB Property Profile</a>
        </div>
      </div>
      <div className="clearfix">
        <button className="btn btn-link float-left" onClick={props.handleCloseDetail}>close detail view --&gt;</button>
      </div>
    </div>
  );
}
export default DetailView;
