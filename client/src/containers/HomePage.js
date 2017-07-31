import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';

import AddressSearch from 'components/AddressSearch';

import 'styles/HomePage.css';

class HomePage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      searchAddress: {}
    };

    this.nothingFound = /(not-found)/g.test(props.location.search);

  }

  handleFormSubmit = (event, searchAddress) => {

    this.setState({
      searchAddress: searchAddress
    });

    event.preventDefault();
  }

  render() {
    return (
      <div>
        <div className="HomePage__search">
          <h5 className="text-center">Enter an address and find other buildings your landlord might own:</h5>
          <AddressSearch onFormSubmit={this.handleFormSubmit} />
          {this.nothingFound &&
            <p className="mt-10 text-center text-danger text-bold text-large">No results found for this address... maybe try a different format?</p>
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
