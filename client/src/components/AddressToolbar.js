import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Modal from 'components/Modal';
import Helpers from 'util/helpers';

import 'styles/AddressToolbar.css';

export default class AddressToolbar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showExportModal: false
    }
  }

  render() {

    // fancy default syntax - if userArr is null, bbl keeps ''
    let { bbl = '' } = this.props.userAddr;
    let boro, block, lot;

    if (bbl.length) {
      ({ boro, block, lot } = Helpers.splitBBL(bbl));
    }

    return (
      <div className="AddressToolbar">
        <div className="btn-group float-right">
          {
            // <div className="dropdown">
            //   <button className="btn dropdown-toggle" tabIndex="0">
            //     Property Links &#8964;
            //   </button>
            //   <ul className="menu">
            //     <li><a href={`http://a836-acris.nyc.gov/bblsearch/bblsearch.asp?borough=${boro}&block=${block}&lot=${lot}`} target="_blank">View documents on ACRIS &#8599;</a></li>
            //     <li><a href={`http://webapps.nyc.gov:8084/CICS/fin1/find001i?FFUNC=C&FBORO=${boro}&FBLOCK=${block}&FLOT=${lot}`} target="_blank">DOF Property Tax Bills &#8599;</a></li>
            //     <li><a href={`http://a810-bisweb.nyc.gov/bisweb/PropertyProfileOverviewServlet?boro=${boro}&block=${block}&lot=${lot}`} target="_blank">DOB Property Profile &#8599;</a></li>
            //     <li><a href={`https://hpdonline.hpdnyc.org/HPDonline/Provide_address.aspx?p1=${boro}&p2=${this.props.userAddr.housenumber}&p3=${this.props.userAddr.streetname}&SearchButton=Search`} target="_blank">HPD Complaints/Violations &#8599;</a></li>
            //   </ul>
            // </div>
          }
          <button className="btn" onClick={() => this.setState({ showExportModal: true })}>
            Export Data
          </button>
          <Link className="btn" to="/">
            New Search
          </Link>
        </div>
        <Modal
          showModal={this.state.showExportModal}
          onClose={() => this.setState({ showExportModal: false })}>
          <p>This will export <b>{this.props.numOfAssocAddrs}</b> addresses associated with the landlord at <b>{this.props.userAddr.housenumber} {this.props.userAddr.streetname}, {this.props.userAddr.boro}</b>!</p>
          <p>This data is in <u>CSV file format</u>, which can easily be used in Excel, Google Sheets, or any other spreadsheet program.</p>
          <br />
          <button className="btn btn-primary centered" onClick={this.props.onExportClick}>Download</button>
        </Modal>
      </div>
    );
  }
}
