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
      canvas: "",
      allowToggle: true,
    };
  }
  createCanvas(){
    let myCanvas = document.createElement("canvas");
    let canvasContainer = document.getElementById("canvasContainer");
    myCanvas.style.width = canvasContainer.scrollWidth + "px";
    myCanvas.style.height = canvasContainer.scrollHeight + "px";
    myCanvas.width = canvasContainer.scrollWidth;
    myCanvas.height = canvasContainer.scrollHeight;
    myCanvas.style.overflow = "visible";
    myCanvas.style.position = "absolute";
    myCanvas.style.zIndex = 11;
    myCanvas.hidden = true;
    canvasContainer.appendChild(myCanvas);
    this.setState({canvas: myCanvas});
  }

  componentDidMount(){
    this.createCanvas();
    this.setupAccordion();
  }

  drawCanvasOverlay(entryTitle) {
    if(entryTitle === ""){this.state.canvas.setAttribute('hidden', ''); return;}
    let elem = document.querySelector("[data-show-me=" + CSS.escape(entryTitle) + "]");
    this.state.canvas.removeAttribute('hidden');
    let boundingBox = new DOMRect(0,0,this.state.canvas.width,this.state.canvas.height);
    if(elem){
    elem.scrollIntoViewIfNeeded({ behavior: "auto", block: "center" });
    boundingBox = elem.getBoundingClientRect();
    }
    let cxt = this.state.canvas.getContext("2d");
    cxt.clearRect(0,0, this.state.canvas.width, this.state.canvas.height);
    cxt.globalCompositeOperation = "source-out";
    cxt.fillStyle = "rgb(255,255,255)";
    cxt.globalAlpha = 1;
    cxt.fillRect(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height);
    cxt.fillStyle = "rgb(0,0,0)";
    cxt.globalAlpha = 0.5;
    cxt.fillRect(0, 0, this.state.canvas.width, this.state.canvas.height);
    this.state.canvas.addEventListener('click', (event) => {event.preventDefault(); return this.dismissActiveEntry()});
  }

  dismissActiveEntry(){
    let active = document.querySelector('[aria-expanded="true"]');
        // close the open accordion
        if (active) {
          // Set the expanded state on the triggering element
          active.setAttribute('aria-expanded', 'false');
          //toggle button off
          let activeButton = active.firstChild.firstChild.nextSibling;
          activeButton.textContent = "Show";
          this.drawCanvasOverlay("");
          // Hide the accordion sections, using aria-controls to specify the desired section
          document.getElementById(active.getAttribute('aria-controls')).setAttribute('hidden', '');
          // When toggling is not allowed, clean up disabled state
          if (!this.state.allowToggle) {
            active.removeAttribute('aria-disabled');
          }
  }
}

  toggleCallback(event){
      let target = event.target;
        // Check if the current toggle is expanded.
        let isExpanded = target.getAttribute('aria-expanded') === 'true';
        //Check if another toggle is expanded
        let active = document.querySelector('[aria-expanded="true"]');
        if(active){ 
        this.dismissActiveEntry();
        }
        if (!isExpanded) { //only expand the target if it wasn't expanded alread
          // Set the expanded state on the triggering element
          target.setAttribute('aria-expanded', 'true');
          this.drawCanvasOverlay(target.id);
          //toggle button on
          active = document.querySelector('[aria-expanded="true"]');
          let activeButton = active.firstChild.firstChild.nextSibling;
          activeButton.textContent = "Hide";
          // Show the accordion sections, using aria-controls to specify the desired section
          document.getElementById(target.getAttribute('aria-controls')).removeAttribute('hidden');
          // If toggling is not allowed, set disabled state on trigger
          if (!this.state.allowToggle) {
            target.setAttribute('aria-disabled', 'true');
          }
        }
        event.preventDefault();
  }

  setupAccordion = () => {
    console.log("OY");
    let accordion = document.querySelector('div.Accordion');
    //if toggling not allowed, accordion will appear with all sections expanded
    if (this.state.allowToggle) { 
      accordion.addEventListener('click', (event) => {event.preventDefault(); return this.toggleCallback(event)});
      
    } else {
      accordion.querySelectorAll('[aria-expanded]').forEach(function (section) {
        section.setAttribute('aria-disabled', 'true');
        });
    let triggers = Array.prototype.slice.call(accordion.querySelectorAll('.Accordion-trigger'));
    // Bind keyboard behaviors on the main accordion container
    accordion.addEventListener('keydown', function (event) {
      let target = event.target;
      let key = event.which.toString();
      // 33 = Page Up, 34 = Page Down
      let ctrlModifier = (event.ctrlKey && key.match(/33|34/));
      // Is this coming from an accordion header?
      if (target.classList.contains('Accordion-trigger')) {
        // Up/ Down arrow and Control + Page Up/ Page Down keyboard operations
        // 38 = Up, 40 = Down
        if (key.match(/38|40/) || ctrlModifier) {
          let index = triggers.indexOf(target);
          let direction = (key.match(/34|40/)) ? 1 : -1;
          let length = triggers.length;
          let newIndex = (index + length + direction) % length;
          triggers[newIndex].focus();
          event.preventDefault();
        }
        else if (key.match(/35|36/)) {
          // 35 = End, 36 = Home keyboard operations
          switch (key) {
            // Go to first accordion
            case '36':
              triggers[0].focus();
              break;
              // Go to last accordion
            case '35':
              triggers[triggers.length - 1].focus();
              break;
            default:
              break;
          }
          event.preventDefault();
        }
      }
    });
  
    // These are used to style the accordion when one of the buttons has focus
    accordion.querySelectorAll('.Accordion-trigger .cancel').forEach(function (trigger) {
      trigger.addEventListener('focus', function (event) {
        accordion.classList.add('focus');
      });
      trigger.addEventListener('blur', function (event) {
        accordion.classList.remove('focus');
      });
  
    });
  }
  
    // Minor setup: will set disabled state, via aria-disabled, to an
    // expanded/ active accordion which is not allowed to be toggled close
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
        text: "Click the Timeline tab to view info about your building over time",
        isToggled: false
      },
      {
        title: "Last Registered",
        text: "You can now see the last time your building was registered",
        isToggled: false
      }
    ]


   let entryDivs = entryElems.map(entry => 
    <div className = "accordion-entry" key = {entry.title}>
    <h3>
      {this.state.allowToggle? 
        <button aria-expanded="false"
                className="Accordion-trigger"
                aria-controls={"sect-" + entry.title}
                id={entry.title} >
          <span className="Accordion-title">
            {entry.title}
            <span className="Accordion-icon">Show</span>
          </span>
        </button> 
        :
        <span className="Accordion-title" aria-label={entry.title}>
        {entry.title}
        </span>
      }
    </h3>
    <div id={"sect-" + entry.title}
         role="region"
         aria-labelledby={"accordion-" + entry.title + "-id"}
         className="Accordion-panel" hidden = {this.state.allowToggle? true : ''}>
         <p htmlFor={"update-" + entry.title}> {entry.text} </p>
    </div>
    </div>);


  let widgetHeader = 
      <div 
      className="header"
      >
        <span className = "pop-up-header">
          <b>What's New</b>
        </span>
        <button  
          type="button" role = "button"
          className="cancel float-right"
          onClick={() => (document.getElementById("myForm").style.display = "none")}
        > 
          <b>X</b>
        </button>
      </div>
  

    let contextWidget = 
                <div>
                  <button className="open-button" 
                    onClick={() => (document.getElementById("myForm").style.display = "block")}
                  > 
                      i
                  </button>
                  <div className="chat-popup" id="myForm" >
                   {widgetHeader}
                    <div className="form-container"  id="form-container-entries" >
                      <div id="accordionGroup" className="Accordion">
                        {entryDivs}
                      </div>
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
