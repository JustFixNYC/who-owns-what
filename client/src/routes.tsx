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

export const WhoOwnsWhatRoutes = () => (
  <Switch>
    <Route exact path="/:locale/" component={HomePage} />
    <Route
      path="/:locale/address/:boro/:housenumber/:streetname"
      render={(props) => <AddressPage currentTab={0} {...props} />}
      exact
    />
    <Route
      path="/:locale/address/:boro/:housenumber/:streetname/timeline"
      render={(props) => <AddressPage currentTab={1} {...props} />}
    />
    <Route
      path="/:locale/address/:boro/:housenumber/:streetname/portfolio"
      render={(props) => <AddressPage currentTab={2} {...props} />}
    />
    <Route
      path="/:locale/address/:boro/:housenumber/:streetname/summary"
      render={(props) => <AddressPage currentTab={3} {...props} />}
    />
    <Route path="/:locale/bbl/:boro/:block/:lot" component={BBLPage} />
    <Route path="/:locale/bbl/:bbl" component={BBLPage} />
    <Route path="/:locale/about" component={AboutPage} />
    <Route path="/:locale/how-to-use" component={HowToUsePage} />
    <Route path="/:locale/how-it-works" component={MethodologyPage} />
    <Route path="/:locale/terms-of-use" component={TermsOfUsePage} />
    <Route path="/:locale/privacy-policy" component={PrivacyPolicyPage} />
  </Switch>
);
