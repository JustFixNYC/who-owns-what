import React, { Component } from 'react';
import RC2 from 'react-chartjs2';

import Loader from 'components/Loader';
import LegalFooter from 'components/LegalFooter';
import APIClient from 'components/APIClient';

import 'styles/PropertiesSummary.css';

export default class Indicators extends Component {
  constructor(props) {
    super(props);

    this.state = { saleHistory: null };
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
    }
  }

  render() {

    var data = {
        labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
        datasets: [{
            label: '# of Votes',
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
                'rgba(255,99,132,1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
        }]
    };

    var options = {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero:true
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