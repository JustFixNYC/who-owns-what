import React, { Component } from 'react';

import Loader from 'components/Loader';
import LegalFooter from 'components/LegalFooter';
import APIClient from 'components/APIClient';

import 'styles/PropertiesSummary.css';

export default class Indicators extends Component {
  constructor(props) {
    super(props);

    this.state = { saleHistory: null };
  }

  // componentDidMount() {
  //
  //   APIClient.getAggregate(this.props.userAddr.bbl)
  //     .then(results => {
  //       console.log(results.result[0]);
  //       this.setState({ agg: results[0] });
  //     })
  //     .catch(err => console.error(err));
  //
  // }

  componentWillReceiveProps(nextProps) {

    // make the api call when we come into view and have
    // the user addrs bbl
    if(nextProps.isVisible && this.props.userAddr && !this.state.saleHistory) {
      APIClient.getSaleHistory(this.props.userAddr.bbl)
        .then(results => this.setState({ saleHistory: results.result }))
        .catch(err => console.error(err));
    }
  }

  render() {
    return (
      <div className="Page PropertiesSummary">
        <div className="PropertiesSummary__content Page__content">
          { !this.state.saleHistory ? (
              <Loader loading={true} classNames="Loader-map">Loading</Loader>
            ) : 
          (
            <div>
              <h3>Recent Sales:</h3> 
              <ul>
                {this.state.saleHistory && 
                  this.state.saleHistory.map((record, idx) => <li key={idx}>{record.recordedfiled}</li> )}
              </ul>
            </div>
          )
          }
        </div>
        <LegalFooter position="inside" />
      </div>
    );
  }
}