import React from "react";
import * as _ from "lodash";
import { Trans } from "@lingui/macro";
import { SummaryStatsRecord } from "./APIDataTypes";

const VIOLATIONS_AVG = 0.7; // By Unit
// 1668635 open violations according to wow_bldgs
// 2366392 total units in registered buildings, according to wow_bldgs
// Last updated: 5/25/2020

type ViolationsSummaryData = Pick<
  SummaryStatsRecord,
  "openviolationsperresunit" | "totalviolations"
>;

export const ViolationsSummary: React.FC<ViolationsSummaryData> = (props) => {
  const { openviolationsperresunit, totalviolations } = props;

  return (
    <>
      <Trans render="h6">Maintenance code violations</Trans>
      <p>
        {/* openviolationsperresunit is not defined when the portfolio has 0 residentials // units in
        PLUTO, so we can't calculate a proportion. */}
        {!_.isNil(openviolationsperresunit) && (
          <>
            <Trans>
              This portfolio has an average of <b>{openviolationsperresunit.toFixed(1)}</b> open HPD
              violations per residential unit.
            </Trans>{" "}
            {openviolationsperresunit >= VIOLATIONS_AVG - 0.05 &&
            openviolationsperresunit < VIOLATIONS_AVG + 0.05 ? (
              <Trans>
                This is <b>about the same</b> as the citywide average.
              </Trans>
            ) : openviolationsperresunit > VIOLATIONS_AVG ? (
              <Trans>
                This is <b>worse</b> than the citywide average of {VIOLATIONS_AVG} per residential
                unit.
              </Trans>
            ) : (
              <Trans>
                This is <b>better</b> than the citywide average of {VIOLATIONS_AVG} per residential
                unit.
              </Trans>
            )}{" "}
          </>
        )}
        <Trans>
          According to available HPD data, this portfolio has received <b>{totalviolations}</b>{" "}
          total violations.
        </Trans>
      </p>
    </>
  );
};
