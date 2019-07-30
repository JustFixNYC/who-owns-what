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

    else if (this.state.searchBBL.boro && this.state.searchBBL.block && this.state.searchBBL.lot) {
      const searchBBL = {
        boro: this.state.searchBBL.boro,
        block: this.state.searchBBL.block.padStart(5,'0'),
        lot: this.state.searchBBL.lot.padStart(4,'0')
      };

      this.setState({
        searchBBL: searchBBL
      });
    }

  }


  componentDidMount() {

    window.gtag('event', 'direct-link');

    const bbl = this.state.searchBBL.boro + this.state.searchBBL.block + this.state.searchBBL.lot;

    APIClient.getBuildingInfo(bbl)
      .then(results => {
        if(!(results.result && results.result.length > 0 )) {
          this.setState({
            results: null
          });
        }
        else {
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
      })
      .catch(err => {window.Rollbar.error("API error: Building Info", err, bbl);}
    );

  }

  render() {

    // If searched and got results,
    if(this.state.results) {

      // redirect doesn't like `this` so lets make a ref
      const results = this.state.results;

      // if(geosearch) {
      //   searchAddress.housenumber = geosearch.giLowHouseNumber1;
      //   searchAddress.streetname = geosearch.giStreetName1;
      //   searchAddress.boro = geosearch.firstBoroughName;
      // }

      // no addrs = not found
      if(!this.state.results) {
        
        window.gtag('event', 'search-notfound');
        return (
          <NotRegisteredPage/>
        );
      // lets redirect to AddressPage and pass the results along with us
      } else {
        window.gtag('event', 'search-found', { 'value': this.state.results.addrs.length });
        const searchAddress = this.state.results.addrs.find( (element) => (element.bbl === this.state.searchBBL.boro + this.state.searchBBL.block + this.state.searchBBL.lot));
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
