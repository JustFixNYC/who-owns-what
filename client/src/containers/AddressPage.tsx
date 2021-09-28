import React, { Component } from "react";

import AddressToolbar from "../components/AddressToolbar";
import PropertiesMap from "../components/PropertiesMap";
import PropertiesList from "../components/PropertiesList";
import PropertiesSummary from "../components/PropertiesSummary";
import Indicators from "../components/Indicators";
import DetailView from "../components/DetailView";
import Loader from "../components/Loader";

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

type RouteParams = {
  locale?: string;
  bbl?: string;
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
  if (!params.bbl) {
    throw new Error("Address Page URL params did not contain a proper bbl!");
  } else
    return {
      ...params,
      bbl: params.bbl,
    };
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
      state.context.portfolioData.searchAddr.bbl === validateRouteParams(match.params).bbl
    )
      return;
    send({
      type: "SEARCH",
      bbl: validateRouteParams(match.params).bbl,
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
    const { state, send, useNewPortfolioMethod } = this.props;

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
      const { assocAddrs, searchAddr } = state.context.portfolioData;
      const routes = createAddressPageRoutes(
        validateRouteParams(this.props.match.params),
        useNewPortfolioMethod
      );

      return (
        <Page title={`${searchAddr.housenumber} ${searchAddr.streetname}`}>
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
      return (
        <Page>
          <Loader loading={true} classNames="Loader-map">
            <Trans>Loading</Trans>
          </Loader>
        </Page>
      );
    }
  }
}
