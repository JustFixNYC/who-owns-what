import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';

import Loader from 'components/Loader';
import APIClient from 'components/APIClient';
import NotRegisteredPage from './NotRegisteredPage';

// import 'styles/HomePage.css';

export default class BBLPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      searchBBL: { ...props.match.params }, // either {boro, block, lot} or {bbl}, based on url params
      results: null,
      bblExists: null,
      foundAddress: {
        boro: null,
        housenumber: null,
        streetname: null
      }
    };
  }


  componentDidMount() {

    window.gtag('event', 'direct-link');

    var fullBBL;

    // handling for when url parameter is full bbl
    if (this.state.searchBBL.bbl) {

      fullBBL = this.state.searchBBL.bbl;

      this.setState({
        searchBBL: {
          boro: fullBBL.slice(0,1),
          block: fullBBL.slice(1,6),
          lot: fullBBL.slice(6,10)
        }
      });
    }

    else if (this.state.searchBBL.boro && this.state.searchBBL.block && this.state.searchBBL.lot) {
      const searchBBL = {
        boro: this.state.searchBBL.boro,
        block: this.state.searchBBL.block.padStart(5,'0'),
        lot: this.state.searchBBL.lot.padStart(4,'0')
      };

      fullBBL = searchBBL.boro + searchBBL.block + searchBBL.lot;

      this.setState({
        searchBBL: searchBBL
      });

    }

    APIClient.getBuildingInfo(fullBBL)
      .then(results => {
        if(!(results.result && results.result.length > 0 )) {
          this.setState({
            bblExists: false
          });
        }
        else {
          this.setState({
            bblExists: true,
            foundAddress: {
              boro: results.result[0].boro,
              housenumber: results.result[0].housenumber,
              streetname: results.result[0].streetname
            }
          });
        }
      })
      .catch(err => {window.Rollbar.error("API error: Building Info", err, fullBBL);}
    );
  }

  componentDidUpdate(prevProps, prevState) {


    if (!prevState.bblExists && this.state.bblExists) {
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
  }



  render() {

    if(this.state.bblExists === false) {
      window.gtag('event', 'search-notfound');
        return (
          <NotRegisteredPage/>
        );
    }

    // If searched and got results,
    else if(this.state.bblExists && this.state.results && this.state.results.addrs) {

      // redirect doesn't like `this` so lets make a ref
      const results = this.state.results;

      // if(geosearch) {
      //   searchAddress.housenumber = geosearch.giLowHouseNumber1;
      //   searchAddress.streetname = geosearch.giStreetName1;
      //   searchAddress.boro = geosearch.firstBoroughName;
      // }

      var addressForURL;
      if (results.addrs.length > 0) {
        window.gtag('event', 'search-found', { 'value': this.state.results.addrs.length });
        addressForURL = this.state.results.addrs.find( (element) => (element.bbl === this.state.searchBBL.boro + this.state.searchBBL.block + this.state.searchBBL.lot));
      }
      else {
        window.gtag('event', 'search-notfound');
        addressForURL = this.state.foundAddress;
      }
        
        //= this.state.results.addrs.find( (element) => (element.bbl === this.state.searchBBL.boro + this.state.searchBBL.block + this.state.searchBBL.lot));
        return (
          <Redirect to={{
            pathname: `/address/` + addressForURL.boro + `/`
            + (addressForURL.housenumber ? addressForURL.housenumber : ` `) + `/`
            + addressForURL.streetname,
            state: { results }
          }}></Redirect>
        );
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
