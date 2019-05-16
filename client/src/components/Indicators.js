import React, { Component } from 'react';
import { Bar } from 'react-chartjs-2';
// reference: https://github.com/jerairrest/react-chartjs-2

import * as ChartAnnotation from 'chartjs-plugin-annotation';
// reference: https://github.com/chartjs/chartjs-plugin-annotation
// why we're using this import format: https://stackoverflow.com/questions/51664741/chartjs-plugin-annotations-not-displayed-in-angular-5/53071497#53071497

import Helpers from 'util/helpers';

import Loader from 'components/Loader';
import LegalFooter from 'components/LegalFooter';
import APIClient from 'components/APIClient';

import 'styles/Indicators.css';

const initialState = { 

      saleHistory: null,
      lastSale: {
        date: null,
        quarter: null, 
        documentid: null 
      },

      violsHistory: null,
      violsData: {
        labels: null,
        values: {
          class_a: null,
          class_b: null,
          class_c: null,
          total: null
        }
      },

      complaintsHistory: null,
      complaintsData: {
        labels: null,
        values: {
          emergency: null,
          nonemergency: null,
          total: null
        }
      },

      permitsHistory: null,
      permitsData: {
        labels: null,
        values: {
          total: null
        }
      },

      activeVis: 'complaints',
      xAxisStart: 0,
      currentAddr: null

};

export default class Indicators extends Component {
  constructor(props) {
    super(props);

    this.indicatorList = ['complaints','viols','permits'];

    this.xAxisSpan = 20;

    this.state = initialState;

  }

  reset() {
    this.setState(initialState);
  }

  // componentDidMount() {
  //
  //   APIClient.getAggregate(this.props.detailAddr.bbl)
  //     .then(results => {
  //       console.log(results.result[0]);
  //       this.setState({ agg: results[0] });
  //     })
  //     .catch(err => console.error(err));
  //
  // }

  handleVisChange(selectedVis) {
    this.setState({
          activeVis: selectedVis
      });
  }

  handleXAxisChange(shift) {

    const span = this.xAxisSpan;

    const currentVisData = this.state.activeVis + 'Data';
    const labelsArray = this.state[currentVisData].labels;

    if(!labelsArray || labelsArray.length < span) { 
      return;
    }

    const xAxisMax = labelsArray.length - span;
    const currentPosition = this.state.xAxisStart;
    

    if (shift === 'left') {
      const newPosition = Math.max(currentPosition - 4, 0);
      this.setState({
          xAxisStart: newPosition
        });
    }

    if (shift === 'right') {
      const newPosition = Math.min(currentPosition + 4, xAxisMax);
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

  formatDate(dateString) {
    var date = new Date(dateString);
    var options = {year: 'numeric', month: 'long', day: 'numeric'};
    return date.toLocaleDateString("en-US", options);
  }

  createLabels(startingYear) {

    const currentYear = parseInt(new Date().getFullYear());
    const currentMonth = parseInt(new Date().getMonth());

    var labelsArray = [];

    var yr, qtr;
    for (yr = startingYear; yr <= currentYear; yr++) {
      if (yr === currentYear) {
        for (qtr = 1; qtr < currentMonth/3; qtr++) {
          labelsArray.push((yr.toString()).concat(" Q",qtr.toString()));
        }
      }
      else {
        for (qtr = 1; qtr < 5; qtr++) {
          labelsArray.push((yr.toString()).concat(" Q",qtr.toString()));
        }
      }
    }

    return labelsArray;

  }

  createVizData(rawJSON, vizType) {

    var vizData;

    // Generate object to hold data for viz
    // Note: keys in "values" object need to match exact key names in data from API call
    switch(vizType) {

      case 'viols':
        vizData = {
          values: {
            class_a: [],
            class_b: [],
            class_c: [],
            total: []
          },
          labels: []
        };
        vizData.labels = this.createLabels(2010);
        break;

      case 'complaints':
        vizData = {
          values: {
            emergency: [],
            nonemergency: [],
            total: []
          },
          labels: []
        }
        vizData.labels = this.createLabels(2010);
        break;

      case 'permits':
        vizData = {
          values: {
            total: []
          },
          labels: []
        }
        vizData.labels = this.createLabels(2010);
        break;

      default:
        break;
      }


      // Generate arrays of data for chart.js visualizations:

      const rawJSONLength = rawJSON.length;

      var i;
      var j = 0;

      for (i = 0; i < vizData.labels.length; i++) {
        if (j < rawJSONLength && vizData.labels[i] === rawJSON[j].quarter) {
          for (const column in vizData.values) {
            vizData.values[column].push(parseInt(rawJSON[j][column]));
          }
          j++;
        }
        else {
          for (const column in vizData.values) {
            vizData.values[column].push(0);
          }
        }
      } 

      return vizData;
  } 

  getDataMaximum() {

    var indicatorDataLabels = this.indicatorList.map(x => x + 'Data');
    var dataMaximums = indicatorDataLabels.map( 
      indicatorData => (this.state[indicatorData].values.total ? 
                        Helpers.maxArray(this.state[indicatorData].values.total) :
                        0)
    );

    return Helpers.maxArray(dataMaximums);

  }

  fetchData() {
      APIClient.getSaleHistory(this.props.detailAddr.bbl)
        .then(results => this.setState({ saleHistory: results.result }))
        .catch(err => console.error(err));

      const indicatorList = this.indicatorList.map(x => x + 'History');

      for (const indicator of indicatorList) {
        const APICall = 'get' + Helpers.capitalize(indicator); // i.e: 'getViolsHistory'
        APIClient[APICall](this.props.detailAddr.bbl)
          .then(results => this.setState({ [indicator]: results.result }))
          .catch(err => console.error(err));
        
      }

      this.setState({
        currentAddr: this.props.detailAddr
      });
  }

  componentWillReceiveProps(nextProps) {

    // make the api call when we come into view and have
    // the user addrs bbl
    if(nextProps.isVisible && this.props.detailAddr && 
        (!this.state.saleHistory ||
        (this.state.currentAddr && !Helpers.addrsAreEqual(this.props.detailAddr, this.state.currentAddr)))
      ) {
      this.fetchData();
    }

    if(this.props.isVisible && !nextProps.isVisible) {
      this.reset();
    }

    // if(nextProps.isVisible && this.props.detailAddr && this.state.currentAddr &&
    // !Helpers.addrsAreEqual(this.props.detailAddr, this.state.currentAddr)) {
    //   this.fetchData();
    // }
  }

  componentDidUpdate(prevProps, prevState) {

    const indicatorList = this.indicatorList;

    // process viz data from incoming API calls: 

    for (const indicator of indicatorList) {
      const indicatorHistory = indicator + 'History';
      const indicatorData = indicator + 'Data';

      if(this.state[indicatorHistory] && !Helpers.jsonEqual(prevState[indicatorHistory], this.state[indicatorHistory])) {

        var inputData = this.createVizData(this.state[indicatorHistory], indicator);
        
        this.setState({
          [indicatorData]: inputData
        });

      }
    }

    // reset chart positions when default dataset loads:

    if(!prevState.complaintsData.labels && this.state.complaintsData.labels) {
      this.handleXAxisChange('reset');
    }

    // process sale history data: 

    if(this.state.saleHistory && !Helpers.jsonEqual(prevState.saleHistory, this.state.saleHistory)) {

      if (this.state.saleHistory.length > 0 && 
          (this.state.saleHistory[0].docdate || this.state.saleHistory[0].recordedfiled) &&
          this.state.saleHistory[0].documentid ) {
        
        var lastSaleDate = this.state.saleHistory[0].docdate || this.state.saleHistory[0].recordedfiled; 
        var lastSaleYear = lastSaleDate.slice(0,4);
        var lastSaleQuarter = Math.ceil(parseInt(lastSaleDate.slice(5,7)) / 3);

        this.setState({
          lastSale: {
            date: lastSaleDate,
            quarter: lastSaleYear + ' Q' + lastSaleQuarter,
            documentid: this.state.saleHistory[0].documentid
          }
        });
      }

      else {
        this.setState({
          lastSale: {
            date: null,
            quarter: null,
            documentid: null
          }
        });
      }

    }
  }

  render() {

  // Set configurables for active vis
  var datasets;

  var boro = (this.props.detailAddr ? this.props.detailAddr.bbl.slice(0, 1) : null);
  var block = (this.props.detailAddr ? this.props.detailAddr.bbl.slice(1, 6) : null);
  var lot = (this.props.detailAddr ? this.props.detailAddr.bbl.slice(6, 10) : null);

  switch (this.state.activeVis) {
    case 'viols': 
      datasets = 
        [{
            label: 'Class A',
            data: this.state.violsData.values.class_a,
            backgroundColor: 'rgba(191,211,230, 0.6)',
            borderColor: 'rgba(191,211,230,1)',
            borderWidth: 1
        },
        {
            label: 'Class B',
            data: this.state.violsData.values.class_b,
            backgroundColor: 'rgba(140,150,198, 0.6)',
            borderColor: 'rgba(140,150,198,1)',
            borderWidth: 1
        },
        {
            label: 'Class C',
            data: this.state.violsData.values.class_c,
            backgroundColor: 'rgba(136,65,157, 0.6)',
            borderColor: 'rgba(136,65,157,1)',
            borderWidth: 1
        }];
      break;
    case 'complaints':
      datasets = 
        [{
            label: 'Non-Emergency',
            data: this.state.complaintsData.values.nonemergency,
            backgroundColor: 'rgba(254,232,200, 0.6)',
            borderColor: 'rgba(254,232,200,1)',
            borderWidth: 1
        },
        {
            label: 'Emergency',
            data: this.state.complaintsData.values.emergency,
            backgroundColor: 'rgba(227,74,51, 0.6)',
            borderColor: 'rgba(227,74,51,1)',
            borderWidth: 1
        }];
      break;
    case 'permits':
      datasets = 
        [{
            label: 'Building Permits Filed',
            data: this.state.permitsData.values.total,
            backgroundColor: 'rgba(73, 192, 179, 0.6)',
            borderColor: 'rgb(73, 192, 179)',
            borderWidth: 1
        }];
      break;
    default: break;
  }

  // Create "data" and "options" objects for rendering visualization

  var indicatorData = this.state.activeVis + 'Data';
  var data = {
        labels: this.state[indicatorData].labels, 
        datasets: datasets
  };

  var labelPosition;
  var dateLocation = 'current'; 

  if (data.labels && data.labels.length > 10) {

    if (!this.state.lastSale.quarter || this.state.lastSale.quarter < data.labels[this.state.xAxisStart]) {
      labelPosition = data.labels[this.state.xAxisStart];
      dateLocation = 'past'; 
    }
    else if (this.state.lastSale.quarter > data.labels[this.state.xAxisStart + this.xAxisSpan - 1]) {
      labelPosition = data.labels[this.state.xAxisStart + this.xAxisSpan - 1];
      dateLocation = 'future'; 
    }
    else {
      labelPosition = this.state.lastSale.quarter;
    }

  }

  var dataMaximum = this.getDataMaximum();

  var options = {
      scales: {
        yAxes: [{
            ticks: {
                beginAtZero: true,
                suggestedMax: (this.state.activeVis === 'permits' ?
                              Math.max(12, Helpers.maxArray(this.state.permitsData.values.total) * 1.25) :
                              Math.max(12, dataMaximum * 1.25))
            },
            stacked: true
        }],
        xAxes: [{
            ticks: {
                min: (data.labels ? data.labels[this.state.xAxisStart] : null),
                max: (data.labels ? data.labels[this.state.xAxisStart + 19] : null),
                // Only show labels for years
                callback: function(value, index, values) {
                  if (value.length === 7 && value.slice(-2) === 'Q1') {
                    const year = value.slice(0,4);
                    return year;
                  }
                  else {
                    return '';
                  }
                }
                        
            },
            stacked: true
        }]
      },
      // title: {
      //   display: true,
      //   fontSize: 20,
      //   fontFamily: "Inconsolata, monospace",
      //   fontColor: "rgb(69, 77, 93)",
      //   text: [
      //     (this.props.detailAddr ? 
      //       this.props.detailAddr.housenumber + " "  +
      //       this.props.detailAddr.streetname + ", " + 
      //       this.props.detailAddr.boro 
      //       : "")]
      // },
      tooltips: {
        callbacks: {
          title: function(tooltipItem) {

            const quarter = this._data.labels[tooltipItem[0].index].slice(-1);
            var monthRange;
            
            switch (quarter) {
              case "1":
                monthRange = "Jan - Mar";
                break;
              case "2":
                monthRange = "Apr - Jun";
                break;
              case "3": 
                monthRange = "Jul - Sep";
                break;
              case "4":
                monthRange = "Oct - Dec";
                break;
              default:
                monthRange = "";
            }

            return monthRange + " " + this._data.labels[tooltipItem[0].index].slice(0,4);
          }
        }
      },
      legend: {
        position: "top",
        labels: {
          fontFamily: "Inconsolata, monospace",
          fontColor: "rgb(69, 77, 93)"
        },
        onHover: function (event, legendItem) {
        // There is only a legendItem when your mouse is positioned over one
          if (legendItem) {
              event.srcElement.style.cursor = 'pointer';
          }
        }
      },
      annotation: {
        annotations: 
        [
            {
                drawTime: "beforeDatasetsDraw",
                // id: "hline",
                type: "line",
                mode: "vertical",
                scaleID: "x-axis-0",
                value: labelPosition,
                borderColor: (dateLocation === 'current' ? "rgb(69, 77, 93)" : "rgba(0,0,0,0)"),
                borderWidth: 2,
                label: {
                    content: (this.state.lastSale.date ? "Sold to Current Owner" : "Last Sale Unknown"),
                    fontFamily: "Inconsolata, monospace",
                    fontColor: "#fff",
                    fontSize: 12,
                    xPadding: 10,
                    yPadding: 10,
                    backgroundColor: "rgb(69, 77, 93)",
                    position: "top",
                    xAdjust: (dateLocation === 'past' ? -70 : dateLocation === 'future' ? 70 : 0),
                    yAdjust: 10,
                    enabled: true,
                    cornerRadius: 0
                }
            },
          (this.state.lastSale.date ? 
            {
                drawTime: "beforeDatasetsDraw",
                // id: "hline",
                type: "line",
                mode: "vertical",
                scaleID: "x-axis-0",
                value: labelPosition,
                borderColor: "rgba(0,0,0,0)",
                borderWidth: 0,
                label: {
                    content: (dateLocation === 'past' ? "← " : "") + 
                              this.formatDate(this.state.lastSale.date) +
                              (dateLocation === 'future' ? " →" : ""),
                    fontFamily: "Inconsolata, monospace",
                    fontColor: "#fff",
                    fontSize: 12,
                    xPadding: 10,
                    yPadding: 10,
                    backgroundColor: "rgb(69, 77, 93)",
                    position: "top",
                    xAdjust: (dateLocation === 'past' ? -70 : dateLocation === 'future' ? 70 : 0),
                    yAdjust: 30,
                    enabled: true,
                    cornerRadius: 0
                }
            } :
            {}
          )
        ],
        drawTime: "afterDraw" // (default)
      },
      maintainAspectRatio: false,
      onHover: function (event) {
        event.srcElement.style.cursor = 'default';
    }
  }; 

    return (
      <div className="Page Indicators">
        <div className="Indicators__content Page__content">
          { !(this.state.saleHistory && this.state.complaintsHistory) ? 
            (
              <Loader loading={true} classNames="Loader-map">Loading</Loader>
            ) : 
          (
            <div className="columns">
              <div className="column col-8 col-lg-12">
                <div className="title-card">
                  <h4 className="title">{(this.props.detailAddr ? 
                        <span>BUILDING: <b>{this.props.detailAddr.housenumber} {this.props.detailAddr.streetname}, {this.props.detailAddr.boro}</b></span> :
                        <span></span>)}
                  </h4>
                  <br/>
                  <button onClick={() => this.props.onBackToOverview(this.props.detailAddr)}>Back to Overview</button>
                </div>
                <span className="title viz-title"> 
                  {(this.state.activeVis === 'complaints' ? 'HPD Complaints since 2014' : 
                    this.state.activeVis === 'viols' ? 'HPD Violations since 2010' :
                    this.state.activeVis === 'permits' ? 'Building Permit Applications since 2010' :
                    '')}:
                </span>
                <div className="Indicators__viz">
                  <button className={(this.state.xAxisStart === 0 ? 
                    "btn btn-off btn-axis-shift" : "btn btn-axis-shift")}
                    onClick={() => this.handleXAxisChange("left")}>‹</button>
                  <div className="Indicators__chart">
                    <Bar data={data} options={options} plugins={[ChartAnnotation]} width={100} height={300} />
                  </div>
                  <button className={(data.labels && this.state.xAxisStart + this.xAxisSpan >= data.labels.length ? 
                    "btn btn-off btn-axis-shift" : "btn btn-axis-shift")}
                    onClick={() => this.handleXAxisChange("right")}>›</button>
                </div> 
                <div className="Indicators__links">
                  <em>Select a Dataset:</em>
                  <li className="menu-item">
                      <label className="form-radio">
                        <input type="radio" 
                          checked={(this.state.activeVis === "complaints" ? true : false)}
                          onChange={() => this.handleVisChange("complaints")} />
                        <i className="form-icon"></i> HPD Complaints
                      </label>
                  </li>
                  <li className="menu-item">
                      <label className="form-radio">
                        <input type="radio" 
                          checked={(this.state.activeVis === "viols" ? true : false)}
                          onChange={() => this.handleVisChange("viols")} />
                        <i className="form-icon"></i> HPD Violations
                      </label>
                  </li>
                  <li className="menu-item">
                      <label className="form-radio">
                        <input type="radio" 
                          checked={(this.state.activeVis === "permits" ? true : false)}
                          onChange={() => this.handleVisChange("permits")} />
                        <i className="form-icon"></i> Building Permit Applications
                      </label>
                  </li>
                </div>  
              </div>
              <div className="column column-context col-4 col-lg-12">
                <div className="card">
                  <div className="card-header">
                    <div className="card-title h5">What are 
                    {(this.state.activeVis === 'complaints' ? ' HPD Complaints' : 
                    this.state.activeVis === 'viols' ? ' HPD Violations' :
                    this.state.activeVis === 'permits' ? ' Building Permit Applications' :
                    '')}?</div>
                    <div className="card-subtitle text-gray"></div>
                  </div>
                  <div className="card-body">
                    {(this.state.activeVis === 'complaints' ? 
                      <span>HPD Complaints are housing issues reported to the City <b>by a tenant calling 311</b>.
                      When someone issues a complaint, the Department of Housing Preservation and Development begins a process of investigation that may lead to an official violation from the City. 
                      Read more about HPD Complaints and how to file them at the <a href='https://www1.nyc.gov/site/hpd/renters/complaints-and-inspections.page' target="_blank" rel="noopener noreferrer">official HPD page</a>.</span> : 
                    this.state.activeVis === 'viols' ? 
                      <span>HPD Violations occur when an official City Inspector finds the conditions of a home in violation of the law. 
                      If not corrected, these violations incur fines for the owner— however, HPD violations are notoriously unenforced by the City.
                      These Violations fall into three categories:<br/>
                        <br/>
                      <b>Class A</b> — non-hazardous<br/>
                      <b>Class B</b> — hazardous<br/>
                      <b>Class C</b> — immediately hazardous<br/>
                        <br/>
                      Read more about HPD Violations at the <a href='https://www1.nyc.gov/site/hpd/owners/compliance-maintenance-requirements.page' target="_blank" rel="noopener noreferrer">official HPD page</a>.</span> :
                    this.state.activeVis === 'permits' ? 
                      <span>Owners submit Building Permit Applications to the Department of Buildings before any construction project to get necessary approval.
                      The number of applications filed can indicate how much construction the owner was planning. 
                      Read more about DOB Building Applications/Permits at the <a href='https://www1.nyc.gov/site/buildings/about/building-applications-and-permits.page' target="_blank" rel="noopener noreferrer">official NYC Buildings page</a>.</span> :
                    '')}
                  </div>
                </div>
                <div className="card card-links">

                  <div className="card-body card-body-links">
                    <h6>Official building pages</h6>
                    <div className="columns">
                      <div className="column col-12">
                        <a href={`http://a836-acris.nyc.gov/bblsearch/bblsearch.asp?borough=${boro}&block=${block}&lot=${lot}`} target="_blank" rel="noopener noreferrer" className="btn btn-block">View documents on ACRIS &#8599;&#xFE0E;</a>
                      </div>
                      <div className="column col-12">
                        <a href={`https://hpdonline.hpdnyc.org/HPDonline/Provide_address.aspx?p1=${boro}&p2=${this.props.detailAddr.housenumber}&p3=${this.props.detailAddr.streetname}&SearchButton=Search`} target="_blank" rel="noopener noreferrer" className="btn btn-block">HPD Building Profile &#8599;&#xFE0E;</a>
                      </div>
                      <div className="column col-12">
                        <a href={`http://a810-bisweb.nyc.gov/bisweb/PropertyProfileOverviewServlet?boro=${boro}&block=${block}&lot=${lot}`} target="_blank" rel="noopener noreferrer" className="btn btn-block">DOB Building Profile &#8599;&#xFE0E;</a>
                      </div>
                      <div className="column col-12">
                        <a href={`https://nycprop.nyc.gov/nycproperty/nynav/jsp/selectbbl.jsp`} target="_blank" rel="noopener noreferrer" className="btn btn-block">DOF Property Tax Bills &#8599;&#xFE0E;</a>
                      </div>
                    </div>
                  </div>
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