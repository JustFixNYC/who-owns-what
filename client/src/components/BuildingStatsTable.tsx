import React, { Fragment, useContext } from "react";

import Helpers from "../util/helpers";
import { AddressRecord } from "./APIDataTypes";

import { withI18n, I18n } from "@lingui/react";
import { t } from "@lingui/macro";
import { Trans } from "@lingui/macro";
import JFCLLinkInternal from "./JFCLLinkInternal";
import { Link } from "react-router-dom";
import "styles/BuildingStatsTable.css";
import { removeIndicatorSuffix } from "routes";
import { Icon } from "@justfixnyc/component-library";
import { InfoIcon } from "./Icons";
import { LocaleLink } from "i18n";
import Modal from "./Modal";
import { isLegacyPath } from "./WowzaToggle";

interface BuildingStatsAddrContext {
  getBuildingStats(): AddressRecord;
}

const BuildingStatsTableWithoutI18n = (props: { addr: AddressRecord; timelineUrl: string }) => {
  const [showInfoModal, setShowInfoModal] = React.useState(false);
  const [infoModalTitle, setInfoModalTitle] = React.useState("");
  const [infoModalContent, setInfoModalContent] = React.useState("");

  const AddrContext = React.createContext<BuildingStatsAddrContext>({
    getBuildingStats: () => {
      throw new Error("This Building Stats table has no data!");
    },
  });

  const bblDash = (
    <span className="unselectable" unselectable="on">
      -
    </span>
  );

  const delta = "Δ";

  const BBL = () => {
    const addr = useContext(AddrContext).getBuildingStats();
    const { boro, block, lot } = Helpers.splitBBL(addr.bbl);
    const title = "Boro-Block-Lot (BBL)";
    const description =
      "This is the official identifer for the building according to the Dept. of Finance tax records";

    return (
      <I18n>
        {({ i18n }) => (
          <tr>
            <th>
              <Fragment>{title}</Fragment>
              <button
                className="results-info"
                onClick={() => {
                  setShowInfoModal(true);
                  setInfoModalTitle(title);
                  setInfoModalContent(i18n._(t`${description}`));
                }}
                aria-label={description}
              >
                <InfoIcon />
              </button>
            </th>
            <td>
              {boro}
              {bblDash}
              {block}
              {bblDash}
              {lot}
            </td>
          </tr>
        )}
      </I18n>
    );
  };

  const YearBuilt = () => {
    const addr = useContext(AddrContext).getBuildingStats();
    const title = "Year Built";
    const description =
      "The year that this building was originally constructed, according to the Dept. of City Planning.";
    return (
      <I18n>
        {({ i18n }) => (
          <tr>
            <th>
              <Fragment>{title}</Fragment>
              <button
                className="results-info"
                onClick={() => {
                  setShowInfoModal(true);
                  setInfoModalTitle(i18n._(t`Year Built`));
                  setInfoModalContent(
                    i18n._(
                      t`The year that this building was originally constructed, according to the Dept. of City Planning.`
                    )
                  );
                }}
                aria-label={description}
              >
                <InfoIcon />
              </button>
            </th>
            <td>{addr.yearbuilt !== 0 ? addr.yearbuilt : "N/A"}</td>
          </tr>
        )}
      </I18n>
    );
  };

  // const title =
  // const description =
  // return (
  //   <I18n>
  //     {({ i18n }) => (
  //       <tr>
  //         <th>
  //           <Fragment>{title}</Fragment>
  //           <button
  //             className="results-info"
  //             onClick={() => {
  //               setShowInfoModal(true);
  //               setInfoModalTitle(i18n._(t``));
  //               setInfoModalContent(
  //                 i18n._(
  //                   t``
  //                 )
  //               );
  //             }}
  //             aria-label={description}
  //           >
  //             <InfoIcon />
  //           </button>
  //         </th>
  //         <td></td>
  //       </tr>
  //     )}
  //   </I18n>
  // );

  const UnitsRes = () => {
    const addr = useContext(AddrContext).getBuildingStats();
    const title = "Units";
    const description =
      "The number of residential units in this building, according to the Dept. of City Planning.";

    return (
      <I18n>
        {({ i18n }) => (
          <tr>
            <th>
              <Fragment>{title}</Fragment>
              <button
                className="results-info"
                onClick={() => {
                  setShowInfoModal(true);
                  setInfoModalTitle(i18n._(t`Units`));
                  setInfoModalContent(
                    i18n._(
                      t`The number of residential units in this building, according to the Dept. of City Planning.`
                    )
                  );
                }}
                aria-label={description}
              >
                <InfoIcon />
              </button>
            </th>
            <td>{addr.unitsres}</td>
          </tr>
        )}
      </I18n>
    );
  };

  const OpenViolations = () => {
    const addr = useContext(AddrContext).getBuildingStats();
    const title = "Open Violations";
    const description =
      "The number of open HPD violations for this building, updated monthly. Click the HPD Building Profile button below for the most up-to-date information.";
    return (
      <I18n>
        {({ i18n }) => (
          <tr>
            <th>
              <Fragment>{title}</Fragment>
              <button
                className="results-info"
                onClick={() => {
                  setShowInfoModal(true);
                  setInfoModalTitle(i18n._(t`Open Violations`));
                  setInfoModalContent(
                    i18n._(
                      t`The number of open HPD violations for this building, updated monthly. Click the HPD Building Profile button below for the most up-to-date information.`
                    )
                  );
                }}
                aria-label={description}
              >
                <InfoIcon />
              </button>
            </th>
            <td>{addr.openviolations}</td>
          </tr>
        )}
      </I18n>
    );
  };

  const TotalViolations = () => {
    const addr = useContext(AddrContext).getBuildingStats();
    const title = "Total Violations";
    const description =
      "This represents the total number of HPD Violations (both open & closed) recorded by the city.";
    return (
      <I18n>
        {({ i18n }) => (
          <tr>
            <th>
              <Fragment>{title}</Fragment>
              <button
                className="results-info"
                onClick={() => {
                  setShowInfoModal(true);
                  setInfoModalTitle(i18n._(t`Total Violations`));
                  setInfoModalContent(
                    i18n._(
                      t`This represents the total number of HPD Violations (both open & closed) recorded by the city.`
                    )
                  );
                }}
                aria-label={description}
              >
                <InfoIcon />
              </button>
            </th>
            <td>{addr.totalviolations}</td>
          </tr>
        )}
      </I18n>
    );
  };

  const EvictionsExecuted = () => {
    const addr = useContext(AddrContext).getBuildingStats();
    const title = "Evictions Executed";
    const description = `Evictions executed by NYC Marshals since 2017. ANHD and the Housing Data Coalition cleaned, geocoded, and validated the data, originally sourced from DOI.`;

    return (
      <I18n>
        {({ i18n }) => (
          <tr>
            <th>
              <Fragment>{title}</Fragment>
              <button
                className="results-info"
                onClick={() => {
                  setShowInfoModal(true);
                  setInfoModalTitle(i18n._(t`Evictions Executed`));
                  setInfoModalContent(
                    i18n._(
                      t`Evictions executed by NYC Marshals since 2017. ANHD and the Housing Data Coalition cleaned, geocoded, and validated the data, originally sourced from DOI.`
                    )
                  );
                }}
                aria-label={description}
              >
                <InfoIcon />
              </button>
            </th>
            <td> {addr.evictions !== null ? addr.evictions : "N/A"}</td>
          </tr>
        )}
      </I18n>
    );
  };

  const EvictionFilings = () => {
    const addr = useContext(AddrContext).getBuildingStats();
    const title = "Eviction Filings";
    const description = `Eviction cases filed in Housing Court since 2017. This data comes from the Office of Court Administration via the Housing Data Coalition.`;

    return (
      <I18n>
        {({ i18n }) => (
          <tr>
            <th>
              <Fragment>{title}</Fragment>
              <button
                className="results-info"
                onClick={() => {
                  setShowInfoModal(true);
                  setInfoModalTitle(i18n._(t`Eviction Filings`));
                  setInfoModalContent(
                    i18n._(
                      t`Eviction cases filed in Housing Court since 2017. This data comes from the Office of Court Administration via the Housing Data Coalition.`
                    )
                  );
                }}
                aria-label={description}
              >
                <InfoIcon />
              </button>
            </th>
            <td> {addr.evictionfilings !== null ? addr.evictionfilings : "N/A"}</td>
          </tr>
        )}
      </I18n>
    );
  };

  const RsUnits = () => {
    const addr = useContext(AddrContext).getBuildingStats();
    const title = "Change in rent stabilized units";
    const description = `This tracks how rent stabilized units in the building have changed (i.e. "${delta}") from 2007 to ${addr.rsunitslatestyear}. If the number for ${addr.rsunitslatestyear} is red, this means there has been a loss in stabilized units! These counts are estimated from the DOF Property Tax Bills.`;

    return (
      <I18n>
        {({ i18n }) => (
          <tr>
            <th>
              <Fragment>{title}</Fragment>
              <button
                className="results-info"
                onClick={() => {
                  setShowInfoModal(true);
                  setInfoModalTitle(i18n._(t`RS Units`));
                  setInfoModalContent(
                    i18n._(
                      t`This tracks how rent stabilized units in the building have changed (i.e. "${delta}") from 2007 to ${addr.rsunitslatestyear}. If the number for ${addr.rsunitslatestyear} is red, this means there has been a loss in stabilized units! These counts are estimated from the DOF Property Tax Bills.`
                    )
                  );
                }}
                aria-label={description}
              >
                <InfoIcon />
              </button>
            </th>
            <td>
              <span>{addr.rsunits2007 !== null ? addr.rsunits2007 : "N/A"}</span>
              <span>&#x21FE;</span>
              <span
                className={`${
                  addr.rsunits2007 && addr.rsunitslatest && addr.rsunitslatest < addr.rsunits2007
                    ? "text-danger"
                    : ""
                }`}
              >
                {addr.rsunitslatest !== null ? addr.rsunitslatest : "N/A"}
              </span>
            </td>
          </tr>
        )}
      </I18n>
    );
  };

  const TimelineLink = (props: { url: string }) => {
    return (
      <Link
        to={removeIndicatorSuffix(props.url)}
        onClick={() => {
          window.gtag("event", "view-data-over-time-overview-tab");
        }}
        component={JFCLLinkInternal}
        className="timeline-link"
      >
        <Trans render="span">View data over time</Trans>
      </Link>
    );
  };

  return (
    <AddrContext.Provider
      value={{
        getBuildingStats: () => props.addr,
      }}
    >
      <Modal key={1} showModal={showInfoModal} width={40} onClose={() => setShowInfoModal(false)}>
        <h4>{infoModalTitle}</h4>
        <p>{infoModalContent}</p>
      </Modal>

      <table>
        <BBL />
        <YearBuilt />
        <UnitsRes />
        <RsUnits />
        <OpenViolations />
        <TotalViolations />
        <EvictionFilings />
        <EvictionsExecuted />
      </table>
      <div className="BuildingStatsTable card-body-table hide-sm">
        {/* <div className="table-row">
          <BBL />
          <YearBuilt />
          <UnitsRes />
          <RsUnits />
        </div>
        <div className="table-row">
          <OpenViolations />
          <TotalViolations />
          <EvictionFilings />
          <EvictionsExecuted />
        </div> */}
        <div className="table-row timeline-link">
          <TimelineLink url={props.timelineUrl} />
        </div>
      </div>
      <div className="BuildingStatsTable card-body-table show-sm">
        <div className="table-row">
          <BBL />
          <YearBuilt />
        </div>
        <div className="table-row">
          <UnitsRes />
          <RsUnits />
          <OpenViolations />
        </div>
        <div className="table-row">
          <TotalViolations />
          <EvictionsExecuted />
        </div>
        <div className="table-row timeline-link">
          <TimelineLink url={props.timelineUrl} />
        </div>
      </div>
    </AddrContext.Provider>
  );
};

const BuildingStatsTable = withI18n()(BuildingStatsTableWithoutI18n);

export default BuildingStatsTable;
