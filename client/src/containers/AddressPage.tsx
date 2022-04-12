import React, { Component } from "react";

import AddressToolbar from "../components/AddressToolbar";
import PropertiesMap from "../components/PropertiesMap";
import PropertiesList from "../components/PropertiesList";
import PropertiesSummary from "../components/PropertiesSummary";
import Indicators from "../components/Indicators";
import DetailView from "../components/DetailView";
import { LoadingPage } from "../components/Loader";

import "styles/AddressPage.css";
import NychaPage from "./NychaPage";
import NotRegisteredPage from "./NotRegisteredPage";
import { Trans, Plural } from "@lingui/macro";
import { Link, RouteComponentProps } from "react-router-dom";
import Page from "../components/Page";
import { SearchResults, Borough } from "../components/APIDataTypes";
import { SearchAddress } from "../components/AddressSearch";
import { withMachineProps } from "state-machine";
import { AddrNotFoundPage } from "./NotFoundPage";
import { searchAddrsAreEqual } from "util/helpers";
import { NetworkErrorMessage } from "components/NetworkErrorMessage";
import { createAddressPageRoutes } from "routes";
import { isLegacyPath } from "../components/WowzaToggle";

type RouteParams = {
  locale?: string;
  boro?: string;
  housenumber?: string;
  streetname?: string;
};

type RouteState = {
  results?: SearchResults;
};

type AddressPageProps = RouteComponentProps<RouteParams, {}, RouteState> &
  withMachineProps & {
    currentTab: number;
    useNewPortfolioMethod?: boolean;
  };

type State = {
  detailMobileSlide: boolean;
};

const validateRouteParams = (params: RouteParams) => {
  if (!params.boro) {
    throw new Error("Address Page URL params did not contain a proper boro!");
  } else if (!params.streetname) {
    throw new Error("Address Page URL params did not contain a proper streetname!");
  } else {
    const searchAddress: SearchAddress = {
      // TODO: We really shouldn't be blindly typecasting to Borough here,
      // params.boro could be anything!
      boro: params.boro as Borough,
      streetname: params.streetname,
      housenumber: params.housenumber,
      bbl: "",
    };
    return { ...searchAddress, locale: params.locale };
  }
};

export default class AddressPage extends Component<AddressPageProps, State> {
  constructor(props: AddressPageProps) {
    super(props);

    this.state = {
      detailMobileSlide: false,
    };
  }

  componentDidMount() {
    const { state, send, match } = this.props;
    if (
      state.matches("portfolioFound") &&
      searchAddrsAreEqual(state.context.portfolioData.searchAddr, validateRouteParams(match.params))
    )
      return;
    send({
      type: "SEARCH",
      address: validateRouteParams(match.params),
      useNewPortfolioMethod: this.props.useNewPortfolioMethod || false,
    });
    /* When searching for user's address, let's reset the DetailView to the "closed" state 
    so it can pop into view once the address is found */
    this.handleCloseDetail();
  }

  handleOpenDetail = () => {
    this.setState({
      detailMobileSlide: true,
    });
  };

  handleCloseDetail = () => {
    this.setState({
      detailMobileSlide: false,
    });
  };

  handleAddrChange = (newFocusBbl: string) => {
    if (!this.props.state.matches("portfolioFound")) {
      throw new Error("A change of detail address was attempted without any portfolio data found.");
    }
    const detailBbl = this.props.state.context.portfolioData.detailAddr.bbl;
    if (newFocusBbl !== detailBbl)
      this.props.send({ type: "SELECT_DETAIL_ADDR", bbl: newFocusBbl });
    this.handleOpenDetail();
  };

  render() {
    const { state, send, useNewPortfolioMethod, location } = this.props;

    if (state.matches("bblNotFound")) {
      window.gtag("event", "bbl-not-found-page");
      return <AddrNotFoundPage />;
    } else if (state.matches("nychaFound")) {
      window.gtag("event", "nycha-page");
      return <NychaPage state={state} send={send} />;
    } else if (state.matches("unregisteredFound")) {
      window.gtag("event", "unregistered-page");
      return <NotRegisteredPage state={state} send={send} />;
    } else if (state.matches("portfolioFound")) {
      window.gtag("event", "portfolio-found-page");
      const { assocAddrs, searchAddr, portfolioGraph } = state.context.portfolioData;
      const routes = createAddressPageRoutes(
        validateRouteParams(this.props.match.params),
        !useNewPortfolioMethod
      );

      /**
       * When switching between the legacy and new versions of Who Owns What,
       * there is a delay period after clicking the `ToggleLinkBetweenPortfolioMethods` link
       * where the url has changed but the new portfolio data hasn't yet loaded via API call.
       *
       * This check makes sure that we show the Loading Page while the url and data are mismatched:
       */
      if (!!portfolioGraph === isLegacyPath(location.pathname)) {
        return <LoadingPage />;
      }

      return (
        <Page
          title={`${this.props.match.params.housenumber} ${this.props.match.params.streetname}`}
        >
          <div className="AddressPage">
            <div className="AddressPage__info">
              <AddressToolbar searchAddr={searchAddr} assocAddrs={assocAddrs} />
              <div className="float-left">
                <h1 className="primary">
                  <Trans>
                    PORTFOLIO: Your search address is associated with <u>{assocAddrs.length}</u>{" "}
                    <Plural value={assocAddrs.length} one="building" other="buildings" />
                  </Trans>
                </h1>
                <ul className="tab tab-block">
                  <li className={`tab-item ${this.props.currentTab === 0 ? "active" : ""}`}>
                    <Link to={routes.overview} tabIndex={this.props.currentTab === 0 ? -1 : 0}>
                      <Trans>Overview</Trans>
                    </Link>
                  </li>
                  <li className={`tab-item ${this.props.currentTab === 1 ? "active" : ""}`}>
                    <Link
                      to={routes.timeline}
                      tabIndex={this.props.currentTab === 1 ? -1 : 0}
                      onClick={() => {
                        window.gtag("event", "timeline-tab");
                      }}
                    >
                      <Trans>Timeline</Trans>
                    </Link>
                  </li>
                  <li className={`tab-item ${this.props.currentTab === 2 ? "active" : ""}`}>
                    <Link
                      to={routes.portfolio}
                      tabIndex={this.props.currentTab === 2 ? -1 : 0}
                      onClick={() => {
                        window.gtag("event", "portfolio-tab");
                      }}
                    >
                      <Trans>Portfolio</Trans>
                    </Link>
                  </li>
                  <li className={`tab-item ${this.props.currentTab === 3 ? "active" : ""}`}>
                    <Link
                      to={routes.summary}
                      tabIndex={this.props.currentTab === 3 ? -1 : 0}
                      onClick={() => {
                        window.gtag("event", "summary-tab");
                      }}
                    >
                      <Trans>Summary</Trans>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div
              className={`AddressPage__content AddressPage__viz ${
                this.props.currentTab === 0 ? "AddressPage__content-active" : ""
              }`}
            >
              <PropertiesMap
                state={state}
                send={send}
                onAddrChange={this.handleAddrChange}
                isVisible={this.props.currentTab === 0}
              />
              <DetailView
                state={state}
                send={send}
                mobileShow={this.state.detailMobileSlide}
                onOpenDetail={this.handleOpenDetail}
                onCloseDetail={this.handleCloseDetail}
                addressPageRoutes={routes}
              />
            </div>
            <div
              className={`AddressPage__content AddressPage__summary ${
                this.props.currentTab === 1 ? "AddressPage__content-active" : ""
              }`}
            >
              <Indicators
                isVisible={this.props.currentTab === 1}
                state={state}
                send={send}
                onBackToOverview={this.handleAddrChange}
                addressPageRoutes={routes}
              />
            </div>
            <div
              className={`AddressPage__content AddressPage__table ${
                this.props.currentTab === 2 ? "AddressPage__content-active" : ""
              }`}
            >
              <PropertiesList
                state={state}
                send={send}
                onOpenDetail={this.handleAddrChange}
                addressPageRoutes={routes}
              />
            </div>
            <div
              className={`AddressPage__content AddressPage__summary ${
                this.props.currentTab === 3 ? "AddressPage__content-active" : ""
              }`}
            >
              <PropertiesSummary
                state={state}
                send={send}
                isVisible={this.props.currentTab === 3}
              />
            </div>
          </div>
        </Page>
      );
    } else if (state.matches("networkErrorOccurred")) {
      return (
        <Page>
          <NetworkErrorMessage />
        </Page>
      );
    } else {
      return <LoadingPage />;
    }
  }
}
