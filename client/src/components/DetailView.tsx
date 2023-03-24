import React, { Component } from "react";
import { CSSTransition } from "react-transition-group";
import { StreetView } from "./StreetView";
import { LazyLoadWhenVisible } from "./LazyLoadWhenVisible";
import Helpers, { longDateOptions } from "../util/helpers";
import Browser from "../util/browser";
import Modal from "../components/Modal";

import "styles/DetailView.css";
import { withI18n, withI18nProps, I18n } from "@lingui/react";
import { t, Trans } from "@lingui/macro";
import { SocialShareAddressPage } from "./SocialShare";
import { isPartOfGroupSale } from "./PropertiesList";
import { Link, useLocation } from "react-router-dom";
import { LocaleLink } from "../i18n";
import BuildingStatsTable from "./BuildingStatsTable";
import { createWhoOwnsWhatRoutePaths, AddressPageRoutes } from "../routes";
import { defaultLocale, SupportedLocale } from "../i18n-base";
import { withMachineInStateProps } from "state-machine";
import { Accordion } from "./Accordion";
import { UsefulLinks } from "./UsefulLinks";
import _groupBy from "lodash/groupBy";
import { HpdContactAddress, HpdFullContact } from "./APIDataTypes";
import { isLegacyPath } from "./WowzaToggle";
import { logAmplitudeEvent } from "./Amplitude";
import EmailAlertSignup from "./EmailAlertSignup";

type Props = withI18nProps &
  withMachineInStateProps<"portfolioFound"> & {
    mobileShow: boolean;
    onOpenDetail: () => void;
    onCloseDetail: () => void;
    addressPageRoutes: AddressPageRoutes;
  };

type State = {
  showCompareModal: boolean;
};

const NUM_COMPLAINT_TYPES_TO_SHOW = 3;

const getTodaysDate = () => new Date();

const SocialShareDetailView = () => (
  <SocialShareAddressPage
    location="overview-tab"
    customContent={{
      tweet: t`I used #WhoOwnsWhat (built by @JustFixNYC) to see not only the open violations in this building, but also rent stabilized losses, evictions, and more. This website is a wealth of info and costs nothing to use. Savvy New Yorkers need this info: `,
      emailSubject: t`Check out the issues in this building`,
      getEmailBody: (url: string) =>
        t`I just looked up this building on Who Owns What, a free tool built by JustFix to make data on landlords and evictors more transparent to tenants. You might want to look up your building. Check it out here: ${url}`,
    }}
  />
);

/**
 * A set of HpdFullContacts grouped by contact name. Will contain exactly one name but can contain
 * one or many full contact entries (with title and address) that have the same matching name.
 */
type GroupedContact = [
  string, // Contact name
  HpdFullContact[] // Array of all contact entries with the same name
];

/**
 * This comparison function, to be used inside the Array.sort() method,
 * prioritizes head officers and owners when sorting an array of grouped HPD contacts
 */
const sortContactsByImportance = (contact: GroupedContact) =>
  contact[1].find((o) => o.title === "HeadOfficer" || o.title.includes("Owner")) ? -1 : 0;

const FormattedContactAddress: React.FC<{ address: HpdContactAddress }> = ({ address }) => {
  const formattedAddress = Helpers.formatHpdContactAddress(address);
  return (
    <>
      <br />
      {formattedAddress.addressLine1}
      <br />
      {formattedAddress.addressLine2}
    </>
  );
};

const HpdContactCard: React.FC<{ contact: GroupedContact; onClick?: () => void }> = ({
  contact,
  onClick,
}) => (
  <I18n>
    {({ i18n }) => (
      <Accordion title={contact[0]} onClick={onClick}>
        {contact[1].map((info, j) => (
          <div className="landlord-contact-info" key={j}>
            <span className="text-bold text-dark">
              {Helpers.translateContactTitleAndIncludeEnglish(info.title, i18n)}
            </span>
            {info.address && <FormattedContactAddress address={info.address} />}
          </div>
        ))}
      </Accordion>
    )}
  </I18n>
);

const LearnMoreAccordion = () => {
  const { pathname } = useLocation();
  const { about, legacy } = createWhoOwnsWhatRoutePaths();
  return (
    <I18n>
      {({ i18n }) => (
        <Accordion
          title={i18n._(t`Learn more`)}
          titleOnOpen={i18n._(t`Close`)}
          onClick={() => {
            logAmplitudeEvent("whoIsLandlordAccordian");
            window.gtag("event", "who-is-landlord-accordian");
          }}
        >
          <br />
          <Trans>
            <p>
              While the legal owner of a building is often a company (usually called an “LLC”),
              these names and business addresses registered with HPD offer a clearer picture of who
              really controls the building.
            </p>
            <p>
              People listed here as “Head Officer” or “Owner” usually have ties to building
              ownership, while “Site Managers” are part of management. That being said, these names
              are self reported by the landlord, so they can be misleading.
            </p>
            <p>
              Learn more about HPD registrations and how this information powers this tool on the{" "}
              <LocaleLink
                to={isLegacyPath(pathname) ? legacy.about : about}
                onClick={() => {
                  window.gtag("event", "about-page-overview-tab");
                }}
              >
                About page
              </LocaleLink>
              .
            </p>
          </Trans>
        </Accordion>
      )}
    </I18n>
  );
};

const HowIsBldgAssociatedHeader = () => (
  <Trans>How is this building associated to this portfolio?</Trans>
);

const HowIsBldgAssociatedDescription = () => {
  const { pathname } = useLocation();
  const { methodology, legacy } = createWhoOwnsWhatRoutePaths();
  return (
    <Trans render="p">
      We compare your search address with a database of over 200k buildings to identify a landlord
      or management company's portfolio. To learn more, check out{" "}
      <LocaleLink to={isLegacyPath(pathname) ? legacy.methodology : methodology}>
        our methodology
      </LocaleLink>
      .
    </Trans>
  );
};
class DetailViewWithoutI18n extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      showCompareModal: false,
    };
  }

  componentDidMount() {
    this.props.onOpenDetail();
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    // scroll to top of wrapper div:
    const wrapper = document.querySelector(".DetailView__wrapper");
    if (wrapper) wrapper.scrollTop = 0;
  }

  render() {
    const isMobile = Browser.isMobile();
    const { i18n, state } = this.props;
    const locale = (i18n.language as SupportedLocale) || defaultLocale;
    const { useNewPortfolioMethod, portfolioData } = state.context;
    const { assocAddrs, detailAddr, searchAddr } = portfolioData;

    // Let's save some variables that will be helpful in rendering the front-end component
    let takeActionURL, formattedRegEndDate, streetViewAddr, ownernames, userOwnernames;

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

    const streetView = streetViewAddr ? (
      <LazyLoadWhenVisible>
        <StreetView addr={streetViewAddr} />
      </LazyLoadWhenVisible>
    ) : (
      <></>
    );

    return (
      <CSSTransition in={!isMobile || this.props.mobileShow} timeout={500} classNames="DetailView">
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
                      {!Helpers.addrsAreEqual(detailAddr, searchAddr) &&
                        (useNewPortfolioMethod ? (
                          <Link to={this.props.addressPageRoutes.summary}>
                            <i>
                              <HowIsBldgAssociatedHeader />
                            </i>
                          </Link>
                        ) : (
                          <a // eslint-disable-line jsx-a11y/anchor-is-valid
                            onClick={() => this.setState({ showCompareModal: true })}
                          >
                            <i>
                              <HowIsBldgAssociatedHeader />
                            </i>
                          </a>
                        ))}
                    </div>
                    <div className="card-body">
                      <BuildingStatsTable addr={detailAddr} />
                      <EmailAlertSignup bbl={detailAddr.bbl} />
                      <div className="card-body-timeline-link">
                        <Link
                          to={this.props.addressPageRoutes.timeline}
                          className="btn btn-primary btn-block"
                          onClick={() => {
                            window.gtag("event", "view-data-over-time-overview-tab");
                          }}
                        >
                          <Trans render="span">View data over time &#8599;&#xFE0E;</Trans>
                        </Link>
                      </div>
                      <div className="card-body-complaints">
                        <div>
                          <b>
                            <Trans>Most Common 311 Complaints, Last 3 Years</Trans>
                          </b>
                          <ul>
                            {detailAddr.recentcomplaintsbytype ? (
                              detailAddr.recentcomplaintsbytype
                                .slice(0, NUM_COMPLAINT_TYPES_TO_SHOW)
                                .map((complaint, idx) => (
                                  <li key={idx}>
                                    {Helpers.translateComplaintType(
                                      complaint.type,
                                      this.props.i18n
                                    )}{" "}
                                    ({complaint.count})
                                  </li>
                                ))
                            ) : (
                              <Trans>None</Trans>
                            )}
                          </ul>
                        </div>
                      </div>
                      {detailAddr.allcontacts && (
                        <div className="card-body-landlord">
                          <div className="card-title-landlord">
                            <b>
                              <Trans>Who’s the landlord of this building?</Trans>
                            </b>
                            <LearnMoreAccordion />
                          </div>
                          <div>
                            {
                              // Group all contact info by the name of each person/corporate entity
                              Object.entries(_groupBy(detailAddr.allcontacts, "value"))
                                .sort(sortContactsByImportance)
                                .map((contact, i) => (
                                  <HpdContactCard
                                    contact={contact}
                                    key={i}
                                    onClick={() => {
                                      logAmplitudeEvent("detailsOpenContactCard");
                                      window.gtag("event", "details-open-contact-card");
                                    }}
                                  />
                                ))
                            }
                          </div>
                          <div className="card-footer-landlord">
                            <LearnMoreAccordion />
                          </div>
                        </div>
                      )}
                      {detailAddr.lastsaledate &&
                        detailAddr.lastsaledate > detailAddr.registrationenddate && (
                          <p className="text-danger text-italic">
                            <Trans>
                              Warning: This building has an expired registration and was sold after
                              the expiration date. The landlord info listed here may be outdated.
                            </Trans>
                          </p>
                        )}
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
                    </div>
                  </div>
                  <div className="column col-lg-12 col-5">
                    <div className="card-image hide-lg">{streetView}</div>
                    <div className="card-body column-right">
                      <UsefulLinks addrForLinks={detailAddr} location="overview-tab" />
                      <div className="card-body-prompt">
                        <h6 className="DetailView__subtitle">
                          <Trans>Are you having issues in this building?</Trans>
                        </h6>
                        <a
                          href={takeActionURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-justfix btn-block"
                        >
                          <Trans>Take action on JustFix.org!</Trans>
                        </a>
                      </div>

                      <div className="card-body-social social-group">
                        <h6 className="DetailView__subtitle">
                          <Trans>Share this page with your neighbors</Trans>
                        </h6>
                        <SocialShareDetailView />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <Modal
              showModal={this.state.showCompareModal}
              width={70}
              onClose={() => this.setState({ showCompareModal: false })}
            >
              <h6>
                <b>
                  <HowIsBldgAssociatedHeader />
                </b>
              </h6>
              <HowIsBldgAssociatedDescription />
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
                              {Helpers.translateContactTitle(owner.title, i18n)}: {owner.value}
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
                              {Helpers.translateContactTitle(owner.title, i18n)}: {owner.value}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Modal>
          </div>
        </div>
      </CSSTransition>
    );
  }
}

const DetailView = withI18n()(DetailViewWithoutI18n);

export default DetailView;
