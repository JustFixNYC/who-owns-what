import React from "react";
import { Trans } from "@lingui/macro";
import Helpers from "../util/helpers";
import { AddressRecord } from "./APIDataTypes";
import { AmplitudeEvent, logAmplitudeEvent } from "components/Amplitude";
import { Link } from "@justfixnyc/component-library";

type UsefulLinksProps = {
  addrForLinks: Pick<AddressRecord, "bbl"> &
    Partial<Pick<AddressRecord, "hpdbuildingid" | "hpdbuildings">>;
  location: "overview-tab" | "timeline-tab" | "not-registered-page";
};

export const UsefulLinks: React.FC<UsefulLinksProps> = ({ addrForLinks, location }) => {
  const { bbl, hpdbuildingid, hpdbuildings } = addrForLinks;
  const { boro, block, lot } = Helpers.splitBBL(bbl);
  return (
    <div className="card-body-links">
      <Trans render={location === "not-registered-page" ? "p" : "b"}>Useful links</Trans>
      <ul>
        <li>
          <Link
            onClick={() => {
              logAmplitudeEvent(`acris-${location}` as AmplitudeEvent);
              window.gtag("event", `acris-${location}`);
            }}
            href={`http://a836-acris.nyc.gov/bblsearch/bblsearch.asp?borough=${boro}&block=${block}&lot=${lot}`}
            target="_blank"
            rel="noopener noreferrer"
            icon="external"
          >
            <Trans>View documents on ACRIS</Trans>
          </Link>
        </li>
        <li>
          <Link
            onClick={() => {
              logAmplitudeEvent(`hpd-${location}` as AmplitudeEvent);
              window.gtag("event", `hpd-${location}`);
            }}
            href={
              !!hpdbuildingid && hpdbuildings === 1
                ? `https://hpdonline.nyc.gov/hpdonline/building/${hpdbuildingid}/overview`
                : "https://hpdonline.nyc.gov/hpdonline"
            }
            target="_blank"
            rel="noopener noreferrer"
            icon="external"
          >
            <Trans>HPD Building Profile</Trans>
          </Link>
        </li>
        <li>
          <Link
            onClick={() => {
              logAmplitudeEvent(`dob-${location}` as AmplitudeEvent);
              window.gtag("event", `dob-${location}`);
            }}
            href={`http://a810-bisweb.nyc.gov/bisweb/PropertyProfileOverviewServlet?boro=${boro}&block=${block}&lot=${lot}`}
            target="_blank"
            rel="noopener noreferrer"
            icon="external"
          >
            <Trans>DOB Building Profile</Trans>
          </Link>
        </li>
        <li>
          <Link
            onClick={() => {
              logAmplitudeEvent(`dof-${location}` as AmplitudeEvent);
              window.gtag("event", `dof-${location}`);
            }}
            href={`https://a836-pts-access.nyc.gov/care/search/commonsearch.aspx?mode=persprop`}
            target="_blank"
            rel="noopener noreferrer"
            icon="external"
          >
            <Trans>DOF Property Tax Bills</Trans>
          </Link>
        </li>
        <li>
          <Link
            onClick={() => {
              logAmplitudeEvent(`dap-${location}` as AmplitudeEvent);
              window.gtag("event", `dap-${location}`);
            }}
            href={`https://portal.displacementalert.org/property/${boro}${block}${lot}`}
            target="_blank"
            rel="noopener noreferrer"
            icon="external"
          >
            <Trans>ANHD DAP Portal</Trans>
          </Link>
        </li>
      </ul>
    </div>
  );
};
