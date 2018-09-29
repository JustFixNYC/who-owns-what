import React, { Component } from 'react';
import Helpers from 'util/helpers';

import Loader from 'components/Loader';
import APIClient from 'components/APIClient';

import 'styles/PropertiesSummary.css';

const VIOLATIONS_AVG = 0.7; // By Unit

// 1588195 open violations according to wow_bldgs
// 2299803 total units in registered buildings, according to wow_bldgs 

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
            <div className="PropertiesSummary__content Page__content">
              <h6>General info</h6>
              <p>
                There are <b>{agg.bldgs}</b> buildings in this portfolio with a total of <b>{agg.units}</b> units. The average age of these buildings is <b>{agg.age}</b> years old.
              </p>
              <aside>
                {agg.violationsaddr && (
                  <figure className="figure">
                    <img src={`https://maps.googleapis.com/maps/api/streetview?size=800x500&location=${agg.violationsaddr.lat},${agg.violationsaddr.lng}&key=AIzaSyCJKZm-rRtfREo2o-GNC-feqpbSvfHNB5s`}
                           alt="Google Street View" className="img-responsive"  />
                    <figcaption className="figure-caption text-center text-italic">
                      {agg.violationsaddr.housenumber} {agg.violationsaddr.streetname}, {agg.violationsaddr.boro} currently has {agg.violationsaddr.openviolations} open HPD violations - the most in this portfolio.
                    </figcaption>
                  </figure>
                )}

              </aside>
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
                This portfolio has an average of <b>{agg.openviolationsperresunit}</b> open HPD violations per residential unit. 
                This is {(agg.openviolationsperresunit >= VIOLATIONS_AVG - 0.05 && agg.openviolationsperresunit < VIOLATIONS_AVG + 0.05)
                         ? <span><b>about the same</b> as the citywide average. </span>
                         : <span><b>{agg.openviolationsperresunit > VIOLATIONS_AVG ? 'worse' : 'better'}</b> than the citywide average of {VIOLATIONS_AVG} per residential unit. </span>}
                According to available HPD data, this portfolio has received <b>{agg.totalviolations}</b> total violations.
              </p>
              <h6>Evictions</h6>
              <p>
                In 2017, NYC Marshals scheduled <b>{agg.totalevictions > 0 ? agg.totalevictions : "0"}</b> eviction{agg.totalevictions == 1 ? "" : "s"} across this portfolio. 
                {agg.totalevictions > 0 ? 
                  <span> The building with the most evictions was&nbsp;
                    {agg.evictionsaddr && (
                      <span>
                        <b>{agg.evictionsaddr.housenumber} {agg.evictionsaddr.streetname}, {agg.evictionsaddr.boro}</b> with <b>{agg.evictionsaddr.evictions}</b> eviction{agg.totalevictions == 1 ? "" : "s"} that year
                      </span>
                    )}. 
                  </span> : ""} 
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
            </div>
          )}
        </div>
    );
  }
}
