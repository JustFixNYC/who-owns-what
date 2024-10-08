import React from "react";
import { LocaleLink as Link } from "../i18n";
import Browser from "../util/browser";
import LegalFooter from "../components/LegalFooter";
import Helpers from "../util/helpers";

import "styles/NotRegisteredPage.css";
import { Trans, t } from "@lingui/macro";
import { withI18n, withI18nProps } from "@lingui/react";
import { Nobr } from "../components/Nobr";
import { SocialShareForNotRegisteredPage } from "./NotRegisteredPage";
import { withMachineInStateProps } from "state-machine";
import Page from "components/Page";
import { Link as JFCLLink } from "@justfixnyc/component-library";

type NychaPageProps = withMachineInStateProps<"nychaFound"> & withI18nProps;

const JFCLLinkInternal: React.FC<any> = (props) => {
  return <JFCLLink icon="internal" {...props} />;
};

const NychaPageWithoutI18n: React.FC<NychaPageProps> = (props) => {
  const { i18n, state } = props;

  const { searchAddrParams, searchAddrBbl, buildingInfo } = state.context;
  const { boro, block, lot } = Helpers.splitBBL(searchAddrBbl);

  const bblDash = (
    <span className="unselectable" unselectable="on">
      -
    </span>
  );

  const boroData =
    boro === "1"
      ? {
          boroName: "Manhattan",
          boroOfficeAddress1: "1980 Lexington Ave #1",
          boroOfficeAddress2: "New York, NY 10035",
          boroOfficePhone: "(917) 206-3500",
        }
      : boro === "2"
      ? {
          boroName: "Bronx",
          boroOfficeAddress1: "1200 Water Pl, Suite #200",
          boroOfficeAddress2: "Bronx, NY 10461",
          boroOfficePhone: "(718) 409-8626",
        }
      : boro === "3"
      ? {
          boroName: "Brooklyn",
          boroOfficeAddress1: "816 Ashford St",
          boroOfficeAddress2: "Brooklyn, NY 11207",
          boroOfficePhone: "(718) 491-6967",
        }
      : boro === "4" || boro === "5"
      ? {
          boroName: "Queens",
          boroOfficeAddress1: "90-20 170th St, 1st Floor",
          boroOfficeAddress2: "Jamaica, NY 11432",
          boroOfficePhone: "(718) 553-4700",
        }
      : null;

  const usersInputAddress =
    searchAddrParams &&
    searchAddrParams.boro &&
    (searchAddrParams.housenumber || searchAddrParams.streetname)
      ? {
          boro: searchAddrParams.boro,
          housenumber: searchAddrParams.housenumber || " ",
          streetname: searchAddrParams.streetname || " ",
        }
      : buildingInfo && buildingInfo.boro && (buildingInfo.housenumber || buildingInfo.streetname)
      ? {
          boro: buildingInfo.boro,
          housenumber: buildingInfo.housenumber || " ",
          streetname: buildingInfo.streetname || " ",
        }
      : null;

  const takeActionURL = Helpers.createTakeActionURL(usersInputAddress, "nycha_page");

  return (
    <Page
      title={searchAddrParams && `${searchAddrParams.housenumber} ${searchAddrParams.streetname}`}
    >
      <div className="NotRegisteredPage Page">
        <div className="HomePage__content">
          <div className="HomePage__search">
            <h5 className="mt-4 text-center text-bold text-large">
              {buildingInfo.nycha_development}: <Trans>Public Housing Development</Trans>
            </h5>
            <h6 className="mt-4 text-center text-bold text-large">
              <Trans>This building is owned by the NYC Housing Authority (NYCHA)</Trans>
            </h6>
            <div className="wrapper">
              <div className="card-body">
                <div className="card-body-table">
                  <div className="table-row">
                    <div title={i18n._(t`The city borough where your search address is located`)}>
                      <Trans render="label">Borough</Trans>
                      {boroData && boroData.boroName}
                    </div>
                    <div
                      title={i18n._(
                        t`The number of residential units across all buildings in this development, according to the Dept. of City Planning.`
                      )}
                    >
                      <Trans render="label">Units</Trans>
                      {buildingInfo.nycha_dev_unitsres || 0}
                    </div>
                    <div
                      title={i18n._(
                        t`Evictions executed in this development by NYC Marshals since 2017. ANHD and the Housing Data Coalition cleaned, geocoded, and validated the data, originally sourced from DOI.`
                      )}
                    >
                      <Trans render="label">Evictions</Trans>
                      {buildingInfo.nycha_dev_evictions || 0}
                    </div>
                  </div>
                </div>
                <div className="columns nycha-addresses">
                  {boroData && (
                    <div className="column col-lg-12 col-6">
                      <div
                        title={i18n._(
                          t`The NYCHA office overseeing your borough. Some experts suggest reaching out to Borough Management Offices to advocate for repairs, as they tend to have more administrative power than local management offices.`
                        )}
                      >
                        <Trans render="b">Borough Management Office:</Trans>
                      </div>
                      <ul>
                        <li>
                          {boroData.boroOfficeAddress1}, {boroData.boroOfficeAddress2}
                        </li>
                        <li>
                          {Browser.isMobile() ? (
                            <span>
                              <a
                                href={"tel:+1" + boroData.boroOfficePhone}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {boroData.boroOfficePhone}
                              </a>
                            </span>
                          ) : (
                            <span>{boroData.boroOfficePhone}</span>
                          )}
                        </li>
                      </ul>
                    </div>
                  )}
                  <div className="column col-lg-12 col-6">
                    <div title="The federal HUD office overseeing New York State. Some experts suggest reaching out to the Regional Office to advocate for repairs, as they tend to have more administrative power than local management offices.">
                      <Trans render="b">New York Regional Office:</Trans>
                    </div>
                    <ul>
                      <li>26 Federal Plaza, New York, NY 10278</li>
                      <li>
                        {Browser.isMobile() ? (
                          <span>
                            <a href="tel:+1212-264-1290" target="_blank" rel="noopener noreferrer">
                              (212) 264-1290
                            </a>
                          </span>
                        ) : (
                          <span>(212) 264-1290</span>
                        )}
                      </li>
                      <li>
                        <span>
                          <a
                            href="mailto:complaints_office_02@hud.gov"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            complaints_office_02@hud.gov
                          </a>
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

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
                <ul>
                  <li>
                    <JFCLLink
                      href="https://www.hud.gov/sites/documents/958.PDF"
                      target="_blank"
                      rel="noopener noreferrer"
                      icon="external"
                    >
                      <Trans>HUD Complaint Form 958</Trans>
                    </JFCLLink>
                  </li>
                  <li>
                    <JFCLLink
                      href="https://www.nyc.gov/assets/nycha/downloads/pdf/Block-and-Lot-Guide.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      icon="external"
                    >
                      <Trans>NYCHA Directory</Trans>
                    </JFCLLink>
                  </li>
                  <li>
                    <JFCLLink
                      href="https://www1.nyc.gov/site/nycha/mynycha/mynycha-landing.page"
                      target="_blank"
                      rel="noopener noreferrer"
                      icon="external"
                    >
                      <Trans>MyNYCHA App</Trans>
                    </JFCLLink>
                  </li>
                  <li>
                    <JFCLLink
                      href={`https://portal.displacementalert.org/property/${boro}${block}${lot}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      icon="external"
                    >
                      <Trans>ANHD DAP Portal</Trans>
                    </JFCLLink>
                  </li>
                </ul>
              </div>

              <div className="justfix-cta">
                <Trans render="p">Are you having issues in this development?</Trans>
                <JFCLLink
                  className="flex-centered"
                  onClick={() => {
                    window.gtag("event", "take-action-nycha-page");
                  }}
                  href={takeActionURL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Trans>Take action on JustFix.org!</Trans>
                </JFCLLink>
              </div>

              <SocialShareForNotRegisteredPage />

              <br />
              {/* <div className="toast toast-error">
                <u>Note:</u> We're currently experiencing some difficulties due to an official NYC data service failing. We're working on it. If a search returns with "no results found", try it again in a minute or so!
              </div> */}
              <br />

              <Link className="flex-centered" component={JFCLLinkInternal} to="/">
                <Trans>Search for a different address</Trans>
              </Link>
            </div>
          </div>
        </div>
        <LegalFooter />
      </div>
    </Page>
  );
};

const NychaPage = withI18n()(NychaPageWithoutI18n);

export default NychaPage;
