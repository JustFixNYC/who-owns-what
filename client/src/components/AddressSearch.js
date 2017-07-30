import React, { Component } from 'react';
import 'styles/AddressSearch.css';

class AddressSearch extends Component {
  constructor() {
    super();

    this.state = {
      searchAddress: {
        housenumber: '654',
        streetname: 'PARK PLACE',
        boro: 'BROOKLYN'
      }
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

  render() {
    return (
      <div className="AddressSearch">
        <form onSubmit={(event) => this.props.onFormSubmit(event, this.state.searchAddress)}>
          <div className="form-group col-xs-12">
            <label className="form-label" htmlFor="housenumber">House number:</label>
            <input
              type="text"
              className="form-input"
              name="housenumber"
              id="housenumber"
              value={this.state.searchAddress.housenumber}
              onChange={this.handleInputChange}
            />
          </div>
          <div className="form-group col-xs-12">
            <label className="form-label" htmlFor="streetname">Street name:</label>
            <input
              type="text"
              className="form-input"
              name="streetname"
              id="streetname"
              value={this.state.searchAddress.streetname}
              onChange={this.handleInputChange}
            />
          </div>
          <div className="form-group col-xs-12">
            <label className="form-label" htmlFor="boro">Borough:</label>
            <select
              className="form-select"
              name="boro"
              id="boro"
              value={this.state.searchAddress.boro}
              onChange={this.handleInputChange}
            >
              <option value="">Choose a borough</option>
              <option value="BROOKLYN">Brooklyn</option>
              <option value="MANHATTAN">Manhattan</option>
              <option value="QUEENS">Queens</option>
              <option value="BRONX">Bronx</option>
              <option value="STATEN ISLAND">Staten Island</option>
            </select>
          </div>
          <div className="form-group">
            <input className="btn btn-primary" type="submit" value="Search" />
          </div>
        </form>
      </div>
    );
  }

}

export default AddressSearch;
