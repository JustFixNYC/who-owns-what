import React, { useContext } from "react";

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
import Modal from "./Modal";

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

  const BBL = () => {
    const addr = useContext(AddrContext).getBuildingStats();
    const { boro, block, lot } = Helpers.splitBBL(addr.bbl);

    return (
      <I18n>
        {({ i18n }) => (
          <tr>
            <th>
              <Trans>{"Boro-Block-Lot (BBL)"}</Trans>
              <button
                className="results-info"
                onClick={() => {
                  setShowInfoModal(true);
                  setInfoModalTitle("Boro-Block-Lot (BBL)");
                  setInfoModalContent(
                    i18n._(
                      t`${"This is the official identifer for the building according to the Dept. of Finance tax records"}`
                    )
                  );
                }}
                aria-label={i18n._(
                  t`${"This is the official identifer for the building according to the Dept. of Finance tax records"}`
                )}
              >
                <Icon icon="circleInfo" className="info-icon" />
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
    return (
      <I18n>
        {({ i18n }) => (
          <tr>
            <th>
              <Trans>Year Built</Trans>
              <button
                className="results-info"
                onClick={() => {
                  setShowInfoModal(true);
                  setInfoModalTitle(i18n._(t`Year Built`));
                  setInfoModalContent(
                    i18n._(
                      t`The year that this building was originally constructed, according to the Dept. of Finance`
                    )
                  );
                }}
                aria-label={i18n._(
                  t`The year that this building was originally constructed, according to the Dept. of Finance`
                )}
              >
                <Icon icon="circleInfo" className="info-icon" />
              </button>
            </th>
            <td>{addr.yearbuilt !== 0 ? addr.yearbuilt : "N/A"}</td>
          </tr>
        )}
      </I18n>
    );
  };

  const UnitsRes = () => {
    const addr = useContext(AddrContext).getBuildingStats();
    return (
      <I18n>
        {({ i18n }) => (
          <tr>
            <th>
              <Trans>Units</Trans>
              <button
                className="results-info"
                onClick={() => {
                  setShowInfoModal(true);
                  setInfoModalTitle(i18n._(t`Units`));
                  setInfoModalContent(
                    i18n._(
                      t`The number of residential units in this building, according to the Dept. of Finance.`
                    )
                  );
                }}
                aria-label={i18n._(
                  t`The number of residential units in this building, according to the Dept. of Finance.`
                )}
              >
                <Icon icon="circleInfo" className="info-icon" />
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
    return (
      <I18n>
        {({ i18n }) => (
          <tr>
            <th>
              <Trans>Open Violations</Trans>
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
                aria-label={i18n._(
                  t`The number of open HPD violations for this building, updated monthly. Click the HPD Building Profile button below for the most up-to-date information.`
                )}
              >
                <Icon icon="circleInfo" className="info-icon" />
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
    return (
      <I18n>
        {({ i18n }) => (
          <tr>
            <th>
              <Trans>Total Violations</Trans>
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
                aria-label={i18n._(
                  t`This represents the total number of HPD Violations (both open & closed) recorded by the city.`
                )}
              >
                <Icon icon="circleInfo" className="info-icon" />
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

    return (
      <I18n>
        {({ i18n }) => (
          <tr>
            <th>
              <Trans>Evictions Executed</Trans>
              <button
                className="results-info"
                onClick={() => {
                  setShowInfoModal(true);
                  setInfoModalTitle(i18n._(t`Evictions Executed`));
                  setInfoModalContent(
                    i18n._(
                      t`Eviction cases filed in Housing Court since 2017. This data comes from the Office of Court Administration via the OCA Data Collective in collaboration with the Right to Counsel Coalition.`
                    )
                  );
                }}
                aria-label={i18n._(
                  t`Eviction cases filed in Housing Court since 2017. This data comes from the Office of Court Administration via the OCA Data Collective in collaboration with the Right to Counsel Coalition.`
                )}
              >
                <Icon icon="circleInfo" className="info-icon" />
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

    return (
      <I18n>
        {({ i18n }) => (
          <tr>
            <th>
              <Trans>Eviction Filings</Trans>
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
                aria-label={i18n._(
                  t`Eviction cases filed in Housing Court since 2017. This data comes from the Office of Court Administration via the Housing Data Coalition.`
                )}
              >
                <Icon icon="circleInfo" className="info-icon" />
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

    return (
      <I18n>
        {({ i18n }) => (
          <tr>
            <th>
              <Trans>Change in rent stabilized units</Trans>
              <button
                className="results-info"
                onClick={() => {
                  setShowInfoModal(true);
                  setInfoModalTitle(i18n._(t`Change in rent stabilized units`));
                  setInfoModalContent(
                    i18n._(
                      t`This tracks how rent stabilized units in the building have changed from 2007 to ${addr.rsunitslatestyear}. If the number for ${addr.rsunitslatestyear} is red, this means there has been a loss in stabilized units! These counts are estimated from the DOF Property Tax Bills.`
                    )
                  );
                }}
                aria-label={i18n._(
                  t`This tracks how rent stabilized units in the building have changed from 2007 to ${addr.rsunitslatestyear}. If the number for ${addr.rsunitslatestyear} is red, this means there has been a loss in stabilized units! These counts are estimated from the DOF Property Tax Bills.`
                )}
              >
                <Icon icon="circleInfo" className="info-icon" />
              </button>
            </th>
            <td>
              <span>{addr.rsunits2007 !== null ? addr.rsunits2007 : "N/A"}</span>{" "}
              <span>&#x2192;</span>{" "}
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
        <Trans render="span">View trends over time</Trans>
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
      <div className="BuildingStatsTable card-body-table">
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
        <div className="table-row timeline-link">
          <TimelineLink url={props.timelineUrl} />
        </div>
      </div>
    </AddrContext.Provider>
  );
};

const BuildingStatsTable = withI18n()(BuildingStatsTableWithoutI18n);

export default BuildingStatsTable;
