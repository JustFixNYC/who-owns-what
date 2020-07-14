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

export const localizeRoute = (route: string) => "/:locale" + route;

export const createRouteForAddressPage = (boro: string, streetname: string, housenumber?: string) =>
  `/address/${boro}/${housenumber || " "}/${streetname}`;

const addressPageRouteWithParams = localizeRoute(
  createRouteForAddressPage(":boro", ":streetname", ":housenumber")
);

export const WhoOwnsWhatRoutes = () => (
  <Switch>
    <Route exact path={localizeRoute("/")} component={HomePage} />
    <Route
      path={addressPageRouteWithParams}
      render={(props) => <AddressPage currentTab={0} {...props} />}
      exact
    />
    <Route
      path={addressPageRouteWithParams + "/timeline"}
      render={(props) => <AddressPage currentTab={1} {...props} />}
    />
    <Route
      path={addressPageRouteWithParams + "/portfolio"}
      render={(props) => <AddressPage currentTab={2} {...props} />}
    />
    <Route
      path={addressPageRouteWithParams + "/summary"}
      render={(props) => <AddressPage currentTab={3} {...props} />}
    />
    <Route path={localizeRoute("/bbl/:boro/:block/:lot")} component={BBLPage} />
    <Route path={localizeRoute("/bbl/:bbl")} component={BBLPage} />
    <Route path={localizeRoute("/about")} component={AboutPage} />
    <Route path={localizeRoute("/how-to-use")} component={HowToUsePage} />
    <Route path={localizeRoute("/how-it-works")} component={MethodologyPage} />
    <Route path={localizeRoute("/terms-of-use")} component={TermsOfUsePage} />
    <Route path={localizeRoute("/privacy-policy")} component={PrivacyPolicyPage} />
  </Switch>
);
