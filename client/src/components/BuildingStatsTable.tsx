import React, { useContext } from "react";

import Helpers from "../util/helpers";
import { AddressRecord } from "./APIDataTypes";

import { withI18n, I18n } from "@lingui/react";
import { t } from "@lingui/macro";
import { Trans } from "@lingui/macro";

type Props = {
  addr: AddressRecord;
  i18n: I18n;
};

const EmptyBuildingStatsData = {
  bbl: "",
  yearbuilt: 0,
  unitsres: 0,
  openviolations: 0,
  totalviolations: 0,
  evictions: null,
  rsunits2007: null,
  rsunits2017: null,
};

interface BuildingStatsAddrContext {
  getBuildingStats(): AddressRecord;
}

const AddrContext = React.createContext<BuildingStatsAddrContext>({
  getBuildingStats: () => {
    throw new Error("This Building Stats table has no data!");
  },
});
const I18nContext = React.createContext({});

const bblDash = (
  <span className="unselectable" unselectable="on">
    -
  </span>
);

const BBL = () => {
  const addr = useContext(AddrContext).getBuildingStats();
  const { boro, block, lot } = Helpers.splitBBL(addr.bbl);
  const i18n = useContext(I18nContext);
  return (
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
  );
};

const YearBuilt = () => {
  const addr = useContext(AddrContext).getBuildingStats();
  const i18n = useContext(I18nContext);
  return (
    <div
      title={i18n._(
        t`The year that this building was originally constructed, according to the Dept. of City Planning.`
      )}
    >
      <Trans render="label">Year Built</Trans>
      {addr.yearbuilt !== 0 ? addr.yearbuilt : "N/A"}
    </div>
  );
};

const UnitsRes = () => {
  const addr = useContext(AddrContext).getBuildingStats();
  const i18n = useContext(I18nContext);
  return (
    <div
      title={i18n._(
        t`The number of residential units in this building, according to the Dept. of City Planning.`
      )}
    >
      <Trans render="label">Units</Trans>
      {addr.unitsres}
    </div>
  );
};

const OpenViolations = () => {
  const addr = useContext(AddrContext).getBuildingStats();
  const i18n = useContext(I18nContext);
  return (
    <div
      title={i18n._(
        t`The number of open HPD violations for this building, updated monthly. Click the HPD Building Profile button below for the most up-to-date information.`
      )}
    >
      <Trans render="label">Open Violations</Trans>
      {addr.openviolations}
    </div>
  );
};

const TotalViolations = () => {
  const addr = useContext(AddrContext).getBuildingStats();
  const i18n = useContext(I18nContext);
  return (
    <div
      title={i18n._(
        t`This represents the total number of HPD Violations (both open & closed) recorded by the city.`
      )}
    >
      <Trans render="label">Total Violations</Trans>
      {addr.totalviolations}
    </div>
  );
};

const Evictions = () => {
  const addr = useContext(AddrContext).getBuildingStats();
  const i18n = useContext(I18nContext);
  return (
    <div
      title={i18n._(
        t`Evictions executed by NYC Marshals in 2019. ANHD and the Housing Data Coalition cleaned, geocoded, and validated the data, originally sourced from DOI.`
      )}
    >
      <Trans render="label">2019 Evictions</Trans>
      {addr.evictions !== null ? addr.evictions : "N/A"}
    </div>
  );
};

const RsUnits = () => {
  const addr = useContext(AddrContext).getBuildingStats();
  const i18n = useContext(I18nContext);
  return (
    <div
      title={i18n._(
        t`This tracks how rent stabilized units in the building have changed (i.e. "&Delta;") from 2007 to 2017. If the number for 2017 is red, this means there has been a loss in stabilzied units! These counts are estimated from the DOF Property Tax Bills.`
      )}
    >
      <label>
        &Delta; <Trans>RS Units</Trans>
      </label>
      <span>{addr.rsunits2007 !== null ? addr.rsunits2007 : "N/A"}</span>
      <span>&#x21FE;</span>
      <span
        className={`${
          addr.rsunits2007 && addr.rsunits2017 && addr.rsunits2017 < addr.rsunits2007
            ? "text-danger"
            : ""
        }`}
      >
        {addr.rsunits2017 !== null ? addr.rsunits2017 : "N/A"}
      </span>
    </div>
  );
};

const BuildingStatsTableWithoutI18n = (props: Props) => (
  <AddrContext.Provider
    value={{
      getBuildingStats: () => props.addr,
    }}
  >
    <I18nContext.Provider value={props.i18n}>
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
    </I18nContext.Provider>
  </AddrContext.Provider>
);

const BuildingStatsTable = withI18n()(BuildingStatsTableWithoutI18n);

export default BuildingStatsTable;
