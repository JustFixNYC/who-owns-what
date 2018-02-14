import React, { Component } from 'react';
import Helpers from 'util/helpers';

import Loader from 'components/Loader';
import APIClient from 'components/APIClient';

import 'styles/PropertiesSummary.css';

const VIOLATIONS_AVG = 13.8;

export default class PropertiesSummary extends Component {
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
        <div className="PropertiesSummary">
          { !this.state.agg ? (
            <Loader loading={true} classNames="Loader-map">Loading</Loader>
          ) : (
            <div className="container">
              <div className="columns">
                <div className="PropertiesSummary__content column col-7 col-mr-auto">
                  <h6>General info</h6>
                  <p>
                    There are <b>{agg.bldgs}</b> buildings in this portfolio with a total of <b>{agg.units}</b> units. The average age of these buildings is <b>{agg.age}</b> years old.
                  </p>
                  <h6>Landlord</h6>
                  <p>The most common names that appear in this portfolio are
                    <b>{agg.topowners && agg.topowners.map((owner,idx) => {
                      return (
                        <span key={idx}>
                          {!idx ? " " : idx < agg.topowners.length - 1 ? ", " : ", and "}
                          {owner}
                        </span>
                      );
                    })}</b>.
                    The most common corporate entity is <b>{agg.topcorp || `n/a`}</b> and the most common business address is <b>{agg.topbusinessaddr || `n/a`}</b>.
                  </p>
                  <h6>Maintenance code violations</h6>
                  <p>
                    This portfolio has an average of <b>{agg.openviolationsperbldg}</b> open HPD violations per building. This is <b>{agg.openviolationsperbldg > VIOLATIONS_AVG ? 'worse' : 'better'}</b> than the citywide average of {VIOLATIONS_AVG}. According to available HPD data, this portfolio has received <b>{agg.totalviolations}</b> total violations.
                  </p>
                  <h6>Eviction filings</h6>
                  <p>
                    From January 2013 to June 2015, there were an average of <b>{agg.avgevictions}</b> eviction proceedings per building filed in housing court.
                  </p>
                  <h6>Rent stabilization</h6>
                  <p>
                    This portfolio has also <b>{agg.totalrsdiff > 0 ? "gained" : "lost"}</b> an estimated <b>{Math.abs(parseInt(agg.totalrsdiff, 10))}</b> rent stabilized units since 2007. This represents <b>{agg.rsproportion}%</b> of the total size of this portfolio. The building that has lost the most units is&nbsp;
                    {agg.rslossaddr && (
                      <b>
                        {agg.rslossaddr.housenumber} {agg.rslossaddr.streetname}, {agg.rslossaddr.boro}
                      </b>
                    )}
                    , which has lost <b>{agg.rslossaddr && Math.abs(parseInt(agg.rslossaddr.rsdiff, 10))}</b> units in the past 10 years.
                  </p>
                  {agg.hasjustfix && (
                    <p className="text-justfix">
                      <br />
                      Our records indicate that some of the buildings in this portfolio have active JustFix.nyc cases. Please <a className="text-bold" href={`mailto:support@justfix.nyc?subject=Outreach request for ${this.props.userAddr.housenumber} ${this.props.userAddr.streetname}, ${this.props.userAddr.boro}`} target="_blank">contact us</a> about conducting outreach!
                    </p>
                  )}
                </div>
                <div className="column col-3">
                  {agg.violationsaddr && (
                    <figure className="figure">
                      <img src={`https://maps.googleapis.com/maps/api/streetview?size=800x500&location=${agg.violationsaddr.lat},${agg.violationsaddr.lng}&key=AIzaSyCJKZm-rRtfREo2o-GNC-feqpbSvfHNB5s`}
                             alt="Google Street View" className="img-responsive"  />
                      <figcaption className="figure-caption text-center text-italic">
                        {agg.violationsaddr.housenumber} {agg.violationsaddr.streetname}, {agg.violationsaddr.boro} currently has {agg.violationsaddr.openviolations} open HPD violations - the most in this portfolio.
                      </figcaption>
                    </figure>
                  )}

                </div>
              </div>
            </div>
          )}
        </div>
    );
  }
}
