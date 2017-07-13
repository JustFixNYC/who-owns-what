import React, { Component } from 'react';
import APIClient from './APIClient';
import './LandlordSearch.css';

export default class LandlordSearch extends Component {
  constructor() {
    super();

    this.state = {
      housenum: '654',
      streetname: 'PARK PLACE',
      boro: 'BROOKLYN',
      contacts: []
    };
  }

  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
     [name]: value.toUpperCase()
    });
  }

  handleSubmit = (event) => {

    APIClient.search(
      {
        housenum: this.state.housenum,
        streetname: this.state.streetname,
        boro: this.state.boro
      }, (contacts) => {
        this.setState({
          contacts: contacts
        });
      }
    );

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
      <div className="LandlordSearch">
        <form onSubmit={this.handleSubmit}>
          <label>
            Street number:
            <input
              type="text"
              name="housenum"
              value={this.state.housenum}
              onChange={this.handleInputChange}
            />
          </label>
          <label>
            Street name:
            <input
              type="text"
              name="streetname"
              value={this.state.streetname}
              onChange={this.handleInputChange}
            />
          </label>
          <label>
            Borough:
            <select name="boro" value={this.state.boro} onChange={this.handleInputChange}>
              <option value="BROOKLYN">Brooklyn</option>
              <option value="MANHATTAN">Manhattan</option>
              <option value="QUEENS">Queens</option>
              <option value="BRONX">Bronx</option>
              <option value="STATEN ISLAND">Staten Island</option>
            </select>
          </label>
          <input type="submit" value="Go" />
        </form>

        <br />
        <br />
        <table className="results">
          <thead>
            <tr>
              <th>Contact Type</th>
              <th>Corp. Name</th>
              <th>Name</th>
              <th>Business Addr.</th>
              <th>Reg. ID</th>
            </tr>
          </thead>
          <tbody>
            {contacts}
          </tbody>
        </table>
      </div>
    );
  }
}
