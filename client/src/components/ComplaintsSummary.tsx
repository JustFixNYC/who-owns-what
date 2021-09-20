import React from "react";
import { Plural, Trans } from "@lingui/macro";
import { SummaryStatsRecord } from "./APIDataTypes";
import helpers from "util/helpers";
import { withI18n, withI18nProps } from "@lingui/react";

type ComplaintsSummaryData = Pick<
  SummaryStatsRecord,
  "totalcomplaints" | "totalrecentcomplaints" | "recentcomplaintsbytype"
>;

const NUM_COMPLAINT_TYPES_TO_SHOW = 3;

export const ComplaintsSummary = withI18n()((props: ComplaintsSummaryData & withI18nProps) => {
  const { totalcomplaints, totalrecentcomplaints, recentcomplaintsbytype, i18n } = props;

  return (
    <>
      <Trans render="h6">Complaints called in to 311</Trans>
      <p>
        <Trans>
          Tenants in this portfolio have reported a total of <b>{totalcomplaints}</b>{" "}
          <Plural value={totalcomplaints} one="complaint" other="complaints" /> to 311,{" "}
          <b>{totalrecentcomplaints}</b> of which{" "}
          <Plural value={totalrecentcomplaints} one="was" other="were" /> reported in the last 3
          years.
        </Trans>
        {recentcomplaintsbytype && recentcomplaintsbytype.length > 0 && (
          <Trans>
            The most common{" "}
            <Plural value={recentcomplaintsbytype.length} one="issue" other="issues" /> reported in
            this portfolio over the last 3 years{" "}
            <Plural value={recentcomplaintsbytype.length} one="is" other="are" />{" "}
            {recentcomplaintsbytype
              .slice(0, NUM_COMPLAINT_TYPES_TO_SHOW)
              .map(
                (complaint) =>
                  `${helpers.translateComplaintType(complaint.type, i18n)} (${complaint.count})`
              )
              .join(", ")}
          </Trans>
        )}
      </p>
    </>
  );
});
