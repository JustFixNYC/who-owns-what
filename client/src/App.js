import React, { Component } from 'react';
import AddressSearch from './AddressSearch';
import PropertiesMap from './PropertiesMap';
import APIClient from './APIClient';
import './App.css';
import 'spectre.css/dist/spectre.css';

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

    APIClient.getContacts(query, (contacts) => {
      this.setState({
        contacts: contacts
      });
    });

    event.preventDefault();
  }


  render() {

    const contacts = this.state.contacts.map((contact, idx) => (
      <tr key={idx}>
        <td>{contact.registrationcontacttype}</td>
        <td>{contact.corporationname}</td>
        <td>{contact.firstname + ' ' + contact.lastname}</td>
        <td>
          {contact.bisnum + ' ' +
            contact.bisstreet + ' ' +
            '#' + contact.bisapt + ', ' +
            contact.biszip}
        </td>
        <td>{contact.registrationid}</td>
      </tr>
    ));

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
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Type</th>
                <th>Corp. Name</th>
                <th>Name</th>
                <th>Business Address</th>
                <th>Reg. ID</th>
              </tr>
            </thead>
            <tbody>
              {contacts}
            </tbody>
          </table>
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
