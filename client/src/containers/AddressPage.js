import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import FileSaver from 'file-saver';

import OwnersTable from 'components/OwnersTable';
import AddressToolbar from 'components/AddressToolbar';
import PropertiesMap from 'components/PropertiesMap';
import DetailView from 'components/DetailView';
import APIClient from 'components/APIClient';

import 'styles/AddressPage.css';

class AddressPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      searchAddress: { ...props.match.params },
      hasSearched: false,
      contacts: [],
      assocAddrs: [],
      detailAddr: null,
      detailHasJustFixUsers: false
    };
  }

  componentDidMount() {

    const query = this.state.searchAddress;

    APIClient.searchAddress(query).then(data => {

      const { contacts, landlords } = data;

      let addrs = [];

      if(landlords.length) {
        // for each landlord/rba found, add its rba to each addr object
        // and then reduce and concatenate them
        addrs = landlords.map(l => {
          const assocRba = `${l.businesshousenumber} ${l.businessstreetname}${l.businessapartment ? ' ' + l.businessapartment : ''}, ${l.businesszip}`;
          return l.addrs.map(a => { return { ...a, assocRba }})
        }).reduce((a,b) => a.concat(b));

        // get array of bbls
        const bbls = addrs.map(addr => addr.bbl);

        // check for JFX users
        if(bbls.length) {
          APIClient.searchForJFXUsers(bbls).then(res => {
            this.setState({
              hasJustFixUsers: res.hasJustFixUsers
            })
          });
        }
      }

      this.setState({
        searchAddress: contacts.length ? { ...query, bbl: contacts[0].bbl } : query,
        hasSearched: true,
        contacts: contacts.length ? contacts : [],
        assocAddrs: addrs
      });

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
      return (
        <Redirect to={{
          pathname: '/',
          search: '?not-found=1'
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
          <h5 className="inline-block mb-10">This landlord is associated with <u>{this.state.assocAddrs.length - 1}</u> other building{(this.state.assocAddrs.length - 1) === 1 ? '':'s'}:</h5>
        </div>
        <div className="AddressPage__viz">
          <PropertiesMap
            addrs={this.state.assocAddrs}
            userAddr={this.state.searchAddress}
            detailAddr={this.state.detailAddr}
            onOpenDetail={this.handleOpenDetail}
          />
          { !this.state.detailAddr &&
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

export default AddressPage;
