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
import { WhoOwnsWhatRoutes, createWhoOwnsWhatRoutePaths } from "../routes";
import { indexOf } from "lodash";

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
      entryIndex: 0,
      entries: [
        {
          title: "Spanish Support",
          text:
            "Click “ES” in the upper right corner to switch your view of Who Owns What to Spanish",
        },
        {
          title: "Timeline Tab",
          text: "Click the Timeline tab to view info about your building over time",
        },
        {
          title: "Last Registered",
          text: "You can now see the last time your building was registered",
        },
      ],
    };
  }

  nextEntry() {
    console.log("this.state.entries = ", this.state.entries);
    this.state.entryIndex === this.state.entries.length - 1
      ? this.setState({ entryIndex: 0 })
      : this.setState({ entryIndex: this.state.entryIndex + 1 });
  }

  prevEntry() {
    console.log("this.state.entries = ", this.state.entries);
    this.state.entryIndex === 0
      ? this.setState({ entryIndex: this.state.entries.length - 1 })
      : this.setState({ entryIndex: this.state.entryIndex - 1 });
  }

  render() {
    const isDemoSite = process.env.REACT_APP_DEMO_SITE === "1";
    const paths = createWhoOwnsWhatRoutePaths();

    let widgetHeader = (
      <div className="header">
        <span className="pop-up-header" role = "heading" tabIndex="0">
          <b>What's New</b>
        </span>
        <button
          type="button"
          role="button"
          className="cancel float-right"
          onClick={() => (document.getElementById("myForm").style.display = "none")}
        >
          <b tabIndex="0">X</b>
        </button>
      </div>
    );

    let entryDivs = this.state.entries.map((entry) => (
      <div
        id={"page-" + entry.title}
        role="region"
        aria-labelledby={"widget-" + entry.title + "-id"}
        className="widget-panel"
      >
        <p htmlFor={"update-" + entry.title}>{entry.title}</p>
        <p>{entry.text}</p>
      </div>
    ));

    let navButtons = (
      <div className="navButtons">
        <button
          className="widget-trigger"
          onClick={(event) => {
            event.preventDefault();
            return this.prevEntry(event);
          }}
        >
          <span className="widget-button .btn-prev" tabIndex = "0">Prev</span>
        </button>
        <button
          className="widget-trigger"
          onClick={(event) => {
            event.preventDefault();
            return this.nextEntry(event);
          }}
        >
          <span className="widget-button .btn-next" tabIndex = "0">Next</span>
        </button>
      </div>
    );

    let featureCalloutWidget = (
      <div>
        <button
          className="open-button"
          tabIndex = "0"
          onClick={() => (document.getElementById("myForm").style.display = "block")}
        >
          i
        </button>
        <div className="chat-popup" id="myForm">
          {widgetHeader}
          <div className="form-container" id="form-container-entries">
            {entryDivs[this.state.entryIndex]}
            {navButtons}
          </div>
        </div>
      </div>
    );

    return (
      <Router>
        <I18n>
          <ScrollToTop>
            
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
              {featureCalloutWidget}
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
          </ScrollToTop>
        </I18n>
      </Router>
    );
  }
}
