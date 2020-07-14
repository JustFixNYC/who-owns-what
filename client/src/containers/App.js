import React, { Component } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Trans, t } from "@lingui/macro";

import "styles/App.css";

// import top-level containers (i.e. pages)
import { I18n, LocaleNavLink, LocaleLink as Link, LocaleSwitcher } from "../i18n";
import ScrollToTop from "components/ScrollToTop";
import Modal from "components/Modal";
import SocialShare from "components/SocialShare";
import { withI18n } from "@lingui/react";
import { WhoOwnsWhatRoutes } from "../routes";

const HomeLink = withI18n()((props) => {
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

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showEngageModal: false,
    };
  }

  render() {
    const isDemoSite = process.env.REACT_APP_DEMO_SITE === "1";
    return (
      <Router>
        <I18n>
          <ScrollToTop>
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
                  <LocaleNavLink exact to="/">
                    <Trans>Home</Trans>
                  </LocaleNavLink>
                  <LocaleNavLink to="/about">
                    <Trans>About</Trans>
                  </LocaleNavLink>
                  <LocaleNavLink to="/how-to-use">
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
