import React from "react";
import { Trans } from "@lingui/macro";
import { CSVDownloader } from "react-papaparse";
import { AddressRecord } from "./APIDataTypes";

const ExportDataButton: React.FC<{ data: AddressRecord[] }> = ({ data }) => {
  // Remove fields we do not want to include in the data export:
  const fieldsWeWant = data.map(({ mapType, ...fields }) => fields);
  const formattedData = fieldsWeWant.map((addr) => {
    return {
      ...addr,
    };
  });

  return (
    <CSVDownloader data={formattedData} filename="who_owns_what_export.csv">
      <button
        className="btn centered"
        onClick={() => {
          window.gtag("event", "export-data");
        }}
      >
        <Trans>Download</Trans>
      </button>
    </CSVDownloader>
  );
};

export default ExportDataButton;
