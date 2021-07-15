import React from "react";
import { I18n } from "@lingui/core";
import { t, Trans, plural } from "@lingui/macro";
import { withI18n } from "@lingui/react";

/**
 * The ids for all datasets shown on the Timeline Tab, _in the order they will appear on the select menu_.
 *
 * Note: This separation of array and type definition allows us to more easily iterate over all dataset ids.
 * See https://stackoverflow.com/a/64174790 for more details on this approach.
 */
export const indicatorsDatasetIds = [
  "hpdcomplaints",
  "hpdviolations",
  "dobpermits",
  "dobviolations",
] as const;
export type IndicatorsDatasetId = typeof indicatorsDatasetIds[number];

/**
 * This interface encapsulates metadata about an Indicators dataset.
 */
export interface IndicatorsDataset {
  /** The localized name of the dataset, e.g. "HPD Complaints". */
  name: (i18n: I18n) => string;

  /**
   * The name to use for the dataset in analytics. This defaults to the dataset ID but
   * can be overridden by defining this property. */
  analyticsName?: string;

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
  hpdviolations: {
    name: (i18n) => i18n._(t`HPD Violations`),
    analyticsName: "violations",
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
        violation of the law. If not corrected, these violations incur fines for the owner— however,
        HPD violations are notoriously unenforced by the City. These Violations fall into three
        categories:
        <br />
        <br />
        <b>Class A</b> — non-hazardous
        <br />
        <b>Class B</b> — hazardous
        <br />
        <b>Class C</b> — immediately hazardous
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
  hpdcomplaints: {
    name: (i18n) => i18n._(t`HPD Complaints`),
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
  dobpermits: {
    name: (i18n) => i18n._(t`Building Permit Applications`),
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
    name: (i18n) => i18n._(t`DOB Violations`),
    quantity: (i18n, value) =>
      i18n._(
        plural({
          value,
          one: "One DOB Violation Issued since 2010",
          other: "# DOB Violations Issued since 2010",
        })
      ),
    yAxisLabel: (i18n) => i18n._(t`Violations Issued`),
    explanation: () => (
      <Trans render="span">
        A DOB Violation is a notice that a property is not in compliance with some building law. It
        includes an order from the Department of Buildings to correct the violating condition, which
        must be corrected before a new or amended Certificate of Occupancy (CO) can be obtained. If
        an ECB (Environmental Control Board) Violation occurs, people named in the violation must
        first attend a hearing with the Office of Administrative Trials and Hearings to pay a fine
        or have the violation dismissed. For that reason, DOB Violations are generally considered
        less severe than ECB violations, but can be identified as:
        <br />
        <br />
        <b>Emergency</b> — critical building situation
        <br />
        <b>Non-Emergency</b> — all others
        <br />
        <br />
        Read more about Building Violations at the{" "}
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
  const analyticsName = dataset.analyticsName || id;
  const name = dataset.name(i18n);

  return (
    <li className="menu-item">
      <label
        className={"form-radio" + (isActive ? " active" : "")}
        onClick={() => {
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
