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
      lastSale: null,
      violsHistory: null,
      violsData: {
        classA: null,
        classB: null,
        classC: null,
        labels: null
      } 
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

  createViolsData(rawJSON, startingYear) {

    const currentYear = parseInt(new Date().getFullYear());
    const currentMonth = parseInt(new Date().getMonth());

    var violsData = {
      classA: [],
      classB: [],
      classC: [],
      labels: []
    };
    
    // Generate array of labels:
    var yr, qtr;
    for (yr = startingYear; yr <= currentYear; yr++) {
      if (yr === currentYear) {
        for (qtr = 1; qtr < currentMonth/3; qtr++) {
          violsData.labels.push((yr.toString()).concat(" Q",qtr.toString()));
        }
      }
      else {
        for (qtr = 1; qtr < 5; qtr++) {
          violsData.labels.push((yr.toString()).concat(" Q",qtr.toString()));
        }
      }
    }

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
    }
  }

  componentDidUpdate(prevProps, prevState) {

    if(this.state.violsHistory && !Helpers.jsonEqual(prevState.violsHistory, this.state.violsHistory)) {

      // Note: "starting year" needs to match starting year in SQL query data
      var violsData = this.createViolsData(this.state.violsHistory, 2010);

      this.setState({
          violsData: violsData
      });

    }

    if(this.state.saleHistory && !Helpers.jsonEqual(prevState.saleHistory, this.state.saleHistory)) {
      if (this.state.saleHistory.length > 0 && (this.state.saleHistory[0].docdate || this.state.saleHistory[0].recordedfiled)) {
        
        var lastSaleDate = this.state.saleHistory[0].docdate || this.state.saleHistory[0].recordedfiled; 
        var lastSaleYear = lastSaleDate.slice(0,4);
        var lastSaleQuarter = Math.ceil(parseInt(lastSaleDate.slice(5,7)) / 3);

        this.setState({
          lastSale: lastSaleYear.concat(" Q",lastSaleQuarter)
        });
      }

      else {
        this.setState({
          lastSale: null
        });
      }

    }
  }

  render() {

  // 
  // 

  var data = {
        labels: this.state.violsData.labels,
        datasets: [
          {
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
          }
        ]
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
          'HPD Violations Issued Over Time']
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
                value: this.state.lastSale,
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
            </div>
          )
          }
        </div>
        <LegalFooter position="inside" />
      </div>
    );
  }
}