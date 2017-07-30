import React, { Component } from 'react';
import { Redirect } from 'react-router-dom'

import AddressSearch from 'components/AddressSearch';

class HomePage extends Component {
  constructor() {
    super();

    this.state = {
      searchAddress: {},
      formSubmitted: false
    };

  }

  handleFormSubmit = (event, searchAddress) => {
    // const { housenumber, streetname, boro } = searchAddress;

    this.setState({
      searchAddress: searchAddress,
      formSubmitted: true
    });

    event.preventDefault();
  }

  render() {
    return (
      <div>
        <h5 className="text-center">Enter an address and find other buildings your landlord might own:</h5>
        <AddressSearch onFormSubmit={this.handleFormSubmit} />
        {this.state.formSubmitted &&
          <Redirect to={`/address/${this.state.searchAddress.boro}/${this.state.searchAddress.housenumber}/${this.state.searchAddress.streetname}`}></Redirect>
        }
      {  // {this.formSubmitted && !this.state.contacts.length &&
        //   <p className="mt-10 text-center text-bold text-large">No results found for this address... maybe try a different format?</p>
        // }
      }
      </div>
    );
  }
}

export default HomePage;
