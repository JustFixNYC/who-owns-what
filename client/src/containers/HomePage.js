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

    this.nothingFound = /(not-found)/g.test(props.location.search);
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
          {this.nothingFound &&
            <p className="mt-10 text-center text-danger text-bold text-large">No results found for this address! It could be unformatted or not registered properly with HPD...</p>
          }
        </div>
        {this.state.searchAddress.housenumber &&
          <Redirect to={`/address/${this.state.searchAddress.boro}/${this.state.searchAddress.housenumber}/${this.state.searchAddress.streetname}`}></Redirect>
        }
      </div>
    );
  }
}

export default HomePage;
