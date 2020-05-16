import React, { Component } from "react";
import { Trans, Plural } from "@lingui/macro";

import Loader from "components/Loader";
import LegalFooter from "components/LegalFooter";
import APIClient from "components/APIClient";

import "styles/PropertiesSummary.css";
import { EvictionsSummary } from "./EvictionsSummary";
import { RentstabSummary } from "./RentstabSummary";
import helpers from "../util/helpers";
import { StringifyListWithConjunction } from "./StringifyList";
import { SocialSharePortfolio } from "./SocialShare";

const VIOLATIONS_AVG = 0.7; // By Unit

// 1656793 open violations according to wow_bldgs
// 2331139 total units in registered buildings, according to wow_bldgs

// Data updated 6/6/19

export default class PropertiesSummary extends Component {
  constructor(props) {
    super(props);

    this.state = { agg: null };
  }

  componentDidUpdate(prevProps, prevState) {
    // make the api call when we come into view and have
    // the user addrs bbl
    if (this.props.isVisible && this.props.userAddr && !this.state.agg) {
      APIClient.getAggregate(this.props.userAddr.bbl)
        .then((results) => this.setState({ agg: results.result[0] }))
        .catch((err) => console.error(err));
    }
  }

  render() {
    let agg = this.state.agg;
    let { bldgs, units, age } = agg || {};

    bldgs = helpers.coerceToInt(bldgs, 0);

    return (
      <div className="Page PropertiesSummary">
        <div className="PropertiesSummary__content Page__content">
          {!this.state.agg ? (
            <Loader loading={true} classNames="Loader-map">
              Loading
            </Loader>
          ) : (
            <div>
              <Trans render="h6">General info</Trans>
              <p>
                <Trans>
                  There{" "}
                  <Plural
                    value={bldgs}
                    one={
                      <span>
                        is <b>1</b> building
                      </span>
                    }
                    other={
                      <span>
                        are <b>{bldgs}</b> buildings
                      </span>
                    }
                  />{" "}
                  in this portfolio with a total of{" "}
                  <Plural value={units} one="1 unit" other="# units" />.
                </Trans>
                {` `}
                <Trans>
                  The <Plural value={bldgs} one="" other="average" /> age of{" "}
                  <Plural value={bldgs} one="this building" other="these buildings" /> is{" "}
                  <b>{age}</b> years old.
                </Trans>
              </p>
              <aside>
                {agg.violationsaddr && (
                  <figure className="figure">
                    <img
                      src={`https://maps.googleapis.com/maps/api/streetview?size=800x500&location=${agg.violationsaddr.lat},${agg.violationsaddr.lng}&key=${process.env.REACT_APP_STREETVIEW_API_KEY}`}
                      alt="Google Street View"
                      className="img-responsive"
                    />
                    <figcaption className="figure-caption text-center text-italic">
                      <Trans>
                        {agg.violationsaddr.housenumber} {agg.violationsaddr.streetname},{" "}
                        {agg.violationsaddr.boro} currently has{" "}
                        <Plural
                          value={agg.violationsaddr.openviolations}
                          one="one open HPD violation"
                          other="# open HPD violations"
                        />{" "}
                        - the most in this portfolio.
                      </Trans>
                    </figcaption>
                  </figure>
                )}
              </aside>
              <Trans render="h6">Landlord</Trans>
              <p>
                <Trans>
                  The most common
                  <Plural
                    value={agg.topowners.length}
                    one="name that appears in this portfolio is"
                    other="names that appear in this portfolio are"
                  />{" "}
                  <StringifyListWithConjunction
                    values={agg.topowners}
                    renderItem={(item) => <strong>{item}</strong>}
                  />
                  .
                </Trans>{" "}
                {agg.topcorp && agg.topbusinessaddr && (
                  <Trans>
                    {" "}
                    The most common corporate entity is <b>{agg.topcorp}</b> and the most common
                    business address is <b>{agg.topbusinessaddr}</b>.
                  </Trans>
                )}
              </p>
              <Trans render="h6">Maintenance code violations</Trans>
              <p>
                <Trans>
                  This portfolio has an average of <b>{agg.openviolationsperresunit}</b> open HPD
                  violations per residential unit.
                </Trans>{" "}
                {agg.openviolationsperresunit >= VIOLATIONS_AVG - 0.05 &&
                agg.openviolationsperresunit < VIOLATIONS_AVG + 0.05 ? (
                  <Trans>
                    This is <b>about the same</b> as the citywide average.{" "}
                  </Trans>
                ) : agg.openviolationsperresunit > VIOLATIONS_AVG ? (
                  <Trans>
                    This is <b>worse</b> than the citywide average of {VIOLATIONS_AVG} per
                    residential unit.{" "}
                  </Trans>
                ) : (
                  <Trans>
                    This is <b>better</b> than the citywide average of {VIOLATIONS_AVG} per
                    residential unit.{" "}
                  </Trans>
                )}{" "}
                <Trans>
                  According to available HPD data, this portfolio has received{" "}
                  <b>{agg.totalviolations}</b> total violations.
                </Trans>
              </p>
              <Trans render="h6">Evictions</Trans>
              <EvictionsSummary {...agg} />
              <Trans render="h6">Rent stabilization</Trans>
              <RentstabSummary {...agg} />
              <aside>
                <div className="PropertiesSummary__links">
                  <span className="PropertiesSummary__linksTitle">
                    <Trans render="em">Additional links</Trans>
                  </span>
                  <div>
                    <h6 className="PropertiesSummary__linksSubtitle">
                      <Trans>Looking for more information?</Trans>
                    </h6>
                    <a
                      onClick={() => {
                        window.gtag("event", "data-request");
                      }}
                      href={encodeURI(
                        `https://docs.google.com/forms/d/e/1FAIpQLSfHdokAh4O-vB6jO8Ym0Wv_lL7cVUxsWvxw5rjZ9Ogcht7HxA/viewform?usp=pp_url&entry.1164013846=${this.props.userAddr.housenumber}+${this.props.userAddr.streetname},+${this.props.userAddr.boro}`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-block"
                    >
                      <div>
                        <Trans render="label">Send us a data request</Trans>
                      </div>
                    </a>
                  </div>
                  <div>
                    <h6 className="PropertiesSummary__linksSubtitle">
                      <Trans>Share this page with your neighbors</Trans>
                    </h6>
                    <SocialSharePortfolio
                      location="summary-tab"
                      addr={this.props.userAddr}
                      buildings={bldgs}
                    />
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
        <LegalFooter position="inside" />
      </div>
    );
  }
}
