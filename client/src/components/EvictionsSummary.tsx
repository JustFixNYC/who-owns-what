import React from "react";
import { Trans, Plural } from "@lingui/macro";
import { SummaryStatsRecord } from "./APIDataTypes";

type EvictionsSummaryData = Pick<SummaryStatsRecord, "evictionsaddr" | "totalevictions">;

export const EvictionsSummary: React.FC<EvictionsSummaryData> = (props) => {
  const totalEvictions = props.totalevictions || 0;
  const building = props.evictionsaddr;
  const buildingTotalEvictions = (building && building.evictions) || 0;

  return (
    <p>
      <Trans>
        Since 2017, NYC Marshals executed{" "}
        <Plural value={totalEvictions} one="one eviction" other="# evictions" /> across this
        portfolio.
      </Trans>{" "}
      {building && totalEvictions > 0 && (
        <Trans>
          The building with the most evictions is{" "}
          <b>
            {building.housenumber} {building.streetname}, {building.boro}
          </b>{" "}
          with <Plural value={buildingTotalEvictions} one="one eviction" other="# evictions" />.
        </Trans>
      )}
    </p>
  );
};
