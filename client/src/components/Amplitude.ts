import amplitude from "amplitude-js";

// Initiating Amplitude inside this helper file seems to work better with the Create React App framework than
// adding a script tag to our index.html file.
//
// See https://javascript.plainenglish.io/adding-analytics-to-your-react-application-b584265f9fae for more details

const API_KEY = process.env.REACT_APP_AMPLITUDE_API_KEY;
if (!API_KEY) throw new Error("No Amplitude API key defined!");

amplitude.getInstance().init(API_KEY);

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
  | "portfolioViewDetail";

type AmplitudeEventData = {
  portfolioSize?: number;
  portfolioMappingMethod?: "wowza" | "legacy";
};

const logAmplitudeEvent = (e: AmplitudeEvent) => amplitude.getInstance().logEvent(e);
const logAmplitudeEventWithData = (e: AmplitudeEvent, data: AmplitudeEventData) =>
  amplitude.getInstance().logEvent(e, data);

export { amplitude, logAmplitudeEvent, logAmplitudeEventWithData };
