import React, { useState } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Trans, t } from "@lingui/macro";

import "styles/App.css";

import ScrollToTop from "../components/ScrollToTop";
import SocialShare from "../components/SocialShare";
import Modal from "../components/Modal";
import FeatureCalloutWidget from "../components/FeatureCalloutWidget";

// import top-level containers (i.e. pages)
import {
  I18n,
  LocaleNavLink,
  LocaleLink as Link,
  LocaleSwitcher,
  LocaleSwitcherWithFullLanguageName,
} from "../i18n";
import { withI18n, withI18nProps } from "@lingui/react";
import { createWhoOwnsWhatRoutePaths } from "../routes";
import { VersionUpgrader } from "./VersionUpgrader";
import { useMachine } from "@xstate/react";

import HomePage from "./HomePage";
import AddressPage from "./AddressPage";
import BBLPage from "./BBLPage";
import AboutPage from "./AboutPage";
import HowToUsePage from "./HowToUsePage";
import MethodologyPage from "./Methodology";
import TermsOfUsePage from "./TermsOfUsePage";
import PrivacyPolicyPage from "./PrivacyPolicyPage";
import { DevPage } from "./DevPage";
import { wowMachine } from "state-machine";
import { NotFoundPage } from "./NotFoundPage";
import widont from "widont";
import { Dropdown } from "components/Dropdown";

const HomeLink = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const title = i18n._(t`Who owns what in nyc?`);
  return (
    <Link
      // We need to spell out each letter of "nyc" here for screenreaders to pronounce:
      aria-label={i18n._(t`Who owns what in n y c?`)}
      onClick={() => {
        window.gtag("event", "site-title");
      }}
      to="/"
    >
      <h4>{widont(title)}</h4>
    </Link>
  );
});

const WhoOwnsWhatRoutes: React.FC<{}> = () => {
  const paths = createWhoOwnsWhatRoutePaths("/:locale");
  const [state, send] = useMachine(wowMachine);
  const machineProps = { state, send };
  return (
    <Switch>
      <Route exact path={paths.home} component={HomePage} />
      <Route
        path={paths.addressPage.overview}
        render={(props) => <AddressPage currentTab={0} {...machineProps} {...props} />}
        exact
      />
      <Route
        path={paths.addressPage.timeline}
        render={(props) => <AddressPage currentTab={1} {...machineProps} {...props} />}
      />
      <Route
        path={paths.addressPage.portfolio}
        render={(props) => <AddressPage currentTab={2} {...machineProps} {...props} />}
      />
      <Route
        path={paths.addressPage.summary}
        render={(props) => <AddressPage currentTab={3} {...machineProps} {...props} />}
      />
      <Route
        path={paths.wowzaAddressPage.overview}
        render={(props) => (
          <AddressPage currentTab={0} {...machineProps} {...props} useNewPortfolioMethod />
        )}
        exact
      />
      <Route
        path={paths.wowzaAddressPage.timeline}
        render={(props) => (
          <AddressPage currentTab={1} {...machineProps} {...props} useNewPortfolioMethod />
        )}
      />
      <Route
        path={paths.wowzaAddressPage.portfolio}
        render={(props) => (
          <AddressPage currentTab={2} {...machineProps} {...props} useNewPortfolioMethod />
        )}
      />
      <Route
        path={paths.wowzaAddressPage.summary}
        render={(props) => (
          <AddressPage currentTab={3} {...machineProps} {...props} useNewPortfolioMethod />
        )}
      />
      <Route path={paths.bbl} component={BBLPage} />
      <Route path={paths.bblWithFullBblInUrl} component={BBLPage} />
      <Route path={paths.about} component={AboutPage} />
      <Route path={paths.howToUse} component={HowToUsePage} />
      <Route path={paths.methodology} component={MethodologyPage} />
      <Route path={paths.termsOfUse} component={TermsOfUsePage} />
      <Route path={paths.privacyPolicy} component={PrivacyPolicyPage} />
      <Route path={paths.dev} component={DevPage} />
      <Route component={NotFoundPage} />
    </Switch>
  );
};

const getMainNavLinks = () => {
  const paths = createWhoOwnsWhatRoutePaths();
  return [
    <LocaleNavLink exact to={paths.home} key={1}>
      <Trans>Search</Trans>
    </LocaleNavLink>,
    <LocaleNavLink to={paths.about} key={2}>
      <Trans>About</Trans>
    </LocaleNavLink>,
    <LocaleNavLink to={paths.howToUse} key={3}>
      <Trans>How to use</Trans>
    </LocaleNavLink>,
    <a href="https://www.justfix.nyc/donate" key={4}>
      <Trans>Donate</Trans>
    </a>,
  ];
};

const App = () => {
  const [isEngageModalVisible, setEngageModalVisibility] = useState(false);

  const isDemoSite = process.env.REACT_APP_DEMO_SITE === "1";
  const addFeatureCalloutWidget = process.env.REACT_APP_ENABLE_FEATURE_CALLOUT_WIDGET === "1";
  const version = process.env.REACT_APP_VERSION;

  return (
    <Router>
      <I18n>
        <ScrollToTop>
          {version && (
            <VersionUpgrader
              currentVersion={version}
              latestVersionUrl="/version.txt"
              checkIntervalSecs={300}
            />
          )}
          <div className="App">
            <div className="App__header navbar">
              <HomeLink />
              {isDemoSite && (
                <span className="label label-warning ml-2 text-uppercase">
                  <Trans>Demo Site</Trans>
                </span>
              )}
              <nav className="inline">
                {addFeatureCalloutWidget && <FeatureCalloutWidget />}
                <span className="hide-lg">
                  {getMainNavLinks()}
                  {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                  <a href="#" onClick={() => setEngageModalVisibility(true)}>
                    <Trans>Share</Trans>
                  </a>
                  <LocaleSwitcher />
                </span>
                <Dropdown>
                  {getMainNavLinks().map((link, i) => (
                    <li className="menu-item" key={i}>
                      {link}
                    </li>
                  ))}
                  <li className="menu-item">
                    {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                    <a href="#" onClick={() => setEngageModalVisibility(true)}>
                      <Trans>Share</Trans>
                    </a>
                  </li>
                  <li className="menu-item">
                    <LocaleSwitcherWithFullLanguageName />
                  </li>
                </Dropdown>
              </nav>

              <Modal
                showModal={isEngageModalVisible}
                onClose={() => setEngageModalVisibility(false)}
              >
                <h5 className="first-header">
                  <Trans>Share this page with your neighbors</Trans>
                </h5>
                <SocialShare location="share-modal" />
              </Modal>
            </div>
            <div className="App__body">
              <WhoOwnsWhatRoutes />
            </div>
          </div>
        </ScrollToTop>
      </I18n>
    </Router>
  );
};

export default App;
