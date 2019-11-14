import React, { Component } from 'react';
import FileSaver from 'file-saver';
import Browser from 'util/browser';

import _find from 'lodash/find';

import AddressToolbar from 'components/AddressToolbar';
import PropertiesMap from 'components/PropertiesMap';
import PropertiesList from 'components/PropertiesList';
import PropertiesSummary from 'components/PropertiesSummary';
import Indicators from 'components/Indicators';
import DetailView from 'components/DetailView';
import APIClient from 'components/APIClient';
import Loader from 'components/Loader';

import 'styles/AddressPage.css';
import { GeoSearchRequester } from '@justfixnyc/geosearch-requester';
import NychaPage from './NychaPage';
import NotRegisteredPage from './NotRegisteredPage';
import helpers from '../util/helpers';

export default class AddressPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      searchAddress: { ...props.match.params },   // maybe this should be
      userAddr: {},                               // merged together?
      hasSearched: false,
      geosearch: {},
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
      const req = new GeoSearchRequester({});
      const {boro, housenumber, streetname} = this.state.searchAddress;
      const addr = `${housenumber} ${streetname}, ${boro}`;
      console.log('searching for', addr);
      req.fetchResults(addr).then(results => {
        const firstResult = results.features[0];
        if (!firstResult) throw new Error('Invalid address!');
        return APIClient.searchAddress({
          bbl: firstResult.properties.pad_bbl
        });
      }).then(results => {
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
    const { geosearch, addrs } = results;

    this.setState({
      searchAddress: { ...this.state.searchAddress, bbl: geosearch.bbl },
      userAddr: _find(addrs, { bbl: geosearch.bbl }),
      hasSearched: true,
      geosearch: geosearch,
      assocAddrs: addrs
    }, () => {
      this.handleAddrChange(this.state.userAddr);
    });

  }

  handleAddrChange = (addr) => {
    this.setState({
      detailAddr: addr,
      detailMobileSlide: true,
      currentTab: 0
    });
  }

  handleTimelineLink = () => {
    this.setState({
      currentTab: 1
    })
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
      return (
        (this.state.searchAddress && this.state.searchAddress.bbl
          && helpers.getNychaData(this.state.searchAddress.bbl) ? 
        <NychaPage geosearch={this.state.geosearch} searchAddress={this.state.searchAddress} nychaData={helpers.getNychaData(this.state.searchAddress.bbl)} /> : 
        <NotRegisteredPage geosearch={this.state.geosearch} searchAddress={this.state.searchAddress} /> )
      );
    }

    else if(this.state.hasSearched && this.state.assocAddrs && this.state.assocAddrs.length) {
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
                  PORTFOLIO: Your search address is associated with <u>{this.state.assocAddrs.length}</u> building{this.state.assocAddrs.length === 1 ? '':'s'}:
                </h5>
                <ul className="tab tab-block">
                  <li className={`tab-item ${this.state.currentTab === 0 ? "active" : ""}`}>
                    <a // eslint-disable-line jsx-a11y/anchor-is-valid
                      onClick={() => {
                        if(Browser.isMobile() && this.state.detailMobileSlide) {
                          this.handleCloseDetail();
                        }
                        this.setState({ currentTab: 0 });
                      }}
                    >Overview</a>
                  </li>
                  <li className={`tab-item ${this.state.currentTab === 1 ? "active" : ""}`}>
                    <a // eslint-disable-line jsx-a11y/anchor-is-valid
                      onClick={() => {this.setState({ currentTab: 1 }); window.gtag('event', 'timeline-tab');}}>Timeline</a>
                  </li>
                  <li className={`tab-item ${this.state.currentTab === 2 ? "active" : ""}`}>
                    <a // eslint-disable-line jsx-a11y/anchor-is-valid
                      onClick={() => {this.setState({ currentTab: 2 }); window.gtag('event', 'portfolio-tab');}}>Portfolio</a>
                  </li>
                  <li className={`tab-item ${this.state.currentTab === 3 ? "active" : ""}`}>
                    <a // eslint-disable-line jsx-a11y/anchor-is-valid
                      onClick={() => {this.setState({ currentTab: 3 }); window.gtag('event', 'summary-tab');}}>Summary</a>
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
              onAddrChange={this.handleAddrChange}
              isVisible={this.state.currentTab === 0}
            />
            <DetailView
              addr={this.state.detailAddr}
              portfolioSize={this.state.assocAddrs.length}
              mobileShow={this.state.detailMobileSlide}
              userAddr={this.state.userAddr}
              onCloseDetail={this.handleCloseDetail}
              onLinkToTimeline={this.handleTimelineLink}
            />
          </div>
          <div className={`AddressPage__content AddressPage__summary ${this.state.currentTab === 1 ? "AddressPage__content-active": ''}`}>
            <Indicators
              isVisible={this.state.currentTab === 1}
              detailAddr={this.state.detailAddr}
              onBackToOverview={this.handleAddrChange}
            />
          </div>
          <div className={`AddressPage__content AddressPage__table ${this.state.currentTab === 2 ? "AddressPage__content-active": ''}`}>
            {
            <PropertiesList
                addrs={this.state.assocAddrs}
                onOpenDetail={this.handleAddrChange}
              />
            }
          </div>
          <div className={`AddressPage__content AddressPage__summary ${this.state.currentTab === 3 ? "AddressPage__content-active": ''}`}>
            <PropertiesSummary
              isVisible={this.state.currentTab === 3}
              userAddr={this.state.userAddr}
            />
          </div>
          

        </div>
      );
    }
    else {
      return (<Loader loading={true} classNames="Loader-map">Loading</Loader>);
    }
  }
}
