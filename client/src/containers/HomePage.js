import React, { Component } from 'react';
import { Redirect, Link } from 'react-router-dom';

import AddressSearch from 'components/AddressSearch';

import 'styles/HomePage.css';

class HomePage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      searchAddress: {
        housenumber: '',
        streetname: '',
        boro: ''
      }
    };
  }

  handleFormSubmit = (searchAddress) => {
    console.log('searching...', searchAddress);
    this.setState({
      searchAddress: searchAddress
    });
    // event.preventDefault();
  }

  render() {
    return (
      <div>
        <div className="HomePage__search">
          <h5 className="text-center">Enter an address and find other buildings your landlord might own:</h5>
          <AddressSearch
            { ...this.state.searchAddress }
            onFormSubmit={this.handleFormSubmit}
          />
          <Link className="block text-center" to="/address/BROOKLYN/654/PARK%20PLACE">View a sample building</Link>
        </div>
        {this.state.searchAddress.housenumber &&
          <Redirect to={`/address/${this.state.searchAddress.boro}/${this.state.searchAddress.housenumber}/${this.state.searchAddress.streetname}`}></Redirect>
        }
      </div>
    );
  }
}

export default HomePage;
