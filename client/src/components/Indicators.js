import React, { Component } from 'react';

import Loader from 'components/Loader';
import LegalFooter from 'components/LegalFooter';
import APIClient from 'components/APIClient';

import 'styles/PropertiesSummary.css';

export default class Indicators extends Component {
  constructor(props) {
    super(props);

    this.state = { agg: null };
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
    if(nextProps.isVisible && this.props.userAddr && !this.state.agg) {
      APIClient.getAggregate(this.props.userAddr.bbl)
        .then(results => this.setState({ agg: results.result[0] }))
        .catch(err => console.error(err));
    }
  }

  render() {
    let agg = this.state.agg;

    return (
      <div className="Page PropertiesSummary">
        <div className="PropertiesSummary__content Page__content">
        </div>
        <LegalFooter position="inside" />
      </div>
    );
  }
}