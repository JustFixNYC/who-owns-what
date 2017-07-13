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
        housenum: '654',
        streetname: 'PARK PLACE',
        boro: 'BROOKLYN'
      },
      contacts: []
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
    const { housenum, streetname, boro } = this.state;
    const query = { housenum, streetname, boro };

    APIClient.search(query, (contacts) => {
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
          <h2>Who owns what in nyc.</h2>
        </div>
        <div className="App-intro">
          <AddressSearch
            address={this.state.searchAddress}
            onInputChange={this.handleInputChange}
            onFormSubmit={this.handleFormSubmit}
          />
          <PropertiesMap />
        </div>
      </div>
    );
  }
}

export default App;
