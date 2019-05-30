import React, { Component } from 'react';
import { Bar } from 'react-chartjs-2';
// reference: https://github.com/jerairrest/react-chartjs-2

import * as ChartAnnotation from 'chartjs-plugin-annotation';
// reference: https://github.com/chartjs/chartjs-plugin-annotation
// why we're using this import format: https://stackoverflow.com/questions/51664741/chartjs-plugin-annotations-not-displayed-in-angular-5/53071497#53071497

import Helpers from 'util/helpers';

import 'styles/Indicators.css';

export default class IndicatorsViz extends Component {

  getDataMaximum() {

    var indicatorDataLabels = this.props.indicatorList.map(x => x + 'Data');
    var dataMaximums = indicatorDataLabels.map( 
      indicatorData => (this.props[indicatorData].values.total ? 
                        Helpers.maxArray(this.props[indicatorData].values.total) :
                        0)
    );

    return Helpers.maxArray(dataMaximums);

  }

  render() {

  // Set configurables for active vis

  var datasets;

  switch (this.props.activeVis) {
    case 'viols': 
      datasets = 
        [{
            label: 'Class A',
            data: this.props.violsData.values.class_a,
            backgroundColor: 'rgba(191,211,230, 0.6)',
            borderColor: 'rgba(191,211,230,1)',
            borderWidth: 1
        },
        {
            label: 'Class B',
            data: this.props.violsData.values.class_b,
            backgroundColor: 'rgba(140,150,198, 0.6)',
            borderColor: 'rgba(140,150,198,1)',
            borderWidth: 1
        },
        {
            label: 'Class C',
            data: this.props.violsData.values.class_c,
            backgroundColor: 'rgba(136,65,157, 0.6)',
            borderColor: 'rgba(136,65,157,1)',
            borderWidth: 1
        }];
      break;
    case 'complaints':
      datasets = 
        [{
            label: 'Non-Emergency',
            data: this.props.complaintsData.values.nonemergency,
            backgroundColor: 'rgba(254,232,200, 0.6)',
            borderColor: 'rgba(254,232,200,1)',
            borderWidth: 1
        },
        {
            label: 'Emergency',
            data: this.props.complaintsData.values.emergency,
            backgroundColor: 'rgba(227,74,51, 0.6)',
            borderColor: 'rgba(227,74,51,1)',
            borderWidth: 1
        }];
      break;
    case 'permits':
      datasets = 
        [{
            label: 'Building Permits Filed',
            data: this.props.permitsData.values.total,
            backgroundColor: 'rgba(73, 192, 179, 0.6)',
            borderColor: 'rgb(73, 192, 179)',
            borderWidth: 1
        }];
      break;
    default: break;
  }

  // Create "data" and "options" objects for rendering visualization

  var indicatorData = this.props.activeVis + 'Data';
  var data = {
        labels: this.props[indicatorData].labels, 
        datasets: datasets
  };

  var labelPosition;
  var dateLocation = 'current'; 

  if (data.labels && data.labels.length > 10) {

    if (!this.props.lastSale.quarter || this.props.lastSale.quarter < data.labels[this.props.xAxisStart]) {
      labelPosition = data.labels[this.props.xAxisStart];
      dateLocation = 'past'; 
    }
    else if (this.props.lastSale.quarter > data.labels[this.props.xAxisStart + this.props.xAxisSpan - 1]) {
      labelPosition = data.labels[this.props.xAxisStart + this.props.xAxisSpan - 1];
      dateLocation = 'future'; 
    }
    else {
      labelPosition = this.props.lastSale.quarter;
    }

  }

  var dataMaximum = this.getDataMaximum();

  var options = {
      scales: {
        yAxes: [{
            ticks: {
                beginAtZero: true,
                suggestedMax: (this.props.activeVis === 'permits' ?
                              Math.max(12, Helpers.maxArray(this.props.permitsData.values.total) * 1.25) :
                              Math.max(12, dataMaximum * 1.25))
            },
            stacked: true
        }],
        xAxes: [{
            ticks: {
                min: (data.labels ? data.labels[this.props.xAxisStart] : null),
                max: (data.labels ? data.labels[this.props.xAxisStart + 19] : null),
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
        mode: 'label',
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
          },
          footer: function(tooltipItem, data) {

            var total = 0;

            var i; 
            for (i = 0; i < tooltipItem.length; i++) {
              total += parseInt(tooltipItem[i].value);
            }
            return "Total: " + total;
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
          if (legendItem) {
            legendItem.lineWidth = 3;
            this.chart.render({duration: 0});
            event.srcElement.style.cursor = 'pointer';
          }

        },
        onLeave: function (event, legendItem) {
          if (legendItem) {
            legendItem.lineWidth = 1;
            this.chart.render({duration: 0});
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
                    content: (this.props.lastSale.date ? "Sold to Current Owner" : "Last Sale Unknown"),
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
          (this.props.lastSale.date ? 
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
                              Helpers.formatDate(this.props.lastSale.date) +
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
          ),
        (this.props.activeVis === 'complaints' ? 
            {
                drawTime: "beforeDatasetsDraw",
                // id: "hline",
                type: "line",
                mode: "vertical",
                scaleID: "x-axis-0",
                value: "2012 Q1",
                borderColor: "rgba(0,0,0,0)",
                borderWidth: 0,
                label: {
                    content: "No data available for this time period",
                    fontFamily: "Inconsolata, monospace",
                    fontColor: "#e85600",
                    fontSize: 12,
                    xPadding: 10,
                    yPadding: 10,
                    backgroundColor: "rgba(0,0,0,0)",
                    position: "top",
                    xAdjust: 0,
                    yAdjust: 105,
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
      <div className="Indicators__chart">
        <Bar data={data} options={options} plugins={[ChartAnnotation]} width={100} height={300} />
      </div>
    );
  }
}