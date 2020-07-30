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
import helpers, { assertNotUndefined } from "../util/helpers";
import { Trans, Plural } from "@lingui/macro";
import { Link, RouteComponentProps } from "react-router-dom";
import Page from "../components/Page";
import { SearchResults, AddressRecord, GeoSearchData, Borough } from "../components/APIDataTypes";
import { SearchAddress } from "../components/AddressSearch";
import { WithMachineProps } from "state-machine";

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
  WithMachineProps & {
    currentTab: number;
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
      boro: params.boro as Borough,
      streetname: params.streetname,
      housenumber: params.housenumber,
      bbl: "",
    };
    return searchAddress;
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
    if (this.props.state.value === "noData") {
      this.props.send({ type: "SEARCH", address: validateRouteParams(this.props.match.params) });
    }
  }

  handleAddrChange = (addr?: AddressRecord) => {
    this.setState({
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
  handleExportClick = (bbl: string) => {
    APIClient.getAddressExport(bbl)
      .then((response) => response.blob())
      .then((blob) => FileSaver.saveAs(blob, "export.csv"));
  };

  render() {
    const { state, send } = this.props;

    // if (state.value === 'nychaFound')
    //   return <Page
    //       title={`${this.state.searchAddress.housenumber} ${this.state.searchAddress.streetname}`}
    //     >
    //       <NychaPage
    //         geosearch={this.state.geosearch}
    //         searchAddress={this.state.searchAddress}
    //         nychaData={state.context.nychaData}
    //       />
    //     </Page>
    //   ) : (
    //     <Page
    //       title={`${this.state.searchAddress.housenumber} ${this.state.searchAddress.streetname}`}
    //     >
    //       <NotRegisteredPage
    //         geosearch={this.state.geosearch}
    //         searchAddress={this.state.searchAddress}
    //       />
    //     </Page>
    //   );
    // } else if (hasSearched && assocAddrs && assocAddrs.length && userAddr) {
    if (state.value === "portfolioFound") {
      const { detailAddr, assocAddrs, searchAddr } = assertNotUndefined(
        state.context.portfolioData
      );
      return (
        <Page
          title={`${this.props.match.params.housenumber} ${this.props.match.params.streetname}`}
        >
          <div className="AddressPage">
            <div className="AddressPage__info">
              <AddressToolbar
                onExportClick={() => this.handleExportClick(searchAddr.bbl)}
                searchAddr={searchAddr}
                numOfAssocAddrs={assocAddrs.length}
              />
              <p>{this.props.state.value}</p>
              <div className="float-left">
                <h1 className="primary">
                  <Trans>
                    PORTFOLIO: Your search address is associated with <u>{assocAddrs.length}</u>{" "}
                    <Plural value={assocAddrs.length} one="building" other="buildings" />
                  </Trans>
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
            </div>
            <div
              className={`AddressPage__content AddressPage__viz ${
                this.props.currentTab === 0 ? "AddressPage__content-active" : ""
              }`}
            >
              <PropertiesMap
                addrs={assocAddrs}
                userAddr={searchAddr}
                detailAddr={detailAddr}
                onAddrChange={this.handleAddrChange}
                isVisible={this.props.currentTab === 0}
              />
              <DetailView
                addrs={assocAddrs}
                addr={detailAddr}
                portfolioSize={assocAddrs.length}
                mobileShow={this.state.detailMobileSlide}
                userAddr={searchAddr}
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
                detailAddr={detailAddr}
                onBackToOverview={this.handleAddrChange}
                generateBaseUrl={this.generateBaseUrl}
              />
            </div>
            <div
              className={`AddressPage__content AddressPage__table ${
                this.props.currentTab === 2 ? "AddressPage__content-active" : ""
              }`}
            >
              <PropertiesList
                addrs={assocAddrs}
                onOpenDetail={this.handleAddrChange}
                generateBaseUrl={this.generateBaseUrl}
              />
            </div>
            <div
              className={`AddressPage__content AddressPage__summary ${
                this.props.currentTab === 3 ? "AddressPage__content-active" : ""
              }`}
            >
              <PropertiesSummary isVisible={this.props.currentTab === 3} userAddr={searchAddr} />
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
