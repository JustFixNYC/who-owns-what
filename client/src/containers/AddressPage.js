import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import FileSaver from 'file-saver';
import Helpers from 'util/helpers';
import Browser from 'util/browser';

import _find from 'lodash/find';

import AddressToolbar from 'components/AddressToolbar';
import PropertiesMap from 'components/PropertiesMap';
import PropertiesList from 'components/PropertiesList';
import PropertiesSummary from 'components/PropertiesSummary';
import DetailView from 'components/DetailView';
import APIClient from 'components/APIClient';

import 'styles/AddressPage.css';

export default class AddressPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      searchAddress: { ...props.match.params },   // maybe this should be
      userAddr: {},                               // merged together?
      hasSearched: false,
      geoclient: {},
      assocAddrs: [],
      detailAddr: null,
      detailMobileSlide: false,
      currentTab: 0
    };
  }

  componentDidMount() {

    // We need to check where to get the results data for the page...

    // Here, the user conducted a search on HomePage and we already got the results
    if(this.props.location && this.props.location.state && this.props.location.state.results) {
      this.handleResults(this.props.location.state.results);

    // Otherwise they navigated directly to this url, so lets fetch it
    } else {
      window.gtag('event', 'direct-link');
      APIClient.searchAddress(this.state.searchAddress)
        .then(results => {
          this.handleResults(results);
        })
        .catch(err => {
          console.error(err);
          this.setState({
            hasSearched: true,
            assocAddrs: []
          });
        })
    }
  }

  // Processes the results and setState accordingly. Doesn't care where results comes from
  handleResults = (results) => {
    const { geoclient, addrs } = results;

    this.setState({
      searchAddress: { ...this.state.searchAddress, bbl: geoclient.bbl },
      userAddr: _find(addrs, { bbl: geoclient.bbl }),
      hasSearched: true,
      geoclient: geoclient,
      assocAddrs: addrs
    }, () => {
      this.handleOpenDetail(this.state.userAddr);
    });

  }

  handleOpenDetail = (addr) => {
    this.setState({
      detailAddr: addr,
      detailMobileSlide: true,
      currentTab: 0
    });
  }

  handleCloseDetail = () => {
    this.setState({
      detailMobileSlide: false
    });

    setTimeout(() => {
      this.setState({
        detailAddr: null
      });
    }, 500)
  }

  // should this properly live in AddressToolbar? you tell me
  handleExportClick = () => {
    APIClient.getAddressExport(this.state.searchAddress)
      .then(response => response.blob())
      .then(blob => FileSaver.saveAs(blob, 'export.csv'));
  }

  render() {

    if(this.state.hasSearched && this.state.assocAddrs.length === 0)  {

      const geoclient = this.state.geoclient;
      const searchAddress = this.state.searchAddress;

      return (
        <Redirect to={{
          pathname: '/not-found',
          state: { geoclient, searchAddress }
        }}></Redirect>
      );
    }

    return (
      <div className="AddressPage">
        <div className="AddressPage__info">
          <AddressToolbar
            onExportClick={this.handleExportClick}
            userAddr={this.state.searchAddress}
            numOfAssocAddrs={this.state.assocAddrs.length}
          />
          { this.state.userAddr &&
            <div className="float-left">
              <h5 className="primary">
                This landlord is associated with <u>{this.state.assocAddrs.length}</u> building{this.state.assocAddrs.length === 1 ? '':'s'}:
              </h5>
              <ul className="tab tab-block">
                <li className={`tab-item ${this.state.currentTab === 0 ? "active" : ""}`}>
                  <a onClick={() => {
                    if(Browser.isMobile() && this.state.detailMobileSlide) {
                      this.handleCloseDetail();
                    }
                    this.setState({ currentTab: 0 });
                  }}>Map</a>
                </li>
                <li className={`tab-item ${this.state.currentTab === 1 ? "active" : ""}`}>
                  <a onClick={() => this.setState({ currentTab: 1 })}>List</a>
                </li>
                <li className={`tab-item ${this.state.currentTab === 2 ? "active" : ""}`}>
                  <a onClick={() => this.setState({ currentTab: 2 })}>Summary</a>
                </li>
              </ul>
            </div>
          }
        </div>
        <div className={`AddressPage__content AddressPage__viz ${this.state.currentTab === 0 ? "AddressPage__content-active": ''}`}>
          <PropertiesMap
            addrs={this.state.assocAddrs}
            userAddr={this.state.userAddr}
            detailAddr={this.state.detailAddr}
            onOpenDetail={this.handleOpenDetail}
            isVisible={this.state.currentTab === 0}
          />
          <DetailView
            addr={this.state.detailAddr}
            portfolioSize={this.state.assocAddrs.length}
            mobileShow={this.state.detailMobileSlide}
            userAddr={this.state.userAddr}
            onCloseDetail={this.handleCloseDetail}
          />
        </div>
        <div className={`AddressPage__content AddressPage__table ${this.state.currentTab === 1 ? "AddressPage__content-active": ''}`}>
          {
           <PropertiesList
              addrs={this.state.assocAddrs}
              onOpenDetail={this.handleOpenDetail}
            />
          }
        </div>
        <div className={`AddressPage__content AddressPage__summary ${this.state.currentTab === 2 ? "AddressPage__content-active": ''}`}>
          <PropertiesSummary
            isVisible={this.state.currentTab === 2}
            userAddr={this.state.userAddr}
          />
        </div>

      </div>
    );
  }
}
