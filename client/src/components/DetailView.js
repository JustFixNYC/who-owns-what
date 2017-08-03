import React, { Component } from 'react';
import APIClient from 'components/APIClient';

import 'styles/DetailView.css';

class DetailView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasJustFixUsers: false
    };
  }

  componentDidMount() {
    APIClient.searchForJFXUsers([this.props.addr.bbl]).then(res => {
      this.setState({
        hasJustFixUsers: res.hasJustFixUsers
      })
    });
  }

  render() {
    let bbl = this.props.addr.bbl.split('');
    let boro = bbl.slice(0,1).join('');
    let block = bbl.slice(1,6).join('');
    let lot= bbl.slice(6,10).join('');

    return (
      <div className="DetailView">
        <div className="DetailView__wrapper">
          <div className="DetailView__close">
            <button className="btn btn-link" onClick={this.props.handleCloseDetail}>[ x ]</button>
          </div>
          <div className="DetailView__card card">
            <div className="card-image">
              <img src={`https://maps.googleapis.com/maps/api/streetview?size=960x300&location=${this.props.addr.lat},${this.props.addr.lng}&key=AIzaSyCJKZm-rRtfREo2o-GNC-feqpbSvfHNB5s`} alt="Google Street View" className="img-responsive"  />
            </div>
            <div className="card-header">
              <h4 className="card-title">{this.props.addr.housenumber} {this.props.addr.streetname}</h4>
            </div>
            <div className="card-body">
              <p>This building is also registered at <b>{this.props.addr.assocRba}</b>.</p>
              {this.state.hasJustFixUsers &&
                <p className="text-bold text-danger">This building has at least one active JustFix.nyc case!</p>
              }
              <b>Shell Companies:</b>
              <ul>
                {this.props.addr.corpnames.map((corp, idx) => <li key={idx}>{corp}</li> )}
              </ul>
              <b>People:</b>
              <ul>
                {this.props.addr.ownernames.map((owner, idx) => <li key={idx}>{owner.title.split(/(?=[A-Z])/).join(" ")}: {owner.value}</li> )}
              </ul>
              <div className="card-body-links">
                <a href={`http://a836-acris.nyc.gov/bblsearch/bblsearch.asp?borough=${boro}&block=${block}&lot=${lot}`} target="_blank" className="btn btn-block">View documents on ACRIS &#8599;</a>
                <a href={`http://webapps.nyc.gov:8084/CICS/fin1/find001i?FFUNC=C&FBORO=${boro}&FBLOCK=${block}&FLOT=${lot}`} target="_blank" className="btn btn-block">DOF Property Tax Bills &#8599;</a>
                <a href={`http://a810-bisweb.nyc.gov/bisweb/PropertyProfileOverviewServlet?boro=${boro}&block=${block}&lot=${lot}`} target="_blank" className="btn btn-block">DOB Building Profile &#8599;</a>
                <a href={`https://hpdonline.hpdnyc.org/HPDonline/Provide_address.aspx?p1=${boro}&p2=${this.props.addr.housenumber}&p3=${this.props.addr.streetname}&SearchButton=Search`} target="_blank" className="btn btn-block">HPD Complaints/Violations &#8599;</a>
              </div>
            </div>
          </div>
          <div className="clearfix">
            <button className="btn btn-link float-left" onClick={this.props.handleCloseDetail}>close detail view --&gt;</button>
          </div>
        </div>
      </div>
    );
  }
}
export default DetailView;
