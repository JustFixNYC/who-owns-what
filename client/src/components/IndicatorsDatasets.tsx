import React from "react";
import { I18n } from "@lingui/core";
import { t, Trans, plural } from "@lingui/macro";
import { withI18n } from "@lingui/react";
import { IndicatorsDatasetId } from "./IndicatorsTypes";
import { AmplitudeEvent, logAmplitudeEvent } from "./Amplitude";

/**
 * This interface encapsulates metadata about an Indicators dataset.
 */
export interface IndicatorsDataset {
  /** The localized name of the dataset, e.g. "HPD Complaints". */
  name: (i18n: I18n) => string;

  /**
   * The name to use for the dataset in analytics. The type options must be defined here
   * for it to recognize the template strings as valid values for the AmplitudeEvent type
   */
  analyticsName:
    | "hpdcomplaints"
    | "hpdviolations"
    | "dobpermits"
    | "dobviolations"
    | "evictionfilings";

  /**
   * The localized name for a particular "quantity" of the dataset, e.g.
   * "15 HPD Complaints issued since 2014".
   */
  quantity: (i18n: I18n, value: number) => string;

  /**
   * The localized name for label on the Y-axis, when the given dataset is shown.
   */
  yAxisLabel: (i18n: I18n) => string;

  /**
   * A localized explanation for what the dataset means, and where to find more information.
   */
  explanation: (i18n: I18n) => JSX.Element;
}

type IndicatorsDatasetMap = {
  [K in IndicatorsDatasetId]: IndicatorsDataset;
};

export const INDICATORS_DATASETS: IndicatorsDatasetMap = {
  hpdcomplaints: {
    name: (i18n) => i18n._(t`HPD Complaints`),
    analyticsName: "hpdcomplaints",
    quantity: (i18n, value) =>
      i18n._(
        plural({
          value,
          one: "One HPD Complaint Issued since 2014",
          other: "# HPD Complaints Issued since 2014",
        })
      ),
    yAxisLabel: (i18n) => i18n._(t`Complaints Issued`),
    explanation: () => (
      <Trans render="span">
        HPD Complaints are housing issues reported to the City <b>by a tenant calling 311</b>. When
        someone issues a complaint, the Department of Housing Preservation and Development begins a
        process of investigation that may lead to an official violation from the City. Complaints
        can be identified as:
        <br />
        <br />
        <b>Emergency</b> — reported to be hazardous/dire
        <br />
        <b>Non-Emergency</b> — all others
        <br />
        <br />
        Read more about HPD Complaints and how to file them at the{" "}
        <a
          href="https://www1.nyc.gov/site/hpd/renters/complaints-and-inspections.page"
          target="_blank"
          rel="noopener noreferrer"
        >
          official HPD page
        </a>
        .
      </Trans>
    ),
  },

  hpdviolations: {
    name: (i18n) => i18n._(t`HPD Violations`),
    analyticsName: "hpdviolations",
    quantity: (i18n, value) =>
      i18n._(
        plural({
          value,
          one: "One HPD Violation Issued since 2010",
          other: "# HPD Violations Issued since 2010",
        })
      ),
    yAxisLabel: (i18n) => i18n._(t`Violations Issued`),
    explanation: () => (
      <Trans render="span">
        HPD Violations occur when an official City Inspector finds the conditions of a home in
        violation of the law. If not corrected, these violations incur fines for the owner—however,
        HPD Violations are notoriously unenforced by the City. These violations fall into four
        categories:
        <br />
        <br />
        <b>Class A</b> — non-hazardous
        <br />
        <b>Class B</b> — hazardous
        <br />
        <b>Class C</b> — immediately hazardous
        <br />
        <b>Class I</b> — fundamental property issue (e.g. landlord failed to register, building in
        Alt. Enforcement Program, Vacate Order issued)
        <br />
        <br />
        Read more about HPD Violations at the{" "}
        <a
          href="https://www1.nyc.gov/site/hpd/owners/compliance-maintenance-requirements.page"
          target="_blank"
          rel="noopener noreferrer"
        >
          official HPD page
        </a>
        .
      </Trans>
    ),
  },
  dobpermits: {
    name: (i18n) => i18n._(t`Building Permit Applications`),
    analyticsName: "dobpermits",
    quantity: (i18n, value) =>
      i18n._(
        plural({
          value,
          one: "One Building Permit Application since 2010",
          other: "# Building Permit Applications since 2010",
        })
      ),
    yAxisLabel: (i18n) => i18n._(t`Building Permits Applied For`),
    explanation: () => (
      <Trans render="span">
        Owners submit Building Permit Applications to the Department of Buildings before any
        construction project to get necessary approval. The number of applications filed can
        indicate how much construction the owner was planning.
        <br />
        <br />
        Read more about DOB Building Applications/Permits at the{" "}
        <a
          href="https://www1.nyc.gov/site/buildings/about/building-applications-and-permits.page"
          target="_blank"
          rel="noopener noreferrer"
        >
          official NYC Buildings page
        </a>
        .
      </Trans>
    ),
  },
  dobviolations: {
    name: (i18n) => i18n._(t`DOB/ECB Violations`),
    analyticsName: "dobviolations",
    quantity: (i18n, value) =>
      i18n._(
        plural({
          value,
          one: "One DOB/ECB Violation Issued since 2010",
          other: "# DOB/ECB Violations Issued since 2010",
        })
      ),
    yAxisLabel: (i18n) => i18n._(t`Violations Issued`),
    explanation: () => (
      <Trans render="span">
        A DOB Violation is a notice that a property is not in compliance with applicable law,
        usually a building code. DOB Violations typically relate to building-wide services (like
        elevators or boilers), the structural integrity of a property, or illegal construction.
        Owners must cure all DOB Violations before they can file a new or amended Certificate of
        Occupancy ("CO").
        <br />
        <br />
        <b>Non-ECB</b> — typical violation, no court hearing needed
        <br />
        <b>ECB (Environment Control Board)</b> — a specific violation of New York City Construction
        Codes or Zoning Resolution. These violations come with additional penalties and require an
        owner to attend an{" "}
        <a
          href="https://www1.nyc.gov/site/oath/index.page"
          target="_blank"
          rel="noopener noreferrer"
        >
          OATH hearing
        </a>
        . They fall into three classes: Class I (immediately hazardous), Class II (major), and Class
        III (lesser).
        <br />
        <br />
        Read more about DOB Violations at the{" "}
        <a
          href="https://www1.nyc.gov/site/buildings/safety/dob-violations.page"
          target="_blank"
          rel="noopener noreferrer"
        >
          official DOB page
        </a>
        .
      </Trans>
    ),
  },
  evictionfilings: {
    name: (i18n) => i18n._(t`Eviction Filings`),
    analyticsName: "evictionfilings",
    quantity: (i18n, value) =>
      i18n._(
        plural({
          value,
          one: "One Eviction Filing since 2017",
          other: "# Eviction Filings since 2017",
        })
      ),
    yAxisLabel: (i18n) => i18n._(t`Eviction Filings`),
    explanation: () => (
      <Trans render="span">
        An “eviction filing” is a legal case for eviction commenced by a landlord against a tenant.
        Such a case can be commenced for nonpayment of rent (most commonly) or for a violation of
        the lease (such as a nuisance). Once an eviction case is filed, the tenant may respond to
        the claims in the case by filing an “answer.” After that, the tenant will have opportunities
        to settle the case by agreement or go before a judge for a trial on the facts of the case.
        If a tenant does not answer or appear in court, a default judgment is entered against the
        tenant. If a judgment is entered against a tenant (whether in an agreement or by decision of
        the judge) that judgment is “executed” (carried out) by a City Marshal, who is licensed by
        the City. In executing on a judgment, the Marshal changes the locks and transfers “legal
        possession” of the apartment from the tenant to the landlord. This is what counts as an
        “Eviction.” Note that there are also illegal evictions, which occur outside of the legal
        process and involve the landlord or their agents acting on their own. There are also
        situations in which a tenant may “self evict,” or leave an apartment prior to the
        commencement of a legal proceeding because of harassment or unlivable housing conditions.
        <br />
        Due to privacy restrictions on the use of these data, eviction filings cannot be shown for
        buildings with fewer than 11 units.
        <br />
        <br />
        Data from the New York State Office of Court Administration{" "}
        <a
          href="https://github.com/housing-data-coalition/oca"
          target="_blank"
          rel="noopener noreferrer"
        >
          via the Housing Data Coalition
        </a>
        in collaboration with the{" "}
        <a href="https://www.righttocounselnyc.org/" target="_blank" rel="noopener noreferrer">
          Right to Counsel Coalition
        </a>
        .
      </Trans>
    ),
  },
};

const IndicatorsDatasetRadioWithoutI18n: React.FC<{
  i18n: I18n;

  /** The dataset ID which this radio button will activate. */
  id: IndicatorsDatasetId;

  /** The dataset ID of the currently active dataset. */
  activeId: IndicatorsDatasetId;

  /** A handler called when this radio button is selected. */
  onChange: (id: IndicatorsDatasetId) => void;
}> = ({ i18n, id, activeId, onChange }) => {
  const dataset = INDICATORS_DATASETS[id];
  const isActive = activeId === id;
  const analyticsName = dataset.analyticsName;
  const name = dataset.name(i18n);

  return (
    <li className="menu-item">
      <label
        className={"form-radio" + (isActive ? " active" : "")}
        onClick={() => {
          logAmplitudeEvent(`${analyticsName}TimelineTab` as AmplitudeEvent);
          window.gtag("event", `${analyticsName}-timeline-tab`);
        }}
      >
        <input type="radio" name={name} checked={isActive} onChange={() => onChange(id)} />
        <i className="form-icon"></i> {name}
      </label>
    </li>
  );
};

/**
 * Render a radio button for the dataset with the given ID.
 */
export const IndicatorsDatasetRadio = withI18n()(IndicatorsDatasetRadioWithoutI18n);
