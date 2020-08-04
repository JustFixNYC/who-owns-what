import React, { Component } from "react";

import Helpers from "../util/helpers";

import IndicatorsViz from "../components/IndicatorsViz";
import Loader from "../components/Loader";
import LegalFooter from "../components/LegalFooter";
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
} from "./IndicatorsTypes";
import { Nobr } from "./Nobr";

class IndicatorsWithoutI18n extends Component<IndicatorsProps, IndicatorsState> {
  constructor(props: IndicatorsProps) {
    super(props);
    this.state = indicatorsInitialState;
    this.handleVisChange = this.handleVisChange.bind(this);
  }

  /** Shifts the X-axis 'left' or 'right', or 'reset' the X-axis to default */
  handleXAxisChange(shift: IndicatorChartShift) {
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
      return (
        <Loader loading={true} classNames="Loader-map">
          <Trans>Loading</Trans>
        </Loader>
      );
    } else {
      const { state, send } = this.props;

      const { detailAddr } = state.context.portfolioData;
      const { housenumber, streetname, bbl } = detailAddr;
      const boro = bbl.slice(0, 1);
      const block = bbl.slice(1, 6);
      const lot = bbl.slice(6, 10);

      const { activeVis } = this.state;
      const activeData = state.context.timelineData[activeVis];

      const xAxisLength = activeData.labels
        ? Math.floor(activeData.labels.length / this.state.monthsInGroup)
        : 0;
      const indicatorDataTotal = activeData.values.total
        ? activeData.values.total.reduce((total: number, sum: number) => total + sum)
        : null;

      const i18n = this.props.i18n;

      const detailAddrStr = `${detailAddr.housenumber} ${Helpers.titleCase(
        detailAddr.streetname
      )}, ${Helpers.titleCase(detailAddr.boro)}`;

      const datasetDescription = INDICATORS_DATASETS[this.state.activeVis];

      return (
        <div className="Page Indicators">
          <div className="Indicators__content Page__content">
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
                      onClick={() => this.props.onBackToOverview(bbl)}
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
                      activeId={activeVis}
                      onChange={this.handleVisChange}
                    />
                    <IndicatorsDatasetRadio
                      id="viols"
                      activeId={activeVis}
                      onChange={this.handleVisChange}
                    />
                    <IndicatorsDatasetRadio
                      id="permits"
                      activeId={activeVis}
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
                  {datasetDescription &&
                    indicatorDataTotal !== null &&
                    datasetDescription.quantity(i18n, indicatorDataTotal)}
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
                  <IndicatorsViz state={state} send={send} {...this.state} />
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
                      <Trans>What are {datasetDescription && datasetDescription.name(i18n)}?</Trans>
                    </div>
                    <div className="card-subtitle text-gray" />
                  </div>
                  <div className="card-body">
                    {datasetDescription && datasetDescription.explanation(i18n)}
                  </div>
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
          </div>
          <LegalFooter />
        </div>
      );
    }
  }
}

const Indicators = withI18n()(IndicatorsWithoutI18n);
export default Indicators;
