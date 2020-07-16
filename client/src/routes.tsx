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
import { SearchAddress } from "./components/AddressSearch";

type AddressPageUrlParams = Pick<SearchAddress, "boro" | "housenumber" | "streetname">;

export const createRouteForAddressPage = (params: AddressPageUrlParams) => {
  let route = `/address/${encodeURIComponent(params.boro)}/${encodeURIComponent(
    params.housenumber ? params.housenumber : " "
  )}/${encodeURIComponent(params.streetname)}`;

  if (route.includes(" ")) {
    window.Rollbar.error(
      "An Address Page URL was not encoded properly! There's a space in the URL."
    );
    route = route.replace(" ", "%20");
  }

  return route;
};

const addressPageRouteWithPlaceholders = "/address/:boro/:housenumber/:streetname";

export const createWhoOwnsWhatRoutePaths = (prefix?: string) => {
  const pathPrefix = prefix || "";
  return {
    home: `${pathPrefix}/`,
    addressPageOverview: `${pathPrefix}${addressPageRouteWithPlaceholders}`,
    addressPageTimeline: `${pathPrefix}${addressPageRouteWithPlaceholders}/timeline`,
    addressPagePortfolio: `${pathPrefix}${addressPageRouteWithPlaceholders}/portfolio`,
    addressPageSummary: `${pathPrefix}${addressPageRouteWithPlaceholders}/summary`,
    /** Note: this path doesn't correspond to a stable page on the site. It simply provides an entry point that
     * immediately redirects to an addressPageOverview. This path is helpful for folks who, say, have a list of
     * boro, block, lot values in a spreadsheet and want to easily generate direct links to WhoOwnsWhat.
     * See `BBLPage.tsx` for more details.
     */
    bbl: `${pathPrefix}/bbl/:boro/:block/:lot`,
    /** Note: this path doesn't correspond to a stable page on the site. It simply provides an entry point that
     * immediately redirects to an addressPageOverview. This path is helpful for folks who, say, have a list of
     * bbl values in a spreadsheet and want to easily generate direct links to WhoOwnsWhat.
     * See `BBLPage.tsx` for more details.
     */
    bblWithFullBblInUrl: `${pathPrefix}/bbl/:bbl`,
    about: `${pathPrefix}/about`,
    howToUse: `${pathPrefix}/how-to-use`,
    methodology: `${pathPrefix}/how-it-works`,
    termsOfUse: `${pathPrefix}/terms-of-use`,
    privacyPolicy: `${pathPrefix}/privacy-policy`,
  };
};

/**
 * In other words, get the current site url without its url paths, i.e. `https://whoownswhat.justfix.nyc`
 */
export const getSiteOrigin = () => `${window.location.protocol}//${window.location.host}`;

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
