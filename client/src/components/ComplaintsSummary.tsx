import React from "react";
import { Trans, Plural } from "@lingui/macro";
import { SummaryStatsRecord } from "./APIDataTypes";
import helpers from "util/helpers";
import { withI18n, withI18nProps } from "@lingui/react";
import { StringifyListWithConjunction } from "./StringifyList";

type ComplaintsSummaryData = Pick<
  SummaryStatsRecord,
  "totalhpdcomplaints" | "totalrecenthpdcomplaints" | "recenthpdcomplaintsbytype"
>;

export const ComplaintsSummary = withI18n()((props: ComplaintsSummaryData & withI18nProps) => {
  const { totalhpdcomplaints, totalrecenthpdcomplaints, recenthpdcomplaintsbytype, i18n } = props;

  return (
    <>
      <Trans render="h6">Complaints to 311</Trans>
      <p>
        <Trans>
          Tenants in this portfolio have reported a total of <b>{totalhpdcomplaints}</b>{" "}
          <Plural value={totalhpdcomplaints} one="complaint" other="complaints" /> to 311,{" "}
          <b>{totalrecenthpdcomplaints}</b> of which{" "}
          <Plural value={totalrecenthpdcomplaints} one="was" other="were" /> reported in the last
          three years.
        </Trans>{" "}
        {recenthpdcomplaintsbytype && recenthpdcomplaintsbytype.length > 0 && (
          <Trans>
            The most common{" "}
            <Plural value={recenthpdcomplaintsbytype.length} one="issue" other="issues" /> reported
            in this portfolio over the last three years{" "}
            <Plural value={recenthpdcomplaintsbytype.length} one="is" other="are" />{" "}
            <StringifyListWithConjunction
              values={recenthpdcomplaintsbytype.map(
                (complaint) =>
                  `${helpers.translateComplaintType(complaint.type, i18n)} (${complaint.count})`
              )}
            />
            .
          </Trans>
        )}
      </p>
    </>
  );
});
