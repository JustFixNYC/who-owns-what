import React, { Component } from "react";
import { CSSTransition } from "react-transition-group";
import { StreetView } from "./StreetView";
import { LazyLoadWhenVisible } from "./LazyLoadWhenVisible";
import Helpers from "util/helpers";
import Browser from "util/browser";
import Modal from "components/Modal";

import "styles/DetailView.css";
import { withI18n } from "@lingui/react";
import { Trans } from "@lingui/macro";
import { SocialSharePortfolio } from "./SocialShare";
import { isPartOfGroupSale } from "./PropertiesList";
import { Link } from "react-router-dom";
import { LocaleLink } from "../i18n";
import BuildingStatsTable from "./BuildingStatsTable";

class DetailViewWithoutI18n extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showCompareModal: false,
      todaysDate: new Date(),
    };

    this.detailSlideLength = 300;
  }

  componentDidUpdate(prevProps, prevState) {
    // scroll to top of wrapper div:
    document.querySelector(".DetailView__wrapper").scrollTop = 0;
  }
  /*
  formatDate(dateString) {
    var date = new Date(dateString);
    var options = { year: "numeric", month: "short", day: "numeric" };
    return date.toLocaleDateString(this.props.i18n._language || "en", options);
  }
*/
  render() {
    let boro, block, lot, ownernames, userOwnernames, takeActionURL;
    if (this.props.addr) {
      ({ boro, block, lot } = Helpers.splitBBL(this.props.addr.bbl));
      takeActionURL = Helpers.createTakeActionURL(this.props.addr, "detail_view");

      if (this.props.addr.ownernames.length) ownernames = Helpers.uniq(this.props.addr.ownernames);
      if (this.props.userAddr.ownernames.length)
        userOwnernames = Helpers.uniq(this.props.userAddr.ownernames);
    }

    const isMobile = Browser.isMobile();

    const formatPrice = new Intl.NumberFormat(this.props.i18n._language || "en");

    const streetView = (
      <LazyLoadWhenVisible>
        <StreetView addr={this.props.addr} />
      </LazyLoadWhenVisible>
    );

    // console.log(showContent);

    return (
      <CSSTransition in={!isMobile || this.props.mobileShow} timeout={500} classNames="DetailView">
        <div className={`DetailView`}>
          {/* <div className={`DetailView ${(!this.props.addr && isMobile) ? 'DetailView__hide' : 'DetailView__show'}`}> */}
          <div className="DetailView__wrapper">
            {this.props.addr && (
              <div className="DetailView__card card">
                <div className="DetailView__mobilePortfolioView">
                  <button onClick={() => this.props.onCloseDetail()}>
                    &#10229; <Trans render="span">View portfolio map</Trans>
                  </button>
                </div>
                <div className="card-image show-lg">{streetView}</div>
                <div className="columns main-content-columns">
                  <div className="column col-lg-12 col-7">
                    <div className="card-header">
                      <h4 className="card-title">
                        <Trans>BUILDING:</Trans> {this.props.addr.housenumber}{" "}
                        {Helpers.titleCase(this.props.addr.streetname)},{" "}
                        {Helpers.titleCase(this.props.addr.boro)}
                      </h4>
                      {!Helpers.addrsAreEqual(this.props.addr, this.props.userAddr) && (
                        <a // eslint-disable-line jsx-a11y/anchor-is-valid
                          onClick={() => this.setState({ showCompareModal: true })}
                        >
                          <Trans render="i">
                            How is this building associated to this portfolio?
                          </Trans>
                        </a>
                      )}
                    </div>
                    <div className="card-body">
                      <BuildingStatsTable addr={this.props.addr} />
                      <div className="card-body-timeline-link">
                        <Link
                          to={this.props.generateBaseUrl() + "/timeline"}
                          className="btn btn-primary btn-block"
                          onClick={() => {
                            window.gtag("event", "view-data-over-time-overview-tab");
                          }}
                        >
                          <Trans render="span">View data over time</Trans> &#8599;&#xFE0E;
                        </Link>
                      </div>
                      <div className="card-body-landlord">
                        <div className="columns">
                          <div className="column col-xs-12 col-6">
                            <b>
                              <Trans>Business Entities</Trans>
                            </b>
                            <ul>
                              {this.props.addr.corpnames &&
                                this.props.addr.corpnames.map((corp, idx) => (
                                  <li key={idx}>{corp}</li>
                                ))}
                            </ul>
                          </div>
                          <div className="column col-xs-12 col-6">
                            <b>
                              <Trans>Business Addresses</Trans>
                            </b>
                            <ul>
                              {this.props.addr.businessaddrs &&
                                this.props.addr.businessaddrs.map((rba, idx) => (
                                  <li key={idx}>{rba}</li>
                                ))}
                            </ul>
                          </div>
                        </div>
                        <div>
                          <b>
                            <Trans>People</Trans>
                          </b>
                          <ul>
                            {ownernames.map((owner, idx) => (
                              <li key={idx}>
                                {owner.title.split(/(?=[A-Z])/).join(" ")}: {owner.value}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="card-body-registration">
                        <p>
                          <b>
                            <Trans>Last registered:</Trans>
                          </b>{" "}
                          {Helpers.formatDate(
                            this.props.addr.lastregistrationdate,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                            this.props.i18n._language || "en"
                          )}
                          {this.state.todaysDate > new Date(this.props.addr.registrationenddate) ? (
                            <span className="text-danger">
                              {" "}
                              <Trans>
                                (expired{" "}
                                {Helpers.formatDate(
                                  this.props.addr.registrationenddate,
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  },
                                  this.props.i18n._language || "en"
                                )}
                                )
                              </Trans>
                            </span>
                          ) : (
                            <span>
                              {" "}
                              <Trans>
                                (expires{" "}
                                {Helpers.formatDate(
                                  this.props.addr.registrationenddate,
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  },
                                  this.props.i18n._language || "en"
                                )}
                                )
                              </Trans>
                            </span>
                          )}
                        </p>
                        {this.props.addr.lastsaledate &&
                          this.props.addr.lastsaleamount &&
                          this.props.addrs && (
                            <p>
                              <b>
                                <Trans>Last sold:</Trans>
                              </b>{" "}
                              <>
                                {Helpers.formatDate(
                                  this.props.addr.lastsaledate,
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  },
                                  this.props.i18n._language || "en"
                                )}{" "}
                                <Trans>
                                  for ${formatPrice.format(this.props.addr.lastsaleamount)}
                                </Trans>
                                {this.props.addr.lastsaleacrisid &&
                                  isPartOfGroupSale(
                                    this.props.addr.lastsaleacrisid,
                                    this.props.addrs
                                  ) && (
                                    <>
                                      {" "}
                                      <Trans>(as part of a group sale)</Trans>
                                    </>
                                  )}
                              </>
                            </p>
                          )}
                      </div>

                      <div className="card-body-prompt hide-lg">
                        <h6 className="DetailView__subtitle">
                          <Trans>Are you having issues in this building?</Trans>
                        </h6>
                        <a
                          onClick={() => {
                            window.gtag("event", "take-action-overview-tab");
                          }}
                          href={takeActionURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-justfix btn-block"
                        >
                          <Trans>Take action on JustFix.nyc!</Trans>
                        </a>
                      </div>

                      <div className="card-body-social social-group hide-lg">
                        <h6 className="DetailView__subtitle">
                          <Trans>Share this page with your neighbors</Trans>
                        </h6>
                        <SocialSharePortfolio
                          location="overview-tab"
                          addr={this.props.addr}
                          buildings={this.props.portfolioSize}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="column col-lg-12 col-5">
                    <div className="card-image hide-lg">{streetView}</div>
                    <div className="card-body column-right">
                      <div className="card-body-resources">
                        <span className="card-body-resources__title show-lg">
                          <Trans render="em">Useful links</Trans>
                        </span>

                        <div className="card-body-links">
                          <h6 className="DetailView__subtitle hide-lg">
                            <Trans>Useful links</Trans>
                          </h6>
                          <div className="columns">
                            <div className="column col-12">
                              <a
                                onClick={() => {
                                  window.gtag("event", "acris-overview-tab");
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
                                  window.gtag("event", "hpd-overview-tab");
                                }}
                                href={`https://hpdonline.hpdnyc.org/HPDonline/Provide_address.aspx?p1=${boro}&p2=${
                                  this.props.addr.housenumber
                                }&p3=${Helpers.formatStreetNameForHpdLink(
                                  this.props.addr.streetname
                                )}&SearchButton=Search`}
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
                                  window.gtag("event", "dob-overview-tab");
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
                                  window.gtag("event", "dof-overview-tab");
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
                                  window.gtag("event", "dap-overview-tab");
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

                        <div className="card-body-prompt show-lg">
                          <h6 className="DetailView__subtitle">
                            <Trans>Are you having issues in this building?</Trans>
                          </h6>
                          <a
                            href={takeActionURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-justfix btn-block"
                          >
                            <Trans>Take action on JustFix.nyc!</Trans>
                          </a>
                        </div>

                        <div className="card-body-social social-group show-lg">
                          <h6 className="DetailView__subtitle">
                            <Trans>Share this page with your neighbors</Trans>
                          </h6>
                          <SocialSharePortfolio
                            location="overview-tab"
                            addr={this.props.addr}
                            buildings={this.props.portfolioSize}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {this.props.addr && (
              <Modal
                showModal={this.state.showCompareModal}
                width={70}
                onClose={() => this.setState({ showCompareModal: false })}
              >
                <h6>
                  <Trans render="b">How is this building associated to this portfolio?</Trans>
                </h6>
                <Trans render="p">
                  We compare your search address with a database of over 200k buildings to identify
                  a landlord or management company's portfolio. To learn more, check out{" "}
                  <LocaleLink to="/how-it-works">our methodology</LocaleLink>.
                </Trans>
                <table className="DetailView__compareTable">
                  <thead>
                    <tr>
                      <th>
                        {this.props.userAddr.housenumber} {this.props.userAddr.streetname},{" "}
                        {this.props.userAddr.boro}
                      </th>
                      <th>
                        {this.props.addr.housenumber} {this.props.addr.streetname},{" "}
                        {this.props.addr.boro}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div>
                          <Trans>Business Entities</Trans>
                        </div>
                        <ul>
                          {this.props.userAddr.corpnames &&
                            this.props.userAddr.corpnames.map((corp, idx) => (
                              <li key={idx}>{corp}</li>
                            ))}
                        </ul>
                      </td>
                      <td>
                        <div>
                          <Trans>Business Entities</Trans>
                        </div>
                        <ul>
                          {this.props.addr.corpnames &&
                            this.props.addr.corpnames.map((corp, idx) => <li key={idx}>{corp}</li>)}
                        </ul>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div>
                          <Trans>Business Addresses</Trans>
                        </div>
                        <ul>
                          {this.props.userAddr.businessaddrs &&
                            this.props.userAddr.businessaddrs.map((rba, idx) => (
                              <li key={idx}>{rba}</li>
                            ))}
                        </ul>
                      </td>
                      <td>
                        <div>
                          <Trans>Business Addresses</Trans>
                        </div>
                        <ul>
                          {this.props.addr.businessaddrs &&
                            this.props.addr.businessaddrs.map((rba, idx) => (
                              <li key={idx}>{rba}</li>
                            ))}
                        </ul>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div>
                          <Trans>People</Trans>
                        </div>
                        <ul>
                          {userOwnernames.map((owner, idx) => (
                            <li key={idx}>
                              {owner.title.split(/(?=[A-Z])/).join(" ")}: {owner.value}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td>
                        <div>
                          <Trans>People</Trans>
                        </div>
                        <ul>
                          {ownernames.map((owner, idx) => (
                            <li key={idx}>
                              {owner.title.split(/(?=[A-Z])/).join(" ")}: {owner.value}
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Modal>
            )}
          </div>
        </div>
      </CSSTransition>
    );
  }
}

const DetailView = withI18n()(DetailViewWithoutI18n);

export default DetailView;
