import React from "react";
import { LocaleLink as Link } from "../i18n";
import Modal from "./Modal";

import "styles/AddressToolbar.css";
import { Trans } from "@lingui/macro";
import { SearchAddress } from "./AddressSearch";
import { useState } from "react";
import { isLegacyPath } from "./WowzaToggle";
import { AddressRecord } from "./APIDataTypes";
import ExportDataButton from "./ExportData";
import { useLocation } from "react-router-dom";
import { createWhoOwnsWhatRoutePaths } from "routes";
import { logAmplitudeEvent } from "./Amplitude";
import { Button, Link as JFCLLink } from "@justfixnyc/component-library";
import { i18n } from "@lingui/core";

export type AddressToolbarProps = {
  searchAddr: SearchAddress;
  assocAddrs: AddressRecord[];
};

const AddressToolbar: React.FC<AddressToolbarProps> = ({ searchAddr, assocAddrs }) => {
  const [showExportModal, setExportModalVisibility] = useState(false);
  const { pathname } = useLocation();
  const { home, legacy } = createWhoOwnsWhatRoutePaths();
  const userAddrStr = `${searchAddr.housenumber} ${searchAddr.streetname}, ${searchAddr.boro}`;

  return (
    <div className="AddressToolbar">
      <div className="btn-group">
        <Link
          onClick={() => {
            logAmplitudeEvent("newSearch");
            window.gtag("event", "new-search");
          }}
          to={isLegacyPath(pathname) ? legacy.home : home}
          component={JFCLLink}
        >
          <Trans>New Search</Trans>
        </Link>
        <Button
          labelText={i18n._("Export Data")}
          variant="secondary"
          size="small"
          onClick={() => {
            setExportModalVisibility(true);
            logAmplitudeEvent("clickExportData");
            window.gtag("event", "click-export-data");
          }}
        />
      </div>
      <Modal showModal={showExportModal} onClose={() => setExportModalVisibility(false)}>
        <Trans render="p">
          This will export <b>{assocAddrs.length}</b> addresses associated with the landlord at{" "}
          <b>{userAddrStr}</b>!
        </Trans>
        <Trans render="p">
          This data is in <u>CSV file format</u>, which can easily be used in Excel, Google Sheets,
          or any other spreadsheet program.
        </Trans>
        <br />
        <ExportDataButton data={assocAddrs} />
      </Modal>
    </div>
  );
};

export default AddressToolbar;
