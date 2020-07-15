import React from "react";
import { Switch, Route } from "react-router-dom";
import HomePage from "./containers/HomePage";
import AddressPage from "./containers/AddressPage";
import BBLPage from "./containers/BBLPage";
import AboutPage from "./containers/AboutPage";
import HowToUsePage from "./containers/HowToUsePage";
import MethodologyPage from "./containers/Methodology";
import TermsOfUsePage from "./containers/TermsOfUsePage";
import PrivacyPolicyPage from "./containers/PrivacyPolicyPage";

export const createRouteForAddressPage = (boro: string, streetname: string, housenumber?: string) =>
  `/address/${boro}/${housenumber || " "}/${streetname}`;

const addressPageRouteWithParams = createRouteForAddressPage(
  ":boro",
  ":streetname",
  ":housenumber"
);

export const createWhoOwnsWhatRoutePaths = (prefix?: string) => {
  const pathPrefix = prefix || "";
  return {
    home: `${pathPrefix}/`,
    addressPageOverview: `${pathPrefix}${addressPageRouteWithParams}`,
    addressPageTimeline: `${pathPrefix}${addressPageRouteWithParams}/timeline`,
    addressPagePortfolio: `${pathPrefix}${addressPageRouteWithParams}/portfolio`,
    addressPageSummary: `${pathPrefix}${addressPageRouteWithParams}/summary`,
    bbl: `${pathPrefix}/bbl/:boro/:block/:lot`,
    bblWithFullBblInUrl: `${pathPrefix}/bbl/:bbl`,
    about: `${pathPrefix}/about`,
    howToUse: `${pathPrefix}/how-to-use`,
    methodology: `${pathPrefix}/how-it-works`,
    termsOfUse: `${pathPrefix}/terms-of-use`,
    privacyPolicy: `${pathPrefix}/privacy-policy`,
  };
};

export const WhoOwnsWhatRoutes = () => {
  const paths = createWhoOwnsWhatRoutePaths("/:locale");
  return (
    <Switch>
      <Route exact path={paths.home} component={HomePage} />
      <Route
        path={paths.addressPageOverview}
        render={(props) => <AddressPage currentTab={0} {...props} />}
        exact
      />
      <Route
        path={paths.addressPageTimeline}
        render={(props) => <AddressPage currentTab={1} {...props} />}
      />
      <Route
        path={paths.addressPagePortfolio}
        render={(props) => <AddressPage currentTab={2} {...props} />}
      />
      <Route
        path={paths.addressPageSummary}
        render={(props) => <AddressPage currentTab={3} {...props} />}
      />
      <Route path={paths.bbl} component={BBLPage} />
      <Route path={paths.bblWithFullBblInUrl} component={BBLPage} />
      <Route path={paths.about} component={AboutPage} />
      <Route path={paths.howToUse} component={HowToUsePage} />
      <Route path={paths.methodology} component={MethodologyPage} />
      <Route path={paths.termsOfUse} component={TermsOfUsePage} />
      <Route path={paths.privacyPolicy} component={PrivacyPolicyPage} />
    </Switch>
  );
};
