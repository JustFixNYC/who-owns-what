import { init, track } from "@amplitude/analytics-browser";

const API_KEY = process.env.REACT_APP_AMPLITUDE_API_KEY;

if (!API_KEY) {
  throw new Error("No Amplitude API key defined!");
}

init(API_KEY);

export type AmplitudeEvent =
  | "closeFeatureCalloutWidget"
  | "openFeatureCalloutWidget"
  | "viewPreviousEntryOnFeatureCalloutWidget"
  | "viewNextEntryOnFeatureCalloutWidget"
  | "switchToNewVersion"
  | "switchToOldVersion"
  | "searchByAddress"
  | "searchByLandlordName"
  | "portfolioFound"
  | "learnWhyPortfolioSoBig"
  | "zoomInNetworkViz"
  | "zoomOutNetworkViz"
  | "resetNetworkViz"
  | "hpdRegistrationIsIncomplete"
  | "hpdRegistrationNotRequired"
  | "hpdRegistrationMaybeRequired"
  | "hpdRegistrationRequiredAndNotThere"
  | "navbarHowToUse"
  | "switchToEnglish"
  | "switchToSpanish"
  | "emailSignUp"
  | "newSearch"
  | "acris-overview-tab"
  | "hpd-overview-tab"
  | "dob-overview-tab"
  | "dof-overview-tab"
  | "dap-overview-tab"
  | "acris-timeline-tab"
  | "hpd-timeline-tab"
  | "dob-timeline-tab"
  | "dof-timeline-tab"
  | "dap-timeline-tab"
  | "acris-not-registered-page"
  | "hpd-not-registered-page"
  | "dob-not-registered-page"
  | "dof-not-registered-page"
  | "dap-not-registered-page"
  | "numAddrsClick"
  | "timelineTab"
  | "portfolioTab"
  | "summaryTab"
  | "whoIsLandlordAccordian"
  | "detailsOpenContactCard"
  | "clickExportData"
  | "downloadPortfolioData"
  | "hpdcomplaintsTimelineTab"
  | "hpdviolationsTimelineTab"
  | "dobpermitsTimelineTab"
  | "dobviolationsTimelineTab"
  | "monthTimelineTab"
  | "quarterTimelineTab"
  | "yearTimelineTab"
  | "portfolioLinktoDeed"
  | "portfolioViewDetail"
  | "addressChangeMap"
  | "addressChangePortfolio"
  | "portfolioColumnSort"
  | "portfolioPagination"
  | "portfolioRowExpanded"
  | "alertToFilterPortfolio"
  | "filterOpened"
  | "filterError"
  | "filterApplied"
  | "filterCleared";

export type EventProperties = {
  [x: string]: unknown;
};

export const logAmplitudeEvent = (name: AmplitudeEvent, eventProperties?: EventProperties) => {
  if (!API_KEY) return;
  track(name, eventProperties);
};
