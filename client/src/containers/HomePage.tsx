import React, { useState } from "react";

import EngagementPanel from "../components/EngagementPanel";
import LegalFooter from "../components/LegalFooter";

import "styles/HomePage.css";

import { LocaleLink as Link } from "../i18n";
import AddressSearch, { SearchAddress } from "../components/AddressSearch";
import { Trans } from "@lingui/macro";
import Page from "../components/Page";
import { createRouteForAddressPage } from "../routes";
import { withMachineProps } from "state-machine";
import { parseLocaleFromPath } from "i18n";
import { useHistory, useLocation } from "react-router-dom";
import LandlordSearch, { algoliaAppId, algoliaSearchKey } from "components/LandlordSearch";
import { logAmplitudeEvent } from "components/Amplitude";
import JFCLLinkInternal from "components/JFCLLinkInternal";

type HomePageProps = {
  useNewPortfolioMethod?: boolean;
} & withMachineProps;

const HomePage: React.FC<HomePageProps> = ({ useNewPortfolioMethod }) => {
  const { pathname } = useLocation();
  const locale = parseLocaleFromPath(pathname) || undefined;

  const handleFormSubmit = (searchAddress: SearchAddress, error: any) => {
    logAmplitudeEvent("searchByAddress");
    window.gtag("event", "search", { bbl: searchAddress.bbl });

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
   * Returns the set of links to the 2 sample portfolios we show on the HomePage.
   * Note: since these urls will be referenced inside `<Link>` components,
   * we do not need to include the locale parameter as the url path should be relative
   * to the current path, which on the HomePage already has a locale parameter.
   */
  const getSampleUrls = () => [
    // A&E
    createRouteForAddressPage(
      {
        boro: "BROOKLYN",
        housenumber: "2750",
        streetname: "HOMECREST AVENUE",
      },
      !useNewPortfolioMethod
    ),
    // Ved Parkash
    createRouteForAddressPage(
      {
        boro: "BRONX",
        housenumber: "750",
        streetname: "GRAND CONCOURSE",
      },
      !useNewPortfolioMethod
    ),
  ];

  const history = useHistory();

  const labelText = (
    <Trans>Enter an address and find other buildings your landlord might own in NYC:</Trans>
  );

  const wowzaLabelText = <Trans>Find other buildings your landlord might own in NYC:</Trans>;

  type SearchType = "address" | "landlord";
  const [searchType, setSearchType] = useState("address" as SearchType);

  return (
    <Page>
      <div className="HomePage Page">
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
                <div className="column col-6 col-sm-12">
                  <div className="HomePage__sample">
                    <h6>
                      <Link
                        to={getSampleUrls()[0]}
                        onClick={() => {
                          window.gtag("event", "example-portfolio-2-homepage");
                        }}
                      >
                        A&amp;E Real Estate
                      </Link>
                    </h6>
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
                      to displace low-income tenants. Aside from lack of repairs and frivolous
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
                      className="flex-centered portfolio-link"
                      to={getSampleUrls()[0]}
                      onClick={() => {
                        window.gtag("event", "example-portfolio-2-homepage");
                      }}
                      component={JFCLLinkInternal}
                    >
                      <Trans>View portfolio</Trans>
                    </Link>
                  </div>
                </div>
                <div className="column col-6 col-sm-12">
                  <div className="HomePage__sample">
                    <h6>
                      <Link
                        to={getSampleUrls()[1]}
                        onClick={() => {
                          window.gtag("event", "example-portfolio-3-homepage");
                        }}
                      >
                        Ved Parkash
                      </Link>
                    </h6>
                    <Trans render="p">
                      Named by the NYC Public Advocate as the{" "}
                      <a
                        href="https://www.cbsnews.com/newyork/news/worst-nyc-landlords-2015/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Worst Landlord in 2015
                      </a>
                      , and as one of the{" "}
                      <a
                        href="https://www.worstevictorsnyc.org/list#7"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Pandemic's worst evictors
                      </a>
                      , Ved Parkash has used housing court as a vehicle to collect rent and evict
                      tenants. In response to Parkash’s predatory behavior, residents have
                      organizing together to form the Parkash Tenant Coalition, but{" "}
                      <a
                        href="https://pix11.com/news/local-news/nyc-tenants-battle-former-worst-landlord-for-repairs-years-after-suing/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        life threatening building conditions remain
                      </a>
                      .
                    </Trans>
                    <Link
                      className="flex-centered portfolio-link"
                      to={getSampleUrls()[1]}
                      onClick={() => {
                        window.gtag("event", "example-portfolio-3-homepage");
                      }}
                      component={JFCLLinkInternal}
                    >
                      <Trans>View portfolio</Trans>
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
