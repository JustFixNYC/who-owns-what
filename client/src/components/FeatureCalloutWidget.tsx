import React, { Component } from "react";
import { t } from "@lingui/macro";
import Timeline_gif from "../assets/img/Feature_callout_gifs/Timeline.gif"
import Spanish_gif from "../assets/img/Feature_callout_gifs/Spanish.gif"
import URLS_gif from "../assets/img/Feature_callout_gifs/URLS.gif"
import LastSold_gif from "../assets/img/Feature_callout_gifs/LastSold.gif"

import "styles/FeatureCalloutWidget.scss";

type widgetProps = {};

type widgetState =  {
  entryIndex: number;
  entries: { index: string; title: string; description: string; img: string }[];
};

export default class FeatureCalloutWidget extends Component<{}, widgetState>  {

  componentWillMount(){
    this.setState({
      entryIndex: 0,
      entries: [
        {
          index: "1 of 4",
          title: "Timeline Tab",
          description: "Click the Timeline tab to view info about your building over time.",
          img: Timeline_gif,
        },
        {
          index: "2 of 4",
          title: "Spanish Support",
          description:
            "Who Owns What is now available in Spanish. Click “ES” in the upper right corner to switch your language.",
          img: Spanish_gif,
        },
        {
          index: "3 of 4",
          title: "Unique Tab URLs",
          description:
            "It's now possible to share links to specific tabs (Overview, Timeline, Portfolio, & Summary).",
          img: URLS_gif,
        },
        {
          index: "4 of 4",
          title: "Last Sold",
          description: "The Overview and Portfolio tabs now display the date and price from when your building was last sold.",
          img: LastSold_gif,
        },
      ],
    });
  }
  render(){
    let nextEntry = () =>{
      this.state.entryIndex === this.state.entries.length - 1
        ? this.setState({ entryIndex: 0 })
        : this.setState({ entryIndex: this.state.entryIndex + 1 });
    };
  
    let prevEntry = () =>{
      this.state.entryIndex === 0
        ? this.setState({ entryIndex: this.state.entries.length - 1 })
        : this.setState({ entryIndex: this.state.entryIndex - 1 });
    };
    
    let toggleWidget = (widget: any) => {
      let tooltipTriangle = document.querySelector(".widget-tooltip-triangle");
      let infoButton = document.querySelector(".widget-button-info");
      if (widget.style.display === "none") {
        widget.style.display = "inline-block";
        if (tooltipTriangle) tooltipTriangle.classList.add("toggled");
        if (infoButton) infoButton.classList.add("pressed");
      } else {
        widget.style.display = "none";
        if (tooltipTriangle) tooltipTriangle.classList.remove("toggled");
        if (infoButton) infoButton.classList.remove("pressed");
      }
      
    };
    
   //header of the widget, says "What's New" and has close button
   let widgetHeader = (
    <div className="widget-header">
      <span className="widget-title focusable" role="heading" tabIndex={0}>
        What's New
      </span>
      <button
        type="button"
        className="widget-button-cancel material-icons md-18 focusable"
        tabIndex={0}
        onClick={(event) => {
          event.preventDefault();
          let widget = document.getElementById("widget");
          return toggleWidget(widget);
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
        tabIndex={0}
        onClick={(event) => {
          event.preventDefault();
          return prevEntry();
        }}
      >
        <span className="material-icons md-14 widget-prev-next-icon">navigate_before</span>
        <span className="widget-prev-text">Prev</span>
      </button>
      <button
        className="widget-button-nav next focusable"
        tabIndex={0}
        onClick={(event) => {
          event.preventDefault();
          return nextEntry();
        }}
      >
        <span className="widget-next-text">Next</span>
        <span className="material-icons md-14 widget-prev-next-icon">navigate_next</span>
      </button>
    </div>
  );

    return (
      <div>
      <div className="widget-triangle-info-button-container">
        <button
          className="widget-button-info focusable material-icons md-14"
          tabIndex={0}
          onClick={(event) => {
            event.preventDefault();
            let widget: any;
            widget = document.getElementById("widget");
            return (toggleWidget(widget));
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
    }
  } 
       

    
  /*
    Search = React.createClass({
      getInitialState: function() {
          return { 
            shouldHide:false
          };
      },
      onClick: function() {
          console.log("onclick");
          if(!this.state.shouldHide){
            this.setState({
              shouldHide: true 
            })
          }else{
            this.setState({
              shouldHide: false 
            })
          }
      },
  render: function() {
      return (
        <div>
          <button onClick={this.onClick}>click me</button>
          <p className={this.state.shouldHide ? 'hidden' : ''} >yoyoyoyoyo</p>
        </div>
      );
  }
  });
  
    
  
    
   // ReactDOM.render(<ToggleInfoButton />, document.querySelector("#info-button-container"))
  
   
  */
