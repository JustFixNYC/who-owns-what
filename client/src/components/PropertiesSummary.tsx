import React, { Component } from "react";
import { Trans, Plural } from "@lingui/macro";

import Loader from "../components/Loader";
import LegalFooter from "../components/LegalFooter";

import "styles/PropertiesSummary.css";
import { EvictionsSummary } from "./EvictionsSummary";
import { RentstabSummary } from "./RentstabSummary";
import { ViolationsSummary } from "./ViolationsSummary";
import { StringifyListWithConjunction } from "./StringifyList";
import { SocialSharePortfolio } from "./SocialShare";
import { AddressRecord } from "./APIDataTypes";
import { WithMachineProps } from "state-machine";

type Props = WithMachineProps & {
  isVisible: boolean;
  userAddr: AddressRecord;
};

const generateLinkToDataRequestForm = (fullAddress: string) =>
  `https://docs.google.com/forms/d/e/1FAIpQLSfHdokAh4O-vB6jO8Ym0Wv_lL7cVUxsWvxw5rjZ9Ogcht7HxA/viewform?usp=pp_url&entry.1164013846=${encodeURIComponent(
    fullAddress
  )}`;

export default class PropertiesSummary extends Component<Props, {}> {
  updateData() {
    if (
      this.props.state.matches({ portfolioFound: { summary: "noData" } }) &&
      this.props.isVisible
    ) {
      this.props.send({ type: "VIEW_SUMMARY" });
    }
  }

  componentDidMount() {
    this.updateData();
  }

  componentDidUpdate() {
    this.updateData();
  }

  render() {
    let agg = this.props.state.context.summaryData;

    return (
      <div className="Page PropertiesSummary">
        <div className="PropertiesSummary__content Page__content">
          {agg ? (
            <div>
              <Trans render="h6">General info</Trans>
              <p>
                <Trans>
                  There{" "}
                  <Plural
                    value={agg.bldgs}
                    one={
                      <span>
                        is <b>1</b> building
                      </span>
                    }
                    other={
                      <span>
                        are <b>{agg.bldgs}</b> buildings
                      </span>
                    }
                  />{" "}
                  in this portfolio with a total of{" "}
                  <Plural value={agg.units} one="1 unit" other="# units" />.
                </Trans>
                {` `}
                <Trans>
                  The <Plural value={agg.bldgs} one="" other="average" /> age of{" "}
                  <Plural value={agg.bldgs} one="this building" other="these buildings" /> is{" "}
                  <b>{agg.age}</b> years old.
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
                          value={agg.violationsaddr.openviolations || 0}
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
              <ViolationsSummary {...agg} />
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
                      href={generateLinkToDataRequestForm(
                        `${this.props.userAddr.housenumber}${this.props.userAddr.streetname},${this.props.userAddr.boro}`
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
                      buildings={agg.bldgs}
                    />
                  </div>
                </div>
              </aside>
            </div>
          ) : (
            <Loader loading={true} classNames="Loader-map">
              Loading
            </Loader>
          )}
        </div>
        <LegalFooter />
      </div>
    );
  }
}
