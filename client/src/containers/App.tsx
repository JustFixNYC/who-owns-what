import React, { useState } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Trans, t } from "@lingui/macro";

import "styles/App.css";

import ScrollToTop from "../components/ScrollToTop";
import SocialShare from "../components/SocialShare";
import Modal from "../components/Modal";

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

const HomeLink = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  return (
    <Link
      // We need to spell out each letter of "nyc" here for screenreaders to pronounce:
      aria-label={i18n._(t`Who owns what in n y c?`)}
      onClick={() => {
        window.gtag("event", "site-title");
      }}
      to="/"
    >
      <Trans render="h4">Who owns what in nyc?</Trans>
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
      <Trans>Home</Trans>
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
  const [isDropdownVisible, setDropdownVisibility] = useState(false);

  const toggleDropdown = () => {
    isDropdownVisible ? setDropdownVisibility(false) : setDropdownVisibility(true);
  };

  const isDemoSite = process.env.REACT_APP_DEMO_SITE === "1";
  const version = process.env.REACT_APP_VERSION;
  const warnAboutOldBrowser = process.env.REACT_APP_ENABLE_OLD_BROWSER_WARNING;

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
            {warnAboutOldBrowser && (
              <div className="App__warning old_safari_only">
                <Trans render="h3">
                  Warning! This site doesn't fully work on older versions of Safari. Try a{" "}
                  <a href="http://outdatedbrowser.com/en">modern browser</a>.
                </Trans>
              </div>
            )}
            <div className="App__header navbar">
              <HomeLink />
              {isDemoSite && (
                <span className="label label-warning ml-2 text-uppercase">
                  <Trans>Demo Site</Trans>
                </span>
              )}
              <nav className="inline">
                <span className="hide-lg">
                  {getMainNavLinks()}
                  {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                  <a href="#" onClick={() => setEngageModalVisibility(true)}>
                    <Trans>Share</Trans>
                  </a>
                  <LocaleSwitcher />
                </span>

                <div className="dropdown dropdown-right show-lg">
                  <button
                    tabIndex={0}
                    className={
                      "btn btn-link dropdown-toggle m-2" + (isDropdownVisible ? " active" : "")
                    }
                    onClick={() => toggleDropdown()}
                  >
                    <i className={"icon " + (isDropdownVisible ? "icon-cross" : "icon-menu")}></i>
                  </button>
                  <ul
                    onClick={() => toggleDropdown()}
                    className={"menu menu-reverse " + (isDropdownVisible ? "d-block" : "d-none")}
                  >
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
                  </ul>
                </div>
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
