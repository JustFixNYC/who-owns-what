import React from "react";
import { Trans, Select, Plural } from "@lingui/macro";
import { SummaryStatsRecord } from "./APIDataTypes";

type RentstabSummaryData = Pick<
  SummaryStatsRecord,
  "totalrsdiff" | "totalrsgain" | "totalrsloss" | "rsproportion" | "rslossaddr"
>;

export const RentstabSummary: React.FC<RentstabSummaryData> = (props) => {
  const totalRsDiff = props.totalrsdiff || 0;
  const absTotalRsDiff = Math.abs(totalRsDiff);
  const absTotalRsGain = Math.abs(props.totalrsgain || 0);
  const absTotalRsLoss = Math.abs(props.totalrsloss || 0);
  const rsProportion = props.rsproportion || 0;
  const changeType: "gain" | "loss" = totalRsDiff > 0 ? "gain" : "loss";
  const rsLossAddr = props.rslossaddr;
  const rsLossAddrDiff = (rsLossAddr && rsLossAddr.rsdiff) || 0;
  const absRsLossAddrDiff = Math.abs(rsLossAddrDiff);

  return (
    <p>
      <Trans>
        This portfolio also had an estimated{" "}
        <b>
          net <Select value={changeType} gain="gain" other="loss" />
        </b>{" "}
        of <b>{absTotalRsDiff}</b>{" "}
        <Plural value={absTotalRsDiff} one="rent stabilized unit" other="rent stabilized units" />{" "}
        since 2007 (gained {absTotalRsGain}, lost {absTotalRsLoss}).
      </Trans>{" "}
      <Trans>
        This represents <b>{rsProportion.toFixed(1)}%</b> of the total size of this portfolio.
      </Trans>
      {rsLossAddr && rsLossAddrDiff < 0 && (
        <Trans>
          {" "}
          The building that has lost the most units is{" "}
          <b>
            {rsLossAddr.housenumber} {rsLossAddr.streetname}, {rsLossAddr.boro}
          </b>
          , which has lost <b>{absRsLossAddrDiff}</b>{" "}
          <Plural value={absRsLossAddrDiff} one="unit" other="units" /> in the past 10 years.
        </Trans>
      )}
    </p>
  );
};
