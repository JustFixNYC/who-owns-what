import React, { Component } from 'react';
import AddressSearch from './AddressSearch';
import PropertiesMap from './PropertiesMap';
import APIClient from './APIClient';
import './App.css';

class App extends Component {
  constructor() {
    super();

    this.state = {
      searchAddress: {
        housenumber: '980',
        streetname: 'BERGEN STREET',
        boro: 'BROOKLYN'
      },
      contacts: [],
      assocAddrs: []
    };
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

    APIClient.getBizAddresses(query, (addrs) => {
      this.setState({
        assocAddrs: addrs
      });
    });

    event.preventDefault();
  }


  render() {
    return (
      <div className="App">
        <div className="App-header">
          <h2>Who owns what in nyc?</h2>
          <p>Enter an address and find other buildings your landlord might own.</p>
        </div>
        <div className="App-intro">
          <AddressSearch
            address={this.state.searchAddress}
            onInputChange={this.handleInputChange}
            onFormSubmit={this.handleFormSubmit}
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
