import React, { Component } from "react";
import FileSaver from "file-saver";
import Browser from "../util/browser";

import _find from "lodash/find";

import AddressToolbar from "../components/AddressToolbar";
import PropertiesMap from "../components/PropertiesMap";
import PropertiesList from "../components/PropertiesList";
import PropertiesSummary from "../components/PropertiesSummary";
import Indicators from "../components/Indicators";
import DetailView from "../components/DetailView";
import APIClient from "../components/APIClient";
import Loader from "../components/Loader";

import "styles/AddressPage.css";
import NychaPage from "./NychaPage";
import NotRegisteredPage from "./NotRegisteredPage";
import helpers from "../util/helpers";
import { Trans, Plural } from "@lingui/macro";
import { Link, RouteComponentProps } from "react-router-dom";
import Page from "../components/Page";
import { SearchResults, AddressRecord } from "../components/APIDataTypes";

type RouteParams = {
  locale?: string;
  boro?: string;
  housenumber?: string;
  streetname?: string;
};

type RouteState = {
  // TODO: Fix this typing.
  results?: any;
};

type AddressPageProps = RouteComponentProps<RouteParams, {}, RouteState> & {
  currentTab: number;
};

type State = {
  hasSearched: boolean;
  detailMobileSlide: boolean;
  assocAddrs: AddressRecord[];

  // TODO: Fix these typings.
  searchAddress: any;
  userAddr: any;
  geosearch: any;
  detailAddr: any;
};

export default class AddressPage extends Component<AddressPageProps, State> {
  constructor(props: AddressPageProps) {
    super(props);

    this.state = {
      searchAddress: { ...props.match.params }, // maybe this should be
      userAddr: {}, // merged together?
      hasSearched: false,
      geosearch: {},
      assocAddrs: [],
      detailAddr: null,
      detailMobileSlide: false,
    };
  }

  componentDidMount() {
    // We need to check where to get the results data for the page...

    // Here, the user conducted a search on HomePage and we already got the results
    if (this.props.location && this.props.location.state && this.props.location.state.results) {
      this.handleResults(this.props.location.state.results);

      // Otherwise they navigated directly to this url, so lets fetch it
    } else {
      window.gtag("event", "direct-link");
      APIClient.searchForAddressWithGeosearch(this.state.searchAddress)
        .then((results) => {
          this.handleResults(results);
        })
        .catch((err) => {
          console.error(err);
          this.setState({
            hasSearched: true,
            assocAddrs: [],
          });
        });
    }
  }

  // Processes the results and setState accordingly. Doesn't care where results comes from
  handleResults = (results: SearchResults) => {
    const { geosearch, addrs } = results;

    if (!geosearch) {
      throw new Error("Address results do not contain geosearch results!");
    }

    this.setState(
      {
        searchAddress: { ...this.state.searchAddress, bbl: geosearch.bbl },
        userAddr: _find(addrs, { bbl: geosearch.bbl }),
        hasSearched: true,
        geosearch: geosearch,
        assocAddrs: addrs,
      },
      () => {
        this.handleAddrChange(this.state.userAddr);
      }
    );
  };

  // TODO: Fix this typing.
  handleAddrChange = (addr: any) => {
    this.setState({
      detailAddr: addr,
      detailMobileSlide: true,
    });
  };

  handleCloseDetail = () => {
    this.setState({
      detailMobileSlide: false,
    });
  };

  generateBaseUrl = () => {
    const params = this.props.match.params;
    return (
      //:locale/address/:boro/:housenumber/:streetname
      `/${params.locale}/address/${params.boro}/${params.housenumber}/${params.streetname}`
    );
  };

  // should this properly live in AddressToolbar? you tell me
  handleExportClick = () => {
    APIClient.getAddressExport(this.state.searchAddress)
      .then((response) => response.blob())
      .then((blob) => FileSaver.saveAs(blob, "export.csv"));
  };

  render() {
    if (this.state.hasSearched && this.state.assocAddrs.length === 0) {
      const nychaData = helpers.getNychaData(this.state.searchAddress.bbl);
      return this.state.searchAddress && this.state.searchAddress.bbl && nychaData ? (
        <Page
          title={`${this.state.searchAddress.housenumber} ${this.state.searchAddress.streetname}`}
        >
          <NychaPage
            geosearch={this.state.geosearch}
            searchAddress={this.state.searchAddress}
            nychaData={nychaData}
          />
        </Page>
      ) : (
        <Page
          title={`${this.state.searchAddress.housenumber} ${this.state.searchAddress.streetname}`}
        >
          <NotRegisteredPage
            geosearch={this.state.geosearch}
            searchAddress={this.state.searchAddress}
          />
        </Page>
      );
    } else if (this.state.hasSearched && this.state.assocAddrs && this.state.assocAddrs.length) {
      return (
        <Page
          title={`${this.state.searchAddress.housenumber} ${this.state.searchAddress.streetname}`}
        >
          <div className="AddressPage">
            <div className="AddressPage__info">
              <AddressToolbar
                onExportClick={this.handleExportClick}
                userAddr={this.state.searchAddress}
                numOfAssocAddrs={this.state.assocAddrs.length}
              />
              {this.state.userAddr && (
                <div className="float-left">
                  <h1 className="primary">
                    <Trans>
                      PORTFOLIO: Your search address is associated with{" "}
                      <u>{this.state.assocAddrs.length}</u>{" "}
                      <Plural
                        value={this.state.assocAddrs.length}
                        one="building"
                        other="buildings"
                      />
                    </Trans>
                    :
                  </h1>
                  <ul className="tab tab-block">
                    <li className={`tab-item ${this.props.currentTab === 0 ? "active" : ""}`}>
                      <Link
                        to={this.generateBaseUrl()}
                        tabIndex={this.props.currentTab === 0 ? -1 : 0}
                        onClick={() => {
                          if (Browser.isMobile() && this.state.detailMobileSlide) {
                            this.handleCloseDetail();
                          }
                        }}
                      >
                        <Trans>Overview</Trans>
                      </Link>
                    </li>
                    <li className={`tab-item ${this.props.currentTab === 1 ? "active" : ""}`}>
                      <Link
                        to={this.generateBaseUrl() + "/timeline"}
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
                        to={this.generateBaseUrl() + "/portfolio"}
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
                        to={this.generateBaseUrl() + "/summary"}
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
              )}
            </div>
            <div
              className={`AddressPage__content AddressPage__viz ${
                this.props.currentTab === 0 ? "AddressPage__content-active" : ""
              }`}
            >
              <PropertiesMap
                addrs={this.state.assocAddrs}
                userAddr={this.state.userAddr}
                detailAddr={this.state.detailAddr}
                onAddrChange={this.handleAddrChange}
                isVisible={this.props.currentTab === 0}
              />
              <DetailView
                addrs={this.state.assocAddrs}
                addr={this.state.detailAddr}
                portfolioSize={this.state.assocAddrs.length}
                mobileShow={this.state.detailMobileSlide}
                userAddr={this.state.userAddr}
                onCloseDetail={this.handleCloseDetail}
                generateBaseUrl={this.generateBaseUrl}
              />
            </div>
            <div
              className={`AddressPage__content AddressPage__summary ${
                this.props.currentTab === 1 ? "AddressPage__content-active" : ""
              }`}
            >
              <Indicators
                isVisible={this.props.currentTab === 1}
                detailAddr={this.state.detailAddr}
                onBackToOverview={this.handleAddrChange}
                generateBaseUrl={this.generateBaseUrl}
              />
            </div>
            <div
              className={`AddressPage__content AddressPage__table ${
                this.props.currentTab === 2 ? "AddressPage__content-active" : ""
              }`}
            >
              {
                <PropertiesList
                  addrs={this.state.assocAddrs}
                  onOpenDetail={this.handleAddrChange}
                  generateBaseUrl={this.generateBaseUrl}
                />
              }
            </div>
            <div
              className={`AddressPage__content AddressPage__summary ${
                this.props.currentTab === 3 ? "AddressPage__content-active" : ""
              }`}
            >
              <PropertiesSummary
                isVisible={this.props.currentTab === 3}
                userAddr={this.state.userAddr}
              />
            </div>
          </div>
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
