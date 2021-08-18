import React from "react";
import { LocaleLink as Link, parseLocaleFromPath, removeLocalePrefix } from "../i18n";
import Modal from "./Modal";

import "styles/AddressToolbar.css";
import { Trans } from "@lingui/macro";
import { SearchAddress } from "./AddressSearch";
import { useState } from "react";
import { useHistory, useLocation } from "react-router-dom";

export type AddressToolbarProps = {
  onExportClick: () => void;
  numOfAssocAddrs: number;
  searchAddr: SearchAddress;
};

const ToggleButtonBetweenPortfolioMethods = () => {
  const history = useHistory();
  const { pathname } = useLocation();
  const isWowzaRoute = removeLocalePrefix(pathname).startsWith("/wowza");
  const toggleUrlChange = () => {
    if (isWowzaRoute) {
      history.push(pathname.replace("/wowza", ""));
    } else {
      const locale = parseLocaleFromPath(pathname);
      const newUrl = `/${locale}/wowza${removeLocalePrefix(pathname)}`;
      history.push(newUrl);
    }
    history.go(0);
  };
  return (
    <button className="btn btn-justfix" onClick={() => toggleUrlChange()}>
      {isWowzaRoute ? <Trans>Switch to Old Version</Trans> : <Trans>Switch to New Version</Trans>}
    </button>
  );
};

const AddressToolbar: React.FC<AddressToolbarProps> = ({
  onExportClick,
  numOfAssocAddrs,
  searchAddr,
}) => {
  const allowChangingPortfolioMethod = process.env.REACT_APP_ENABLE_NEW_WOWZA_PORTFOLIO_MAPPING;
  const [showExportModal, setExportModalVisibility] = useState(false);

  const userAddrStr = `${searchAddr.housenumber} ${searchAddr.streetname}, ${searchAddr.boro}`;

  return (
    <div className="AddressToolbar">
      <div className="btn-group float-right">
        {allowChangingPortfolioMethod && <ToggleButtonBetweenPortfolioMethods />}
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
