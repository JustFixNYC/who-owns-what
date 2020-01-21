import React, { Component } from 'react';

import Helpers from 'util/helpers';

import IndicatorsViz from 'components/IndicatorsViz';
import Loader from 'components/Loader';
import LegalFooter from 'components/LegalFooter';
import APIClient from 'components/APIClient';
import { withI18n } from '@lingui/react';
import { Trans } from '@lingui/macro';

import 'styles/Indicators.css';
import { IndicatorsDatasetRadio, INDICATORS_DATASETS } from './IndicatorsDatasets';


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
        }
      },

      complaintsData: {
        labels: null,
        values: {
          emergency: null,
          nonemergency: null,
          total: null
        }
      },

      permitsData: {
        labels: null,
        values: {
          total: null
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

class IndicatorsWithoutI18n extends Component {
  constructor(props) {
    super(props);
    this.state = initialState;
    this.handleVisChange = this.handleVisChange.bind(this);
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

  UNSAFE_componentWillReceiveProps(nextProps) {

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
  
  const i18n = this.props.i18n;
  const detailAddrStr = this.props.detailAddr && `${this.props.detailAddr.housenumber} ${Helpers.titleCase(this.props.detailAddr.streetname)}, ${Helpers.titleCase(this.props.detailAddr.boro)}`;
  
  const dataset = INDICATORS_DATASETS[this.state.activeVis];

    return (
      <div className="Page Indicators">
        <div className="Indicators__content Page__content">
          { !(this.props.isVisible && 
              this.state.saleHistory && this.state.indicatorHistory &&
              this.state[this.state.defaultVis + 'Data'].labels) ? 
            (
              <Loader loading={true} classNames="Loader-map"><Trans>Loading</Trans></Loader>
            ) : 
          (
            <div className="columns">
              <div className="column col-8 col-lg-12">

                <div className="title-card">
                  <h4 className="title">{(this.props.detailAddr ? 
                    <span><Trans>BUILDING</Trans>: <b>{detailAddrStr}</b></span> :
                        <span></span>)}
                  </h4>
                  <br/>
                  <button onClick={() => this.props.onBackToOverview(this.props.detailAddr)}><Trans>Back to Overview</Trans></button>
                </div>

                <div className="Indicators__links">
                  <div className="Indicators__linksContainer">
                    <em className="Indicators__linksTitle"><Trans>Select a Dataset</Trans>:</em> <br/>
                    <IndicatorsDatasetRadio id="complaints" activeId={this.state.activeVis} onChange={this.handleVisChange} />
                    <IndicatorsDatasetRadio id="viols" activeId={this.state.activeVis} onChange={this.handleVisChange} />
                    <IndicatorsDatasetRadio id="permits" activeId={this.state.activeVis} onChange={this.handleVisChange} />
                  </div>
                  <div className="Indicators__linksContainer">
                    <em className="Indicators__linksTitle">View by:</em> <br/>
                    <li className="menu-item">
                        <label className={"form-radio" + (this.state.activeTimeSpan === "month" ? " active" : "")} onClick={() => {window.gtag('event', 'month-timeline-tab');}}>
                          <input type="radio"
                            name="Time" 
                            checked={(this.state.activeTimeSpan === "month" ? true : false)}
                            onChange={() => this.handleTimeSpanChange("month")} />
                          <i className="form-icon"></i> <Trans>Month</Trans>
                        </label>
                    </li>
                    <li className="menu-item">
                        <label className={"form-radio" + (this.state.activeTimeSpan === "quarter" ? " active" : "")} onClick={() => {window.gtag('event', 'quarter-timeline-tab');}}>
                          <input type="radio"
                            name= "Time" 
                            checked={(this.state.activeTimeSpan === "quarter" ? true : false)}
                            onChange={() => this.handleTimeSpanChange("quarter")} />
                          <i className="form-icon"></i> <Trans>Quarter</Trans>
                        </label>
                    </li>
                    <li className="menu-item">
                        <label className={"form-radio" + (this.state.activeTimeSpan === "year" ? " active" : "")} onClick={() => {window.gtag('event', 'year-timeline-tab');}}>
                          <input type="radio"
                            name="Time" 
                            checked={(this.state.activeTimeSpan === "year" ? true : false)}
                            onChange={() => this.handleTimeSpanChange("year")} />
                          <i className="form-icon"></i> <Trans>Year</Trans>
                        </label>
                    </li>
                  </div>
                </div>  

                <span className="title viz-title"> 
                  {dataset && dataset.quantity(i18n, indicatorDataTotal)}
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
                  <Trans render="i">Have thoughts about this page?</Trans> 
                  <nobr><a href="https://airtable.com/shrZ9uL3id6oWEn8T" target="_blank" rel="noopener noreferrer"><Trans>Send us feedback!</Trans></a></nobr>
                </div>

              </div>
              <div className="column column-context col-4 col-lg-12">
                
                <div className="card">
                  <div className="card-header">
                    <div className="card-title h5">What are {dataset && dataset.name(i18n)}?</div>
                    <div className="card-subtitle text-gray"></div>
                  </div>
                  <div className="card-body">
                    {dataset && dataset.explanation(i18n)}
                  </div>
                </div>

                <div className="card card-links">
                  <div className="card-body card-body-links">
                    <Trans render="h6">Official building pages</Trans>
                    <div className="columns">
                      <div className="column col-12">
                        <a onClick={() => {window.gtag('event', 'acris-timeline-tab');}} 
                           href={`http://a836-acris.nyc.gov/bblsearch/bblsearch.asp?borough=${boro}&block=${block}&lot=${lot}`} target="_blank" rel="noopener noreferrer" 
                           className="btn btn-block"><Trans>View documents on ACRIS</Trans> &#8599;&#xFE0E;</a>
                      </div>
                      <div className="column col-12">
                        <a onClick={() => {window.gtag('event', 'hpd-timeline-tab');}} 
                           href={(housenumber && streetname ? `https://hpdonline.hpdnyc.org/HPDonline/Provide_address.aspx?p1=${boro}&p2=${housenumber}&p3=${streetname}&SearchButton=Search` : `https://hpdonline.hpdnyc.org/HPDonline/provide_address.aspx`)} target="_blank" rel="noopener noreferrer" 
                           className="btn btn-block"><Trans>HPD Building Profile</Trans> &#8599;&#xFE0E;</a>
                      </div>
                      <div className="column col-12">
                        <a onClick={() => {window.gtag('event', 'dob-timeline-tab');}} 
                           href={`http://a810-bisweb.nyc.gov/bisweb/PropertyProfileOverviewServlet?boro=${boro}&block=${block}&lot=${lot}`} target="_blank" rel="noopener noreferrer" 
                           className="btn btn-block"><Trans>DOB Building Profile</Trans> &#8599;&#xFE0E;</a>
                      </div>
                      <div className="column col-12">
                        <a onClick={() => {window.gtag('event', 'dof-timeline-tab');}} 
                           href={`https://a836-pts-access.nyc.gov/care/search/commonsearch.aspx?mode=persprop`} target="_blank" rel="noopener noreferrer" 
                           className="btn btn-block"><Trans>DOF Property Tax Bills</Trans> &#8599;&#xFE0E;</a>
                      </div>
                      <div className="column col-12">
                          <a onClick={() => {window.gtag('event', 'dap-timeline-tab');}} href={`https://portal.displacementalert.org/property/${boro}${block}${lot}`} target="_blank" rel="noopener noreferrer" className="btn btn-block"><span className="chip text-italic"><Trans>New!</Trans></span> <Trans>ANHD DAP Portal</Trans> &#8599;&#xFE0E;</a>
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

const Indicators = withI18n()(IndicatorsWithoutI18n);
export default Indicators;