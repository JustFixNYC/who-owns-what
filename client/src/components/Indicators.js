import React, { Component } from 'react';
import { Bar } from 'react-chartjs-2';
// reference: https://github.com/jerairrest/react-chartjs-2

import 'chartjs-plugin-annotation';
// reference: https://github.com/chartjs/chartjs-plugin-annotation

import Helpers from 'util/helpers';

import Loader from 'components/Loader';
import LegalFooter from 'components/LegalFooter';
import APIClient from 'components/APIClient';

import 'styles/PropertiesSummary.css';

export default class Indicators extends Component {
  constructor(props) {
    super(props);

    this.state = { 
      saleHistory: null,
      lastSale: {
        date: null,
        quarter: null 
      },
      violsHistory: null,
      violsData: {
        classA: null,
        classB: null,
        classC: null,
        labels: null
      },
      complaintsHistory: null,
      complaintsData: {
        emergency: null,
        nonemergency: null,
        labels: null
      },
      activeVis: 'viols'
    };
  }

  // componentDidMount() {
  //
  //   APIClient.getAggregate(this.props.userAddr.bbl)
  //     .then(results => {
  //       console.log(results.result[0]);
  //       this.setState({ agg: results[0] });
  //     })
  //     .catch(err => console.error(err));
  //
  // }

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

  createViolsData(rawJSON) {

    var violsData = {
      classA: [],
      classB: [],
      classC: [],
      labels: []
    };

    // Note: "starting year" needs to match starting year in SQL query data
    violsData.labels = this.createLabels(2010);

    // Generate array of bar chart values:
    const violsHistory = rawJSON;
    const violsArrayLength = violsHistory.length;

    var i;
    var j = 0;

    for (i = 0; i < violsData.labels.length; i++) {
      if (j < violsArrayLength && violsData.labels[i] === violsHistory[j].quarter) {
        violsData.classA.push(parseInt(violsHistory[j].class_a));
        violsData.classB.push(parseInt(violsHistory[j].class_b));
        violsData.classC.push(parseInt(violsHistory[j].class_c));
        j++;
      }
      else {
        violsData.classA.push(0);
        violsData.classB.push(0);
        violsData.classC.push(0);
      }
    }

    return violsData;

  }

  createComplaintsData(rawJSON) {

    var complaintsData = {
      emergency: [],
      nonemergency: [],
      labels: []
    };

    // Note: "starting year" needs to match starting year in SQL query data
    complaintsData.labels = this.createLabels(2014);

    // Generate array of bar chart values:
    const complaintsHistory = rawJSON;
    const complaintsArrayLength = complaintsHistory.length;

    var i;
    var j = 0;

    for (i = 0; i < complaintsData.labels.length; i++) {
      if (j < complaintsArrayLength && complaintsData.labels[i] === complaintsHistory[j].quarter) {
        complaintsData.emergency.push(parseInt(complaintsHistory[j].emergency));
        complaintsData.nonemergency.push(parseInt(complaintsHistory[j].nonemergency));
        j++;
      }
      else {
        complaintsData.emergency.push(0);
        complaintsData.nonemergency.push(0);
      }
    }

    return complaintsData;

  }



  componentWillReceiveProps(nextProps) {

    // make the api call when we come into view and have
    // the user addrs bbl
    if(nextProps.isVisible && this.props.userAddr && !this.state.saleHistory) {
      APIClient.getSaleHistory(this.props.userAddr.bbl)
        .then(results => this.setState({ saleHistory: results.result }))
        .catch(err => console.error(err));
      if(!this.state.violsHistory) {
        APIClient.getViolsHistory(this.props.userAddr.bbl)
          .then(results => this.setState({ violsHistory: results.result }))
          .catch(err => console.error(err));
      }
      if(!this.state.complaintsHistory) {
        APIClient.getComplaintsHistory(this.props.userAddr.bbl)
          .then(results => this.setState({ complaintsHistory: results.result }))
          .catch(err => console.error(err));
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {

    if(this.state.violsHistory && !Helpers.jsonEqual(prevState.violsHistory, this.state.violsHistory)) {

      var violsData = this.createViolsData(this.state.violsHistory);

      this.setState({
          violsData: violsData
      });

    }

    if(this.state.complaintsHistory && !Helpers.jsonEqual(prevState.complaintsHistory, this.state.complaintsHistory)) {

      // Note: "starting year" needs to match starting year in SQL query data
      var complaintsData = this.createComplaintsData(this.state.complaintsHistory);

      this.setState({
          complaintsData: complaintsData
      });

    }

    if(this.state.saleHistory && !Helpers.jsonEqual(prevState.saleHistory, this.state.saleHistory)) {
      if (this.state.saleHistory.length > 0 && (this.state.saleHistory[0].docdate || this.state.saleHistory[0].recordedfiled)) {
        
        var lastSaleDate = this.state.saleHistory[0].docdate || this.state.saleHistory[0].recordedfiled; 
        var lastSaleYear = lastSaleDate.slice(0,4);
        var lastSaleQuarter = Math.ceil(parseInt(lastSaleDate.slice(5,7)) / 3);

        this.setState({
          lastSale: {
            date: lastSaleDate,
            quarter: lastSaleYear.concat(" Q",lastSaleQuarter)
          }
        });
      }

      else {
        this.setState({
          lastSale: {
            date: null,
            quarter: null
          }
        });
      }

    }
  }

  render() {

  // 
  // 

  var data = {
        labels: (this.state.activeVis === 'complaints' ? 
                  this.state.complaintsData.labels : 
                  this.state.violsData.labels),
        datasets: 
          (this.state.activeVis === 'complaints' ? 
            [{
                label: 'Non-Emergency',
                data: this.state.complaintsData.nonemergency,
                backgroundColor: 'rgba(140,150,198, 0.6)',
                borderColor: 'rgba(140,150,198,1)',
                borderWidth: 1
            },
            {
                label: 'Emergency',
                data: this.state.complaintsData.emergency,
                backgroundColor: 'rgba(191,211,230, 0.6)',
                borderColor: 'rgba(191,211,230,1)',
                borderWidth: 1
            }] 
            : 
            [{
                label: 'Class A',
                data: this.state.violsData.classA,
                backgroundColor: 'rgba(191,211,230, 0.6)',
                borderColor: 'rgba(191,211,230,1)',
                borderWidth: 1
            },
            {
                label: 'Class B',
                data: this.state.violsData.classB,
                backgroundColor: 'rgba(140,150,198, 0.6)',
                borderColor: 'rgba(140,150,198,1)',
                borderWidth: 1
            },
            {
                label: 'Class C',
                data: this.state.violsData.classC,
                backgroundColor: 'rgba(136,65,157, 0.6)',
                borderColor: 'rgba(136,65,157,1)',
                borderWidth: 1
            }] 
          )
    };

  var options = {
      scales: {
        yAxes: [{
            ticks: {
                beginAtZero: true,
                suggestedMax: 15
            },
            stacked: true
        }],
        xAxes: [{
            ticks: {
                beginAtZero: true,
                suggestedMax: 15
            },
            stacked: true
        }]
      },
      title: {
        display: true,
        fontSize: 20,
        fontFamily: "Inconsolata, monospace",
        fontColor: "rgb(69, 77, 93)",
        text: [
          (this.props.userAddr ? 
            this.props.userAddr.housenumber + " "  +
            this.props.userAddr.streetname + ", " + 
            this.props.userAddr.boro 
            : ""),
          'HPD ' + 
          (this.state.activeVis === 'complaints' ?
          'Complaints' : 'Violations') +
          ' Issued Over Time']
      },
      legend: {
        labels: {
          fontFamily: "Inconsolata, monospace",
          fontColor: "rgb(69, 77, 93)"
        }
      },
      annotation: {
        annotations: 
        [
            {
                // drawTime: "afterDatasetsDraw",
                // id: "hline",
                type: "line",
                mode: "vertical",
                scaleID: "x-axis-0",
                value: this.state.lastSale.quarter,
                borderColor: "rgb(69, 77, 93)",
                borderWidth: 2,
                label: {
                    content: "Sold to Current Owner",
                    fontFamily: "Inconsolata, monospace",
                    fontColor: "#fff",
                    fontSize: 12,
                    xPadding: 10,
                    yPadding: 10,
                    backgroundColor: "rgb(69, 77, 93)",
                    position: "top",
                    yAdjust: 25,
                    enabled: true
                }
            }
        ],
        drawTime: "afterDraw" // (default)
      },
      maintainAspectRatio: false
  }; 

    return (
      <div className="Page PropertiesSummary">
        <div className="PropertiesSummary__content Page__content">
          { !this.state.saleHistory || !this.state.violsHistory ? (
              <Loader loading={true} classNames="Loader-map">Loading</Loader>
            ) : 
          (
            <div>
              <Bar data={data} options={options} width={100} height={450} />
              <p> Sold to Current Owner on {this.formatDate(this.state.lastSale.date) || "unknown date"}. </p>
            </div>
            )
          }
        </div>
        <LegalFooter position="inside" />
      </div>
    );
  }
}