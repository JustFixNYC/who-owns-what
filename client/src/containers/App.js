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

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showEngageModal: false,
      toggled_entry: "invalid entry",
      canvas: "",
    };
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

  drawCanvasOverlay(entry) {
    if(entry === ""){this.state.canvas.style.visibility = "hidden"; return;}
    //console.log("drawing new canvas");
    let elem = document.querySelector("[data-show-me=" + CSS.escape(entry.title) + "]");
    this.state.canvas.style.visibility = "visible";
    //elem.scrollIntoViewIfNeeded({ behavior: "auto", block: "center" });
    var cxt = this.state.canvas.getContext("2d");
    cxt.clearRect(0,0, this.state.canvas.width, this.state.canvas.height);
    let boundingBox = elem.getBoundingClientRect();
    cxt.globalCompositeOperation = "source-out";
    cxt.fillStyle = "rgb(255,255,255)";
    cxt.globalAlpha = 1;
    cxt.fillRect(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height);
    cxt.fillStyle = "rgb(0,0,0)";
    cxt.globalAlpha = 0.5;
    cxt.fillRect(0, 0, this.state.canvas.width, this.state.canvas.height);
    this.state.canvas.onclick = (e) => {e.preventDefault(); return this.handleToggle(entry)};
  }

  toggleShowMeButton(entryTitle){
    let button = document.getElementById("showMeButton-" + entryTitle);
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
      //console.log("before toggleEntry: this entry = ", entry.title, "toggled entry =  ", this.state.toggled_entry.title);
      if (entry.isToggled) {
        entry.isToggled = false;
        this.toggleShowMeButton(entry.title);
        this.drawCanvasOverlay("");
      } else {
        entry.isToggled = true;
        this.toggleShowMeButton(entry.title);
        this.drawCanvasOverlay(entry);
      }
      //console.log("after toggleEntry: this entry = ", entry.title, "toggled entry =  ", this.state.toggled_entry.title);
  }

  handleToggle(entry){
    console.log("handleToggle: this entry = ", entry, "toggled entry =  ", this.state.toggled_entry);
    if (this.state.toggled_entry.title === entry.title) {
      console.log("toggleEntryoff, toggled entry =  ", this.state.toggled_entry.title);
      this.toggleEntry(entry);
      this.state.toggled_entry = "invalid entry";
      return;
    }
    if(this.state.toggled_entry !== "invalid entry") {
      this.toggleEntry(this.state.toggled_entry);
    }
    this.toggleEntry(entry);
    this.state.toggled_entry = entry;
    console.log("toggleEntry on, toggled entry =  ", this.state.toggled_entry.title);
  }
/*
  componentDidUpdate(prevprops){
    if(this.props.toggled_entry !== prevprops.toggled_entry){
      console.log("YO");
      this.setState();
    }
  }
*/


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
        text: "Click the Timeline tab to view info about your building over time",
        isToggled: false
      },
      {
        title: "Last Registered",
        text: "You can now see the last time your building was registered",
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
                      this.handleToggle(entry);
                    }
                    }
                  >
                    {" "}
                    Show me{" "}
                  </button>
                  
                  {entry.isToggled ? <div className = "blurb">{entry.text}</div> : ""}
              </div>);

    var contextWidget = 
                <div>
                  <button 
                    className="open-button" 
                    onClick={() => (document.getElementById("myForm").style.display = "block")}
                    > 
                      i
                  </button>
                  <div 
                  className="chat-popup" 
                  id="myForm"
                  >
                    <div 
                    className="header"
                    >
                      <span className = "pop-up-header">
                        <b>What's New</b>
                      </span>
                      <button  
                        type="button" 
                        className="cancel float-right"
                        onClick={() => (document.getElementById("myForm").style.display = "none")}
                      > 
                        <b>X</b>
                      </button>
                    </div>
                    <div 
                    className="form-container" 
                    id="form-container-entries"
                    >
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
