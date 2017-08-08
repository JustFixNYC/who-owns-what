import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import FileSaver from 'file-saver';

import OwnersTable from 'components/OwnersTable';
import AddressToolbar from 'components/AddressToolbar';
import PropertiesMap from 'components/PropertiesMap';
import APIClient from 'components/APIClient';

import 'styles/AddressPage.css';

class AddressPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      searchAddress: { ...props.match.params },
      hasSearched: false,
      contacts: [],
      assocAddrs: []
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
        { /* <h5 className="inline-block">We found <u>{this.state.assocAddrs.length}</u> other buildings that share this landlord<sup><span className="tooltip" data-tooltip="We can't guarantee 100% accuracy :~(">*</span></sup>:</h5> */ }
        { /* <h5 className="inline-block">We found <u>{this.state.assocAddrs.length}</u> other buildings that share this landlord:</h5> */ }
        <h5 className="inline-block mb-10">This landlord is associated with <u>{this.state.assocAddrs.length}</u> other buildings:</h5>
        </div>
        <PropertiesMap
          addrs={this.state.assocAddrs}
          userAddr={this.state.searchAddress}
        />
      </div>
    );
  }
}

export default AddressPage;
