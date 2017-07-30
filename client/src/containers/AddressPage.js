import React, { Component } from 'react';

import OwnersTable from 'components/OwnersTable';
import PropertiesMap from 'components/PropertiesMap';
import APIClient from 'components/APIClient';

import 'styles/AddressPage.css';

class AddressPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      searchAddress: { ...props.match.params },
      contacts: [],
      assocAddrs: []
    };

  }

  componentDidMount() {

    const query = this.state.searchAddress;

    APIClient.getLandlords(query).then(landlords => {

      // for each landlord/rba found, add its rba to each addr object
      // and then reduce and concatenate them
      const addrs = landlords.map(l => {
        const assocRba = `${l.businesshousenumber} ${l.businessstreetname}${l.businessapartment ? ' ' + l.businessapartment : ''}, ${l.businesszip}`;
        return l.addrs.map(a => { return { ...a, assocRba }})
      }).reduce((a,b) => a.concat(b));

      this.setState({
        assocAddrs: addrs
      });

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
    });

    APIClient.getContacts(query).then(contacts => {
      this.setState({
        contacts: contacts
      });
    });


  }

  render() {
    return (
      <div className="AddressPage">
        <div className="AddressPage__info">
          <h5>Showing results for {this.state.searchAddress.housenumber} {this.state.searchAddress.streetname}, {this.state.searchAddress.boro}:</h5>
          <OwnersTable
            contacts={this.state.contacts}
            hasJustFixUsers={this.state.hasJustFixUsers}
          />
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
