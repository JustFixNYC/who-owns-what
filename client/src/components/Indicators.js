import React, { Component } from 'react';

import Helpers from 'util/helpers';

import IndicatorsViz from 'components/IndicatorsViz';
import IndicatorsDescription from 'components/IndicatorsDescription';
import Loader from 'components/Loader';
import LegalFooter from 'components/LegalFooter';
import APIClient from 'components/APIClient';

import 'styles/Indicators.css';

const initialState = { 

      saleHistory: null,

      lastSale: {
        date: null,
        label: null, 
        documentid: null 
      },

      indicatorHistory: null,

      violsData: {
        labels: null,
        values: {
          class_a: null,
          class_b: null,
          class_c: null,
          total: null
        }, 
        text: {
          title: "HPD Violations",
          titleSuffix: "Issued since 2010",
          yAxisTitle: "Violations Issued"
        }
      },

      complaintsData: {
        labels: null,
        values: {
          emergency: null,
          nonemergency: null,
          total: null
        },
        text: {
          title: "HPD Complaints",
          titleSuffix: "Issued since 2014",
          yAxisTitle: "Complaints Issued",
        }
      },

      permitsData: {
        labels: null,
        values: {
          total: null
        },
        text: {
          title: "Building Permit Applications",
          titleSuffix: "since 2010",
          yAxisTitle: "Building Permits Applied For",
        }
      },

      indicatorList: ['complaints','viols','permits'],
      defaultVis: 'complaints',
      activeVis: 'complaints',
      timeSpanList: ['month','quarter','year'],
      activeTimeSpan: 'quarter',
      monthsInGroup: 3,
      xAxisStart: 0,
      xAxisViewableColumns: 20,
      currentAddr: null

};

export default class Indicators extends Component {
  constructor(props) {
    super(props);
    this.state = initialState;
  }

  /** Resets the component to initial blank state */
  reset() {
    this.setState(initialState);
  }

  /** Shifts the X-axis 'left' or 'right', or 'reset' the X-axis to default */
  handleXAxisChange(shift) {

    const span = this.state.xAxisViewableColumns;
    const labelsArray = this.state[(this.state.activeVis + 'Data')].labels;

    if(!labelsArray || labelsArray.length < span) { 
      return;
    }

    const groupedLabelsLength = Math.floor(labelsArray.length / this.state.monthsInGroup);

    const xAxisMax = Math.max(groupedLabelsLength - span, 0);
    const currentPosition = this.state.xAxisStart;
    const offset = Math.ceil(6 / this.state.monthsInGroup);

    if (shift === 'left') {
      const newPosition = Math.max(currentPosition - offset, 0);
      this.setState({
          xAxisStart: newPosition
        });
    }

    if (shift === 'right') {
      const newPosition = Math.min(currentPosition + offset, xAxisMax);
      this.setState({
          xAxisStart: newPosition
        });
    }

    if (shift === 'reset') {
      this.setState({
          xAxisStart: xAxisMax
        });
    }

  }

  handleVisChange(selectedVis) {
    this.setState({
      activeVis: selectedVis
    });
  }

  /** Changes viewing timespan to be by 'year', 'quarter', or 'month' */
  handleTimeSpanChange(selectedTimeSpan) {
    var monthsInGroup = (selectedTimeSpan === 'quarter' ? 3 : selectedTimeSpan === 'year' ? 12 : 1)

    this.setState({
      activeTimeSpan: selectedTimeSpan,
      monthsInGroup: monthsInGroup
    });
  }

  /** Fetches data for Indicators component via 2 API calls and saves the raw data in state */
  fetchData(detailAddr) {
      APIClient.getSaleHistory(detailAddr.bbl)
        .then(results => this.setState({ saleHistory: results.result }))
        .catch(err => {window.Rollbar.error("API error on Indicators: Sale History", err, detailAddr.bbl);}
      );

      APIClient.getIndicatorHistory(detailAddr.bbl)
        .then(results => this.setState({ indicatorHistory: results.result }))
        .catch(err => {window.Rollbar.error("API error on Indicators: Indicator History", err, detailAddr.bbl);}
      );

      this.setState({
        currentAddr: detailAddr
      });
  }

  /** Reorganizes raw data from API call and then returns an object that matches the data stucture in state  */
  createVizData(rawJSON, vizType) {

    // Generate object to hold data for viz
    // Note: keys in "values" object need to match exact key names in data from API call
    var vizData = Object.assign({},initialState[(vizType + 'Data')]);
    
    vizData.labels = [];
    for (const column in vizData.values) {
      vizData.values[column] = [];
    }

    // Generate arrays of data for chart.js visualizations:
    // Default grouping is by MONTH

    const rawJSONLength = rawJSON.length;
     
    for (let i = 0; i < rawJSONLength; i++) {

      vizData.labels.push(rawJSON[i].month);

      for (const column in vizData.values) {
        const vizTypePlusColumn = vizType + '_' + column
        vizData.values[column].push(parseInt(rawJSON[i][vizTypePlusColumn]));
      }

    }
    return vizData;
  } 

  componentWillReceiveProps(nextProps) {

    // make the api call when we have a new detail address from the Address Page
    if(nextProps.detailAddr && nextProps.detailAddr.bbl && // will be receiving a detailAddr prop AND
        (!this.props.detailAddr || // either we don't have one now 
         (this.props.detailAddr && this.props.detailAddr.bbl && // OR we have a different one
          !Helpers.addrsAreEqual(this.props.detailAddr, nextProps.detailAddr)))) { 
      this.reset();
      this.fetchData(nextProps.detailAddr);
    }
  }

  componentDidUpdate(prevProps, prevState) {

    const indicatorList = this.state.indicatorList;

    // process viz data from incoming API calls: 
    
    if(this.state.indicatorHistory && !Helpers.jsonEqual(prevState.indicatorHistory, this.state.indicatorHistory)) {
     
      for (const indicator of indicatorList) {

        var inputData = this.createVizData(this.state.indicatorHistory, indicator);
        
        this.setState({
          [(indicator + 'Data')]: inputData
        });
      }
    }

    // reset chart positions when:
    // 1. default dataset loads or 
    // 2. when activeTimeSpan changes:

    if((!prevState[(this.state.defaultVis + 'Data')].labels && this.state[(this.state.defaultVis + 'Data')].labels) ||
    (prevState.activeTimeSpan !== this.state.activeTimeSpan)) {
      this.handleXAxisChange('reset');
    }

    // process sale history data when:
    // 1. default dataset loads or 
    // 2. when activeTimeSpan changes 

    if(this.state.saleHistory && 
        (!Helpers.jsonEqual(prevState.saleHistory, this.state.saleHistory) ||
        (prevState.activeTimeSpan !== this.state.activeTimeSpan))) {

      if (this.state.saleHistory.length > 0 && 
          (this.state.saleHistory[0].docdate || this.state.saleHistory[0].recordedfiled) &&
          this.state.saleHistory[0].documentid ) {
        
        var lastSaleDate = this.state.saleHistory[0].docdate || this.state.saleHistory[0].recordedfiled; 
        var lastSaleYear = lastSaleDate.slice(0,4);
        var lastSaleQuarter = lastSaleYear + '-Q' + Math.ceil(parseInt(lastSaleDate.slice(5,7)) / 3);
        var lastSaleMonth = lastSaleDate.slice(0,7);

        this.setState({
          lastSale: {
            date: lastSaleDate,
            label: (this.state.activeTimeSpan === 'year' ? lastSaleYear :
                    this.state.activeTimeSpan === 'quarter' ? lastSaleQuarter :
                    lastSaleMonth),
            documentid: this.state.saleHistory[0].documentid
          }
        });

      }

      else {
        this.setState({
          lastSale: initialState.lastSale
        });
      }

    }
  }

  render() {

  const boro = (this.props.detailAddr ? this.props.detailAddr.bbl.slice(0, 1) : null);
  const block = (this.props.detailAddr ? this.props.detailAddr.bbl.slice(1, 6) : null);
  const lot = (this.props.detailAddr ? this.props.detailAddr.bbl.slice(6, 10) : null);
  const housenumber = (this.props.detailAddr ? this.props.detailAddr.housenumber : null);
  const streetname = (this.props.detailAddr ? this.props.detailAddr.streetname : null);

  const indicatorData = this.state.activeVis + 'Data'; 
  const xAxisLength = (this.state[indicatorData].labels ? Math.floor(this.state[indicatorData].labels.length / this.state.monthsInGroup) : 0);
  const indicatorDataTotal = (this.state[indicatorData].values.total ? (this.state[indicatorData].values.total).reduce((total, sum) => (total + sum)) : null);
  
    return (
      <div className="Page Indicators">
        <div className="Indicators__content Page__content">
          { !(this.props.isVisible && 
              this.state.saleHistory && this.state.indicatorHistory &&
              this.state[this.state.defaultVis + 'Data'].labels) ? 
            (
              <Loader loading={true} classNames="Loader-map">Loading</Loader>
            ) : 
          (
            <div className="columns">
              <div className="column col-8 col-lg-12">

                <div className="title-card">
                  <h4 className="title">{(this.props.detailAddr ? 
                        <span>BUILDING: <b>{this.props.detailAddr.housenumber} {Helpers.titleCase(this.props.detailAddr.streetname)}, {Helpers.titleCase(this.props.detailAddr.boro)}</b></span> :
                        <span></span>)}
                  </h4>
                  <br/>
                  <button onClick={() => this.props.onBackToOverview(this.props.detailAddr)}>Back to Overview</button>
                </div>

                <div className="Indicators__links">
                  <div className="Indicators__linksContainer">
                    <em className="Indicators__linksTitle">Select a Dataset:</em> <br/>
                    {/** Generates a data selection button for every dataset listed in indicatorList */}
                    {(this.state.indicatorList).map(
                      (indicator,i) => 
                        <li className="menu-item" key={i}>
                          <label className={"form-radio" + (this.state.activeVis === indicator ? " active" : "")} onClick={() => {window.gtag('event', (indicator + '-timeline-tab'));}}>
                            <input type="radio" 
                              checked={(this.state.activeVis === indicator ? true : false)}
                              onChange={() => this.handleVisChange(indicator)} />
                            <i className="form-icon"></i> {this.state[indicator + 'Data'].text.title}
                          </label>
                        </li>
                    )}
                  </div>
                  <div className="Indicators__linksContainer">
                    <em className="Indicators__linksTitle">View by:</em> <br/>
                    {/** Generates a time span selection button for every time span listed in timeSpanList */}
                    {(this.state.timeSpanList).map(
                      (timeSpan, i) => 
                        <li className="menu-item" key={i}>
                          <label className={"form-radio" + (this.state.activeTimeSpan === timeSpan ? " active" : "")} onClick={() => {window.gtag('event', (timeSpan + '-timeline-tab'));}}>
                            <input type="radio" 
                              checked={(this.state.activeTimeSpan === timeSpan ? true : false)}
                              onChange={() => this.handleTimeSpanChange(timeSpan)} />
                            <i className="form-icon"></i> {Helpers.capitalize(timeSpan)}
                          </label>
                        </li>
                    )}
                  </div>
                </div>  

                <span className="title viz-title"> 
                  { indicatorDataTotal + ' ' + (this.state[indicatorData].text.title).slice(0,-1) + 
                    Helpers.pluralize(indicatorDataTotal) + ' ' + this.state[indicatorData].text.titleSuffix}
                </span>

                <div className="Indicators__viz">
                  <button className={(this.state.xAxisStart === 0 || this.state.activeTimeSpan === 'year' ? 
                    "btn btn-off btn-axis-shift" : "btn btn-axis-shift")}
                    onClick={() => {this.handleXAxisChange("left"); window.gtag('event', 'graph-back-button');}}>‹</button>
                  <IndicatorsViz {...this.state} />
                  <button className={(this.state.xAxisStart + this.state.xAxisViewableColumns >= xAxisLength || this.state.activeTimeSpan === 'year'? 
                    "btn btn-off btn-axis-shift" : "btn btn-axis-shift")}
                    onClick={() => this.handleXAxisChange("right")}>›</button>
                </div> 

                <div className="Indicators__feedback hide-lg">
                  <i>Have thoughts about this page?</i> 
                  <nobr><a href="https://airtable.com/shrZ9uL3id6oWEn8T" target="_blank" rel="noopener noreferrer">Send us feedback!</a></nobr>
                </div>

              </div>
              <div className="column column-context col-4 col-lg-12">
                
                <div className="card">
                  <div className="card-header">
                    <div className="card-title h5">What are {this.state[indicatorData].text.title}?</div>
                    <div className="card-subtitle text-gray"></div>
                  </div>
                  <div className="card-body">
                    <IndicatorsDescription activeVis={this.state.activeVis} />
                  </div>
                </div>

                <div className="card card-links">
                  <div className="card-body card-body-links">
                    <h6>Official building pages</h6>
                    <div className="columns">
                      <div className="column col-12">
                        <a onClick={() => {window.gtag('event', 'acris-timeline-tab');}} 
                           href={`http://a836-acris.nyc.gov/bblsearch/bblsearch.asp?borough=${boro}&block=${block}&lot=${lot}`} target="_blank" rel="noopener noreferrer" 
                           className="btn btn-block">View documents on ACRIS &#8599;&#xFE0E;</a>
                      </div>
                      <div className="column col-12">
                        <a onClick={() => {window.gtag('event', 'hpd-timeline-tab');}} 
                           href={(housenumber && streetname ? `https://hpdonline.hpdnyc.org/HPDonline/Provide_address.aspx?p1=${boro}&p2=${housenumber}&p3=${streetname}&SearchButton=Search` : `https://hpdonline.hpdnyc.org/HPDonline/provide_address.aspx`)} target="_blank" rel="noopener noreferrer" 
                           className="btn btn-block">HPD Building Profile &#8599;&#xFE0E;</a>
                      </div>
                      <div className="column col-12">
                        <a onClick={() => {window.gtag('event', 'dob-timeline-tab');}} 
                           href={`http://a810-bisweb.nyc.gov/bisweb/PropertyProfileOverviewServlet?boro=${boro}&block=${block}&lot=${lot}`} target="_blank" rel="noopener noreferrer" 
                           className="btn btn-block">DOB Building Profile &#8599;&#xFE0E;</a>
                      </div>
                      <div className="column col-12">
                        <a onClick={() => {window.gtag('event', 'dof-timeline-tab');}} 
                           href={`https://nycprop.nyc.gov/nycproperty/nynav/jsp/selectbbl.jsp`} target="_blank" rel="noopener noreferrer" 
                           className="btn btn-block">DOF Property Tax Bills &#8599;&#xFE0E;</a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="Indicators__feedback show-lg">
                  <i>Have thoughts about this page?</i> 
                  <nobr><a href="https://airtable.com/shrZ9uL3id6oWEn8T" target="_blank" rel="noopener noreferrer">Send us feedback!</a></nobr>
                </div>

              </div>

            </div>
            )
          }
        </div>
        <LegalFooter position="inside" />
      </div>
    );
  }
}