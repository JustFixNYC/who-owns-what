import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';

import Loader from 'components/Loader';
import APIClient from 'components/APIClient';

// import 'styles/HomePage.css';

export default class BBLPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      searchBBL: { ...props.match.params }, // either {boro, block, lot} or {bbl}, based on url params
      results: null
    };
  }

  componentWillMount() {

    // handling for when url parameter is full bbl

    if (this.state.searchBBL.bbl) {
      let bbl = this.state.searchBBL.bbl;
      this.setState({
        searchBBL: {
          boro: bbl.slice(0,1),
          block: bbl.slice(1,6),
          lot: bbl.slice(6,10)
        }
      });
    }

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
      <div className="Page HomePage">
        <div className="HomePage__content">
          <div className="HomePage__search">
            <Loader classNames="Loader--centered" loading={true}>Searching</Loader>
          </div>
        </div>
      </div>
    );
  }
}
