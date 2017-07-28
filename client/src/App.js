import React, { Component } from 'react';
import AddressSearch from './AddressSearch';
import OwnersTable from './OwnersTable';
import PropertiesMap from './PropertiesMap';
import APIClient from './APIClient';
import './App.css';
import 'spectre.css/dist/spectre.css';

class App extends Component {
  constructor() {
    super();

    this.state = {
      searchAddress: {
        // housenumber: '',
        // streetname: '',
        // boro: ''
        housenumber: '654',
        streetname: 'PARK PLACE',
        boro: 'BROOKLYN'
      },
      contacts: [],
      assocAddrs: []
    };

    this.formSubmitted = false;
  }

  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    const searchAddress = this.state.searchAddress;
    searchAddress[name] = value.toUpperCase();

    this.setState({
     searchAddress: searchAddress
    });
  }

  handleFormSubmit = (event) => {
    const { housenumber, streetname, boro } = this.state.searchAddress;
    const query = { housenumber, streetname, boro };

    this.formSubmitted = true;

    APIClient.getLandlords(query).then(landlords => {

      let addrs = landlords.map(l => l.addrs).reduce((a,b) => a.concat(b));

      this.setState({
        assocAddrs: addrs
      });

      // get array of bbls
      const bbls = addrs.map((addr, idx) => addr.bbl);

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

    event.preventDefault();
  }


  render() {
    return (
      <div className="App">
        <div className="App-header">
          <h2>Who owns what in nyc?</h2>
          <h5>Enter an address and find other buildings your landlord might own.</h5>
        </div>
        <div className="App-intro">
          <AddressSearch
            address={this.state.searchAddress}
            onInputChange={this.handleInputChange}
            onFormSubmit={this.handleFormSubmit}
          />
          {this.formSubmitted && !this.state.contacts.length &&
            <p className="mt-10 text-center text-bold text-large">No results found for this address... maybe try a different format?</p>
          }
          <OwnersTable
            contacts={this.state.contacts}
            hasJustFixUsers={this.state.hasJustFixUsers}
          />
          <PropertiesMap
            addrs={this.state.assocAddrs}
            currentAddr={this.state.searchAddress}
          />
        </div>
      </div>
    );
  }
}

export default App;
