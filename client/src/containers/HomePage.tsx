import React, { Component, useState } from "react";

import EngagementPanel from "../components/EngagementPanel";
import LegalFooter from "../components/LegalFooter";

import "styles/HomePage.css";

import { LocaleLink as Link } from "../i18n";
import westminsterLogo from "../assets/img/westminster.svg";
import stellarLogo from "../assets/img/stellar.png";
import aeLogo from "../assets/img/aande.svg";
import AddressSearch, { SearchAddress } from "../components/AddressSearch";
import { Trans } from "@lingui/macro";
import Page from "../components/Page";
import { createRouteForAddressPage } from "../routes";
import { withMachineProps } from "state-machine";
import { parseLocaleFromPath } from "i18n";
import { useHistory, useLocation } from "react-router-dom";
import { withI18n, withI18nProps } from "@lingui/react";
import { INLINES } from "@contentful/rich-text-types";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { ContentfulCommonStrings } from "@justfixnyc/contentful-common-strings";
import _commonStrings from "../data/common-strings.json";
import LandlordSearch, { algoliaAppId, algoliaSearchKey } from "components/LandlordSearch";
import { logAmplitudeEvent } from "components/Amplitude";

const commonStrings = new ContentfulCommonStrings(_commonStrings as any);

type BannerState = {
  isHidden: boolean;
};

class MoratoriumBannerWithoutI18n extends Component<withI18nProps, BannerState> {
  constructor(Props: withI18nProps) {
    super(Props);

    this.state = {
      isHidden: false,
    };
  }

  closeBanner = () => this.setState({ isHidden: true });

  render() {
    const locale = this.props.i18n.language;
    const content = commonStrings.get("covidMoratoriumBanner", locale);

    return (
      content && (
        <div className={"HomePage__banner " + (this.state.isHidden ? "d-hide" : "")}>
          <div className="close-button float-right" onClick={this.closeBanner}>
            ✕
          </div>
          <div className="content">
            {documentToReactComponents(content, {
              renderNode: {
                [INLINES.HYPERLINK]: (node, children) => (
                  <a rel="noreferrer noopener" target="_blank" href={node.data.uri}>
                    {children}
                  </a>
                ),
              },
            })}
          </div>
        </div>
      )
    );
  }
}

const MoratoriumBanner = withI18n()(MoratoriumBannerWithoutI18n);

type HomePageProps = {
  useNewPortfolioMethod?: boolean;
} & withMachineProps;

const HomePage: React.FC<HomePageProps> = ({ useNewPortfolioMethod }) => {
  const { pathname } = useLocation();
  const locale = parseLocaleFromPath(pathname) || undefined;

  const handleFormSubmit = (searchAddress: SearchAddress, error: any) => {
    logAmplitudeEvent("searchByAddress");
    window.gtag("event", "search");

    if (error) {
      window.gtag("event", "search-error");
    } else {
      const addressPage = createRouteForAddressPage(
        { ...searchAddress, locale },
        !useNewPortfolioMethod
      );
      history.push(addressPage);
    }
  };

  /**
   * Returns the set of links to the 3 sample portfolios we show on the HomePage.
   * Note: since these urls will be referenced inside `<Link>` components,
   * we do not need to include the locale parameter as the url path should be relative
   * to the current path, which on the HomePage already has a locale parameter.
   */
  const getSampleUrls = () => [
    createRouteForAddressPage(
      {
        boro: "BROOKLYN",
        housenumber: "89",
        streetname: "HICKS STREET",
      },
      !useNewPortfolioMethod
    ),
    createRouteForAddressPage(
      {
        boro: "QUEENS",
        housenumber: "4125",
        streetname: "CASE STREET",
      },
      !useNewPortfolioMethod
    ),
    createRouteForAddressPage(
      {
        boro: "BRONX",
        housenumber: "801",
        streetname: "NEILL AVENUE",
      },
      !useNewPortfolioMethod
    ),
  ];

  const history = useHistory();

  const labelText = (
    <Trans>Enter an NYC address and find other buildings your landlord might own:</Trans>
  );

  const wowzaLabelText = <Trans>Find other buildings your landlord might own:</Trans>;

  type SearchType = "address" | "landlord";
  const [searchType, setSearchType] = useState("address" as SearchType);

  return (
    <Page>
      <div className="HomePage Page">
        <MoratoriumBanner />
        <div className="HomePage__content">
          {useNewPortfolioMethod && algoliaAppId && algoliaSearchKey ? (
            <div className="HomePage__search wowza-styling">
              <h1 className="text-center">{wowzaLabelText}</h1>
              <div>
                <h2 className="text-uppercase">
                  <Trans>Search by:</Trans>
                </h2>
                <label className={"form-radio" + (searchType === "address" ? " active" : "")}>
                  <input
                    type="radio"
                    name="Address"
                    checked={searchType === "address"}
                    onChange={() => setSearchType("address")}
                  />
                  <i className="form-icon" /> <Trans>Address</Trans>
                </label>
                <label className={"form-radio" + (searchType === "landlord" ? " active" : "")}>
                  <input
                    type="radio"
                    name="Landlord name"
                    checked={searchType === "landlord"}
                    onChange={() => setSearchType("landlord")}
                  />
                  <i className="form-icon" /> <Trans>Landlord name</Trans>
                  <span className="chip">
                    <Trans>New</Trans>
                  </span>
                </label>
              </div>
              {searchType === "landlord" ? (
                <LandlordSearch />
              ) : (
                <AddressSearch
                  labelText={labelText}
                  labelClass="text-assistive"
                  onFormSubmit={handleFormSubmit}
                />
              )}
              <br />
            </div>
          ) : (
            <div className="HomePage__search">
              <h1 className="text-center">{labelText}</h1>
              <AddressSearch
                labelText={labelText}
                labelClass="text-assistive"
                onFormSubmit={handleFormSubmit}
              />
            </div>
          )}

          <div className="HomePage__samples">
            <h5 className="text-center">
              <Trans>... or view some sample portfolios:</Trans>
            </h5>
            <div className="container">
              <div className="columns">
                <div className="column col-4 col-sm-12">
                  <div className="HomePage__sample">
                    <h6>
                      <Link
                        to={getSampleUrls()[0]}
                        onClick={() => {
                          window.gtag("event", "example-portfolio-1-homepage");
                        }}
                      >
                        Kushner Companies / Westminster Management
                      </Link>
                    </h6>
                    <Link
                      className="image"
                      tabIndex={-1} // Since link is not necessary navigation, removing tab focus
                      to={getSampleUrls()[0]}
                      onClick={() => {
                        window.gtag("event", "example-portfolio-1-homepage");
                      }}
                    >
                      <img className="img-responsive" src={westminsterLogo} alt="Westminster" />
                    </Link>
                    <Trans render="p">
                      This property management company owned by the Kushner family is notorious for{" "}
                      <a
                        href="https://www.nytimes.com/2017/08/15/business/tenants-sue-kushner-companies-claiming-rent-rule-violations.html"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        violating rent regulations
                      </a>{" "}
                      and{" "}
                      <a
                        href="https://www.villagevoice.com/2017/01/12/jared-kushners-east-village-tenants-horrified-their-landlord-will-be-working-in-the-white-house/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        harassing tenants
                      </a>
                      . The stake currently held by Jared Kushner and Ivanka Trump is worth as much
                      as $761 million.
                    </Trans>
                    <Link
                      className="btn block text-center"
                      to={getSampleUrls()[0]}
                      onClick={() => {
                        window.gtag("event", "example-portfolio-1-homepage");
                      }}
                    >
                      <Trans>View portfolio</Trans> &#10230;
                    </Link>
                  </div>
                </div>
                <div className="column col-4 col-sm-12">
                  <div className="HomePage__sample">
                    <h6>
                      <Link
                        to={getSampleUrls()[1]}
                        onClick={() => {
                          window.gtag("event", "example-portfolio-2-homepage");
                        }}
                      >
                        A&amp;E Real Estate
                      </Link>
                    </h6>
                    <Link
                      className="image"
                      tabIndex={-1} // Since link is not necessary navigation, removing tab focus
                      to={getSampleUrls()[1]}
                      onClick={() => {
                        window.gtag("event", "example-portfolio-2-homepage");
                      }}
                    >
                      <img
                        className="emassoc img-responsive"
                        src={aeLogo}
                        alt="A&amp;E Real Estate"
                      />
                    </Link>
                    <Trans render="p">
                      The city’s fifth{" "}
                      <a
                        href="https://www.worstevictorsnyc.org/evictors-list/citywide"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        worst evictor
                      </a>{" "}
                      in 2018, A&E is a prime example of a landlord who engages in{" "}
                      <a
                        href="https://www.dnainfo.com/new-york/20170124/washington-heights/ae-real-estate-holdings-affordable-housing-nyc-tax-breaks/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        aggressive eviction strategies
                      </a>{" "}
                      to displace low-income tenants. Besides lack of repairs and frivolous
                      evictions in housing court, A&E has also been known to use{" "}
                      <a
                        href="https://hcr.ny.gov/faqs-major-capital-and-individual-apartment-improvements"
                        target="blank"
                        rel="noopener noreferrer"
                      >
                        MCIs
                      </a>{" "}
                      to{" "}
                      <a
                        href="https://www.nytimes.com/interactive/2018/05/20/nyregion/nyc-affordable-housing.html"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        double rents
                      </a>{" "}
                      in rent-stabilized buildings.
                    </Trans>
                    <Link
                      className="btn block text-center"
                      to={getSampleUrls()[1]}
                      onClick={() => {
                        window.gtag("event", "example-portfolio-2-homepage");
                      }}
                    >
                      <Trans>View portfolio</Trans> &#10230;
                    </Link>
                  </div>
                </div>
                <div className="column col-4 col-sm-12">
                  <div className="HomePage__sample">
                    <h6>
                      <Link
                        to={getSampleUrls()[2]}
                        onClick={() => {
                          window.gtag("event", "example-portfolio-3-homepage");
                        }}
                      >
                        Stellar Management
                      </Link>
                    </h6>
                    <Link
                      className="image"
                      tabIndex={-1} // Since link is not necessary navigation, removing tab focus
                      to={getSampleUrls()[2]}
                      onClick={() => {
                        window.gtag("event", "example-portfolio-3-homepage");
                      }}
                    >
                      <img className="img-responsive" src={stellarLogo} alt="Stellar Management" />
                    </Link>
                    <Trans render="p">
                      Known for{" "}
                      <a
                        href="https://gothamist.com/news/dozens-of-tenants-sue-big-time-landlord-over-alleged-systematic-illegal-rent-increases"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        unscrupulously deregulating rent stabilized apartments
                      </a>
                      , Larry Gluck’s Stellar Management has also secured a prominent place as one
                      of{" "}
                      <a
                        href="https://www.worstevictorsnyc.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        New York City’s Worst Evictors
                      </a>
                      . Stellar is a gentrifying force, particularly in upper Manhattan where Gluck
                      operates the majority of his properties. Stellar has a reputation for
                      displacing long-term tenants, renovating their units while vacant, and
                      skyrocketing rents to market rate.
                    </Trans>
                    <Link
                      className="btn block text-center"
                      to={getSampleUrls()[2]}
                      onClick={() => {
                        window.gtag("event", "example-portfolio-3-homepage");
                      }}
                    >
                      <Trans>View portfolio</Trans> &#10230;
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <EngagementPanel location="homepage" />
        </div>
        <LegalFooter />
      </div>
    </Page>
  );
};

export default HomePage;
