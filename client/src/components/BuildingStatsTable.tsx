import React, { useContext } from "react";

import Helpers from "../util/helpers";
import { AddressRecord } from "./APIDataTypes";

import { withI18n, I18n } from "@lingui/react";
import { t } from "@lingui/macro";
import { Trans } from "@lingui/macro";

interface BuildingStatsAddrContext {
  getBuildingStats(): AddressRecord;
}

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
  return (
    <I18n>
      {({ i18n }) => (
        <div
          className="double"
          title={i18n._(
            t`This is the official identifer for the building according to the Dept. of Finance tax records.`
          )}
        >
          <label>
            Boro{bblDash}Block{bblDash}Lot (BBL)
          </label>
          {boro}
          {bblDash}
          {block}
          {bblDash}
          {lot}
        </div>
      )}
    </I18n>
  );
};

const YearBuilt = () => {
  const addr = useContext(AddrContext).getBuildingStats();
  return (
    <I18n>
      {({ i18n }) => (
        <div
          title={i18n._(
            t`The year that this building was originally constructed, according to the Dept. of City Planning.`
          )}
        >
          <Trans render="label">Year Built</Trans>
          {addr.yearbuilt !== 0 ? addr.yearbuilt : "N/A"}
        </div>
      )}
    </I18n>
  );
};

const UnitsRes = () => {
  const addr = useContext(AddrContext).getBuildingStats();
  return (
    <I18n>
      {({ i18n }) => (
        <div
          title={i18n._(
            t`The number of residential units in this building, according to the Dept. of City Planning.`
          )}
        >
          <Trans render="label">Units</Trans>
          {addr.unitsres}
        </div>
      )}
    </I18n>
  );
};

const OpenViolations = () => {
  const addr = useContext(AddrContext).getBuildingStats();
  return (
    <I18n>
      {({ i18n }) => (
        <div
          title={i18n._(
            t`The number of open HPD violations for this building, updated monthly. Click the HPD Building Profile button below for the most up-to-date information.`
          )}
        >
          <Trans render="label">Open Violations</Trans>
          {addr.openviolations}
        </div>
      )}
    </I18n>
  );
};

const TotalViolations = () => {
  const addr = useContext(AddrContext).getBuildingStats();
  return (
    <I18n>
      {({ i18n }) => (
        <div
          title={i18n._(
            t`This represents the total number of HPD Violations (both open & closed) recorded by the city.`
          )}
        >
          <Trans render="label">Total Violations</Trans>
          {addr.totalviolations}
        </div>
      )}
    </I18n>
  );
};

const Evictions = () => {
  const addr = useContext(AddrContext).getBuildingStats();
  return (
    <I18n>
      {({ i18n }) => (
        <div
          title={i18n._(
            t`Evictions executed by NYC Marshals since 2017. ANHD and the Housing Data Coalition cleaned, geocoded, and validated the data, originally sourced from DOI.`
          )}
        >
          <Trans render="label">Evictions</Trans>
          {addr.evictions !== null ? addr.evictions : "N/A"}
        </div>
      )}
    </I18n>
  );
};

const RsUnits = () => {
  const addr = useContext(AddrContext).getBuildingStats();
  return (
    <I18n>
      {({ i18n }) => (
        <div
          title={i18n._(
            t`This tracks how rent stabilized units in the building have changed (i.e. "${delta}") from 2007 to ${addr.rsunitslatestyear}. If the number for ${addr.rsunitslatestyear} is red, this means there has been a loss in stabilzied units! These counts are estimated from the DOF Property Tax Bills.`
          )}
        >
          <label>
            &Delta; <Trans>RS Units</Trans>
          </label>
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
        </div>
      )}
    </I18n>
  );
};

const BuildingStatsTableWithoutI18n = (props: { addr: AddressRecord }) => (
  <AddrContext.Provider
    value={{
      getBuildingStats: () => props.addr,
    }}
  >
    <div className="card-body-table hide-sm">
      <div className="table-row">
        <BBL />
        <YearBuilt />
        <UnitsRes />
      </div>
      <div className="table-row">
        <OpenViolations />
        <TotalViolations />
        <Evictions />
        <RsUnits />
      </div>
    </div>
    <div className="card-body-table show-sm">
      <div className="table-row">
        <BBL />
      </div>
      <div className="table-row">
        <YearBuilt />
        <UnitsRes />
        <RsUnits />
      </div>
      <div className="table-row">
        <OpenViolations />
        <TotalViolations />
        <Evictions />
      </div>
    </div>
    <span className="card-body-table-prompt float-right">
      <Trans render="i">(hover over a box to learn more)</Trans>
    </span>
  </AddrContext.Provider>
);

const BuildingStatsTable = withI18n()(BuildingStatsTableWithoutI18n);

export default BuildingStatsTable;
