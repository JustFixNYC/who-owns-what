import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import FileSaver from 'file-saver';
import Helpers from 'util/helpers';

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
      searchAddress: { ...props.match.params },
      hasSearched: false,
      geoclient: {},
      contacts: [],
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
    const { geoclient, contacts, landlords } = results;

    let addrs = [];

    if(landlords.length) {

      // iterate thru each landlord and each address associated with the landlord
      // if the property is linked by more than one rba (i.e. the BBL already exists), it handles that gracefully in an es6 Set
      for(let i = 0; i < landlords.length; i++) {
        const assocRba = `${landlords[i].businesshousenumber} ${landlords[i].businessstreetname}${landlords[i].businessapartment ? ' ' + landlords[i].businessapartment : ''}, ${landlords[i].businesszip}`;

        for(let j = 0; j < landlords[i].addrs.length; j++) {
          let newAddr = landlords[i].addrs[j];

          // instead of using _.find, we use a for loop that is super performant!
          let addr = Helpers.find(addrs, 'bbl', newAddr.bbl);
          if(!addr) {
            newAddr.assocRbas = new Set([assocRba]);
            addrs.push(newAddr);
          } else {
            addr.assocRbas.add(assocRba);
          }
        }
      }

      // check for JFX users
      // if(bbls.length) {
      //   APIClient.searchForJFXUsers(bbls).then(res => {
      //     this.setState({
      //       hasJustFixUsers: res.hasJustFixUsers
      //     })
      //   });
      // }
    }

    // The first line of this is essentially "keep searchAddress unless we found a BBL, in which case add it to the searchAddress object"
    // TBH now that we pass geoclient results to the client we don't really need to do this, but its working just fine atm
    this.setState({
      searchAddress: contacts.length ? { ...this.state.searchAddress, bbl: contacts[0].bbl } : this.state.searchAddress,
      hasSearched: true,
      geoclient: geoclient,
      contacts: contacts.length ? contacts : [],
      assocAddrs: addrs
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

    if(this.state.hasSearched && this.state.contacts.length === 0)  {

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
          <h5 className="primary">Information for {this.state.searchAddress.housenumber} {this.state.searchAddress.streetname}, {this.state.searchAddress.boro}:</h5>
          <OwnersTable
            contacts={this.state.contacts}
            hasJustFixUsers={this.state.hasJustFixUsers}
          />
        { this.state.hasSearched && <h5 className="inline-block mb-10">This landlord is associated with <u>{Math.max(this.state.assocAddrs.length - 1, 0)}</u> other building{(this.state.assocAddrs.length - 1) === 1 ? '':'s'}:</h5> }
        </div>
        <div className="AddressPage__viz">
          <PropertiesMap
            addrs={this.state.assocAddrs}
            userAddr={this.state.searchAddress}
            detailAddr={this.state.detailAddr}
            onOpenDetail={this.handleOpenDetail}
            onMapLoad={this.handleMapLoad}
          />
          { !this.state.detailAddr && this.state.hasSearched &&
            <div className="AddressPage__viz-prompt">
              <p><i>(click on a building to view details)</i></p>
            </div>
          }
          <DetailView
            addr={this.state.detailAddr}
            hasJustFixUsers={this.state.detailHasJustFixUsers}
            onCloseDetail={this.handleCloseDetail}
          />
        </div>

      </div>
    );
  }
}
