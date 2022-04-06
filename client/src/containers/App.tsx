import React, { useState } from "react";
import { BrowserRouter as Router, Switch, Route, useLocation } from "react-router-dom";
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
import { isWowzaPath } from "components/WowzaToggle";

const HomeLink = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const title = i18n._(t`Who owns what in nyc?`);

  const { home, legacy } = createWhoOwnsWhatRoutePaths();
  const { pathname } = useLocation();

  return (
    <Link
      // We need to spell out each letter of "nyc" here for screenreaders to pronounce:
      aria-label={i18n._(t`Who owns what in n y c?`)}
      onClick={() => {
        window.gtag("event", "site-title");
      }}
      to={isWowzaPath(pathname) ? home : legacy.home}
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
      <Route exact path={paths.legacy.home} component={HomePage} />
      <Route
        exact
        path={paths.home}
        render={(props) => <HomePage useNewPortfolioMethod {...machineProps} {...props} />}
      />
      <Route
        path={paths.legacy.addressPage.overview}
        render={(props) => <AddressPage currentTab={0} {...machineProps} {...props} />}
        exact
      />
      <Route
        path={paths.legacy.addressPage.timeline}
        render={(props) => <AddressPage currentTab={1} {...machineProps} {...props} />}
      />
      <Route
        path={paths.legacy.addressPage.portfolio}
        render={(props) => <AddressPage currentTab={2} {...machineProps} {...props} />}
      />
      <Route
        path={paths.legacy.addressPage.summary}
        render={(props) => <AddressPage currentTab={3} {...machineProps} {...props} />}
      />
      <Route
        path={paths.addressPage.overview}
        render={(props) => (
          <AddressPage currentTab={0} {...machineProps} {...props} useNewPortfolioMethod />
        )}
        exact
      />
      <Route
        path={paths.addressPage.timeline}
        render={(props) => (
          <AddressPage currentTab={1} {...machineProps} {...props} useNewPortfolioMethod />
        )}
      />
      <Route
        path={paths.addressPage.portfolio}
        render={(props) => (
          <AddressPage currentTab={2} {...machineProps} {...props} useNewPortfolioMethod />
        )}
      />
      <Route
        path={paths.addressPage.summary}
        render={(props) => (
          <AddressPage currentTab={3} {...machineProps} {...props} useNewPortfolioMethod />
        )}
      />
      <Route path={paths.bblSeparatedIntoParts} component={BBLPage} />
      <Route path={paths.legacy.bbl} component={BBLPage} />
      <Route path={paths.bbl} render={(props) => <BBLPage {...props} useNewPortfolioMethod />} />
      <Route path={paths.about} component={AboutPage} />
      <Route path={paths.legacy.about} component={AboutPage} />
      <Route path={paths.howToUse} component={HowToUsePage} />
      <Route path={paths.legacy.howToUse} component={HowToUsePage} />
      <Route path={paths.methodology} component={MethodologyPage} />
      <Route path={paths.legacy.methodology} component={MethodologyPage} />
      <Route path={paths.termsOfUse} component={TermsOfUsePage} />
      <Route path={paths.legacy.termsOfUse} component={TermsOfUsePage} />
      <Route path={paths.privacyPolicy} component={PrivacyPolicyPage} />
      <Route path={paths.legacy.privacyPolicy} component={PrivacyPolicyPage} />
      <Route path={paths.dev} component={DevPage} />
      <Route component={NotFoundPage} />
    </Switch>
  );
};

const SearchLink = () => {
  const { pathname } = useLocation();
  const { home, legacy } = createWhoOwnsWhatRoutePaths();
  const searchRoute = isWowzaPath(pathname) ? home : legacy.home;

  return (
    <LocaleNavLink exact to={searchRoute} key={1}>
      <Trans>Search</Trans>
    </LocaleNavLink>
  );
};

const getMainNavLinks = (isWowzaPath?: boolean) => {
  const { about, howToUse, legacy } = createWhoOwnsWhatRoutePaths();
  return [
    <SearchLink />,
    <LocaleNavLink to={isWowzaPath ? about : legacy.about} key={2}>
      <Trans>About</Trans>
    </LocaleNavLink>,
    <LocaleNavLink to={isWowzaPath ? howToUse : legacy.howToUse} key={3}>
      <Trans>How to use</Trans>
    </LocaleNavLink>,
    <a href="https://www.justfix.nyc/donate" key={4}>
      <Trans>Donate</Trans>
    </a>,
  ];
};

const Navbar = () => {
  const { pathname } = useLocation();
  const [isEngageModalVisible, setEngageModalVisibility] = useState(false);
  const addFeatureCalloutWidget = process.env.REACT_APP_ENABLE_FEATURE_CALLOUT_WIDGET === "1";
  const isDemoSite = process.env.REACT_APP_DEMO_SITE === "1";
  return (
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
          {getMainNavLinks(isWowzaPath(pathname))}
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a href="#" onClick={() => setEngageModalVisibility(true)}>
            <Trans>Share</Trans>
          </a>
          <LocaleSwitcher />
        </span>
        <Dropdown>
          {getMainNavLinks(isWowzaPath(pathname)).map((link, i) => (
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
      <Modal showModal={isEngageModalVisible} onClose={() => setEngageModalVisibility(false)}>
        <h5 className="first-header">
          <Trans>Share this page with your neighbors</Trans>
        </h5>
        <SocialShare location="share-modal" />
      </Modal>
    </div>
  );
};

const App = () => {
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
            <Navbar />
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
