import React, { Component } from "react";

import Loader from "../components/Loader";
import APIClient from "../components/APIClient";
import EngagementPanel from "../components/EngagementPanel";
import LegalFooter from "../components/LegalFooter";

import "styles/HomePage.css";

import { LocaleLink as Link, LocaleRedirect as Redirect } from "../i18n";
import westminsterLogo from "../assets/img/westminster.svg";
import allyearLogo from "../assets/img/allyear.png";
import aeLogo from "../assets/img/aande.jpeg";
import AddressSearch, { makeEmptySearchAddress, SearchAddress } from "../components/AddressSearch";
import { Trans } from "@lingui/macro";

type HomePageProps = {};

type State = {
  searchAddress: SearchAddress;
  results: { addrs: unknown[] } | null;
  sampleURLs: string[];
};

type BannerState = {
  isHidden: boolean;
};

class MoratoriumBanner extends Component<HomePageProps, BannerState> {
  constructor(Props: HomePageProps) {
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
            JustFix.nyc remains in operation, and we are adapting our products to match new rules
            put in place during the Covid-19 public health crisis. Thanks to organizing from tenant
            leaders, renters now have stronger protections during this time, including a full halt
            on eviction cases.{" "}
            <a
              href="https://www.righttocounselnyc.org/moratorium_faq"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="text-bold">Learn more</span>
            </a>
          </Trans>
        </div>
      </div>
    );
  }
}

class HomePage extends Component<HomePageProps, State> {
  constructor(props: HomePageProps) {
    super(props);

    this.state = {
      searchAddress: makeEmptySearchAddress(),
      results: null,
      sampleURLs: [
        "/address/BROOKLYN/89/HICKS%20STREET",
        "/address/QUEENS/4125/CASE%20STREET",
        "/address/BROOKLYN/196/RALPH%20AVENUE",
      ],
    };
  }

  handleFormSubmit = (searchAddress: SearchAddress, error: any) => {
    // set state (mainly to show addr on load)
    this.setState({
      searchAddress: searchAddress,
    });

    window.gtag("event", "search");

    if (error) {
      window.gtag("event", "search-error");
      this.setState({
        results: { addrs: [] },
      });
    } else {
      // searching on HomePage allows for more clean redirects
      // as opposed to HomePage > AddressPage > NotRegisteredPage
      APIClient.searchAddress({
        ...searchAddress,
        housenumber: searchAddress.housenumber || "",
      })
        .then((results) => {
          this.setState({
            results: results,
          });
        })
        .catch((err) => {
          window.Rollbar.error("API error from homepage: Search Address", err, searchAddress);
          this.setState({
            results: { addrs: [] },
          });
        });
    }
  };

  render() {
    // If searched and got results,
    if (this.state.results) {
      // redirect doesn't like `this` so lets make a ref
      const results = this.state.results;

      // no addrs = not found
      if (!this.state.results.addrs || !this.state.results.addrs.length) {
        window.gtag("event", "search-notfound");

        // lets redirect to AddressPage and pass the results along with us
      } else {
        window.gtag("event", "search-found", {
          value: this.state.results.addrs.length,
        });
      }
      return (
        <Redirect
          push
          to={{
            pathname:
              `/address/` +
              this.state.searchAddress.boro +
              `/` +
              (this.state.searchAddress.housenumber ? this.state.searchAddress.housenumber : ` `) +
              `/` +
              this.state.searchAddress.streetname,
            state: { results },
          }}
        ></Redirect>
      );
    }

    const labelText = (
      <Trans>Enter an NYC address and find other buildings your landlord might own:</Trans>
    );

    return (
      <div className="HomePage Page">
        <MoratoriumBanner />
        <div className="HomePage__content">
          <div className="HomePage__search">
            {this.state.searchAddress.housenumber ? (
              <Loader loading={true}>
                <Trans>
                  Searching for{" "}
                  <b>
                    {this.state.searchAddress.housenumber} {this.state.searchAddress.streetname},{" "}
                    {this.state.searchAddress.boro}
                  </b>
                </Trans>
              </Loader>
            ) : (
              <div>
                <h5 className="text-center">{labelText}</h5>
                <AddressSearch
                  {...this.state.searchAddress}
                  labelText={labelText}
                  labelClass="text-assistive"
                  onFormSubmit={this.handleFormSubmit}
                />
              </div>
            )}
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
                        to={this.state.sampleURLs[0]}
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
                      to={this.state.sampleURLs[0]}
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
                      to={this.state.sampleURLs[0]}
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
                        to={this.state.sampleURLs[1]}
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
                      to={this.state.sampleURLs[1]}
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
                      to={this.state.sampleURLs[1]}
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
                        to={this.state.sampleURLs[2]}
                        onClick={() => {
                          window.gtag("event", "example-portfolio-1-homepage");
                        }}
                      >
                        All Year Management
                      </Link>
                    </h6>
                    <Link
                      className="image"
                      tabIndex={-1} // Since link is not necessary navigation, removing tab focus
                      to={this.state.sampleURLs[2]}
                      onClick={() => {
                        window.gtag("event", "example-portfolio-1-homepage");
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
                      to={this.state.sampleURLs[2]}
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
    );
  }
}

export default HomePage;
