import React, { Component } from 'react';
import { Bar } from 'react-chartjs-2';
// reference: https://github.com/jerairrest/react-chartjs-2

import * as ChartAnnotation from 'chartjs-plugin-annotation';
// reference: https://github.com/chartjs/chartjs-plugin-annotation
// why we're using this import format: https://stackoverflow.com/questions/51664741/chartjs-plugin-annotations-not-displayed-in-angular-5/53071497#53071497

import Helpers from 'util/helpers';
import Browser from 'util/browser';

import 'styles/Indicators.css';

export default class IndicatorsViz extends Component {

  constructor(props) {
    super(props);
    this.state = { 
      shouldRedraw: false 
    };
  }

  // Make Chart Redraw ONLY when the time span changes:
  componentWillReceiveProps(nextProps) { 
    if(nextProps.activeTimeSpan !== this.props.activeTimeSpan) {
      this.setState({shouldRedraw: true})
    } 
    else {
     this.setState({shouldRedraw: false})
    }
  }

  // Group raw data to match selected time span:
  groupLabels(labelsArray) {
    if (labelsArray && this.props.activeTimeSpan === 'quarter') {
      var labelsByQuarter = []; 
      for (let i = 2; i < labelsArray.length; i = i + 3) {
        var quarter = labelsArray[i].slice(0,4) + '-Q' + Math.ceil(parseInt(labelsArray[i].slice(-2)) / 3);
        labelsByQuarter.push(quarter); 
      }
      return labelsByQuarter;
    }

    else if (labelsArray && this.props.activeTimeSpan === 'year') {
      var labelsByYear = []; 
      for (let i = 11; i < labelsArray.length; i = i + 12) {
        var year = labelsArray[i].slice(0,4);
        labelsByYear.push(year); 
      }
      return labelsByYear;
    }

    else {
      return labelsArray;
    }
  }

  groupData(dataArray) {
    if (dataArray && this.props.activeTimeSpan === 'quarter') {
      var dataByQuarter = []; 
      for (let i = 2; i < dataArray.length; i = i + 3) {
        var sumQuarter = dataArray[i] + dataArray[i-1] + dataArray[i-2];
        dataByQuarter.push(sumQuarter); 
      }
      return dataByQuarter;
    }

    else if (dataArray && this.props.activeTimeSpan === 'year') {
      var dataByYear = []; 
      for (let i = 12; i < dataArray.length; i = i + 12) {
        var sumYear = (dataArray.slice(i - 12, i)).reduce( (total, sum) => (total + sum) );
        dataByYear.push(sumYear); 
      }
      return dataByYear;
    }

    else {
      return dataArray;
    }

  }

  getDataMaximum() {

    var indicatorDataLabels = this.props.indicatorList.map(x => x + 'Data');
    var dataMaximums = indicatorDataLabels.map( 
      indicatorData => (this.props[indicatorData].values.total ? 
                        Helpers.maxArray(this.groupData(this.props[indicatorData].values.total)) :
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
            label: 'Class C',
            data: this.groupData(this.props.violsData.values.class_c),
            backgroundColor: 'rgba(136,65,157, 0.6)',
            borderColor: 'rgba(136,65,157,1)',
            borderWidth: 1
        },
        {
            label: 'Class B',
            data: this.groupData(this.props.violsData.values.class_b),
            backgroundColor: 'rgba(140,150,198, 0.6)',
            borderColor: 'rgba(140,150,198,1)',
            borderWidth: 1
        },
        {
            label: 'Class A',
            data: this.groupData(this.props.violsData.values.class_a),
            backgroundColor: 'rgba(157, 194, 227, 0.6)',
            borderColor: 'rgba(157, 194, 227,1)',
            borderWidth: 1
        }];
      break;
    case 'complaints':
      datasets = 
        [{
            label: 'Emergency',
            data: this.groupData(this.props.complaintsData.values.emergency),
            backgroundColor: 'rgba(227,74,51, 0.6)',
            borderColor: 'rgba(227,74,51,1)',
            borderWidth: 1
        },
        {
            label: 'Non-Emergency',
            data: this.groupData(this.props.complaintsData.values.nonemergency),
            backgroundColor: 'rgba(255, 219, 170, 0.6)',
            borderColor: 'rgba(255, 219, 170,1)',
            borderWidth: 1
        }];
      break;
    case 'permits':
      datasets = 
        [{
            label: 'Building Permits Filed',
            data: this.groupData(this.props.permitsData.values.total),
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
        labels: this.groupLabels(this.props[indicatorData].labels), 
        datasets: datasets
  };

  var labelPosition;
  var dateLocation = 'current'; 

  if (data.labels && data.labels.length > 10) {

    if (!this.props.lastSale.label || this.props.lastSale.label < data.labels[this.props.xAxisStart]) {
      labelPosition = data.labels[this.props.xAxisStart];
      dateLocation = 'past'; 
    }
    else if (this.props.lastSale.label > data.labels[this.props.xAxisStart + this.props.xAxisSpan - 1]) {
      labelPosition = data.labels[this.props.xAxisStart + this.props.xAxisSpan - 1];
      dateLocation = 'future'; 
    }
    else {
      labelPosition = this.props.lastSale.label;
    }
  }

  var dataMaximum = this.getDataMaximum();
  var timeSpan = this.props.activeTimeSpan;

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
                maxRotation: 45,
                minRotation: 45,
                callback: function(value, index, values) {

                  if (timeSpan === 'month') {
                    var fullDate = value.concat('-15'); // Make date value include a day so it can be parsed
                    return (value.slice(5,7) === "01" ? value.slice(0,4) + "  " : "") // Include special year label for January
                     + Helpers.formatDate(fullDate).slice(0,3);
                  }

                  else if (timeSpan === 'quarter') {
                    return (value.slice(-2) === "Q1" ? value.slice(0,4) + "  " : "") // Include special year label for Q1
                     + value.slice(-2);
                  }

                  else {
                    return value;
                  }
                }
                        
            },
            stacked: true
        }]
      },
      tooltips: {
        mode: 'label',
        itemSort: function(a, b) {
          return b.datasetIndex - a.datasetIndex
        },
        callbacks: {
          title: function(tooltipItem) {

            if (timeSpan === 'quarter') {

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

            else if (timeSpan === 'year') {
              return this._data.labels[tooltipItem[0].index];
            }

            else if (timeSpan === 'month') {

              // Make date value include day:
              var fullDate = (this._data.labels[tooltipItem[0].index]).concat('-15');
              return Helpers.formatDate(fullDate);
            }

            else {
              return '';
            }

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
        position: "bottom",
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
                value: (timeSpan === "quarter" ? "2012-Q4" : "2013-10"),
                borderColor: "rgba(0,0,0,0)",
                borderWidth: 0,
                label: {
                    content: (Browser.isMobile() ? "← No data available" : "← No data available for this time period"),
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
        <Bar data={data} options={options} plugins={[ChartAnnotation]} width={100} height={300} redraw={this.state.shouldRedraw} />
      </div>
    );
  }
}