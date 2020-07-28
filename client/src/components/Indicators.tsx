import React, { Component } from "react";

import Helpers from "../util/helpers";

import IndicatorsViz from "../components/IndicatorsViz";
import Loader from "../components/Loader";
import LegalFooter from "../components/LegalFooter";
import APIClient from "../components/APIClient";
import { withI18n } from "@lingui/react";
import { Trans } from "@lingui/macro";

import "styles/Indicators.css";
import {
  IndicatorsDatasetRadio,
  INDICATORS_DATASETS,
  IndicatorsDatasetId,
} from "./IndicatorsDatasets";
import { Link } from "react-router-dom";
import {
  indicatorsInitialState,
  IndicatorsProps,
  IndicatorsState,
  IndicatorChartShift,
  IndicatorsTimeSpan,
  IndicatorsData,
} from "./IndicatorsTypes";
import { AddressRecord } from "./APIDataTypes";
import { Nobr } from "./Nobr";

class IndicatorsWithoutI18n extends Component<IndicatorsProps, IndicatorsState> {
  constructor(props: IndicatorsProps) {
    super(props);
    this.state = indicatorsInitialState;
    this.handleVisChange = this.handleVisChange.bind(this);
  }

  /** Resets the component to initial blank state */
  reset() {
    this.setState(indicatorsInitialState);
  }

  /** Shifts the X-axis 'left' or 'right', or 'reset' the X-axis to default */
  handleXAxisChange(shift: IndicatorChartShift) {
    const span = this.state.xAxisViewableColumns;
    const labelsArray = this.state[this.state.activeVis].labels;

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

  /** Fetches data for Indicators component via 2 API calls and saves the raw data in state */
  fetchData(detailAddr: AddressRecord) {
    APIClient.getIndicatorHistory(detailAddr.bbl)
      .then((results) => this.setState({ indicatorHistory: results.result }))
      .catch((err) => {
        window.Rollbar.error("API error on Indicators: Indicator History", err, detailAddr.bbl);
      });

    this.setState({
      currentAddr: detailAddr,
    });
  }

  /** Reorganizes raw data from API call and then returns an object that matches the data stucture in state  */
  createVizData(rawJSON: any, vizType: IndicatorsDatasetId): IndicatorsData {
    // Generate object to hold data for viz
    // Note: keys in "values" object need to match exact key names in data from API call
    var vizData: IndicatorsData = Object.assign({}, indicatorsInitialState[vizType]);

    vizData.labels = [];
    for (const column in vizData.values) {
      vizData.values[column] = [];
    }

    // Generate arrays of data for chart.js visualizations:
    // Default grouping is by MONTH

    const rawJSONLength = rawJSON.length;

    for (let i = 0; i < rawJSONLength; i++) {
      vizData.labels.push(rawJSON[i].month);

      for (const column in vizData.values) {
        const vizTypePlusColumn = vizType + "_" + column;
        const values = vizData.values[column];
        if (!values)
          throw new Error(`Column "${column}" of visualization "${vizType}" is not an array!`);
        values.push(parseInt(rawJSON[i][vizTypePlusColumn]));
      }
    }
    return vizData;
  }

  UNSAFE_componentWillReceiveProps(nextProps: IndicatorsProps) {
    // make the api call when we have a new detail address from the Address Page
    if (
      nextProps.detailAddr &&
      nextProps.detailAddr.bbl && // will be receiving a detailAddr prop AND
      (!this.props.detailAddr || // either we don't have one now
        (this.props.detailAddr &&
        this.props.detailAddr.bbl && // OR we have a different one
          !Helpers.addrsAreEqual(this.props.detailAddr, nextProps.detailAddr)))
    ) {
      this.reset();
      this.fetchData(nextProps.detailAddr);
    }
  }

  componentDidUpdate(prevProps: IndicatorsProps, prevState: IndicatorsState) {
    const indicatorList = this.state.indicatorList;

    // process viz data from incoming API calls:

    if (
      this.state.indicatorHistory &&
      !Helpers.jsonEqual(prevState.indicatorHistory, this.state.indicatorHistory)
    ) {
      for (const indicator of indicatorList) {
        var inputData = this.createVizData(this.state.indicatorHistory, indicator);

        this.setState({
          [indicator]: inputData,
        } as any);
      }
    }

    // reset chart positions when:
    // 1. default dataset loads or
    // 2. when activeTimeSpan changes:

    if (
      (!prevState[this.state.defaultVis].labels && this.state[this.state.defaultVis].labels) ||
      prevState.activeTimeSpan !== this.state.activeTimeSpan
    ) {
      this.handleXAxisChange("reset");
    }

    // process sale history data when:
    // 1. default dataset loads or
    // 2. when activeTimeSpan changes

    if (
      (this.state.currentAddr &&
        !prevState[this.state.defaultVis].labels &&
        this.state[this.state.defaultVis].labels) ||
      prevState.activeTimeSpan !== this.state.activeTimeSpan
    ) {
      if (
        this.props.detailAddr &&
        this.props.detailAddr.lastsaledate &&
        this.props.detailAddr.lastsaleacrisid
      ) {
        var lastSaleDate = this.props.detailAddr.lastsaledate;
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
            documentid: this.props.detailAddr.lastsaleacrisid,
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
    const detailAddr = this.props.detailAddr;

    const boro = detailAddr ? detailAddr.bbl.slice(0, 1) : null;
    const block = detailAddr ? detailAddr.bbl.slice(1, 6) : null;
    const lot = detailAddr ? detailAddr.bbl.slice(6, 10) : null;
    const housenumber = detailAddr ? detailAddr.housenumber : null;
    const streetname = detailAddr ? detailAddr.streetname : null;

    const { activeVis } = this.state;
    const data = this.state[activeVis];
    const xAxisLength = data.labels ? Math.floor(data.labels.length / this.state.monthsInGroup) : 0;
    const indicatorDataTotal = data.values.total
      ? data.values.total.reduce((total: number, sum: number) => total + sum)
      : null;

    const i18n = this.props.i18n;

    const detailAddrStr =
      detailAddr &&
      `${detailAddr.housenumber} ${Helpers.titleCase(detailAddr.streetname)}, ${Helpers.titleCase(
        detailAddr.boro
      )}`;

    const dataset = INDICATORS_DATASETS[this.state.activeVis];

    return (
      <div className="Page Indicators">
        <div className="Indicators__content Page__content">
          {!(
            this.props.isVisible &&
            this.state.indicatorHistory &&
            this.state[this.state.defaultVis].labels
          ) ? (
            <Loader loading={true} classNames="Loader-map">
              <Trans>Loading</Trans>
            </Loader>
          ) : (
            <div className="columns">
              <div className="column col-8 col-lg-12">
                {detailAddr && (
                  <div className="title-card">
                    <h4 className="title">
                      <span>
                        <Trans>BUILDING:</Trans> <b>{detailAddrStr}</b>
                      </span>
                    </h4>
                    <br />
                    <Link
                      to={this.props.generateBaseUrl()}
                      onClick={() => this.props.onBackToOverview(detailAddr)}
                    >
                      <Trans>Back to Overview</Trans>
                    </Link>
                  </div>
                )}

                <div className="Indicators__links">
                  <div className="Indicators__linksContainer">
                    <em className="Indicators__linksTitle">
                      <Trans>Select a Dataset:</Trans>
                    </em>{" "}
                    <br />
                    <IndicatorsDatasetRadio
                      id="complaints"
                      activeId={this.state.activeVis}
                      onChange={this.handleVisChange}
                    />
                    <IndicatorsDatasetRadio
                      id="viols"
                      activeId={this.state.activeVis}
                      onChange={this.handleVisChange}
                    />
                    <IndicatorsDatasetRadio
                      id="permits"
                      activeId={this.state.activeVis}
                      onChange={this.handleVisChange}
                    />
                  </div>
                  <div className="Indicators__linksContainer">
                    <em className="Indicators__linksTitle">
                      <Trans>View by:</Trans>
                    </em>
                    <br />
                    <li className="menu-item">
                      <label
                        className={
                          "form-radio" + (this.state.activeTimeSpan === "month" ? " active" : "")
                        }
                        onClick={() => {
                          window.gtag("event", "month-timeline-tab");
                        }}
                      >
                        <input
                          type="radio"
                          name="month"
                          checked={this.state.activeTimeSpan === "month" ? true : false}
                          onChange={() => this.handleTimeSpanChange("month")}
                        />
                        <i className="form-icon" /> <Trans>Month</Trans>
                      </label>
                    </li>
                    <li className="menu-item">
                      <label
                        className={
                          "form-radio" + (this.state.activeTimeSpan === "quarter" ? " active" : "")
                        }
                        onClick={() => {
                          window.gtag("event", "quarter-timeline-tab");
                        }}
                      >
                        <input
                          type="radio"
                          name="quarter"
                          checked={this.state.activeTimeSpan === "quarter" ? true : false}
                          onChange={() => this.handleTimeSpanChange("quarter")}
                        />
                        <i className="form-icon" /> <Trans>Quarter</Trans>
                      </label>
                    </li>
                    <li className="menu-item">
                      <label
                        className={
                          "form-radio" + (this.state.activeTimeSpan === "year" ? " active" : "")
                        }
                        onClick={() => {
                          window.gtag("event", "year-timeline-tab");
                        }}
                      >
                        <input
                          type="radio"
                          name="year"
                          checked={this.state.activeTimeSpan === "year" ? true : false}
                          onChange={() => this.handleTimeSpanChange("year")}
                        />
                        <i className="form-icon" /> <Trans>Year</Trans>
                      </label>
                    </li>
                  </div>
                </div>

                <span className="title viz-title">
                  {dataset && indicatorDataTotal && dataset.quantity(i18n, indicatorDataTotal)}
                </span>

                <div className="Indicators__viz">
                  <button
                    aria-hidden={
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
                  <IndicatorsViz {...this.state} />
                  <button
                    aria-hidden={
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

                <div className="Indicators__feedback hide-lg">
                  <Trans render="i">Have thoughts about this page?</Trans>
                  <Nobr>
                    <a
                      href="https://airtable.com/shrZ9uL3id6oWEn8T"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Trans>Send us feedback!</Trans>
                    </a>
                  </Nobr>
                </div>
              </div>
              <div className="column column-context col-4 col-lg-12">
                <div className="card">
                  <div className="card-header">
                    <div className="card-title h5">
                      <Trans>What are {dataset && dataset.name(i18n)}?</Trans>
                    </div>
                    <div className="card-subtitle text-gray" />
                  </div>
                  <div className="card-body">{dataset && dataset.explanation(i18n)}</div>
                </div>

                <div className="card card-links">
                  <div className="card-body card-body-links">
                    <Trans render="h6">Useful links</Trans>
                    <div className="columns">
                      <div className="column col-12">
                        <a
                          onClick={() => {
                            window.gtag("event", "acris-timeline-tab");
                          }}
                          href={`http://a836-acris.nyc.gov/bblsearch/bblsearch.asp?borough=${boro}&block=${block}&lot=${lot}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-block"
                        >
                          <Trans>View documents on ACRIS</Trans> &#8599;&#xFE0E;
                        </a>
                      </div>
                      <div className="column col-12">
                        <a
                          onClick={() => {
                            window.gtag("event", "hpd-timeline-tab");
                          }}
                          href={
                            housenumber && streetname
                              ? `https://hpdonline.hpdnyc.org/HPDonline/Provide_address.aspx?p1=${boro}&p2=${housenumber}&p3=${Helpers.formatStreetNameForHpdLink(
                                  streetname
                                )}&SearchButton=Search`
                              : `https://hpdonline.hpdnyc.org/HPDonline/provide_address.aspx`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-block"
                        >
                          <Trans>HPD Building Profile</Trans> &#8599;&#xFE0E;
                        </a>
                      </div>
                      <div className="column col-12">
                        <a
                          onClick={() => {
                            window.gtag("event", "dob-timeline-tab");
                          }}
                          href={`http://a810-bisweb.nyc.gov/bisweb/PropertyProfileOverviewServlet?boro=${boro}&block=${block}&lot=${lot}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-block"
                        >
                          <Trans>DOB Building Profile</Trans> &#8599;&#xFE0E;
                        </a>
                      </div>
                      <div className="column col-12">
                        <a
                          onClick={() => {
                            window.gtag("event", "dof-timeline-tab");
                          }}
                          href={`https://a836-pts-access.nyc.gov/care/search/commonsearch.aspx?mode=persprop`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-block"
                        >
                          <Trans>DOF Property Tax Bills</Trans> &#8599;&#xFE0E;
                        </a>
                      </div>
                      <div className="column col-12">
                        <a
                          onClick={() => {
                            window.gtag("event", "dap-timeline-tab");
                          }}
                          href={`https://portal.displacementalert.org/property/${boro}${block}${lot}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-block"
                        >
                          <Trans>ANHD DAP Portal</Trans> &#8599;&#xFE0E;
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="Indicators__feedback show-lg">
                  <Trans render="i">Have thoughts about this page?</Trans>
                  <Nobr>
                    <a
                      href="https://airtable.com/shrZ9uL3id6oWEn8T"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Trans>Send us feedback!</Trans>
                    </a>
                  </Nobr>
                </div>
              </div>
            </div>
          )}
        </div>
        <LegalFooter />
      </div>
    );
  }
}

const Indicators = withI18n()(IndicatorsWithoutI18n);
export default Indicators;
