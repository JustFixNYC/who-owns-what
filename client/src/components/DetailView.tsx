import React, { Component } from "react";
import { CSSTransition } from "react-transition-group";
import { StreetView } from "./StreetView";
import { LazyLoadWhenVisible } from "./LazyLoadWhenVisible";
import Helpers, { longDateOptions } from "../util/helpers";
import Browser from "../util/browser";
import Modal from "../components/Modal";

import "styles/DetailView.css";
import { withI18n, withI18nProps } from "@lingui/react";
import { Trans } from "@lingui/macro";
import { SocialSharePortfolio } from "./SocialShare";
import { isPartOfGroupSale } from "./PropertiesList";
import { Link } from "react-router-dom";
import { LocaleLink } from "../i18n";
import BuildingStatsTable from "./BuildingStatsTable";
import { createWhoOwnsWhatRoutePaths, AddressPageRoutes } from "../routes";
import { AddressRecord } from "./APIDataTypes";
import { SupportedLocale } from "../i18n-base";
import { WithMachineInStateProps } from "state-machine";

type Props = withI18nProps &
  WithMachineInStateProps<"portfolioFound"> & {
    mobileShow: boolean;
    onCloseDetail: () => void;
    addressPageRoutes: AddressPageRoutes;
  };

type State = {
  showCompareModal: boolean;
};

const getTodaysDate = () => new Date();

class DetailViewWithoutI18n extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      showCompareModal: false,
    };
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    // scroll to top of wrapper div:
    const wrapper = document.querySelector(".DetailView__wrapper");
    if (wrapper) wrapper.scrollTop = 0;
  }

  render() {
    const isMobile = Browser.isMobile();
    const locale = (this.props.i18n.language as SupportedLocale) || "en";
    const { assocAddrs, detailAddr, searchAddr } = this.props.state.context.portfolioData;
    const portfolioSize = assocAddrs.length;

    // Let's save some variables that will be helpful in rendering the front-end component
    let boro,
      block,
      lot,
      takeActionURL,
      formattedRegEndDate,
      streetViewAddr,
      ownernames,
      userOwnernames;

    if (detailAddr) {
      ({ boro, block, lot } = Helpers.splitBBL(detailAddr.bbl));

      takeActionURL = Helpers.createTakeActionURL(detailAddr, "detail_view");

      formattedRegEndDate = Helpers.formatDate(
        detailAddr.registrationenddate,
        longDateOptions,
        locale
      );

      streetViewAddr =
        detailAddr.lat && detailAddr.lng
          ? {
              lat: detailAddr.lat,
              lng: detailAddr.lng,
            }
          : null;

      if (detailAddr.ownernames && detailAddr.ownernames.length)
        ownernames = Helpers.uniq(detailAddr.ownernames);

      if (searchAddr.ownernames && searchAddr.ownernames.length)
        userOwnernames = Helpers.uniq(searchAddr.ownernames);
    }

    const streetView = streetViewAddr ? (
      <LazyLoadWhenVisible>
        <StreetView addr={streetViewAddr} />
      </LazyLoadWhenVisible>
    ) : (
      <></>
    );

    return (
      <CSSTransition in={this.props.mobileShow} timeout={500} classNames="DetailView">
        <div className={`DetailView`}>
          <div className="DetailView__wrapper">
            {detailAddr && (
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
                        <Trans>BUILDING:</Trans> {detailAddr.housenumber}{" "}
                        {Helpers.titleCase(detailAddr.streetname)},{" "}
                        {Helpers.titleCase(detailAddr.boro)}
                      </h4>
                      {!Helpers.addrsAreEqual(detailAddr, searchAddr) && (
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
                      <BuildingStatsTable addr={detailAddr} />
                      <div className="card-body-timeline-link">
                        <Link
                          to={this.props.addressPageRoutes.timeline}
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
                              {detailAddr.corpnames &&
                                detailAddr.corpnames.map((corp, idx) => <li key={idx}>{corp}</li>)}
                            </ul>
                          </div>
                          <div className="column col-xs-12 col-6">
                            <b>
                              <Trans>Business Addresses</Trans>
                            </b>
                            <ul>
                              {detailAddr.businessaddrs &&
                                detailAddr.businessaddrs.map((rba, idx) => (
                                  <li key={idx}>{rba}</li>
                                ))}
                            </ul>
                          </div>
                        </div>
                        {ownernames && (
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
                        )}
                      </div>

                      <div className="card-body-registration">
                        <p>
                          <b>
                            <Trans>Last registered:</Trans>
                          </b>{" "}
                          {Helpers.formatDate(
                            detailAddr.lastregistrationdate,
                            longDateOptions,
                            locale
                          )}
                          {getTodaysDate() > new Date(detailAddr.registrationenddate) ? (
                            <span className="text-danger">
                              {" "}
                              <Trans>(expired {formattedRegEndDate})</Trans>
                            </span>
                          ) : (
                            <span>
                              {" "}
                              <Trans>(expires {formattedRegEndDate})</Trans>
                            </span>
                          )}
                        </p>
                        {detailAddr.lastsaledate && detailAddr.lastsaleamount && (
                          <p>
                            <b>
                              <Trans>Last sold:</Trans>
                            </b>{" "}
                            <>
                              {Helpers.formatDate(detailAddr.lastsaledate, longDateOptions, locale)}{" "}
                              <Trans>
                                for ${Helpers.formatPrice(detailAddr.lastsaleamount, locale)}
                              </Trans>
                              {detailAddr.lastsaleacrisid &&
                                isPartOfGroupSale(detailAddr.lastsaleacrisid, assocAddrs) && (
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
                          addr={detailAddr}
                          buildings={portfolioSize}
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
                                  detailAddr.housenumber
                                }&p3=${Helpers.formatStreetNameForHpdLink(
                                  detailAddr.streetname
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
                            addr={detailAddr}
                            buildings={portfolioSize}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {detailAddr && (
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
                  <LocaleLink to={createWhoOwnsWhatRoutePaths().methodology}>
                    our methodology
                  </LocaleLink>
                  .
                </Trans>
                <table className="DetailView__compareTable">
                  <thead>
                    <tr>
                      <th>
                        {searchAddr.housenumber} {searchAddr.streetname}, {searchAddr.boro}
                      </th>
                      <th>
                        {detailAddr.housenumber} {detailAddr.streetname}, {detailAddr.boro}
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
                          {searchAddr.corpnames &&
                            searchAddr.corpnames.map((corp, idx) => <li key={idx}>{corp}</li>)}
                        </ul>
                      </td>
                      <td>
                        <div>
                          <Trans>Business Entities</Trans>
                        </div>
                        <ul>
                          {detailAddr.corpnames &&
                            detailAddr.corpnames.map((corp, idx) => <li key={idx}>{corp}</li>)}
                        </ul>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div>
                          <Trans>Business Addresses</Trans>
                        </div>
                        <ul>
                          {searchAddr.businessaddrs &&
                            searchAddr.businessaddrs.map((rba, idx) => <li key={idx}>{rba}</li>)}
                        </ul>
                      </td>
                      <td>
                        <div>
                          <Trans>Business Addresses</Trans>
                        </div>
                        <ul>
                          {detailAddr.businessaddrs &&
                            detailAddr.businessaddrs.map((rba, idx) => <li key={idx}>{rba}</li>)}
                        </ul>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div>
                          <Trans>People</Trans>
                        </div>
                        {userOwnernames && (
                          <ul>
                            {userOwnernames.map((owner, idx) => (
                              <li key={idx}>
                                {owner.title.split(/(?=[A-Z])/).join(" ")}: {owner.value}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td>
                        <div>
                          <Trans>People</Trans>
                        </div>
                        {ownernames && (
                          <ul>
                            {ownernames.map((owner, idx) => (
                              <li key={idx}>
                                {owner.title.split(/(?=[A-Z])/).join(" ")}: {owner.value}
                              </li>
                            ))}
                          </ul>
                        )}
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
