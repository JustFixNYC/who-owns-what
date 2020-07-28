import React, { Component } from "react";
import { Bar } from "react-chartjs-2";
import { I18n, withI18nProps } from "@lingui/react";
import { t } from "@lingui/macro";

// reference: https://github.com/jerairrest/react-chartjs-2

import * as ChartAnnotation from "chartjs-plugin-annotation";
// reference: https://github.com/chartjs/chartjs-plugin-annotation
// why we're using this import format: https://stackoverflow.com/questions/51664741/chartjs-plugin-annotations-not-displayed-in-angular-5/53071497#53071497

import Helpers, { mediumDateOptions, shortDateOptions } from "../util/helpers";

import "styles/Indicators.css";
import { IndicatorsState } from "./IndicatorsUtils";
import { SupportedLocale } from "../i18n-base";
import { ChartOptions } from "chart.js";

const DEFAULT_ANIMATION_MS = 1000;
const MONTH_ANIMATION_MS = 2500;

type IndicatorVizProps = IndicatorsState;

type IndicatorVizState = IndicatorsState & {
  shouldRedraw: boolean;
  animationTime: number;
};

function setCursorStyle(target: EventTarget | null, style: "default" | "pointer") {
  if (target && target instanceof HTMLElement) {
    target.style.cursor = "pointer";
  }
}

export default class IndicatorsViz extends Component<IndicatorVizProps, IndicatorVizState> {
  timeout?: number;

  constructor(props: IndicatorVizProps) {
    super(props);
    this.state = {
      ...props,
      shouldRedraw: false,
      animationTime: 1000,
    };
    this.timeout = undefined;
  }

  // Make Chart Redraw ONLY when the time span changes:
  componentDidUpdate(prevProps: IndicatorVizProps, prevState: IndicatorVizState) {
    if (prevProps === this.props) {
      return;
    }
    if (prevProps.activeTimeSpan !== this.props.activeTimeSpan) {
      const animationTime =
        this.props.activeTimeSpan === "month" ? MONTH_ANIMATION_MS : DEFAULT_ANIMATION_MS;
      this.setState({
        ...this.props,
        shouldRedraw: true,
        animationTime: animationTime,
      });
      window.clearTimeout(this.timeout);
      this.timeout = window.setTimeout(() => {
        this.setState({
          animationTime: DEFAULT_ANIMATION_MS,
        });
        this.timeout = undefined;
      }, MONTH_ANIMATION_MS);
    } else {
      this.setState((state) => ({
        ...state,
        ...this.props,
        shouldRedraw: false,
      }));
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  render() {
    return <I18n>{({ i18n }) => <IndicatorsVizImplementation {...this.state} i18n={i18n} />}</I18n>;
  }
}

function makeAnnotations(
  annotations: Array<ChartAnnotation.AnnotationOptions | false>
): ChartAnnotation.AnnotationOptions[] {
  const result: ChartAnnotation.AnnotationOptions[] = [];

  for (let anno of annotations) {
    if (anno) {
      annotations.push(anno);
    }
  }

  return result;
}

type IndicatorVizImplementationProps = withI18nProps & IndicatorVizState;

class IndicatorsVizImplementation extends Component<IndicatorVizImplementationProps> {
  /** Returns new data labels match selected time span */

  groupLabels(labelsArray: string[] | null) {
    if (labelsArray && this.props.activeTimeSpan === "quarter") {
      var labelsByQuarter = [];
      for (let i = 2; i < labelsArray.length; i = i + 3) {
        var quarter =
          labelsArray[i].slice(0, 4) + "-Q" + Math.ceil(parseInt(labelsArray[i].slice(-2)) / 3); // i.e "2012-Q2"
        labelsByQuarter.push(quarter);
      }
      return labelsByQuarter;
    } else if (labelsArray && this.props.activeTimeSpan === "year") {
      var labelsByYear = [];
      for (let i = 11; i < labelsArray.length; i = i + 12) {
        var year = labelsArray[i].slice(0, 4); // i.e "2012"
        labelsByYear.push(year);
      }
      return labelsByYear;
    } else {
      return labelsArray;
    }
  }

  /** Returns grouped data to match selected time span */

  groupData(dataArray: number[] | null) {
    if (dataArray && this.props.activeTimeSpan === "quarter") {
      var dataByQuarter = [];
      for (let i = 2; i < dataArray.length; i = i + 3) {
        var sumQuarter = dataArray[i] + dataArray[i - 1] + dataArray[i - 2];
        dataByQuarter.push(sumQuarter);
      }
      return dataByQuarter;
    } else if (dataArray && this.props.activeTimeSpan === "year") {
      var dataByYear = [];
      for (let i = 11; i < dataArray.length; i = i + 12) {
        var sumYear = dataArray.slice(i - 11, i + 1).reduce((total, sum) => total + sum);
        dataByYear.push(sumYear);
      }
      return dataByYear;
    } else {
      return dataArray;
    }
  }

  /** Returns maximum y-value across all datasets, grouped by selected timespan */
  getDataMaximum() {
    var dataMaximums = this.props.indicatorList.map((indicatorData) => {
      const { total } = this.props[indicatorData].values;
      return total ? Helpers.maxArray(this.groupData(total) || [0]) : 0;
    });

    return Helpers.maxArray(dataMaximums);
  }

  render() {
    // Create "data" object according to Chart.js documentation
    var datasets;

    const { i18n } = this.props;
    const locale = (i18n.language || "en") as SupportedLocale;

    switch (this.props.activeVis) {
      case "viols":
        datasets = [
          {
            label: i18n._(t`Class C`),
            data: this.groupData(this.props.viols.values.class_c),
            backgroundColor: "rgba(136,65,157, 0.6)",
            borderColor: "rgba(136,65,157,1)",
            borderWidth: 1,
          },
          {
            label: i18n._(t`Class B`),
            data: this.groupData(this.props.viols.values.class_b),
            backgroundColor: "rgba(140,150,198, 0.6)",
            borderColor: "rgba(140,150,198,1)",
            borderWidth: 1,
          },
          {
            label: i18n._(t`Class A`),
            data: this.groupData(this.props.viols.values.class_a),
            backgroundColor: "rgba(157, 194, 227, 0.6)",
            borderColor: "rgba(157, 194, 227,1)",
            borderWidth: 1,
          },
        ];
        break;
      case "complaints":
        datasets = [
          {
            label: i18n._(t`Emergency`),
            data: this.groupData(this.props.complaints.values.emergency),
            backgroundColor: "rgba(227,74,51, 0.6)",
            borderColor: "rgba(227,74,51,1)",
            borderWidth: 1,
          },
          {
            label: i18n._(t`Non-Emergency`),
            data: this.groupData(this.props.complaints.values.nonemergency),
            backgroundColor: "rgba(255, 219, 170, 0.6)",
            borderColor: "rgba(255, 219, 170,1)",
            borderWidth: 1,
          },
        ];
        break;
      case "permits":
        datasets = [
          {
            label: i18n._(t`Building Permits Applied For`),
            data: this.groupData(this.props.permits.values.total),
            backgroundColor: "rgba(73, 192, 179, 0.6)",
            borderColor: "rgb(73, 192, 179)",
            borderWidth: 1,
          },
        ];
        break;
      default:
        break;
    }

    var { activeVis } = this.props;
    var data: any = {
      labels: this.groupLabels(this.props[activeVis].labels),
      datasets: datasets,
    };

    // Create "options" object according to Chart.js documentation

    var labelPosition; // specific graph label value where we want to mark "Sold to Current Owner"
    var dateLocation = "current"; // last sale date is either in the 'past', 'future', or 'current' (default)

    if (data.labels) {
      const lastColumnIndex =
        Math.min(this.props.xAxisStart + this.props.xAxisViewableColumns, data.labels.length) - 1;

      if (
        !this.props.lastSale.label ||
        this.props.lastSale.label < data.labels[this.props.xAxisStart]
      ) {
        labelPosition = data.labels[this.props.xAxisStart];
        dateLocation = "past";
      } else if (this.props.lastSale.label > data.labels[lastColumnIndex]) {
        labelPosition = data.labels[lastColumnIndex];
        dateLocation = "future";
      } else {
        labelPosition = this.props.lastSale.label;
      }
    }

    var dataMaximum = this.getDataMaximum();
    var timeSpan = this.props.activeTimeSpan;

    var acrisURL =
      this.props.lastSale && this.props.lastSale.documentid
        ? "https://a836-acris.nyc.gov/DS/DocumentSearch/DocumentImageView?doc_id=" +
          this.props.lastSale.documentid
        : "https://a836-acris.nyc.gov/DS/DocumentSearch/Index";

    var options: ChartOptions = {
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
              suggestedMax:
                this.props.activeVis === "permits"
                  ? Math.max(
                      12,
                      Helpers.maxArray(this.groupData(this.props.permits.values.total) || [0]) *
                        1.25
                    )
                  : Math.max(12, dataMaximum * 1.25),
            },
            scaleLabel: {
              display: true,
              fontFamily: "Inconsolata, monospace",
              fontColor: "rgb(69, 77, 93)",
              fontSize: 14,
              padding: 8,
              labelString:
                this.props.activeVis === "complaints"
                  ? i18n._(t`Complaints Issued`)
                  : this.props.activeVis === "viols"
                  ? i18n._(t`Violations Issued`)
                  : i18n._(t`Building Permits Applied For`),
            },
            stacked: true,
          },
        ],
        xAxes: [
          {
            ticks: {
              min: data.labels ? data.labels[this.props.xAxisStart] : null,
              max: data.labels
                ? data.labels[this.props.xAxisStart + this.props.xAxisViewableColumns - 1]
                : null,
              maxRotation: 45,
              minRotation: 45,
              callback: function (value: any, index: any, values: any) {
                if (timeSpan === "month") {
                  var fullDate = value.concat("-15"); // Make date value include a day so it can be parsed
                  return (
                    (value.slice(5, 7) === "01" ? value.slice(0, 4) + "  " : "") + // Include special year label for January
                    Helpers.formatDate(fullDate, shortDateOptions, locale)
                  );
                } else if (timeSpan === "quarter") {
                  return (
                    (value.slice(-2) === "Q1" ? value.slice(0, 4) + "  " : "") + value.slice(-2) // Include special year label for Q1
                  );
                } else {
                  return value;
                }
              },
            },
            stacked: true,
          },
        ],
      },
      tooltips: {
        mode: "label",
        itemSort(a, b) {
          return (b.datasetIndex || 0) - (a.datasetIndex || 0);
        },
        callbacks: {
          title(tooltipItem) {
            if (timeSpan === "quarter") {
              const quarter = this._data.labels[tooltipItem[0].index].slice(-1);
              const monthRange = Helpers.getMonthRangeFromQuarter(quarter, locale);

              return monthRange + " " + this._data.labels[tooltipItem[0].index].slice(0, 4);
            } else if (timeSpan === "year") {
              return this._data.labels[tooltipItem[0].index];
            } else if (timeSpan === "month") {
              // Make date value include day:
              var fullDate = this._data.labels[tooltipItem[0].index].concat("-15");
              return Helpers.formatDate(fullDate, mediumDateOptions, locale);
            } else {
              return "";
            }
          },
          footer(tooltipItem, data) {
            var total = 0;

            var i;
            for (i = 0; i < tooltipItem.length; i++) {
              total += parseInt(tooltipItem[i].value || "0");
            }
            return i18n._(t`Total`) + ": " + total;
          },
        },
      },
      legend: {
        position: "bottom",
        labels: {
          fontFamily: "Inconsolata, monospace",
          fontColor: "rgb(69, 77, 93)",
        },
        onHover(event, legendItem) {
          if (legendItem) {
            legendItem.lineWidth = 3;
            this.chart.render({ duration: 0 });
            setCursorStyle(event.srcElement, "pointer");
          }
        },
        onLeave(event, legendItem) {
          if (legendItem) {
            legendItem.lineWidth = 1;
            this.chart.render({ duration: 0 });
          }
        },
      },
      annotation: {
        events: ["click"],
        annotations: makeAnnotations([
          {
            drawTime: "beforeDatasetsDraw",
            type: "line",
            mode: "vertical",
            scaleID: "x-axis-0",
            value: labelPosition,
            borderColor: dateLocation === "current" ? "rgb(69, 77, 93)" : "rgba(0,0,0,0)",
            borderWidth: 2,
            label: {
              content: this.props.lastSale.date
                ? i18n._(t`Sold to Current Owner`)
                : i18n._(t`Last Sale Unknown`),
              fontFamily: "Inconsolata, monospace",
              fontColor: "#fff",
              fontSize: 12,
              xPadding: 10,
              yPadding: 10,
              backgroundColor: "rgb(69, 77, 93)",
              position: "top",
              xAdjust: dateLocation === "past" ? -70 : dateLocation === "future" ? 70 : 0,
              yAdjust: 10,
              enabled: true,
              cornerRadius: 0,
            },
            onClick: () => {
              window.open(acrisURL, "_blank");
            },
          },
          !!this.props.lastSale.date && {
            drawTime: "beforeDatasetsDraw",
            type: "line",
            mode: "vertical",
            scaleID: "x-axis-0",
            value: labelPosition,
            borderColor: "rgba(0,0,0,0)",
            borderWidth: 0,
            label: {
              content:
                (dateLocation === "past" ? "← " : "") +
                Helpers.formatDate(this.props.lastSale.date, mediumDateOptions, locale) +
                (dateLocation === "future" ? " →" : ""),
              fontFamily: "Inconsolata, monospace",
              fontColor: "#fff",
              fontSize: 12,
              xPadding: 10,
              yPadding: 10,
              backgroundColor: "rgb(69, 77, 93)",
              position: "top",
              xAdjust: dateLocation === "past" ? -70 : dateLocation === "future" ? 70 : 0,
              yAdjust: 30,
              enabled: true,
              cornerRadius: 0,
            },
            onClick: () => {
              window.open(acrisURL, "_blank");
            },
          },
          this.props.activeVis === "complaints" && {
            drawTime: "beforeDatasetsDraw",
            type: "line",
            mode: "vertical",
            scaleID: "x-axis-0",
            value: timeSpan === "quarter" ? "2012-Q4" : timeSpan === "year" ? "2012" : "2013-10",
            borderColor: "rgba(0,0,0,0)",
            borderWidth: 0,
            label: {
              content: "← " + i18n._(t`No data available`),
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
              cornerRadius: 0,
            },
          },
        ]),
        drawTime: "afterDraw", // (default)
      },
      animation: {
        duration: this.props.animationTime,
      },
      maintainAspectRatio: false,
      onHover(event) {
        setCursorStyle(event.srcElement, "default");
      },
    };

    return (
      <div className="Indicators__chart">
        <Bar
          data={data}
          options={options}
          plugins={[ChartAnnotation]}
          width={100}
          height={300}
          redraw={this.props.shouldRedraw}
        />
      </div>
    );
  }
}
