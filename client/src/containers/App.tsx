import React, { Component } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Trans, t } from "@lingui/macro";

import "styles/App.css";

import ScrollToTop from "../components/ScrollToTop";
import SocialShare from "../components/SocialShare";
import Modal from "../components/Modal";

// import top-level containers (i.e. pages)
import { I18n, LocaleNavLink, LocaleLink as Link, LocaleSwitcher } from "../i18n";
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

type Props = {};

type State = {
  showEngageModal: boolean;
};

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

export default class App extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      showEngageModal: false,
    };
  }

  render() {
    const isDemoSite = process.env.REACT_APP_DEMO_SITE === "1";
    const version = process.env.REACT_APP_VERSION;
    const paths = createWhoOwnsWhatRoutePaths();
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
              <div className="App__warning old_safari_only">
                <Trans render="h3">
                  Warning! This site doesn't fully work on older versions of Safari. Try a{" "}
                  <a href="http://outdatedbrowser.com/en">modern browser</a>.
                </Trans>
              </div>
              <div className="App__header">
                <HomeLink />
                {isDemoSite && (
                  <span className="label label-warning ml-2 text-uppercase">
                    <Trans>Demo Site</Trans>
                  </span>
                )}
                <nav className="inline">
                  <LocaleNavLink exact to={paths.home}>
                    <Trans>Home</Trans>
                  </LocaleNavLink>
                  <LocaleNavLink to={paths.about}>
                    <Trans>About</Trans>
                  </LocaleNavLink>
                  <LocaleNavLink to={paths.howToUse}>
                    <Trans>How to use</Trans>
                  </LocaleNavLink>
                  <a href="https://www.justfix.nyc/donate">
                    <Trans>Donate</Trans>
                  </a>
                  {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                  <a href="#" onClick={() => this.setState({ showEngageModal: true })}>
                    <Trans>Share</Trans>
                  </a>
                  <LocaleSwitcher />
                </nav>
                <Modal
                  showModal={this.state.showEngageModal}
                  onClose={() => this.setState({ showEngageModal: false })}
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
  }
}
