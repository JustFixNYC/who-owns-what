import React from "react";
import { Trans } from "@lingui/macro";
import Helpers from "../util/helpers";
import { AddressRecord } from "./APIDataTypes";
import { AmplitudeEvent, logAmplitudeEvent } from "components/Amplitude";

type UsefulLinksProps = {
  addrForLinks: Pick<AddressRecord, "bbl"> & Partial<Pick<AddressRecord, "buildingid">>;
  location: "overview-tab" | "timeline-tab" | "not-registered-page";
};

export const UsefulLinks: React.FC<UsefulLinksProps> = ({ addrForLinks, location }) => {
  const { bbl, buildingid } = addrForLinks;
  const { boro, block, lot } = Helpers.splitBBL(bbl);
  return (
    <div className="card-body-links">
      <Trans render={location === "not-registered-page" ? "p" : "b"}>Useful links</Trans>
      <ul>
        <li>
          <Trans>
            View documents on{" "}
            <a
              onClick={() => {
                logAmplitudeEvent(`acris-${location}` as AmplitudeEvent);
                window.gtag("event", `acris-${location}`);
              }}
              href={`http://a836-acris.nyc.gov/bblsearch/bblsearch.asp?borough=${boro}&block=${block}&lot=${lot}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              ACRIS
            </a>
          </Trans>
        </li>
        <li>
          <a
            onClick={() => {
              logAmplitudeEvent(`hpd-${location}` as AmplitudeEvent);
              window.gtag("event", `hpd-${location}`);
            }}
            href={
              !!buildingid
                ? `https://hpdonline.nyc.gov/hpdonline/building/${buildingid}/overview`
                : `https://hpdonline.nyc.gov/hpdonline/building/search-results?boro=${Helpers.formatBoroughNameForHpdLink(
                    boro
                  )}&block=${Number(block)}&lot=${Number(lot)}`
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            <Trans>HPD Building Profile</Trans>
          </a>
        </li>
        <li>
          <a
            onClick={() => {
              logAmplitudeEvent(`dob-${location}` as AmplitudeEvent);
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
              logAmplitudeEvent(`dof-${location}` as AmplitudeEvent);
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
              logAmplitudeEvent(`dap-${location}` as AmplitudeEvent);
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
