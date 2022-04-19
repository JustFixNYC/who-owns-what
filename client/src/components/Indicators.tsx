import React, { Component } from "react";

import Helpers from "../util/helpers";

import IndicatorsViz from "../components/IndicatorsViz";
import { FixedLoadingLabel } from "../components/Loader";
import LegalFooter from "../components/LegalFooter";
import { UsefulLinks } from "./UsefulLinks";
import { withI18n } from "@lingui/react";
import { I18n } from "@lingui/core";
import { t, Trans } from "@lingui/macro";

import "styles/Indicators.css";
import { IndicatorsDatasetRadio, INDICATORS_DATASETS } from "./IndicatorsDatasets";
import {
  indicatorsInitialState,
  IndicatorsProps,
  IndicatorsState,
  IndicatorsChartShift,
  IndicatorsTimeSpan,
  indicatorsTimeSpans,
  IndicatorsDatasetId,
  indicatorsDatasetIds,
} from "./IndicatorsTypes";
import { NetworkErrorMessage } from "./NetworkErrorMessage";
import { Dropdown } from "./Dropdown";

type TimeSpanTranslationsMap = {
  [K in IndicatorsTimeSpan]: (i18n: I18n) => string;
};

const timeSpanTranslations: TimeSpanTranslationsMap = {
  month: (i18n) => i18n._(t`month`),
  quarter: (i18n) => i18n._(t`quarter`),
  year: (i18n) => i18n._(t`year`),
};

/**
 * Generates an appropriate width for a dropdown selection menu
 * that's scaled according to the longest text selection.
 */
const getDropdownWidthFromLongestSelection = (selections: string[]) => {
  const LETTER_WIDTH = 10;
  const MENU_BUFFER = 70;
  const MAX_WIDTH = 350;

  const lengthOfLongestSelection = Math.max(...selections.map((selection) => selection.length));
  return Math.min(lengthOfLongestSelection * LETTER_WIDTH + MENU_BUFFER, MAX_WIDTH);
};

class IndicatorsWithoutI18n extends Component<IndicatorsProps, IndicatorsState> {
  constructor(props: IndicatorsProps) {
    super(props);
    this.state = indicatorsInitialState;
    this.handleVisChange = this.handleVisChange.bind(this);
  }

  /** Shifts the X-axis 'left' or 'right', or 'reset' the X-axis to default */
  handleXAxisChange(shift: IndicatorsChartShift) {
    const span = this.state.xAxisViewableColumns;
    const activeVis = this.state.activeVis;
    const labelsArray =
      this.props.state.context.timelineData &&
      this.props.state.context.timelineData[activeVis].labels;

    if (!labelsArray || labelsArray.length < span) {
      return;
    }

    const groupedLabelsLength = Math.floor(labelsArray.length / this.state.monthsInGroup);

    const xAxisMax = Math.max(groupedLabelsLength - span, 0);
    const currentPosition = this.state.xAxisStart;
    const offset = Math.ceil(6 / this.state.monthsInGroup);

    if (shift === "left") {
      const newPosition = Math.max(currentPosition - offset, 0);
      this.setState({
        xAxisStart: newPosition,
      });
    }

    if (shift === "right") {
      const newPosition = Math.min(currentPosition + offset, xAxisMax);
      this.setState({
        xAxisStart: newPosition,
      });
    }

    if (shift === "reset") {
      this.setState({
        xAxisStart: xAxisMax,
      });
    }
  }

  handleVisChange(selectedVis: IndicatorsDatasetId) {
    this.setState({
      activeVis: selectedVis,
    });
  }

  /** Changes viewing timespan to be by 'year', 'quarter', or 'month' */
  handleTimeSpanChange(selectedTimeSpan: IndicatorsTimeSpan) {
    var monthsInGroup = selectedTimeSpan === "quarter" ? 3 : selectedTimeSpan === "year" ? 12 : 1;

    this.setState({
      activeTimeSpan: selectedTimeSpan,
      monthsInGroup: monthsInGroup,
    });
  }

  updateData() {
    if (
      this.props.state.matches({ portfolioFound: { timeline: "noData" } }) &&
      this.props.isVisible
    ) {
      this.props.send({ type: "VIEW_TIMELINE" });
    }
  }

  componentDidMount() {
    this.updateData();
    this.handleXAxisChange("reset");
  }

  componentDidUpdate(prevProps: IndicatorsProps, prevState: IndicatorsState) {
    const { state } = this.props;

    this.updateData();

    const newlyLoadedRawData =
      !prevProps.state.matches({ portfolioFound: { timeline: "success" } }) &&
      state.matches({ portfolioFound: { timeline: "success" } }) &&
      state.context.timelineData;

    // reset chart positions when:
    // 1. default dataset loads or
    // 2. when activeTimeSpan changes:

    if (newlyLoadedRawData || prevState.activeTimeSpan !== this.state.activeTimeSpan) {
      this.handleXAxisChange("reset");
    }

    // process sale history data when:
    // 1. default dataset loads or
    // 2. when activeTimeSpan changes

    if (newlyLoadedRawData || prevState.activeTimeSpan !== this.state.activeTimeSpan) {
      const { detailAddr } = this.props.state.context.portfolioData;
      if (detailAddr.lastsaledate && detailAddr.lastsaleacrisid) {
        var lastSaleDate = detailAddr.lastsaledate;
        var lastSaleYear = lastSaleDate.slice(0, 4);
        var lastSaleQuarter =
          lastSaleYear + "-Q" + Math.ceil(parseInt(lastSaleDate.slice(5, 7)) / 3);
        var lastSaleMonth = lastSaleDate.slice(0, 7);

        this.setState({
          lastSale: {
            date: lastSaleDate,
            label:
              this.state.activeTimeSpan === "year"
                ? lastSaleYear
                : this.state.activeTimeSpan === "quarter"
                ? lastSaleQuarter
                : lastSaleMonth,
            documentid: detailAddr.lastsaleacrisid,
          },
        });
      } else {
        this.setState({
          lastSale: indicatorsInitialState.lastSale,
        });
      }
    }
  }

  render() {
    if (
      !(
        this.props.isVisible &&
        this.props.state.matches({ portfolioFound: { timeline: "success" } })
      )
    ) {
      return this.props.state.matches({ portfolioFound: { timeline: "error" } }) ? (
        <NetworkErrorMessage />
      ) : (
        <FixedLoadingLabel />
      );
    } else {
      const { state, send } = this.props;

      const { detailAddr } = state.context.portfolioData;

      const { activeVis } = this.state;
      const activeData = state.context.timelineData[activeVis];

      const xAxisLength = activeData.labels
        ? Math.floor(activeData.labels.length / this.state.monthsInGroup)
        : 0;
      const indicatorDataTotal = activeData.values.total
        ? activeData.values.total.reduce((total: number, sum: number) => total + sum)
        : null;

      const i18n = this.props.i18n;

      const datasetSelectionNames = indicatorsDatasetIds.map((datasetId) =>
        INDICATORS_DATASETS[datasetId].name(i18n)
      );
      const timeSpanSelectionNames = indicatorsTimeSpans.map((timeSpan) =>
        timeSpanTranslations[timeSpan](i18n)
      );

      const detailAddrStr = `${detailAddr.housenumber} ${Helpers.titleCase(
        detailAddr.streetname
      )}, ${Helpers.titleCase(detailAddr.boro)}`;

      const datasetDescription = INDICATORS_DATASETS[this.state.activeVis];

      justfix_startFullStoryRecording();

      return (
        <div className="Page Indicators">
          <div className="Indicators__content Page__content">
            <div className="columns">
              <div className="column col-8 col-lg-12">
                {detailAddr && (
                  <div className="title-card">
                    <h4 className="title">
                      <b>{detailAddrStr}</b>
                    </h4>
                  </div>
                )}
                <div className="Indicators__links">
                  <div
                    className="Indicators__linksContainer"
                    style={{
                      width: `${getDropdownWidthFromLongestSelection(datasetSelectionNames)}px`,
                    }}
                  >
                    <span className="Indicators__linksTitle text-uppercase">
                      <Trans>Display:</Trans>
                    </span>{" "}
                    <br />
                    <Dropdown
                      buttonLabel={INDICATORS_DATASETS[activeVis].name(i18n)}
                      buttonAriaLabel={`${i18n._(t`Display:`)} ${INDICATORS_DATASETS[
                        activeVis
                      ].name(i18n)}`}
                    >
                      {indicatorsDatasetIds.map((datasetKey, i) => (
                        <IndicatorsDatasetRadio
                          key={i}
                          id={datasetKey}
                          activeId={activeVis}
                          onChange={this.handleVisChange}
                        />
                      ))}
                    </Dropdown>
                  </div>
                  <div
                    className="Indicators__linksContainer"
                    style={{
                      width: `${getDropdownWidthFromLongestSelection(timeSpanSelectionNames)}px`,
                    }}
                  >
                    <span className="Indicators__linksTitle text-uppercase">
                      <Trans>View by:</Trans>
                    </span>
                    <br />
                    <Dropdown
                      buttonLabel={timeSpanTranslations[this.state.activeTimeSpan](i18n)}
                      buttonAriaLabel={`${i18n._(t`View by:`)} ${timeSpanTranslations[
                        this.state.activeTimeSpan
                      ](i18n)}`}
                    >
                      {indicatorsTimeSpans.map((timespan, i) => (
                        <li className="menu-item" key={i}>
                          <label
                            className={
                              "form-radio" +
                              (this.state.activeTimeSpan === timespan ? " active" : "")
                            }
                            onClick={() => {
                              window.gtag("event", "month-timeline-tab");
                            }}
                          >
                            <input
                              type="radio"
                              name={timespan}
                              checked={this.state.activeTimeSpan === timespan ? true : false}
                              onChange={() => this.handleTimeSpanChange(timespan)}
                            />
                            <i className="form-icon" /> {timeSpanTranslations[timespan](i18n)}
                          </label>
                        </li>
                      ))}
                    </Dropdown>
                  </div>
                </div>
                <span className="title viz-title">
                  {datasetDescription &&
                    indicatorDataTotal !== null &&
                    datasetDescription.quantity(i18n, indicatorDataTotal)}
                </span>
                <div className="Indicators__viz">
                  <button
                    aria-label={i18n._(t`Move chart data left.`)}
                    aria-hidden={
                      this.state.xAxisStart === 0 || this.state.activeTimeSpan === "year"
                    }
                    aria-disabled={
                      this.state.xAxisStart === 0 || this.state.activeTimeSpan === "year"
                    }
                    className={
                      this.state.xAxisStart === 0 || this.state.activeTimeSpan === "year"
                        ? "btn btn-off btn-axis-shift"
                        : "btn btn-axis-shift"
                    }
                    onClick={() => {
                      this.handleXAxisChange("left");
                      window.gtag("event", "graph-back-button");
                    }}
                  >
                    ‹
                  </button>
                  <IndicatorsViz state={state} send={send} {...this.state} />
                  <button
                    aria-label={i18n._(t`Move chart data right.`)}
                    aria-hidden={
                      this.state.xAxisStart + this.state.xAxisViewableColumns >= xAxisLength ||
                      this.state.activeTimeSpan === "year"
                    }
                    aria-disabled={
                      this.state.xAxisStart + this.state.xAxisViewableColumns >= xAxisLength ||
                      this.state.activeTimeSpan === "year"
                    }
                    className={
                      this.state.xAxisStart + this.state.xAxisViewableColumns >= xAxisLength ||
                      this.state.activeTimeSpan === "year"
                        ? "btn btn-off btn-axis-shift"
                        : "btn btn-axis-shift"
                    }
                    onClick={() => this.handleXAxisChange("right")}
                  >
                    ›
                  </button>
                </div>
              </div>
              <div className="column column-context col-4 col-lg-12">
                <div className="card">
                  <div className="card-header">
                    <div className="card-title h5">
                      <Trans>What are {datasetDescription && datasetDescription.name(i18n)}?</Trans>
                    </div>
                    <div className="card-subtitle text-gray" />
                  </div>
                  <div className="card-body">
                    {datasetDescription && datasetDescription.explanation(i18n)}
                  </div>
                </div>

                <UsefulLinks addrForLinks={detailAddr} location="timeline-tab" />
              </div>
            </div>
          </div>
          <LegalFooter />
        </div>
      );
    }
  }
}

const Indicators = withI18n()(IndicatorsWithoutI18n);
export default Indicators;
