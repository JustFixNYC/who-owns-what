import React from "react";
import { Trans } from "@lingui/macro";
import Helpers from "../util/helpers";
import { AddressRecord } from "./APIDataTypes";

type UsefulLinksProps = {
  addrForLinks: AddressRecord;
  location: "overview-tab" | "timeline-tab";
};

export const UsefulLinks: React.FC<UsefulLinksProps> = ({ addrForLinks, location }) => {
  const { bbl, housenumber, streetname } = addrForLinks;
  const { boro, block, lot } = Helpers.splitBBL(bbl);
  return (
    <div className="card-body-links">
      <b>
        <Trans>Useful links</Trans>
      </b>
      <ul>
        <li>
          View documents on{" "}
          <a
            onClick={() => {
              window.gtag("event", `acris-${location}`);
            }}
            href={`http://a836-acris.nyc.gov/bblsearch/bblsearch.asp?borough=${boro}&block=${block}&lot=${lot}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Trans>ACRIS</Trans>
          </a>
        </li>
        <li>
          <a
            onClick={() => {
              window.gtag("event", `hpd-${location}`);
            }}
            href={`https://hpdonline.hpdnyc.org/HPDonline/Provide_address.aspx?p1=${boro}&p2=${housenumber}&p3=${Helpers.formatStreetNameForHpdLink(
              streetname
            )}&SearchButton=Search`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Trans>HPD Building Profile</Trans>
          </a>
        </li>
        <li>
          <a
            onClick={() => {
              window.gtag("event", `dob-${location}`);
            }}
            href={`http://a810-bisweb.nyc.gov/bisweb/PropertyProfileOverviewServlet?boro=${boro}&block=${block}&lot=${lot}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Trans>DOB Building Profile</Trans>
          </a>
        </li>
        <li>
          <a
            onClick={() => {
              window.gtag("event", `dof-${location}`);
            }}
            href={`https://a836-pts-access.nyc.gov/care/search/commonsearch.aspx?mode=persprop`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Trans>DOF Property Tax Bills</Trans>
          </a>
        </li>
        <li>
          <a
            onClick={() => {
              window.gtag("event", `dap-${location}`);
            }}
            href={`https://portal.displacementalert.org/property/${boro}${block}${lot}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Trans>ANHD DAP Portal</Trans>
          </a>
        </li>
      </ul>
    </div>
  );
};
