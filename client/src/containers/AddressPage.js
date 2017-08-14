import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import FileSaver from 'file-saver';

import mergeWith from 'lodash/mergeWith';
import keys from 'lodash/keys';
import values from 'lodash/values';
import groupBy from 'lodash/groupBy';

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
      // for each landlord/rba found, add its rba to each addr object
      // and then reduce and concatenate them
      let addrsByLL = landlords.map(l => {
        const assocRba = `${l.businesshousenumber} ${l.businessstreetname}${l.businessapartment ? ' ' + l.businessapartment : ''}, ${l.businesszip}`;
        return l.addrs.map(a => { return { ...a, assocRba }})
      }).reduce((a,b) => a.concat(b));

      let addrsByBBL = groupBy(addrsByLL, 'bbl');

      // groups duplicates by bbl
      // this occurs when the property is associated by more than one rba
      addrs = values(addrsByBBL);
      const bbls = keys(addrsByBBL);

      // merge the repeat addrs to make the duplicate rba's into an array
      addrs = addrs.map(addr => {
        return mergeWith({}, ...addr, (v1, v2, key) => {
          if(key == 'assocRba') {
            const arr = (v1 || []);
            arr.push(v2);
            return arr;
          }
        });
      });

      console.log(addrs);

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
        { this.state.hasSearched && <h5 className="inline-block mb-10">This landlord is associated with <u>{this.state.assocAddrs.length - 1}</u> other building{(this.state.assocAddrs.length - 1) === 1 ? '':'s'}:</h5> }
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
