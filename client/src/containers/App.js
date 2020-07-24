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

/*



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
                          "Click “ES” in the upper right corner to switch your view of Who Owns What to Spanish"
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




*/







export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showEngageModal: false,
      toggled_entry: "",
      canvas: "",
    };
  }

  drawCanvasOverlay(showMeLocatorTag) {
    console.log("drawCanvasOverlay called, tag =", showMeLocatorTag, "this.state.canvas = ", this.state.canvas);
    if(showMeLocatorTag === ""){this.state.canvas.style.visibility = "hidden"; return;}
    console.log("drawing new canvas");
    let elem = document.querySelector("[data-show-me=" + CSS.escape(showMeLocatorTag) + "]");
    //elem.scrollIntoViewIfNeeded({ behavior: "auto", block: "center" });
    var context = this.state.canvas.getContext("2d");
    //  console.log("canvas Conatiner = ", canvasContainer, "canvas = ", this.state.canvas, "context = ", context);
    let boundingBox = elem.getBoundingClientRect();
    context.globalCompositeOperation = "source-out";
    context.fillStyle = "rgb(255,255,255)";
    context.globalAlpha = 1;
    context.fillRect(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height);
    context.fillStyle = "rgb(0,0,0)";
    context.globalAlpha = 0.5;
    context.fillRect(0, 0, this.state.canvas.width, this.state.canvas.height);
    //this.state.canvas.onclick = () => ToggleElement(showMeLocatorTag, blurbText);
    this.state.canvas.style.visibility = "visible";
  }

  createCanvas(){
    this.state.canvas = document.createElement("canvas");
    let canvasContainer = document.getElementById("canvasContainer");
    this.state.canvas.style.width = canvasContainer.scrollWidth + "px";
    this.state.canvas.style.height = canvasContainer.scrollHeight + "px";
    this.state.canvas.width = canvasContainer.scrollWidth;
    this.state.canvas.height = canvasContainer.scrollHeight;
    //this.state.canvas.style.overflow = "visible";
    this.state.canvas.style.position = "absolute";
    this.state.canvas.style.zIndex = 11;
    this.state.canvas.style.visibility = "hidden";
    canvasContainer.appendChild(this.state.canvas);
  }

  componentDidMount(){
    this.createCanvas();
  }

  toggleShowMeButton(buttonIndex){
    let button = document.getElementById("showMeButton-" + buttonIndex);
    if(button.isToggled){
        button.isToggled = false;
        button.textContent = "Show me";
        button.style.background = "#454d5d";
        button.style.color = "#FFFFFF";
    } else {
        button.isToggled = true;
        button.textContent = "Hide";
        button.style.background = "#FE9D43";
        button.style.color = "#101114";
    }
  }

  toggleEntry(entry) {
    console.log("toggleEntry called, this entry = ", entry.title, "toggled entry =  ", this.state.toggled_entry.title);
      if (entry.isToggled) {
        entry.isToggled = false;
        this.toggleShowMeButton(entry.title);
        this.drawCanvasOverlay("");
      } else {
        entry.isToggled = true;
        this.drawCanvasOverlay(entry.title);
        this.toggleShowMeButton(entry.title);
      }
  }


  

  render() {
    const isDemoSite = process.env.REACT_APP_DEMO_SITE === "1";
    const paths = createWhoOwnsWhatRoutePaths();

    let entryElems = [
      {
        title: "Spanish Support",
        text: "Click “ES” in the upper right corner to switch your view of Who Owns What to Spanish",
        isToggled: false
        
      },
      {
        title: "Timeline Tab",
        text: "Click 2 “ES” in the upper right corner to switch your view of Who Owns What to Spanish",
        isToggled: false
      },
      {
        title: "Last Registered",
        text: "Click 3 “ES” in the upper right corner to switch your view of Who Owns What to Spanish",
        isToggled: false
      }
    ]

   
   var entryDivs = entryElems.map(entry => 
    <div className="show-me-entry" key = {entry.title} >
                    <span className = "entry-title">
                      <b>{entry.title}</b>
                    </span>
                    <button
                      type = "button" className="show-me-button float-right"
                      id = {"showMeButton-" + entry.title}
                      onClick={(e) => {
                        e.preventDefault();
                        if (this.state.toggled_entry === entry) {
                          this.toggleEntry(entry);
                          this.state.toggled_entry = "";
                          return;
                        }
                        if(this.state.toggled_entry !== "") {
                          this.toggleEntry(this.state.toggled_entry);
                        }
                        this.toggleEntry(entry);
                        this.state.toggled_entry = entry;
                      }
                      }
                    >
                      {" "}
                      Show me{" "}
                    </button>
                    {this.state.expanded_blurb === entry.title ? <span>{entry.text}</span> : ""}
                  </div>);

    var contextWidget = 
      <div>
        <button className="open-button" 
            onClick={() => (document.getElementById("myForm").style.display = "block")}> i
          </button>
        <div className="chat-popup" id="myForm">
          <div className="header">
            <span className = "pop-up-header"><b>What's New</b></span>
              <button  type="button" className="cancel float-right"
                  onClick={() => (document.getElementById("myForm").style.display = "none")}> <b>X</b>
                </button>
          </div>
          <div className="form-container" id="form-container-entries">
            {entryDivs}
          </div>
        </div>
     </div> 


   
    return (
      <Router>
        <I18n>
          <ScrollToTop>
            <div className="App" id="canvasContainer">
              {contextWidget}
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
