import React, { Component } from 'react';
import { Redirect, Link } from 'react-router-dom';

import AddressSearch from 'components/AddressSearch';
import Loader from 'components/Loader';
import APIClient from 'components/APIClient';
import LegalFooter from 'components/LegalFooter';

import 'styles/HomePage.css';

import westminsterLogo from '../assets/img/westminster.svg';
import allyearLogo from '../assets/img/allyear.png';
import silvershoreLogo from '../assets/img/silvershore.png';

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

  handleFormSubmit = (searchAddress, error) => {

    // set state (mainly to show addr on load)
    this.setState({
      searchAddress: searchAddress
    });

    window.gtag('event', 'search');

    if(error) {

      window.gtag('event', 'search-error');
      this.setState({
        results: { addrs: [] }
      });

    } else {

      // searching on HomePage allows for more clean redirects
      // as opposed to HomePage > AddressPage > NotRegisteredPage
      APIClient.searchAddress(searchAddress)
        .then(results => {
          this.setState({
            results: results
          });
        })
        .catch(err => {
          window.Rollbar.error("API error", err, searchAddress);
          this.setState({
            results: { addrs: [] }
          });
        });

    }
  }

  render() {

    // If searched and got results,
    if(this.state.results) {

      // redirect doesn't like `this` so lets make a ref
      const results = this.state.results;
      const geoclient = results.geoclient;
      const searchAddress = this.state.searchAddress;

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
            pathname: `/address/${this.state.searchAddress.boro}/${this.state.searchAddress.housenumber}/${this.state.searchAddress.streetname}`,
            state: { results }
          }}></Redirect>
        );
      }
    }


    return (
      <div className="HomePage Page">
        <div className="HomePage__content">
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
              </div>
            )}
          </div>
          <div className="HomePage__samples">
            <h5 className="text-center">... or view some sample portfolios:</h5>
            <div className="container">
              <div className="columns">
                <div className="column col-4 col-sm-12">
                  <div className="HomePage__sample">
                    <h6>Kushner Companies / Westminster Management</h6>
                    <img className="img-responsive" src={westminsterLogo} alt="Westminster" />
                    <p>
                      This property management company owned by the Kushner family is notorious for <a href="https://www.nytimes.com/2017/08/15/business/tenants-sue-kushner-companies-claiming-rent-rule-violations.html" target="_blank">violating rent regulations</a> and <a href="https://www.villagevoice.com/2017/01/12/jared-kushners-east-village-tenants-horrified-their-landlord-will-be-working-in-the-white-house/" target="_blank">harassing tenants</a>. The stake currently held by Jared Kushner and Ivanka Trump is worth as much as $761 million.
                    </p>
                    <Link className="btn block text-center" to="/address/BROOKLYN/89/HICKS%20STREET">View portfolio &#10230;</Link>
                  </div>
                </div>
                <div className="column col-4 col-sm-12">
                  <div className="HomePage__sample">
                    <h6>All Year Management</h6>
                    <img className="img-responsive" src={allyearLogo} alt="All Year" />
                    <p>
                      Yoel Goldman's All Year Management has been at the <a href="https://commercialobserver.com/2017/09/yoel-goldman-all-year-management-brooklyn-real-estate/" target="_blank">forefront of gentrification</a> in Brooklyn. Tenants in his buidlings in Williamsburg, Bushwick, and Crown Heights have been forced to live in horrendous and often dangerous conditions.
                    </p>
                    <Link className="btn block text-center" to="/address/BROOKLYN/654/PARK%20PLACE">View portfolio &#10230;</Link>
                  </div>
                </div>
                <div className="column col-4 col-sm-12">
                  <div className="HomePage__sample">
                    <h6>Silvershore Properties</h6>
                    <img className="silvershore img-responsive" src={silvershoreLogo} alt="Silvershore" />
                    <p>
                      Taking the #1 place in this year's <a href="http://landlordwatchlist.com/" target="_blank">Worst Landlord List</a>, Johnathan Cohen's buildings received over 1,000 HPD violations. Tenants in this portfolio were left "without heat, hot water or gas and surrounded by vermin, leaks and mold" for <a href="https://www.dnainfo.com/new-york/20170613/greenpoint/silvershore-properties-landlord-tenant-mold-mice-rats-hpd-dob" target="_blank">months</a> at a time.
                    </p>
                    <Link className="btn block text-center" to="/address/BROOKLYN/196/KINGSLAND%20AVENUE">View portfolio &#10230;</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <LegalFooter />
      </div>
    );
  }
}

export default HomePage;
