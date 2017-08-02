import React, { Component } from 'react';
import { Redirect, Link } from 'react-router-dom';

import OwnersTable from 'components/OwnersTable';
import PropertiesMap from 'components/PropertiesMap';
import APIClient from 'components/APIClient';

import 'styles/AddressPage.css';

class AddressPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      searchAddress: { ...props.match.params },
      hasSearched: false,
      contacts: [],
      assocAddrs: []
    };
  }

  componentDidMount() {

    const query = this.state.searchAddress;

    APIClient.searchAddress(query).then(data => {

      const { contacts, landlords } = data;

      let addrs = [];

      if(landlords.length) {
        // for each landlord/rba found, add its rba to each addr object
        // and then reduce and concatenate them
        addrs = landlords.map(l => {
          const assocRba = `${l.businesshousenumber} ${l.businessstreetname}${l.businessapartment ? ' ' + l.businessapartment : ''}, ${l.businesszip}`;
          return l.addrs.map(a => { return { ...a, assocRba }})
        }).reduce((a,b) => a.concat(b));

        // get array of bbls
        const bbls = addrs.map(addr => addr.bbl);

        // check for JFX users
        if(bbls.length) {
          APIClient.searchForJFXUsers(bbls).then(res => {
            this.setState({
              hasJustFixUsers: res.hasJustFixUsers
            })
          });
        }
      }

      this.setState({
        hasSearched: true,
        contacts: contacts.length ? contacts : [],
        assocAddrs: addrs
      });

    });
  }

  render() {

    let bbl, boro, block, lot;

    if(this.state.hasSearched && this.state.contacts.length === 0)  {
      return (
        <Redirect to={{
          pathname: '/',
          search: '?not-found=1'
        }}></Redirect>
      );
    }

    // I don't like where this is living atm. But fuck it ship it
    if (this.state.contacts.length) {
      bbl = this.state.contacts[0].bbl.split('');
      boro = bbl.slice(0,1).join('');
      block = bbl.slice(1,6).join('');
      lot = bbl.slice(6,10).join('');
    }




    return (
      <div className="AddressPage">
        <div className="AddressPage__info">
          <div className="btn-group float-right">
            {this.state.contacts.length ? (
                <div className="dropdown">
                  <a href="#" className="btn dropdown-toggle" tabIndex="0">
                    Property Links &#8964;
                  </a>
                  <ul className="menu">
                    <li><a href={`http://a836-acris.nyc.gov/bblsearch/bblsearch.asp?borough=${boro}&block=${block}&lot=${lot}`} target="_blank">View documents on ACRIS &#8599;</a></li>
                    <li><a href={`http://a810-bisweb.nyc.gov/bisweb/PropertyProfileOverviewServlet?boro=${boro}&block=${block}&lot=${lot}`} target="_blank">DOB Property Profile &#8599;</a></li>
                    <li><a href={`https://hpdonline.hpdnyc.org/HPDonline/Provide_address.aspx?p1=${boro}&p2=${this.state.searchAddress.housenumber}&p3=${this.state.searchAddress.streetname}&SearchButton=Search`} target="_blank">HPD Complaints/Violations &#8599;</a></li>
                  </ul>
                </div>
              ) : null
            }
            <Link className="btn" to="/">
              New Search
            </Link>
          </div>



          <h5 className="primary">Landlord info for {this.state.searchAddress.housenumber} {this.state.searchAddress.streetname}, {this.state.searchAddress.boro}:</h5>
          <OwnersTable
            contacts={this.state.contacts}
            hasJustFixUsers={this.state.hasJustFixUsers}
          />
          <h5 className="inline-block">We found <i>{this.state.assocAddrs.length}</i> associated buildings:</h5>
          <p className="inline-block float-right"><i>&nbsp;(click on a building to view details)</i></p>

        </div>
        <PropertiesMap
          addrs={this.state.assocAddrs}
          userAddr={this.state.searchAddress}
        />
      </div>
    );
  }
}

export default AddressPage;
