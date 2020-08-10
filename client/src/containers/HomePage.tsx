import React, { Component } from "react";

import EngagementPanel from "../components/EngagementPanel";
import LegalFooter from "../components/LegalFooter";

import "styles/HomePage.css";

import { LocaleLink as Link } from "../i18n";
import westminsterLogo from "../assets/img/westminster.svg";
import allyearLogo from "../assets/img/allyear.png";
import aeLogo from "../assets/img/aande.jpeg";
import AddressSearch, { SearchAddress } from "../components/AddressSearch";
import { Trans } from "@lingui/macro";
import Page from "../components/Page";
import { createRouteForAddressPage } from "../routes";
import { WithMachineProps } from "state-machine";
import { useHistory } from "react-router-dom";

type BannerState = {
  isHidden: boolean;
};

class MoratoriumBanner extends Component<{}, BannerState> {
  constructor(Props: {}) {
    super(Props);

    this.state = {
      isHidden: false,
    };
  }

  closeBanner = () => this.setState({ isHidden: true });

  render() {
    return (
      <div className={"HomePage__banner " + (this.state.isHidden ? "d-hide" : "")}>
        <div className="close-button float-right" onClick={this.closeBanner}>
          ✕
        </div>
        <div className="content">
          <Trans>
            <span className="text-bold">COVID-19 Update: </span>
            JustFix.nyc is operating, and has adapted our products to match preliminary rules put in
            place during the COVID-19 crisis. We recommend you take full precautions to stay safe
            during this public health crisis. Thanks to tenant organizing during this time, renters
            cannot be evicted for any reason. Visit{" "}
            <a
              href="https://www.righttocounselnyc.org/ny_eviction_moratorium_faq"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="text-bold">Right to Council’s Eviction Moratorium FAQs</span>
            </a>{" "}
            to learn more.
          </Trans>
        </div>
      </div>
    );
  }
}

const getSampleUrls = () => [
  createRouteForAddressPage({
    boro: "BROOKLYN",
    housenumber: "89",
    streetname: "HICKS STREET",
  }),
  createRouteForAddressPage({
    boro: "QUEENS",
    housenumber: "4125",
    streetname: "CASE STREET",
  }),
  createRouteForAddressPage({
    boro: "BROOKLYN",
    housenumber: "196",
    streetname: "RALPH AVENUE",
  }),
];

const HomePage: React.FC<WithMachineProps> = (props) => {
  const handleFormSubmit = (searchAddress: SearchAddress, error: any) => {
    window.gtag("event", "search");

    if (error) {
      window.gtag("event", "search-error");
    } else {
      const addressPage = createRouteForAddressPage(searchAddress);
      history.push(addressPage);
    }
  };

  const history = useHistory();

  const labelText = (
    <Trans>Enter an NYC address and find other buildings your landlord might own:</Trans>
  );

  return (
    <Page>
      <div className="HomePage Page">
        <MoratoriumBanner />
        <div className="HomePage__content">
          <div className="HomePage__search">
            <div>
              <h1 className="text-center">{labelText}</h1>
              <AddressSearch
                labelText={labelText}
                labelClass="text-assistive"
                onFormSubmit={handleFormSubmit}
              />
            </div>{" "}
          </div>
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
                        All Year Management
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
                      <img className="img-responsive" src={allyearLogo} alt="All Year" />
                    </Link>
                    <Trans render="p">
                      Yoel Goldman's All Year Management has been at the{" "}
                      <a
                        href="https://commercialobserver.com/2017/09/yoel-goldman-all-year-management-brooklyn-real-estate/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        forefront of gentrification
                      </a>{" "}
                      in Brooklyn. Tenants in his buidlings in Williamsburg, Bushwick, and Crown
                      Heights have been forced to live in horrendous and often dangerous conditions.
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
