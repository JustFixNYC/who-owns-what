import React, { Component } from 'react';
import { Redirect, Link } from 'react-router-dom';

import AddressSearch from 'components/AddressSearch';
import Loader from 'components/Loader';
import APIClient from 'components/APIClient';

import 'styles/HomePage.css';

class HomePage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      searchAddress: {
        housenumber: '',
        streetname: '',
        boro: ''
      },
      results: null
    };
  }

  handleFormSubmit = (searchAddress) => {

    // set state (mainly to show addr on load)
    this.setState({
      searchAddress: searchAddress
    });

    // searching on HomePage allows for more clean redirects
    // as opposed to HomePage > AddressPage > NotRegisteredPage
    APIClient.searchAddress(searchAddress).then(results => {
      this.setState({
        results: results
      });
    })
  }

  render() {

    // If searched and got results,
    if(this.state.results) {

      // redirect doesn't like `this` so lets make a ref
      const results = this.state.results;
      const geoclient = results.geoclient;
      const searchAddress = this.state.searchAddress;

      // no addrs = not found
      if(!this.state.results.addrs.length) {
        return (
          <Redirect to={{
            pathname: '/not-found',
            state: { geoclient, searchAddress }
          }}></Redirect>
        );

      // lets redirect to AddressPage and pass the results along with us
      } else {
        return (
          <Redirect to={{
            pathname: `/address/${this.state.searchAddress.boro}/${this.state.searchAddress.housenumber}/${this.state.searchAddress.streetname}`,
            state: { results }
          }}></Redirect>
        );
      }
    }


    return (
      <div>
        <div className="HomePage__search">
          { this.state.searchAddress.housenumber ? (
            <Loader loading={true} >Searching for <b>{this.state.searchAddress.housenumber} {this.state.searchAddress.streetname}, {this.state.searchAddress.boro}</b></Loader>
          ) : (
            <div>
              <h5 className="text-center">Enter an address and find other buildings your landlord might own:</h5>
              <AddressSearch
                { ...this.state.searchAddress }
                onFormSubmit={this.handleFormSubmit}
              />
              <Link className="block text-center" to="/address/BROOKLYN/654/PARK%20PLACE">View a sample building</Link>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default HomePage;
