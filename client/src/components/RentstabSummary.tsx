import React from "react";
import helpers, { MaybeStringyNumber } from "../util/helpers";
import { Trans, Select, Plural } from "@lingui/macro";

export const RentstabSummary: React.FC<{
  totalrsdiff: MaybeStringyNumber;
  totalrsgain: MaybeStringyNumber;
  totalrsloss: MaybeStringyNumber;
  rsproportion: MaybeStringyNumber;
  rslossaddr: {
    rsdiff: MaybeStringyNumber;
    housenumber: string;
    streetname: string;
    boro: string;
  };
}> = (props) => {
  const totalRsDiff = helpers.coerceToInt(props.totalrsdiff, 0);
  const absTotalRsDiff = Math.abs(totalRsDiff);
  const absTotalRsGain = Math.abs(helpers.coerceToInt(props.totalrsgain, 0));
  const absTotalRsLoss = Math.abs(helpers.coerceToInt(props.totalrsloss, 0));
  const rsProportion = helpers.coerceToInt(props.rsproportion, 0);
  const changeType: "gain" | "loss" = totalRsDiff > 0 ? "gain" : "loss";
  const rsLossAddr = props.rslossaddr;
  const rsLossAddrDiff = helpers.coerceToInt(rsLossAddr && rsLossAddr.rsdiff, 0);
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
        This represents <b>{rsProportion}%</b> of the total size of this portfolio.
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
