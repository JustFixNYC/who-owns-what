import React, { Component } from "react";
import { Trans, Plural, t } from "@lingui/macro";

import { FixedLoadingLabel } from "../components/Loader";
import LegalFooter from "../components/LegalFooter";

import "styles/PropertiesSummary.css";
import { EvictionsSummary } from "./EvictionsSummary";
import { RentstabSummary } from "./RentstabSummary";
import { ViolationsSummary } from "./ViolationsSummary";
import { StringifyListWithConjunction } from "./StringifyList";
import { SocialShareAddressPage } from "./SocialShare";
import { withMachineInStateProps } from "state-machine";
import { AddressRecord } from "./APIDataTypes";
import { defaultLocale, isSupportedLocale } from "i18n-base";
import { I18n } from "@lingui/core/i18n";
import { I18n as I18nComponent } from "@lingui/react";
import { PortfolioGraph } from "./PortfolioGraph";
import { ComplaintsSummary } from "./ComplaintsSummary";
import { BigPortfolioAlert } from "./PortfolioAlerts";
import { LazyLoadWhenVisible } from "./LazyLoadWhenVisible";
import { StreetViewStatic } from "./StreetView";

type Props = withMachineInStateProps<"portfolioFound"> & {
  isVisible: boolean;
};

const DATA_REQUEST_FORM_URLS = {
  en: "https://airtable.com/shruDUDHViainzUBB",
  es: "https://airtable.com/shrQudDbhUVz5J83u",
};

const generateLinkToDataRequestForm = (i18n: I18n, address?: AddressRecord) => {
  const locale = i18n.language;
  if (!isSupportedLocale(locale)) {
    throw new Error(`Trying to generate Data Request Form link with unsupported locale: ${locale}`);
  }
  let url = DATA_REQUEST_FORM_URLS[locale] || DATA_REQUEST_FORM_URLS[defaultLocale];
  if (address) {
    const fullAddress = encodeURIComponent(
      `${address.housenumber} ${address.streetname}, ${address.boro}`
    );
    url = `${url}?prefill_Address=${fullAddress}`;
  }
  return url;
};

const DataRequestButton: React.FC<{
  address?: AddressRecord;
}> = ({ address }) => {
  return (
    <I18nComponent>
      {({ i18n }) => (
        <a
          onClick={() => {
            window.gtag("event", "data-request");
          }}
          href={generateLinkToDataRequestForm(i18n, address)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-block"
        >
          <div>
            <Trans render="label">Send us a data request</Trans>
          </div>
        </a>
      )}
    </I18nComponent>
  );
};

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
    const { state } = this.props;
    let agg = state.context.summaryData;
    let searchAddr = state.context.portfolioData.searchAddr;
    if (!agg) {
      return <FixedLoadingLabel />;
    } else {
      return (
        <div className="Page PropertiesSummary">
          <div className="PropertiesSummary__content Page__content">
            <div>
              <Trans render="h6">Network of Landlords</Trans>
              {state.context.useNewPortfolioMethod && state.context.portfolioData.portfolioGraph && (
                <div className="portfolio-graph-container">
                  <LazyLoadWhenVisible showLoader>
                    <PortfolioGraph
                      graphJSON={state.context.portfolioData.portfolioGraph}
                      state={state}
                    />
                    <BigPortfolioAlert
                      closeType="session"
                      storageId="summary-big-portfolio-alert"
                      portfolioSize={agg.bldgs}
                    />
                  </LazyLoadWhenVisible>
                </div>
              )}
              <p>
                <Trans>
                  Across owners and management staff, the most common
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
              <aside>
                {agg.violationsaddr.lat && agg.violationsaddr.lng && (
                  <figure className="figure">
                    <StreetViewStatic
                      lat={agg.violationsaddr.lat}
                      lng={agg.violationsaddr.lng}
                      imgHeight={() => 800}
                      imgWidth={() => 500}
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
              <Trans render="h6">Building info</Trans>
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
                {agg.age && (
                  <Trans>
                    The <Plural value={agg.bldgs} one="" other="average" /> age of{" "}
                    <Plural value={agg.bldgs} one="this building" other="these buildings" /> is{" "}
                    <b>{Math.round(agg.age)}</b> years old.
                  </Trans>
                )}
              </p>

              <ComplaintsSummary {...agg} />
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
                    <DataRequestButton address={searchAddr} />
                  </div>
                  <div>
                    <h6 className="PropertiesSummary__linksSubtitle">
                      <Trans>Share this page with your neighbors</Trans>
                    </h6>
                    <SocialShareAddressPage
                      location="summary-tab"
                      customContent={{
                        tweet: t`This landlord owns ${agg.bldgs} buildings, and according to @NYCHousing, has received a total of ${agg.totalviolations} violations. Can you guess which landlord it is? Find their name and more data analysis here: `,
                        tweetCloseout: t`#WhoOwnsWhat via @JustFixNYC`,
                        emailSubject: t` This landlord’s buildings average ${agg.openviolationsperresunit} open HPD violations per apartment`,
                        getEmailBody: (url: string) =>
                          t`I was checking out this building on Who Owns What, a free landlord research tool from JustFix. It’s a remarkable website that every tenant and housing advocate should know about! Can you guess how many total violations this landlord portfolio has? Check it out here: ${url}`,
                      }}
                    />
                  </div>
                </div>
              </aside>
            </div>
          </div>
          <LegalFooter />
        </div>
      );
    }
  }
}
