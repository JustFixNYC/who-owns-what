import React, { Component } from "react";
import { Bar, ChartData } from "react-chartjs-2";
import { I18n, withI18nProps } from "@lingui/react";
import { t } from "@lingui/macro";
import * as chartjs from "chart.js";

// reference: https://github.com/jerairrest/react-chartjs-2

import * as ChartAnnotation from "chartjs-plugin-annotation";
// reference: https://github.com/chartjs/chartjs-plugin-annotation
// why we're using this import format: https://stackoverflow.com/questions/51664741/chartjs-plugin-annotations-not-displayed-in-angular-5/53071497#53071497

import Helpers, { longDateOptions, mediumDateOptions, shortDateOptions } from "../util/helpers";

import "styles/Indicators.css";
import { indicatorsDatasetIds, IndicatorsState } from "./IndicatorsTypes";
import { defaultLocale, SupportedLocale } from "../i18n-base";
import { ChartOptions } from "chart.js";
import { withMachineInStateProps } from "state-machine";
import { INDICATORS_DATASETS } from "./IndicatorsDatasets";

const DEFAULT_ANIMATION_MS = 1000;
const MONTH_ANIMATION_MS = 2500;

type IndicatorVizProps = withMachineInStateProps<{ portfolioFound: { timeline: "success" } }> &
  IndicatorsState;

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
    const { state, send } = this.props;
    return (
      <I18n>
        {({ i18n }) => (
          <IndicatorsVizImplementation {...this.state} i18n={i18n} state={state} send={send} />
        )}
      </I18n>
    );
  }
}

function makeAnnotations(
  annotations: Array<ChartAnnotation.AnnotationOptions | false>
): ChartAnnotation.AnnotationOptions[] {
  const result: ChartAnnotation.AnnotationOptions[] = [];

  for (let anno of annotations) {
    if (anno) {
      result.push(anno);
    }
  }

  return result;
}

type IndicatorVizImplementationProps = withI18nProps &
  withMachineInStateProps<{ portfolioFound: { timeline: "success" } }> &
  IndicatorVizState;

class IndicatorsVizImplementation extends Component<IndicatorVizImplementationProps> {
  /** Returns new data labels match selected time span */

  barRef: React.RefObject<Bar>;

  constructor(props: IndicatorVizImplementationProps) {
    super(props);

    this.barRef = React.createRef();
  }

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

  /** Returns maximum y-value across all datasets except Rent Stab, grouped by selected timespan */
  getDataMaximum() {
    var { timelineData } = this.props.state.context;
    // Rent stabilized unit counts are usually an outlier and may skew the suggested Y axis calculation for other indicators
    const indicatorsWithoutRentStab = indicatorsDatasetIds.filter(
      (id) => id !== "rentstabilizedunits"
    );

    var dataMaximums = indicatorsWithoutRentStab.map((datasetName) => {
      const { total } = timelineData[datasetName].values;
      return total ? Helpers.maxArray(this.groupData(total) || [0]) : 0;
    });

    return Helpers.maxArray(dataMaximums);
  }

  render() {
    // Create "data" object according to Chart.js documentation
    var datasets: chartjs.ChartDataSets[];
    var { timelineData } = this.props.state.context;

    const { i18n } = this.props;
    const locale = (i18n.language || defaultLocale) as SupportedLocale;

    const unitsres = this.props.state.context.portfolioData.searchAddr.unitsres ?? 0;
    const rsunits = this.groupData(timelineData.rentstabilizedunits.values.total) ?? [];

    switch (this.props.activeVis) {
      case "hpdviolations":
        datasets = [
          {
            label: i18n._(t`Class I`),
            data: this.groupData(timelineData.hpdviolations.values.class_i) || [],
            backgroundColor: "rgba(87, 0, 83, 0.6)",
            borderColor: "rgba(87, 0, 83, 1)",
            borderWidth: 1,
          },
          {
            label: i18n._(t`Class C`),
            data: this.groupData(timelineData.hpdviolations.values.class_c) || [],
            backgroundColor: "rgba(136, 65, 157, 0.6)",
            borderColor: "rgba(136, 65, 157, 1)",
            borderWidth: 1,
          },
          {
            label: i18n._(t`Class B`),
            data: this.groupData(timelineData.hpdviolations.values.class_b) || [],
            backgroundColor: "rgba(140, 150, 198, 0.6)",
            borderColor: "rgba(140,150,198,1)",
            borderWidth: 1,
          },
          {
            label: i18n._(t`Class A`),
            data: this.groupData(timelineData.hpdviolations.values.class_a) || [],
            backgroundColor: "rgba(157, 194, 227, 0.6)",
            borderColor: "rgba(157, 194, 227,1)",
            borderWidth: 1,
          },
        ];
        break;
      case "hpdcomplaints":
        datasets = [
          {
            label: i18n._(t`Emergency`),
            data: this.groupData(timelineData.hpdcomplaints.values.emergency) || [],
            backgroundColor: "rgba(227,74,51, 0.6)",
            borderColor: "rgba(227,74,51,1)",
            borderWidth: 1,
          },
          {
            label: i18n._(t`Non-Emergency`),
            data: this.groupData(timelineData.hpdcomplaints.values.nonemergency) || [],
            backgroundColor: "rgba(255, 219, 170, 0.6)",
            borderColor: "rgba(255, 219, 170,1)",
            borderWidth: 1,
          },
        ];
        break;
      case "dobpermits":
        datasets = [
          {
            label: i18n._(t`Building Permits Applied For`),
            data: this.groupData(timelineData.dobpermits.values.total) || [],
            backgroundColor: "rgba(73, 192, 179, 0.6)",
            borderColor: "rgb(73, 192, 179)",
            borderWidth: 1,
          },
        ];
        break;
      case "dobviolations":
        datasets = [
          {
            label: i18n._(t`ECB`),
            data: this.groupData(timelineData.dobviolations.values.ecb) || [],
            backgroundColor: "rgba(217,95,14, 0.6)",
            borderColor: "rgba(217,95,14,1)",
            borderWidth: 1,
          },
          {
            label: i18n._(t`Non-ECB`),
            data: this.groupData(timelineData.dobviolations.values.regular) || [],
            backgroundColor: "rgba(254,217,142, 0.6)",
            borderColor: "rgba(254,217,142,1)",
            borderWidth: 1,
          },
        ];
        break;
      case "evictionfilings":
        datasets = [
          {
            label: i18n._(t`Eviction Filings`),
            data: this.groupData(timelineData.evictionfilings.values.total) || [],
            backgroundColor: "rgba(227,74,51,0.6)",
            borderColor: "rgba(227,74,51,1)",
            borderWidth: 1,
          },
        ];
        break;
      case "rentstabilizedunits":
        datasets = [
          {
            label: i18n._(t`Rent Stabilized Units`),
            data: rsunits,
            backgroundColor: "rgba(131, 207, 162, 0.6)",
            borderColor: "rgba(131, 207, 162, 1)",
            borderWidth: 1,
          },
        ];
        break;
      default:
        datasets = [];
        break;
    }

    var { activeVis } = this.props;
    var data: ChartData<chartjs.ChartData> = {
      labels: this.groupLabels(timelineData[activeVis].labels) || [],
      datasets,
    };

    // Create "options" object according to Chart.js documentation

    var labelPosition: string = ""; // specific graph label value where we want to mark "Sold to Current Owner" (as YYYY-MM)
    var dateLocation = "current"; // last sale date is either in the 'past', 'future', or 'current' (default)

    if (data.labels) {
      const lastColumnIndex =
        Math.min(this.props.xAxisStart + this.props.xAxisViewableColumns, data.labels.length) - 1;

      if (
        !this.props.lastSale.label ||
        this.props.lastSale.label < data.labels[this.props.xAxisStart]
      ) {
        labelPosition = (data.labels[this.props.xAxisStart] || "").toString();
        dateLocation = "past";
      } else if (this.props.lastSale.label > data.labels[lastColumnIndex]) {
        labelPosition = (data.labels[lastColumnIndex] || "").toString();
        dateLocation = "future";
      } else {
        labelPosition = this.props.lastSale.label;
      }
    }

    var dataMaximum = this.getDataMaximum();
    var suggestedYAxisMax =
      this.props.activeVis !== "hpdcomplaints" && this.props.activeVis !== "hpdviolations"
        ? this.props.activeVis !== "rentstabilizedunits"
          ? Math.max(
              12,
              Helpers.maxArray(this.groupData(timelineData.dobpermits.values.total) || [0]) * 1.25
            )
          : Math.max(12, unitsres + unitsres / 4)
        : Math.max(12, dataMaximum * 1.25);

    var timeSpan = this.props.activeTimeSpan;

    const formatXAxisTicks = (dateValue: string): string => {
      if (timeSpan === "month") {
        var fullDate = dateValue.concat("-15"); // Make date value include a day so it can be parsed
        return (
          (dateValue.slice(5, 7) === "01" ? dateValue.slice(0, 4) + "  " : "") + // Include special year label for January
          Helpers.formatDate(fullDate, shortDateOptions, locale)
        );
      } else if (timeSpan === "quarter") {
        return (
          (dateValue.slice(-2) === "Q1" ? dateValue.slice(0, 4) + "  " : "") + dateValue.slice(-2) // Include special year label for Q1
        );
      } else {
        return dateValue;
      }
    };

    var acrisURL =
      this.props.lastSale && this.props.lastSale.documentid
        ? "https://a836-acris.nyc.gov/DS/DocumentSearch/DocumentImageView?doc_id=" +
          this.props.lastSale.documentid
        : "https://a836-acris.nyc.gov/DS/DocumentSearch/Index";

    const rerenderBar = () => {
      const { barRef } = this;
      if (barRef.current) {
        barRef.current.chartInstance.render({ duration: 0 });
      }
    };

    var options: ChartOptions = {
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
              suggestedMax: suggestedYAxisMax,
            },
            scaleLabel: {
              display: true,
              fontFamily: "Inconsolata, monospace",
              fontColor: "rgb(69, 77, 93)",
              fontSize: 14,
              padding: 8,
              labelString: INDICATORS_DATASETS[activeVis].yAxisLabel(i18n),
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
              callback: formatXAxisTicks,
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
          title(tooltipItem, data) {
            const { index } = tooltipItem[0];
            const { labels } = data;

            if (!(typeof index !== "undefined" && labels && labels[index])) {
              return "";
            }

            const label = labels[index];

            if (typeof label !== "string") {
              return "";
            }

            if (timeSpan === "quarter") {
              const quarter = label.slice(-1) as "1" | "2" | "3" | "4";
              const monthRange = Helpers.getMonthRangeFromQuarter(quarter, locale);

              return monthRange + " " + label.slice(0, 4);
            } else if (timeSpan === "year") {
              return label;
            } else if (timeSpan === "month") {
              // Make date value include day:
              var fullDate = label.concat("-15");
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
            rerenderBar();
            setCursorStyle(event.srcElement, "pointer");
          }
        },
        onLeave(event, legendItem) {
          if (legendItem) {
            legendItem.lineWidth = 1;
            rerenderBar();
          }
        },
      },
      annotation: {
        events: ["click"],
        annotations: makeAnnotations([
          !!this.props.lastSale.date
            ? {
                drawTime: "beforeDatasetsDraw",
                type: "line",
                mode: "vertical",
                scaleID: "x-axis-0",
                value: labelPosition,
                borderColor: dateLocation === "current" ? "rgb(68, 77, 93)" : "rgba(0,0,0,0)",
                borderWidth: 2,
                label: {
                  content:
                    (dateLocation === "past" ? "← " : "") +
                    i18n._(t`Sold`) +
                    " " +
                    Helpers.formatDate(this.props.lastSale.date, longDateOptions, locale) +
                    (dateLocation === "future" ? " →" : ""),
                  fontStyle: "normal",
                  xPadding: 10,
                  yPadding: 10,
                  backgroundColor: "rgb(68, 77, 93)",
                  position: "top",
                  xAdjust: dateLocation === "past" ? -70 : dateLocation === "future" ? 70 : 0,
                  yAdjust: 10,
                  enabled: true,
                  cornerRadius: 0,
                },
                onClick: () => {
                  window.open(acrisURL, "_blank");
                },
              }
            : {
                drawTime: "beforeDatasetsDraw",
                type: "line",
                mode: "vertical",
                scaleID: "x-axis-0",
                value: labelPosition,
                borderColor: dateLocation === "current" ? "rgb(68, 77, 93)" : "rgba(0,0,0,0)",
                borderWidth: 2,
                label: {
                  content: i18n._(t`Last Sale Unknown`),
                  fontStyle: "normal",
                  xPadding: 10,
                  yPadding: 10,
                  backgroundColor: "rgb(68, 77, 93)",
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
          this.props.activeVis === "rentstabilizedunits" &&
            !!unitsres && {
              drawTime: "afterDatasetsDraw",
              type: "line",
              mode: "horizontal",
              scaleID: "y-axis-0",
              value: unitsres,
              borderColor: "rgb(81, 136, 255)",
              borderWidth: 2,
              borderDash: [10, 10],
              label: {
                content: i18n._(t`${unitsres} units total`),
                fontStyle: "normal",
                fontColor: "#000",
                xPadding: 10,
                yPadding: 10,
                backgroundColor: "rgb(81, 136, 255)",
                position: "center",
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
          ref={this.barRef}
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
