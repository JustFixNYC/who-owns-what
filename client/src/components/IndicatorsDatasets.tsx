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
    | "evictionfilings"
    | "rentstabilizedunits";

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
          href="https://www.nyc.gov/site/hpd/services-and-information/report-a-maintenance-issue.page"
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
          href="https://www.nyc.gov/site/hpd/services-and-information/report-a-maintenance-issue.page"
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
          href="https://www.nyc.gov/site/buildings/dob/building-applications-permits.page"
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
      isNaN(value)
        ? i18n._(t`No Eviction Filings Data Available for Properties with Fewer than 11 Units`)
        : i18n._(
            plural({
              value,
              one: "One Eviction Filing since 2017",
              other: "# Eviction Filings since 2017",
            })
          ),
    yAxisLabel: (i18n) => i18n._(t`Eviction Filings`),
    explanation: () => (
      <Trans render="span">
        An “eviction filing” is a legal case for eviction commenced by a landlord against a tenant
        in Housing Court. Such a case can be commenced for nonpayment of rent (most commonly) or for
        a violation of the lease (such as a nuisance). The eviction filings number only represents
        cases filed in Housing Court (data from the New York State Office of Court Administration{" "}
        <a
          href="https://github.com/housing-data-coalition/oca"
          target="_blank"
          rel="noopener noreferrer"
        >
          via the Housing Data Coalition
        </a>{" "}
        in collaboration with the{" "}
        <a href="https://www.righttocounselnyc.org/" target="_blank" rel="noopener noreferrer">
          Right to Counsel Coalition
        </a>
        ) and not evictions carried out by NYC Marshals.
        <br />
        <br />
        If you or someone you know is facing eviction and want to learn more about your rights, head
        over to{" "}
        <a
          href="https://housingcourtanswers.org/answers/for-tenants/housing-court-tenants/court-process/eviction-notice/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Housing Court Answers for more information
        </a>
        .
        <br />
        <br />
        Due to privacy restrictions on the use of these data, eviction filings cannot be shown for
        buildings with fewer than 11 units.
      </Trans>
    ),
  },
  rentstabilizedunits: {
    name: (i18n) => i18n._(t`Rent Stabilized Units`),
    analyticsName: "rentstabilizedunits",
    quantity: (i18n, value) => i18n._("Rent Stabilized Units registered since 2010"),
    yAxisLabel: (i18n) => i18n._(t`Number of Units`),
    explanation: () => (
      <Trans render="span">
        <a
          href="https://rentguidelinesboard.cityofnewyork.us/resources/faqs/rent-stabilization/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Rent stabilization
        </a>{" "}
        protects tenants by limiting rent increases and providing the right to lease renewals.
        Landlords register rent-stabilized units each year with NYS Homes and Community Renewal
        (HCR). Though the agency does not directly make this data available, the number of
        registered rent-stabilized units appears on public city property tax bills. JustFix and
        open-source community projects have extracted these numbers to compile a{" "}
        <a
          href="https://github.com/nycdb/nycdb/wiki/Dataset:-Rent-Stabilized-Buildings#provenance"
          target="_blank"
          rel="noopener noreferrer"
        >
          dataset of building-level counts of rent-stabilized units
        </a>{" "}
        from 2007 to 2022.
        <br />
        <br />A significant limitation of the data is that{" "}
        <a
          href="https://projects.thecity.nyc/rent-stabilized-map/"
          target="_blank"
          rel="noopener noreferrer"
        >
          landlords will sometimes fail to register the units
        </a>{" "}
        or do so late, and in the tax bills, it appears there are no rent-stabilized units. For this
        reason, you may see a sudden drop of registered units to zero, but this doesn’t necessarily
        reflect an actual loss of stabilized units. If you see a gradual decline in the number of
        stabilized units that is more likely to represent a true destabilization of units,
        especially if before 2019 when the passage of the Housing Stability and Tenant Protection
        Act of 2019 (HSTPA) greatly limited the ways units could be legally destabilized. Even when
        units are actually destabilized by landlords it does not mean that this was done legally.
        The only way to know for sure whether your apartment is rent stabilized, was illegally
        destabilized, or if you are being overcharged is to{" "}
        <a href="https://app.justfix.org/rh" target="_blank" rel="noopener noreferrer">
          request your rent history
        </a>{" "}
        from HCR. Once you receive it, you can use{" "}
        <a
          href="https://www.justfix.org/en/learn/rent-history-101"
          target="_blank"
          rel="noopener noreferrer"
        >
          this Learning Center article
        </a>{" "}
        to guide you in reading your rent history document.
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
