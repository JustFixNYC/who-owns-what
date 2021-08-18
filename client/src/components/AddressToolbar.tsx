import React, { Component } from "react";
import { LocaleLink as Link } from "../i18n";
import Modal from "./Modal";

import "styles/AddressToolbar.css";
import { Trans } from "@lingui/macro";
import { SearchAddress } from "./AddressSearch";
import { useState } from "react";

export type AddressToolbarProps = {
  onExportClick: () => void;
  numOfAssocAddrs: number;
  searchAddr: SearchAddress;
};

type State = {
  showExportModal: boolean;
};

const AddressToolbar: React.FC<AddressToolbarProps> = ({
  onExportClick,
  numOfAssocAddrs,
  searchAddr,
}) => {
  const [showExportModal, setExportModalVisibility] = useState(false);
  const userAddrStr = `${searchAddr.housenumber} ${searchAddr.streetname}, ${searchAddr.boro}`;

  return (
    <div className="AddressToolbar">
      <div className="btn-group float-right">
        <Link
          className="btn btn-primary"
          onClick={() => {
            window.gtag("event", "new-search");
          }}
          to="/"
        >
          <Trans>New Search</Trans>
        </Link>
        <button className="btn" onClick={() => setExportModalVisibility(true)}>
          <Trans>Export Data</Trans>
        </button>
      </div>
      <Modal showModal={showExportModal} onClose={() => setExportModalVisibility(false)}>
        <Trans render="p">
          This will export <b>{numOfAssocAddrs}</b> addresses associated with the landlord at{" "}
          <b>{userAddrStr}</b>!
        </Trans>
        <Trans render="p">
          This data is in <u>CSV file format</u>, which can easily be used in Excel, Google Sheets,
          or any other spreadsheet program.
        </Trans>
        <br />
        <button
          className="btn centered"
          onClick={() => {
            window.gtag("event", "export-data");
            onExportClick();
          }}
        >
          <Trans>Download</Trans>
        </button>
      </Modal>
    </div>
  );
};

export default AddressToolbar;
