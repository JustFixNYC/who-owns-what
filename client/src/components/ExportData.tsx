import React from "react";
import { CSVDownloader } from "react-papaparse";
import { AddressRecord, HpdComplaintCount, HpdFullContact, HpdOwnerContact } from "./APIDataTypes";
import helpers from "util/helpers";
import { logAmplitudeEvent } from "./Amplitude";
import { Button } from "@justfixnyc/component-library";
import { i18n } from "@lingui/core";

export const formatOwnerNames = (names: HpdOwnerContact[] | null) => {
  return names ? names.map(({ title, value }) => `${value} (${title})`).join(", ") : "";
};

export const formatComplaintTypes = (complaints: HpdComplaintCount[] | null) => {
  return complaints ? complaints.map(({ type, count }) => `${type} (${count})`).join(", ") : "";
};

export const formatAllContacts = (contacts: HpdFullContact[] | null) => {
  if (!contacts) return "";
  else
    return contacts
      .map(({ title, value, address }) => {
        const formattedAddress = address
          ? `, ${helpers.formatHpdContactAddress(address).addressLine1} ${
              helpers.formatHpdContactAddress(address).addressLine2
            }`
          : "";
        return `${value} (${title})${formattedAddress}`;
      })
      .join("; ");
};

const ExportDataButton: React.FC<{ data: AddressRecord[] }> = ({ data }) => {
  // Remove fields we do not want to include in the data export:
  const fieldsWeWant = data.map(({ mapType, ...fields }) => fields);
  const formattedData = fieldsWeWant.map((addr) => {
    return {
      ...addr,
      corpnames: !!addr.corpnames ? addr.corpnames.join("; ") : "",
      businessaddrs: !!addr.businessaddrs ? addr.businessaddrs.join("; ") : "",
      ownernames: formatOwnerNames(addr.ownernames),
      recentcomplaintsbytype: formatComplaintTypes(addr.recentcomplaintsbytype),
      allcontacts: formatAllContacts(addr.allcontacts),
    };
  });

  return (
    <CSVDownloader
      data={formattedData}
      filename="who_owns_what_export"
      className="flex-centered download-btn-link"
    >
      <Button
        onClick={() => {
          logAmplitudeEvent("downloadPortfolioData");
          window.gtag("event", "download-portfolio-data");
        }}
        labelText={i18n._("Download")}
        variant="secondary"
        size="small"
      />
    </CSVDownloader>
  );
};

export default ExportDataButton;
