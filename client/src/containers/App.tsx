import React, { useEffect, useState, useContext } from "react";
import { BrowserRouter as Router, Switch, Route, useLocation } from "react-router-dom";
import { Trans, t } from "@lingui/macro";

import "styles/App.css";

import ScrollToTop from "../components/ScrollToTop";
import FeatureCalloutWidget from "../components/FeatureCalloutWidget";
import classnames from "classnames";
import browser from "util/browser";

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
import VerifyEmailPage from "./VerifyEmailPage";
import { DevPage } from "./DevPage";
import { wowMachine } from "state-machine";
import { NotFoundPage } from "./NotFoundPage";
import widont from "widont";
import { Dropdown } from "components/Dropdown";
import { isLegacyPath, WowzaRedirectPage } from "components/WowzaToggle";
import { logAmplitudeEvent } from "../components/Amplitude";
import { SliderButton } from "@typeform/embed-react";
import { StickyModal } from "components/StickyModal";
import { DeprecationModal } from "components/DeprecationModal";
import { UserContext, UserContextProvider } from "components/UserContext";
import AccountSettingsPage from "./AccountSettingsPage";
import ResetPasswordPage from "./ResetPasswordPage";
import ForgotPasswordPage from "./ForgotPasswordPage";
import UnsubscribePage from "./UnsubscribePage";
import LoginPage from "./LoginPage";

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
      to={isLegacyPath(pathname) ? legacy.home : home}
    >
      <h1 className="page-title">{widont(title)}</h1>
    </Link>
  );
});

const WhoOwnsWhatRoutes: React.FC<{}> = () => {
  const paths = createWhoOwnsWhatRoutePaths("/:locale");
  const [state, send] = useMachine(wowMachine);
  const machineProps = { state, send };
  const allowChangingPortfolioMethod =
    process.env.REACT_APP_ENABLE_NEW_WOWZA_PORTFOLIO_MAPPING === "1";
  return (
    <Switch>
      <Route exact path={paths.legacy.home} component={HomePage} />
      <Route
        exact
        path={paths.home}
        render={(props) => (
          <HomePage
            useNewPortfolioMethod={allowChangingPortfolioMethod}
            {...machineProps}
            {...props}
          />
        )}
      />
      <Route
        path={paths.legacy.addressPage.overview}
        render={(props) => <AddressPage currentTab={0} {...machineProps} {...props} />}
        exact
      />
      <Route
        path={paths.legacy.addressPage.portfolio}
        render={(props) => <AddressPage currentTab={1} {...machineProps} {...props} />}
      />
      <Route
        path={paths.legacy.addressPage.timeline}
        render={(props) => <AddressPage currentTab={2} {...machineProps} {...props} />}
      />
      <Route
        path={paths.legacy.addressPage.summary}
        render={(props) => <AddressPage currentTab={3} {...machineProps} {...props} />}
      />
      <Route
        path={paths.addressPage.overview}
        render={(props) => (
          <AddressPage
            currentTab={0}
            {...machineProps}
            {...props}
            useNewPortfolioMethod={allowChangingPortfolioMethod}
          />
        )}
        exact
      />
      <Route
        path={paths.addressPage.portfolio}
        render={(props) => (
          <AddressPage
            currentTab={1}
            {...machineProps}
            {...props}
            useNewPortfolioMethod={allowChangingPortfolioMethod}
          />
        )}
      />
      <Route
        path={paths.addressPage.timeline}
        render={(props) => (
          <AddressPage
            currentTab={2}
            {...machineProps}
            {...props}
            useNewPortfolioMethod={allowChangingPortfolioMethod}
          />
        )}
      />
      <Route
        path={paths.addressPage.summary}
        render={(props) => (
          <AddressPage
            currentTab={3}
            {...machineProps}
            {...props}
            useNewPortfolioMethod={allowChangingPortfolioMethod}
          />
        )}
      />
      <Route path={paths.legacy.bbl} component={BBLPage} />
      <Route
        path={paths.bblSeparatedIntoParts}
        render={(props) => (
          <BBLPage {...props} useNewPortfolioMethod={allowChangingPortfolioMethod} />
        )}
      />
      <Route
        path={paths.bbl}
        render={(props) => (
          <BBLPage {...props} useNewPortfolioMethod={allowChangingPortfolioMethod} />
        )}
      />
      <Route path={paths.account.login} component={LoginPage} />
      <Route path={paths.account.verifyEmail} component={VerifyEmailPage} />
      <Route path={paths.account.settings} component={AccountSettingsPage} />
      <Route path={paths.account.forgotPassword} component={ForgotPasswordPage} />
      <Route path={paths.account.resetPassword} component={ResetPasswordPage} />
      <Route path={paths.account.unsubscribe} component={UnsubscribePage} />
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
      <Route path={paths.oldWowzaPath} component={WowzaRedirectPage} />
      <Route component={NotFoundPage} />
    </Switch>
  );
};

const SearchLink = () => {
  const { pathname } = useLocation();
  const { home, legacy } = createWhoOwnsWhatRoutePaths();
  const searchRoute = isLegacyPath(pathname) ? legacy.home : home;

  return (
    <LocaleNavLink exact to={searchRoute} key={1}>
      <Trans>Search</Trans>
    </LocaleNavLink>
  );
};

const getAccountNavLinks = (
  handleLogout: (fromPath: string) => void,
  fromPath: string,
  isSignedIn?: boolean
) => {
  const { account } = createWhoOwnsWhatRoutePaths();
  const { settings, login } = account;

  return isSignedIn
    ? [
        <LocaleNavLink to={settings} key="account-1">
          <Trans>Account</Trans>
        </LocaleNavLink>,
        <button onClick={() => handleLogout(fromPath)} key="account-2">
          <Trans>Log out</Trans>
        </button>,
      ]
    : [
        <LocaleNavLink to={login} key="account-3">
          <Trans>Log in</Trans>
        </LocaleNavLink>,
      ];
};

const getMainNavLinks = (isLegacyPath?: boolean) => {
  const { about, howToUse, legacy } = createWhoOwnsWhatRoutePaths();
  return [
    <SearchLink key={1} />,
    <LocaleNavLink to={isLegacyPath ? legacy.about : about} key={2}>
      <Trans>About</Trans>
    </LocaleNavLink>,
    <LocaleNavLink
      to={isLegacyPath ? legacy.howToUse : howToUse}
      key={3}
      onClick={() => {
        logAmplitudeEvent("navbarHowToUse");
        window.gtag("event", "navbar-how-to-use");
      }}
    >
      <Trans>How to use</Trans>
    </LocaleNavLink>,
    <a href="https://donorbox.org/donate-to-justfix-nyc" key={4}>
      <Trans>Donate</Trans>
    </a>,
  ];
};

const Navbar = () => {
  const { pathname } = useLocation();
  const addFeatureCalloutWidget = process.env.REACT_APP_ENABLE_FEATURE_CALLOUT_WIDGET === "1";
  const isDemoSite = process.env.REACT_APP_DEMO_SITE === "1";
  const allowChangingPortfolioMethod =
    process.env.REACT_APP_ENABLE_NEW_WOWZA_PORTFOLIO_MAPPING === "1";

  const userContext = useContext(UserContext);

  return (
    <div
      className={classnames(
        "App__header",
        "navbar",
        allowChangingPortfolioMethod && !isLegacyPath(pathname) && "wowza-styling"
      )}
    >
      <HomeLink />
      {isDemoSite && (
        <span className="label label-warning ml-1 text-uppercase">
          <Trans>Demo Site</Trans>
        </span>
      )}
      <nav className="inline">
        {addFeatureCalloutWidget && <FeatureCalloutWidget />}
        <span className="hide-lg">
          {getMainNavLinks(isLegacyPath(pathname))}
          <LocaleSwitcher />
          {getAccountNavLinks(userContext.logout, pathname, !!userContext?.user?.email)}
        </span>
        <Dropdown>
          {getMainNavLinks(isLegacyPath(pathname)).map((link, i) => (
            <li className="menu-item" key={i}>
              {link}
            </li>
          ))}
          <li className="menu-item">
            <LocaleSwitcherWithFullLanguageName />
          </li>
          {getAccountNavLinks(userContext.logout, pathname, !!userContext?.user?.email).map(
            (link, i) => (
              <li className="menu-item" key={`account-${i}`}>
                {link}
              </li>
            )
          )}
        </Dropdown>
      </nav>
    </div>
  );
};

const AppBody = () => {
  const { pathname } = useLocation();
  const allowChangingPortfolioMethod =
    process.env.REACT_APP_ENABLE_NEW_WOWZA_PORTFOLIO_MAPPING === "1";
  return (
    <div
      className={classnames(
        "App__body",
        allowChangingPortfolioMethod && !isLegacyPath(pathname) && "wowza-styling"
      )}
    >
      <WhoOwnsWhatRoutes />
    </div>
  );
};

const App = () => {
  const version = process.env.REACT_APP_VERSION;
  const surveyId = process.env.REACT_APP_WOAU_SURVEY_ID;
  const deprecationModalEnabled = process.env.REACT_APP_DEPRECATION_MODAL_ENABLED;

  const [surveyCookie, setSurveyCookie] = useState(
    browser.getCookieValue(browser.WOAU_COOKIE_NAME)
  );
  let surveySubmitted = surveyCookie === "2";

  useEffect(() => {
    if (surveyCookie) {
      browser.setCookie(browser.WOAU_COOKIE_NAME, surveyCookie, 30);
    }
  }, [surveyCookie]);

  // On submission or close set the cookie to "2" to hide the button permanently
  const hideSurveyButton = () => setSurveyCookie("2");
  // If the survey has never been submitted (cookie == "0"), set cookie to "1"
  // If the survey has just been submitted, set the cookie to "2"
  const closeSurvey = () => {
    if (surveySubmitted) {
      setSurveyCookie("2");
    } else if (!surveyCookie) {
      setSurveyCookie("1");
    }
  };

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
          <UserContextProvider>
            <div className="App">
              <Navbar />
              {deprecationModalEnabled && <DeprecationModal />}
              <AppBody />
              {surveyId && surveyCookie !== "2" && (
                <StickyModal
                  label={"Help us build tenant power in NYC!"}
                  verticalPosition="bottom"
                  horizontalPosition="right"
                  onClose={hideSurveyButton}
                >
                  <SliderButton
                    id={surveyId}
                    redirectTarget="_self"
                    open={surveyCookie ? undefined : "time"}
                    openValue={surveyCookie ? undefined : 5000}
                    className="waou-survey-button"
                    onClose={closeSurvey}
                    onSubmit={() => (surveySubmitted = true)}
                  >
                    Take our short survey
                  </SliderButton>
                </StickyModal>
              )}
            </div>
          </UserContextProvider>
        </ScrollToTop>
      </I18n>
    </Router>
  );
};

export default App;
