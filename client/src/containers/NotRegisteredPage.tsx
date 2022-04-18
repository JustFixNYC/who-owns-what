import React, { Component } from "react";
import { LocaleLink as Link } from "../i18n";

import "styles/NotRegisteredPage.css";
import { Trans } from "@lingui/macro";
import Modal from "../components/Modal";
import LegalFooter from "../components/LegalFooter";
import { withI18n, withI18nProps } from "@lingui/react";
import Helpers, { longDateOptions } from "../util/helpers";
import { defaultLocale, SupportedLocale } from "../i18n-base";
import SocialShare from "../components/SocialShare";
import { Nobr } from "../components/Nobr";
import { withMachineInStateProps } from "state-machine";
import Page from "components/Page";
import { UsefulLinks } from "components/UsefulLinks";

type Props = withI18nProps & withMachineInStateProps<"unregisteredFound">;

type State = {
  showModal: boolean;
};

const getTodaysDate = () => new Date();

export const SocialShareForNotRegisteredPage = () => (
  <div className="social-share">
    <p>
      <Trans>Share this page with your neighbors</Trans>
    </p>
    <SocialShare location="not-registered-page" />
  </div>
);

class NotRegisteredPageWithoutI18n extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      showModal: false,
    };
  }

  render() {
    const { state, i18n } = this.props;
    const { searchAddrParams, searchAddrBbl, buildingInfo } = state.context;

    const { boro, block, lot } = Helpers.splitBBL(searchAddrBbl);

    const locale = (i18n.language as SupportedLocale) || defaultLocale;

    /**
     * This is the address that will show up in the top header of the page.
     * If the user didn't enter an address themselves (i.e. they are redirected to this page
     * directly from a BBL-based url), we will fall back on the buildingInfo SQL query to grab
     * a standard address for the property they are searching.
     */
    const usersInputAddress = searchAddrBbl
      ? {
          bbl: searchAddrBbl,
          housenumber: searchAddrParams?.housenumber || buildingInfo?.housenumber || " ",
          streetname: searchAddrParams?.streetname || buildingInfo?.streetname || " ",
        }
      : null;

    const bblDash = (
      <span className="unselectable" unselectable="on">
        -
      </span>
    );

    const usersInputAddressFragment = usersInputAddress ? (
      <>
        {usersInputAddress.housenumber === " " ? "" : usersInputAddress.housenumber + " "}
        {usersInputAddress.streetname !== " " && usersInputAddress.streetname}
      </>
    ) : null;

    const registrationMissingOrExpired =
      !buildingInfo.registrationenddate ||
      getTodaysDate() > new Date(buildingInfo.registrationenddate);

    let registrationMessageText;

    if (!usersInputAddress) {
      registrationMessageText = <Trans>No registration found.</Trans>;
    } else if (buildingInfo.registrationenddate) {
      registrationMessageText = (
        <Trans>Incomplete registration for {usersInputAddressFragment}.</Trans>
      );
    } else {
      registrationMessageText = (
        <Trans>No registration found for {usersInputAddressFragment}.</Trans>
      );
    }

    let buildingTypeMessageText;

    if (buildingInfo.unitsres === 0) {
      buildingTypeMessageText = (
        <Trans>
          <b>This property is not required to register with HPD</b> because it doesn't have any
          residential units.
        </Trans>
      );
    } else if (buildingInfo.unitsres < 3) {
      buildingTypeMessageText = (
        <Trans>
          <b>If the landlord doesn't reside here, this property should be registered with HPD</b>{" "}
          because it has fewer than 3 residential units.
        </Trans>
      );
    } else if (buildingInfo.unitsres >= 3) {
      buildingTypeMessageText = (
        <Trans>
          <b>This property should be registered with HPD</b> because it has more than 2 residential
          units.
        </Trans>
      );
    }

    const formattedLastRegDate = Helpers.formatDate(
      buildingInfo.lastregistrationdate,
      longDateOptions,
      locale
    );

    const formattedRegEndDate = Helpers.formatDate(
      buildingInfo.registrationenddate,
      longDateOptions,
      locale
    );

    const lastRegisteredDates = buildingInfo.registrationenddate ? (
      <div className="card-body-registration text-center">
        {buildingInfo.lastregistrationdate ? (
          <p>
            <b>
              <Trans>Last registered:</Trans>
            </b>{" "}
            {formattedLastRegDate}
            <span className="text-danger">
              {" "}
              <Trans>(expired {formattedRegEndDate})</Trans>
            </span>
          </p>
        ) : (
          <p>
            <b>
              <Trans>Registration expired:</Trans>
            </b>{" "}
            <span className="text-danger"> {formattedRegEndDate}</span>
          </p>
        )}
      </div>
    ) : (
      <></>
    );

    const failedToRegisterLink = (
      <div className="text-center">
        <button className="is-link" onClick={() => this.setState({ showModal: true })}>
          <Trans>What happens if the landlord has failed to register?</Trans>
        </button>
      </div>
    );

    return (
      <Page
        title={searchAddrParams && `${searchAddrParams.housenumber} ${searchAddrParams.streetname}`}
      >
        <div className="NotRegisteredPage Page">
          <div className="HomePage__content">
            <div className="HomePage__search">
              <h5 className="mt-10 text-center text-bold text-large">{registrationMessageText}</h5>
              {buildingInfo.registrationenddate && (
                <p className="text-center">
                  <Trans>
                    The registration for this property is missing details for owner name or
                    businesses address, which are required to link the property to a portfolio.
                  </Trans>
                </p>
              )}
              {registrationMissingOrExpired && (
                <div>
                  <p className="text-center">{buildingTypeMessageText}</p>
                </div>
              )}
              {registrationMissingOrExpired && buildingInfo.unitsres > 0 && (
                <>
                  {lastRegisteredDates}
                  {failedToRegisterLink}
                </>
              )}
              <div className="wrapper">
                {buildingInfo && buildingInfo.latitude && buildingInfo.longitude && (
                  <img
                    src={`https://maps.googleapis.com/maps/api/streetview?size=800x200&location=${buildingInfo.latitude},${buildingInfo.longitude}&key=${process.env.REACT_APP_STREETVIEW_API_KEY}`}
                    alt="Google Street View"
                    className="streetview img-responsive"
                  />
                )}
                <div className="bbl-link">
                  <span>
                    Boro-Block-Lot (BBL):{" "}
                    <Nobr>
                      <a
                        href={"https://zola.planning.nyc.gov/lot/" + boro + "/" + block + "/" + lot}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {boro}
                        {bblDash}
                        {block}
                        {bblDash}
                        {lot}
                      </a>
                    </Nobr>
                  </span>
                </div>
                <br />
                {usersInputAddress && (
                  <UsefulLinks addrForLinks={usersInputAddress} location="not-registered-page" />
                )}
                <SocialShareForNotRegisteredPage />
                <br />
                <br />
                <Link className="btn btn-primary btn-block" to="/">
                  &lt;-- <Trans>Search for a different address</Trans>
                </Link>
              </div>
              <Modal
                width={60}
                showModal={this.state.showModal}
                onClose={() => this.setState({ showModal: false })}
              >
                <Trans render="h5">Failure to register a building with HPD</Trans>
                <Trans render="p">
                  Buildings without valid property registration are subject to the following:
                </Trans>
                <ul>
                  <Trans render="li">Civil penalties of $250-$500</Trans>
                  <Trans render="li">May be issued official Orders</Trans>
                  <Trans render="li">Ineligible to certify violations</Trans>
                  <Trans render="li">Unable to request Code Violation Dismissals</Trans>
                  <Trans render="li">
                    Unable to initiate a court action for nonpayment of rent.
                  </Trans>
                </ul>
                <a
                  className="btn"
                  href="https://www1.nyc.gov/site/hpd/services-and-information/register-your-property.page"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Trans>Click here to learn more.</Trans> &#8599;
                </a>
              </Modal>
            </div>
          </div>
          <LegalFooter />
        </div>
      </Page>
    );
  }
}

const NotRegisteredPage = withI18n()(NotRegisteredPageWithoutI18n);

export default NotRegisteredPage;
