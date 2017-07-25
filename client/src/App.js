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
        housenumber: '',
        streetname: '',
        boro: ''
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

      const bbls = addrs.map((addr, idx) => addr.bbl);

      this.setState({
        assocAddrs: addrs
      });

      // check for JFX users
      APIClient.searchForJFXUsers(bbls, (res) => {
        this.setState({
          hasJustFixUsers: res.hasJustFixUsers
        })
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

    let hasJustFixUsersWarning = null;
    if(this.state.hasJustFixUsers) {
      hasJustFixUsersWarning = <p className="mt-10 text-center text-bold text-danger text-large">This landlord has at least one active JustFix.nyc case!</p>
    }

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
        {contacts.length > 0 && <table className="table table-striped">
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
          </table>}
        {hasJustFixUsersWarning}
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
