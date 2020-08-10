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
import Spanish_gif from "../assets/img/Feature_callout_gifs/Spanish.gif";
import Timeline_gif from "../assets/img/Feature_callout_gifs/Timeline.gif";
import URLS_gif from "../assets/img/Feature_callout_gifs/URLS.gif";
import LastSold_gif from "../assets/img/Feature_callout_gifs/LastSold.gif";

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
          index: "1 of 4",
          title: "Timeline Tab",
          description: "Click the Timeline tab to view info about your building over time",
          img: Timeline_gif,
        },
        {
          index: "2 of 4",
          title: "Spanish Support",
          description:
            "Click “ES” in the upper right corner to switch your view of Who Owns What to Spanish",
          img: Spanish_gif,
        },
        {
          index: "3 of 4",
          title: "Unique Tab URLs",
          description:
            "It's now possible to share links to specific tabs (Overview, Timeline, Portfolio, & Summary)",
          img: URLS_gif,
        },
        {
          index: "4 of 4",
          title: "Last Sold",
          description: "View the date and price from the last time your building was sold",
          img: LastSold_gif,
        },
      ],
    };
  }

  nextEntry() {
    this.state.entryIndex === this.state.entries.length - 1
      ? this.setState({ entryIndex: 0 })
      : this.setState({ entryIndex: this.state.entryIndex + 1 });
  }

  prevEntry() {
    this.state.entryIndex === 0
      ? this.setState({ entryIndex: this.state.entries.length - 1 })
      : this.setState({ entryIndex: this.state.entryIndex - 1 });
  }

  toggleWidget(event, widget) {
    if (widget.style.display === "none") {
      widget.style.display = "inline-block";
      document.querySelector(".widget-tooltip-triangle").classList.add("toggled");
      document.querySelector(".widget-button-info").classList.add("pressed");
    } else {
      widget.style.display = "none";
      document.querySelector(".widget-button-info").classList.remove("pressed");
      document.querySelector(".widget-tooltip-triangle").classList.remove("toggled");
    }
  }

  render() {
    const isDemoSite = process.env.REACT_APP_DEMO_SITE === "1";
    const paths = createWhoOwnsWhatRoutePaths();

    //header of the widget, says "What's New" and has close button
    let widgetHeader = (
      <div className="widget-header">
        <span className="widget-title focusable" role="heading" tabIndex="0">
          What's New
        </span>
        <button
          type="button"
          className="widget-button-cancel material-icons md-18 focusable"
          tabIndex="0"
          onClick={(event) => {
            event.preventDefault();
            let widget = document.getElementById("widget");
            return this.toggleWidget(event, widget);
          }}
        >
          close
        </button>
      </div>
    );

    //All entries in the widget will have this format: index, title, image, and description
    let widgetEntries = this.state.entries.map((entry) => (
      <div
        className="widget-entry"
        id={"page-" + entry.title}
        role="region"
        aria-labelledby={"widget-" + entry.title + "-id"}
      >
        <p className="widget-entry-title-container">
          <span className="widget-entry-index" aria-describedby={entry.index}>
            {entry.index}
          </span>
          <span
            className="widget-entry-title"
            aria-describedby={"widget-entry title- " + entry.title}
          >
            {entry.title}
          </span>
        </p>
        <img className="widget-entry-image" src={entry.img} alt={entry.description}></img>
        <p className="widget-entry-description">{entry.description}</p>
      </div>
    ));

    //Prev/next buttons
    let navButtons = (
      <div className="widget-nav-buttons-container">
        <button
          className="widget-button-nav prev focusable"
          tabIndex="0"
          onClick={(event) => {
            event.preventDefault();
            return this.prevEntry(event);
          }}
        >
          <span className="material-icons md-14 widget-prev-next-icon">navigate_before</span>
          <span className="widget-prev-text">Prev</span>
        </button>
        <button
          className="widget-button-nav next focusable"
          tabIndex="0"
          onClick={(event) => {
            event.preventDefault();
            return this.nextEntry(event);
          }}
        >
          <span className="widget-next-text">Next</span>
          <span className="material-icons md-14 widget-prev-next-icon">navigate_next</span>
        </button>
      </div>
    );

    //The whole widget, with the info button toggle
    let featureCalloutWidget = (
      <div>
        <div className="widget-triangle-info-button-container">
          <button
            className="widget-button-info focusable material-icons md-14"
            tabIndex="0"
            onClick={(event) => {
              event.preventDefault();
              let widget = document.getElementById("widget");
              return this.toggleWidget(event, widget);
            }}
          >
            info
          </button>
          <div className="widget-tooltip-triangle"></div>
        </div>
        <div className="widget-container" id="widget">
          {widgetHeader}
          <div className="widget-content-container" id="widget-entries">
            {widgetEntries[this.state.entryIndex]}
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
