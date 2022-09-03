import React from "react";
import { Trans, Plural } from "@lingui/macro";
import { SummaryStatsRecord } from "./APIDataTypes";

type EvictionsSummaryData = Pick<
  SummaryStatsRecord,
  "evictionsaddr" | "totalevictions" | "evictionfilingsaddr" | "totalevictionfilings"
>;

export const EvictionsSummary: React.FC<EvictionsSummaryData> = (props) => {
  const totalEvictions = props.totalevictions || 0;
  const evictionsBuilding = props.evictionsaddr;
  const buildingTotalEvictions = (evictionsBuilding && evictionsBuilding.evictions) || 0;

  const totalEvictionFilings = props.totalevictionfilings || 0;
  const evictionFilingsBuilding = props.evictionfilingsaddr;
  const buildingTotalEvictionFilings =
    (evictionFilingsBuilding && evictionFilingsBuilding.filings) || 0;

  return (
    <p>
      <Trans>
        Since 2017, landlords filed{" "}
        <Plural
          value={totalEvictionFilings}
          one="one eviction case"
          other="# eviction cases"
        />{" "}
        and NYC Marshals executed{" "}
        <Plural value={totalEvictions} one="one eviction" other="# evictions" /> across this
        portfolio.
      </Trans>{" "}
      {evictionFilingsBuilding && totalEvictionFilings > 0 && (
        <Trans>
          The building with the most eviction cases filed is{" "}
          <b>
            {evictionFilingsBuilding.housenumber} {evictionFilingsBuilding.streetname},{" "}
            {evictionFilingsBuilding.boro}
          </b>{" "}
          with <Plural value={buildingTotalEvictionFilings} one="one filing" other="# filings" />.
        </Trans>
      )}{" "}
      {evictionsBuilding && totalEvictions > 0 && (
        <Trans>
          The building with the most executed evictions is{" "}
          <b>
            {evictionsBuilding.housenumber} {evictionsBuilding.streetname}, {evictionsBuilding.boro}
          </b>{" "}
          with <Plural value={buildingTotalEvictions} one="one eviction" other="# evictions" />.
        </Trans>
      )}
    </p>
  );
};
