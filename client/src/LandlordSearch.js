import React, { Component } from 'react';
import APIClient from './APIClient';
import './LandlordSearch.css';

export default class LandlordSearch extends Component {
  constructor() {
    super();

    this.state = {
      housenum: '654',
      streetname: 'PARK PLACE',
      boro: 'BROOKLYN'
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

    APIClient.search(this.state, contacts => {
      console.log(contacts);
    });

    event.preventDefault();
  }

  render() {
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


        <table className="results">

        </table>
      </div>
    );
  }
}
