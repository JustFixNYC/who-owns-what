import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import FileSaver from 'file-saver';
import Helpers from 'util/helpers';

import _find from 'lodash/find';
import _countBy from 'lodash/countBy';
import _ from 'lodash';

import OwnersTable from 'components/OwnersTable';
import AddressToolbar from 'components/AddressToolbar';
import PropertiesMap from 'components/PropertiesMap';
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
      detailHasJustFixUsers: false
    };
  }

  componentDidMount() {

    // We need to check where to get the results data for the page...

    // Here, the user conducted a search on HomePage and we already got the results
    if(this.props.location && this.props.location.state && this.props.location.state.results) {
      this.handleResults(this.props.location.state.results);

    // Otherwise they navigated directly to this url, so lets fetch it
    } else {
      APIClient.searchAddress(this.state.searchAddress).then(results => {
        this.handleResults(results);
      });
    }
  }

  // Processes the results and setState accordingly. Doesn't care where results comes from
  handleResults = (results) => {
    const { geoclient, addrs } = results;

    console.log('user', _find(addrs, { bbl: geoclient.bbl }));

    let owners = addrs.map(a => a.ownernames).reduce((a,b) => a.concat(b));
    owners = _.chain(owners)
      .countBy(o => o.value)
      .toPairs()
      .sortBy(o => o[1])
      .reverse()
      .value();


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
      detailAddr: addr
    });

    APIClient.searchForJFXUsers([addr.bbl]).then(res => {
      this.setState({
        detailHasJustFixUsers: res.hasJustFixUsers
      })
    });
  }

  handleCloseDetail = () => {
    this.setState({
      detailAddr: null
    });
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

    let boro, block, lot;
    if(this.state.searchAddress.bbl) {
      ({ boro, block, lot } = Helpers.splitBBL(this.state.searchAddress.bbl));
    }

    let landlordName;
    if(this.state.userAddr.ownernames) {
      var owners =  this.state.userAddr.ownernames;    // "owners"
                                                      // real estate doesn't own nyc tho
      let landlords = owners.filter(o => o.title == "HeadOfficer" || o.title == "IndividualOwner");
      landlordName = landlords[0].value;
    }

    return (
      <div className="AddressPage">
        <div className="AddressPage__info">
          <AddressToolbar
            onExportClick={this.handleExportClick}
            userAddr={this.state.searchAddress}
            numOfAssocAddrs={this.state.assocAddrs.length}
          />
        {
          // <h5 className="primary">
          //   Information for {this.state.searchAddress.housenumber} {this.state.searchAddress.streetname}, {this.state.searchAddress.boro}:
          // </h5>
        }
          { this.state.userAddr &&
            <h5 className="primary">
              The landlord at { this.state.searchAddress.housenumber} {this.state.searchAddress.streetname}, {this.state.searchAddress.boro} is associated with ~<u>{Math.max(this.state.assocAddrs.length - 1, 0)}</u> other building{(this.state.assocAddrs.length - 1) === 1 ? '':'s'}:
            </h5>
          }
          {//<p><i>Boro-Block-Lot: {boro}-{block}-{lot}</i></p>
          }
          {
            // <OwnersTable
            //   addr={this.state.userAddr}
            //   hasJustFixUsers={this.state.hasJustFixUsers}
            // />
          }


        </div>
        <div className="AddressPage__viz">
          <DetailView
            addr={this.state.detailAddr}
            hasJustFixUsers={this.state.detailHasJustFixUsers}
            onCloseDetail={this.handleCloseDetail}
          />
          <PropertiesMap
            addrs={this.state.assocAddrs}
            userAddr={this.state.userAddr}
            detailAddr={this.state.detailAddr}
            onOpenDetail={this.handleOpenDetail}
            onMapLoad={this.handleMapLoad}
          />
          { // !this.state.detailAddr && this.state.hasSearched &&
            // <div className="AddressPage__viz-prompt">
            //   <p><i>(click on a building to view details)</i></p>
            // </div>
          }

        </div>

      </div>
    );
  }
}
