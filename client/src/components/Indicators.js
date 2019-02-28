import React, { Component } from 'react';
import RC2 from 'react-chartjs2';
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
      violsHistory: null,
      violsLabels: null,
      violsData: null 
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

    const currentYear = parseInt(new Date().getFullYear());
    const currentMonth = parseInt(new Date().getMonth());

    // Generate array of labels:
    var violsLabels = []; 
    
    var yr, qtr;
    for (yr = 2013; yr <= currentYear; yr++) {
      if (yr === currentYear) {
        for (qtr = 1; qtr < currentMonth/3; qtr++) {
          violsLabels.push((yr.toString()).concat(" Q",qtr.toString()));
        }
      }
      else {
        for (qtr = 1; qtr < 5; qtr++) {
          violsLabels.push((yr.toString()).concat(" Q",qtr.toString()));
        }
      }
    }

    const violsHistory = this.state.violsHistory;
    const violsArrayLength = violsHistory.length;


    // Generate array of bar chart values:
    var violsData = [];

    var i;
    var j = 0;

    for (i = 0; i < violsLabels.length; i++) {
      if (j < violsArrayLength && violsLabels[i] === violsHistory[j].quarter) {
        violsData.push(parseInt(violsHistory[j].total));
        j++;
      }
      else {
        violsData.push(0);
      }
    }

    this.setState({
        violsLabels: violsLabels,
        violsData: violsData
    });

    }
  }

  render() {

  var data = {
        labels: this.state.violsLabels,
        datasets: [{
            label: '# of HPD Violations',
            data: this.state.violsData,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255,99,132,1)',
            borderWidth: 1
        }]
    };

    var options = {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    suggestedMax: 15
                }
            }]
        }
    };


    return (
      <div className="Page PropertiesSummary">
        <div className="PropertiesSummary__content Page__content">
          { !this.state.saleHistory ? (
              <Loader loading={true} classNames="Loader-map">Loading</Loader>
            ) : 
          (
            <div>
              <RC2 data={data} options={options} type='bar' />
              <h3>Recent Sales:</h3> 
              <ul>
                {this.state.saleHistory && 
                  this.state.saleHistory.map((record, idx) => <li key={idx}>{record.recordedfiled}</li> )}
              </ul>
            </div>
          )
          }
        </div>
        <LegalFooter position="inside" />
      </div>
    );
  }
}