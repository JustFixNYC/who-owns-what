import React, { Component } from 'react';
import { Redirect, Link } from 'react-router-dom';

import Loader from 'components/Loader';
import APIClient from 'components/APIClient';

// import 'styles/HomePage.css';

export default class BBLPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      searchBBL: { ...props.match.params },
      results: null
    };
  }

  componentDidMount() {

    window.gtag('event', 'direct-link');
    APIClient.searchBBL(this.state.searchBBL)
      .then(results => {
        this.setState({
          results: results
        });
      })
      .catch(err => {
        window.Rollbar.error("API error", err, this.state.searchBBL);
        this.setState({
          results: { addrs: [] }
        });
      });
  }

  render() {

    // If searched and got results,
    if(this.state.results) {

      // redirect doesn't like `this` so lets make a ref
      const results = this.state.results;
      const geoclient = results.geoclient;
      let searchAddress = {};
      if(geoclient) {
        searchAddress.housenumber = geoclient.giLowHouseNumber1;
        searchAddress.streetname = geoclient.giStreetName1;
        searchAddress.boro = geoclient.firstBoroughName;
      }

      // no addrs = not found
      if(!this.state.results.addrs || !this.state.results.addrs.length) {
        window.gtag('event', 'search-notfound');
        return (
          <Redirect to={{
            pathname: '/not-found',
            state: { geoclient, searchAddress }
          }}></Redirect>
        );

      // lets redirect to AddressPage and pass the results along with us
      } else {
        window.gtag('event', 'search-found', { 'value': this.state.results.addrs.length });
        return (
          <Redirect to={{
            pathname: `/address/${searchAddress.boro}/${searchAddress.housenumber}/${searchAddress.streetname}`,
            state: { results }
          }}></Redirect>
        );
      }
    }


    return (
      <div>
        <div className="HomePage__search">
          <Loader loading={true}>Searching...</Loader>
        </div>
      </div>
    );
  }
}
