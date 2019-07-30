import React, { Component } from 'react';
import { Redirect, Link } from 'react-router-dom';

import Loader from 'components/Loader';
import APIClient from 'components/APIClient';
import EngagementPanel from 'components/EngagementPanel';
import LegalFooter from 'components/LegalFooter';

import 'styles/HomePage.css';

import westminsterLogo from '../assets/img/westminster.svg';
import allyearLogo from '../assets/img/allyear.png';
import emLogo from '../assets/img/emassociates.jpg';
import AddressSearch, { makeEmptySearchAddress } from '../components/AddressSearch';

class HomePage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      searchAddress: makeEmptySearchAddress(),
      results: null,
      sampleURLs: ['/address/BROOKLYN/89/HICKS%20STREET',
                   '/address/MANHATTAN/2006/ADAM%20CLAYTON%20POWELL%20JR%20BOULEVARD',
                   '/address/BROOKLYN/196/RALPH%20AVENUE']
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

      // no addrs = not found
      if(!this.state.results.addrs || !this.state.results.addrs.length) {
        window.gtag('event', 'search-notfound');

      // lets redirect to AddressPage and pass the results along with us
      } else {
        window.gtag('event', 'search-found', { 'value': this.state.results.addrs.length });
      }
      return (
        <Redirect push to={{
          pathname: `/address/${this.state.searchAddress.boro}/${this.state.searchAddress.housenumber}/${this.state.searchAddress.streetname}`,
          state: { results }
        }}></Redirect>
      );
    }

    const labelText = "Enter an NYC address and find other buildings your landlord might own:";

    return (
      <div className="HomePage Page">
        <div className="HomePage__content">
          <div className="HomePage__search">
            { this.state.searchAddress.housenumber ? (
              <Loader loading={true} >Searching for <b>{this.state.searchAddress.housenumber} {this.state.searchAddress.streetname}, {this.state.searchAddress.boro}</b></Loader>
            ) : (
              <div>
                <h5 className="text-center">{labelText}</h5>
                <AddressSearch
                  { ...this.state.searchAddress }
                  labelText={labelText}
                  labelClass="text-assistive"
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
                    <h6>
                      <Link to={this.state.sampleURLs[0]} onClick={() => {window.gtag('event', 'example-portfolio-1-homepage');}} >
                        Kushner Companies / Westminster Management
                      </Link>
                    </h6>
                    <Link to={this.state.sampleURLs[0]} onClick={() => {window.gtag('event', 'example-portfolio-1-homepage');}} >
                      <img className="img-responsive" src={westminsterLogo} alt="Westminster" />
                    </Link>
                    <p>
                      This property management company owned by the Kushner family is notorious for <a href="https://www.nytimes.com/2017/08/15/business/tenants-sue-kushner-companies-claiming-rent-rule-violations.html" target="_blank" rel="noopener noreferrer">violating rent regulations</a> and <a href="https://www.villagevoice.com/2017/01/12/jared-kushners-east-village-tenants-horrified-their-landlord-will-be-working-in-the-white-house/" target="_blank" rel="noopener noreferrer">harassing tenants</a>. The stake currently held by Jared Kushner and Ivanka Trump is worth as much as $761 million.
                    </p>
                    <Link className="btn block text-center" to={this.state.sampleURLs[0]} onClick={() => {window.gtag('event', 'example-portfolio-1-homepage');}} >View portfolio &#10230;</Link>
                  </div>
                </div>
                <div className="column col-4 col-sm-12">
                  <div className="HomePage__sample">
                    <h6>
                      <Link to={this.state.sampleURLs[1]}  onClick={() => {window.gtag('event', 'example-portfolio-2-homepage');}} >
                        E&M Associates
                      </Link>
                    </h6>
                    <Link to={this.state.sampleURLs[1]} onClick={() => {window.gtag('event', 'example-portfolio-2-homepage');}} >
                      <img className="emassoc img-responsive" src={emLogo} alt="E&M Associates" />
                    </Link>
                    <p>
                      E&M Associates was <a href="https://www.nytimes.com/interactive/2018/05/20/nyregion/nyc-affordable-housing.html" target="_blank" rel="noopener noreferrer">reported in the New York Times</a> as a prime example of a landlord who engages in aggresive eviction strategies to displace low-income tenants. In <a href="https://en.wikipedia.org/wiki/Dunbar_Apartments" target="_blank" rel="noopener noreferrer">one of their buildings</a>, they sued at least 250 rent-regulated tenants in under five years — using tactics like lack of repairs and frivolous evictions.
                    </p>
                    <Link className="btn block text-center" to={this.state.sampleURLs[1]} onClick={() => {window.gtag('event', 'example-portfolio-2-homepage');}} >View portfolio &#10230;</Link>
                  </div>
                </div>
                <div className="column col-4 col-sm-12">
                  <div className="HomePage__sample">
                    <h6>
                      <Link to={this.state.sampleURLs[2]} onClick={() => {window.gtag('event', 'example-portfolio-1-homepage');}} >
                        All Year Management
                      </Link>
                    </h6>
                      <Link to={this.state.sampleURLs[2]} onClick={() => {window.gtag('event', 'example-portfolio-1-homepage');}} >
                        <img className="img-responsive" src={allyearLogo} alt="All Year" />
                      </Link>
                    <p>
                      Yoel Goldman's All Year Management has been at the <a href="https://commercialobserver.com/2017/09/yoel-goldman-all-year-management-brooklyn-real-estate/" target="_blank" rel="noopener noreferrer">forefront of gentrification</a> in Brooklyn. Tenants in his buidlings in Williamsburg, Bushwick, and Crown Heights have been forced to live in horrendous and often dangerous conditions.
                    </p>
                    <Link className="btn block text-center" to={this.state.sampleURLs[2]} onClick={() => {window.gtag('event', 'example-portfolio-3-homepage');}} >View portfolio &#10230;</Link>
                  </div>
                </div>

              </div>
            </div>
          </div>
          <EngagementPanel location="homepage" />
        </div>
        <LegalFooter />
      </div>
    );
  }
}

export default HomePage;
