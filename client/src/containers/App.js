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

var myCanvas;

function createCanvasOverlay(elem, dataShowMeTag, entryNumber, blurbText, Xadjustment, Yadjustment) {
  console.log("createCanvasOverlay");
  elem.scrollIntoViewIfNeeded({ behavior: "auto", block: "center" });
  let boundingBox = elem.getBoundingClientRect();
  let canvasContainer = document.getElementById("canvasContainer");
  // Part of block below is inspired by code from Google excanvas.js
  if(!myCanvas){
  myCanvas = document.createElement("canvas");
  }
  myCanvas.style.visibility = "visible";
  myCanvas.style.width = canvasContainer.scrollWidth + "px";
  myCanvas.style.height = canvasContainer.scrollHeight + "px";
  // You must set this otherwise the canvas will be streethed to fit the container
  myCanvas.width = canvasContainer.scrollWidth;
  myCanvas.height = canvasContainer.scrollHeight;
  //surfaceElement.style.width=window.innerWidth;
  myCanvas.style.overflow = "visible";
  myCanvas.style.position = "absolute";
  myCanvas.style.zIndex = 11;
  var context = myCanvas.getContext("2d");
  //  console.log("canvas Conatiner = ", canvasContainer, "canvas = ", myCanvas, "context = ", context);
  context.globalCompositeOperation = "source-out";
  context.fillStyle = "rgb(255,255,255)";
  context.globalAlpha = 1;
  
  context.fillRect(Xadjustment? boundingBox.x + Xadjustment: boundingBox.x, Yadjustment? boundingBox.y + Yadjustment: boundingBox.y, boundingBox.width, boundingBox.height);
  
  context.fillStyle = "rgb(0,0,0)";
  context.globalAlpha = 0.4;
  context.fillRect(0, 0, myCanvas.width, myCanvas.height);
  canvasContainer.appendChild(myCanvas);
  myCanvas.onclick = () => ToggleElement(dataShowMeTag, entryNumber, blurbText);

  //alert(myCanvas);
}

function hideCanvas() {
  if (myCanvas) {
    myCanvas.style.visibility = "hidden";
    
  }
}

function ToggleElement(dataShowMeTag, entryNumber, blurbText, Xadjustment, Yadjustment) {
  console.log("show me clicked", dataShowMeTag);
  let elem = document.querySelector("[data-show-me=" + CSS.escape(dataShowMeTag) + "]");
  //console.log(elem);
  if (elem !== null) {
    console.log("toggle status on click: ", elem.dataShowMeToggleState);
    if (elem.dataShowMeToggleState === "toggled") {
      hideCanvas();
      let blurb = document.getElementById(entryNumber + "-blurb");
      blurb.parentNode.removeChild(blurb);
      elem.dataShowMeToggleState = "";
      console.log("toggle off: ", elem.dataShowMeToggleState);
    } else {
      elem.dataShowMeToggleState = "toggled";
      console.log("toggle on: ", elem.dataShowMeToggleState);
      createCanvasOverlay(elem, dataShowMeTag, entryNumber, blurbText, Xadjustment, Yadjustment);
      let blurb = document.createElement("p");
      let blurbContent = document.createTextNode(blurbText);
      blurb.appendChild(blurbContent);
      blurb.className = "blurb";
      blurb.id = entryNumber + "-blurb";
      document.getElementById(entryNumber).appendChild(blurb);
    }
  }
}

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showEngageModal: false,
    };
  }

  render() {
    const isDemoSite = process.env.REACT_APP_DEMO_SITE === "1";
    const paths = createWhoOwnsWhatRoutePaths();

    return (
      <Router>
        <I18n>
          <ScrollToTop>
            <div className="App" id="canvasContainer">
              <button
                className="open-button"
                onClick={() => (document.getElementById("myForm").style.display = "block")}
              >
                i
              </button>
              <div className="chat-popup" id="myForm">
                <div className="header">
                  <span className = "pop-up-header"><b>What's New</b></span>
                  <button
                    type="button"
                    className="cancel float-right"
                    onClick={() => (document.getElementById("myForm").style.display = "none")}
                  >
                    <b>X</b>
                  </button>
                </div>
                <div className="form-container" id="form-container-entries">
                  <div className="show-me-entry" id="show-me-entry-1">
                    <span className = "entry-title">
                      <b>Spanish Support</b>
                    </span>
                    <button
                      type = "button" className="show-me-button float-right"
                      onClick={(e) => {
                        e.preventDefault();
                        return ToggleElement(
                          "Spanish Support",
                          "show-me-entry-1",
                          "Click “ES” in the upper right corner to switch your view of Who Owns What to Spanish",
                          5,
                          0
                        )
                      }
                      }
                    >
                      {" "}
                      Show me{" "}
                    </button>
                  </div>

                  <div className="show-me-entry" id="show-me-entry-2">
                    <span className = "entry-title">
                      <b>Timeline Tab</b>
                    </span>
                    <button
                      className="show-me-button float-right"
                      onClick={() =>
                        ToggleElement(
                          "Timeline Tab",
                          "show-me-entry-2",
                          "Click the Timeline tab to view info about your building over time"
                        )
                      }
                    >
                      {" "}
                      Show me{" "}
                    </button>
                  </div>
                  <div className="show-me-entry last" id="show-me-entry-3">
                    <span className = "entry-title">
                      <b>Last Registered </b>
                    </span>
                    <button
                      className="show-me-button float-right"
                      onClick={() =>
                        ToggleElement(
                          "Last Registered",
                          "show-me-entry-3",
                          "You can now see the last time your building was registered"
                        )
                      }
                    >
                      {" "}
                      Show me{" "}
                    </button>
                  </div>
                </div>
              </div>
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
