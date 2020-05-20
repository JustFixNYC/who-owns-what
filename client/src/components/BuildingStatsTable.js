import React from "react";

import Helpers from "util/helpers";

import { withI18n } from "@lingui/react";
import { t } from "@lingui/macro";
import { Trans } from "@lingui/macro";

const BuildingStatsTableWithoutI18n = (props) => {
  const { i18n } = props;
  const { boro, block, lot } = Helpers.splitBBL(props.addr.bbl);

  const bblDash = (
    <span className="unselectable" unselectable="on">
      -
    </span>
  );

  const BBL = () => (
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

  const YearBuilt = () => (
    <div
      title={i18n._(
        t`The year that this building was originally constructed, according to the Dept. of City Planning.`
      )}
    >
      <Trans render="label">Year Built</Trans>
      {props.addr.yearbuilt !== 0 ? props.addr.yearbuilt : "N/A"}
    </div>
  );

  const UnitsRes = () => (
    <div
      title={i18n._(
        t`The number of residential units in this building, according to the Dept. of City Planning.`
      )}
    >
      <Trans render="label">Units</Trans>
      {props.addr.unitsres}
    </div>
  );

  const OpenViolations = () => (
    <div
      title={i18n._(
        t`The number of open HPD violations for this building, updated monthly. Click the HPD Building Profile button below for the most up-to-date information.`
      )}
    >
      <Trans render="label">Open Violations</Trans>
      {props.addr.openviolations}
    </div>
  );

  const TotalViolations = () => (
    <div
      title={i18n._(
        t`This represents the total number of HPD Violations (both open & closed) recorded by the city.`
      )}
    >
      <Trans render="label">Total Violations</Trans>
      {props.addr.totalviolations}
    </div>
  );

  const Evictions = () => (
    <div
      title={i18n._(
        t`Evictions executed by NYC Marshals in 2019. ANHD and the Housing Data Coalition cleaned, geocoded, and validated the data, originally sourced from DOI.`
      )}
    >
      <Trans render="label">2019 Evictions</Trans>
      {props.addr.evictions !== null ? props.addr.evictions : "N/A"}
    </div>
  );

  const RsUnits = () => (
    <div
      title={i18n._(
        t`This tracks how rent stabilized units in the building have changed (i.e. "&Delta;") from 2007 to 2017. If the number for 2017 is red, this means there has been a loss in stabilzied units! These counts are estimated from the DOF Property Tax Bills.`
      )}
    >
      <label>
        &Delta; <Trans>RS Units</Trans>
      </label>
      <span>{props.addr.rsunits2007 !== null ? props.addr.rsunits2007 : "N/A"}</span>
      <span>&#x21FE;</span>
      <span className={`${props.addr.rsunits2017 < props.addr.rsunits2007 ? "text-danger" : ""}`}>
        {props.addr.rsunits2017 !== null ? props.addr.rsunits2017 : "N/A"}
      </span>
    </div>
  );

  return (
    <>
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
          <OpenViolations />
        </div>
        <div className="table-row">
          <TotalViolations />
          <Evictions />
          <RsUnits />
        </div>
      </div>
      <span className="card-body-table-prompt float-right">
        <Trans render="i">(hover over a box to learn more)</Trans>
      </span>
    </>
  );
};

const BuildingStatsTable = withI18n()(BuildingStatsTableWithoutI18n);

export default BuildingStatsTable;
