import React, { Component } from 'react';
import Helpers from 'util/helpers';

import Loader from 'components/Loader';
import APIClient from 'components/APIClient';

import 'styles/PropertiesSummary.css';

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
          { this.state.agg && (
            <div className="container">
              <div className="columns">
                <div className="PropertiesSummary__content column col-7 col-mr-auto">
                  <p>
                    There are <b>{agg.bldgs}</b> buildings in this portfolio with a total of <b>{agg.units}</b> units. The average age of these buildings is <b>{agg.age}</b> years old.
                  </p>
                  <p>The most common names that appear on this portfolio are
                    <b>{agg.topowners && agg.topowners.map((owner,idx) => {
                      return (
                        <span key={idx}>
                          {!idx ? " " : idx < agg.topowners.length - 1 ? ", " : ", and "}
                          {owner}
                        </span>
                      );
                    })}</b>.
                    The most common corporate entity is <b>{agg.topcorp}</b> and the most common business address is <b>{agg.topbusinessaddr}</b>.
                  </p>
                  <p>
                    This portfolio has an average of <b>{agg.openviolationsperbldg}</b> open HPD Violations per building. This is <b>much worse</b> than the citywide average of 3.47. Since 2015, this portfolio has received <b>{agg.totalviolations}</b> total violations.
                  </p>
                  <p>
                    From January 2013 to June 2015, there were an average of <b>{agg.avgevictions}</b> eviction proceedings per building filed in housing court. This is <b>much worse</b> compared to the citywide average of 1.34 during this time period.
                  </p>
                  <p>
                    This portfolio has also <b>{agg.totalrsdiff > 0 ? "gained" : "lost"}</b> an estimated <b>{Math.abs(parseInt(agg.totalrsdiff, 10))}</b> rent stabilized units since 2007. This represents an average change of <b>{agg.avgrspercent}</b> per building. The building that has lost the most units is&nbsp;
                    {agg.rslossaddr && (
                      <b>
                        {agg.rslossaddr.housenumber} {agg.rslossaddr.streetname}, {agg.rslossaddr.boro}
                      </b>
                    )}
                    , which has lost <b>{agg.rslossaddr && agg.rslossaddr.rsdiff}</b> units in the past 10 years.
                  </p>
                  {agg.hasjustfix && (
                    <p>
                      Our records indicate that some of the buildings in this portfolio have active JustFix.nyc cases. Please <a className="text-bold" href={`mailto:hello@justfix.nyc?subject=Outreach request for ${this.props.userAddr.housenumber} ${this.props.userAddr.streetname}, ${this.props.userAddr.boro}`} target="_blank">contact us</a> about conducting outreach!
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
