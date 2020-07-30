import React, { Component } from "react";
import { LocaleLink as Link } from "../i18n";

import "styles/NotRegisteredPage.css";
import { Trans } from "@lingui/macro";
import { createRouteForAddressPage, getSiteOrigin, AddressPageUrlParams } from "../routes";
import Modal from "../components/Modal";
import LegalFooter from "../components/LegalFooter";
import Helpers, { assertNotUndefined } from "../util/helpers";
import SocialShare from "../components/SocialShare";
import { Nobr } from "../components/Nobr";
import { WithMachineProps } from "state-machine";

type Props = WithMachineProps;

type State = {
  showModal: boolean;
};

export const SocialShareForNotRegisteredPage = (props: { addr?: AddressPageUrlParams | null }) => (
  <div className="social-share">
    <p>
      <Trans>Share this page with your neighbors</Trans>
    </p>
    <SocialShare
      location="not-registered-page"
      url={props.addr ? `${getSiteOrigin()}${createRouteForAddressPage(props.addr)}` : undefined}
    />
  </div>
);

export default class NotRegisteredPage extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      showModal: false,
    };
  }

  render() {
    const { searchAddrParams, searchAddrBbl } = this.props.state.context;
    const buildingInfo = assertNotUndefined(this.props.state.context.buildingInfo);
    const { boro, block, lot } = Helpers.splitBBL(assertNotUndefined(searchAddrBbl));

    const usersInputAddress = searchAddrParams
      ? {
          boro: searchAddrParams.boro,
          housenumber: searchAddrParams.housenumber || " ",
          streetname: searchAddrParams.streetname,
        }
      : buildingInfo
      ? {
          boro: buildingInfo.boro,
          housenumber: buildingInfo.housenumber || " ",
          streetname: buildingInfo.streetname || " ",
        }
      : null;

    const failedToRegisterLink = (
      <div className="text-center">
        <button className="is-link" onClick={() => this.setState({ showModal: true })}>
          <Trans>What happens if the landlord has failed to register?</Trans>
        </button>
      </div>
    );

    const bblDash = (
      <span className="unselectable" unselectable="on">
        -
      </span>
    );

    let buildingTypeMessage;

    const generalBldgCat = buildingInfo && buildingInfo.bldgclass.replace(/[0-9]/g, "");
    switch (generalBldgCat) {
      case "B":
        buildingTypeMessage = (
          <div>
            <h6 className="mt-10 text-center text-bold text-large">
              <p className="text-center">
                <Trans>
                  This seems like a smaller residential building. If the landlord doesn't reside
                  there, it should be registered with HPD.
                </Trans>{" "}
                <Nobr>
                  (
                  <i>
                    <a
                      href={`http://www1.nyc.gov/assets/finance/jump/hlpbldgcode.html#${generalBldgCat.charAt(
                        0
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Trans>Building Classification</Trans>
                    </a>
                    : {buildingInfo.bldgclass}
                  </i>
                  )
                </Nobr>
              </p>
            </h6>
            {failedToRegisterLink}
          </div>
        );
        break;
      case "C":
        buildingTypeMessage = (
          <div>
            <h6 className="mt-10 text-center text-bold text-large">
              <p className="text-center">
                <Trans render="b">This building seems like it should be registered with HPD!</Trans>{" "}
                <Nobr>
                  (
                  <i>
                    <a
                      href={`http://www1.nyc.gov/assets/finance/jump/hlpbldgcode.html#${generalBldgCat.charAt(
                        0
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Trans>Building Classification</Trans>
                    </a>
                    : {buildingInfo.bldgclass}
                  </i>
                  )
                </Nobr>
              </p>
            </h6>
            {failedToRegisterLink}
          </div>
        );
        break;
      default:
        buildingTypeMessage = (
          <h6 className="mt-10 text-center text-bold text-large">
            <p className="text-center">
              <Trans>It doesn't seem like this property is required to register with HPD.</Trans>{" "}
              <Nobr>
                (
                <i>
                  <a
                    href={`http://www1.nyc.gov/assets/finance/jump/hlpbldgcode.html#${generalBldgCat.charAt(
                      0
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Trans render="u">Building Classification</Trans>
                  </a>
                  : {buildingInfo.bldgclass}
                </i>
                )
              </Nobr>
            </p>
          </h6>
        );
        break;
    }

    // if (!geosearch && !buildingInfo) {
    //   return (
    //     <div className="NotRegisteredPage Page">
    //       <div className="HomePage__content">
    //         <div className="HomePage__search">
    //           <h5 className="mt-10 text-danger text-center text-bold text-large">
    //             <Trans>No address found</Trans>
    //           </h5>
    //         </div>
    //         `
    //       </div>
    //     </div>
    //   );
    // }

    const usersInputAddressFragment = usersInputAddress ? (
      <>
        {usersInputAddress.housenumber === " " ? "" : usersInputAddress.housenumber + " "}
        {usersInputAddress.streetname !== " " && usersInputAddress.streetname}
      </>
    ) : null;

    return (
      <div className="NotRegisteredPage Page">
        <div className="HomePage__content">
          <div className="HomePage__search">
            <h5 className="mt-10 text-danger text-center text-bold text-large">
              {usersInputAddress ? (
                <Trans>No registration found for {usersInputAddressFragment}!</Trans>
              ) : (
                <Trans>No registration found!</Trans>
              )}
            </h5>
            {buildingTypeMessage}
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
              <div>
                <Trans render="p">Useful links</Trans>
                <div>
                  <div className="btn-group btn-group-block">
                    <a
                      href={`http://a836-acris.nyc.gov/bblsearch/bblsearch.asp?borough=${boro}&block=${block}&lot=${lot}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                    >
                      <Trans>View documents on ACRIS</Trans> &#8599;
                    </a>
                    <a
                      href={`http://webapps.nyc.gov:8084/CICS/fin1/find001i?FFUNC=C&FBORO=${boro}&FBLOCK=${block}&FLOT=${lot}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                    >
                      <Trans>DOF Property Tax Bills</Trans> &#8599;
                    </a>
                  </div>
                  <div className="btn-group btn-group-block">
                    <a
                      href={`http://a810-bisweb.nyc.gov/bisweb/PropertyProfileOverviewServlet?boro=${boro}&block=${block}&lot=${lot}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                    >
                      <Trans>DOB Building Profile</Trans> &#8599;
                    </a>
                    <a
                      href={`https://portal.displacementalert.org/property/${boro}${block}${lot}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                    >
                      <Trans>ANHD DAP Portal</Trans> &#8599;
                    </a>
                  </div>
                </div>
              </div>

              <SocialShareForNotRegisteredPage addr={usersInputAddress} />
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
                <Trans render="li">Unable to initiate a court action for nonpayment of rent.</Trans>
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
    );
  }
}
