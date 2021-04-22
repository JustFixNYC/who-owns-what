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

type NychaPageProps = withMachineInStateProps<"nychaFound"> & withI18nProps;

const NychaPageWithoutI18n: React.FC<NychaPageProps> = (props) => {
  const { i18n, state } = props;

  const { searchAddrParams, searchAddrBbl, nychaStats: nycha, buildingInfo } = state.context;
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
            <h5 className="mt-10 text-center text-bold text-large">
              {nycha.development}: <Trans>Public Housing Development</Trans>
            </h5>
            <h6 className="mt-10 text-center text-bold text-large">
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
                      {nycha.dev_unitsres}
                    </div>
                    <div
                      title={i18n._(
                        t`Evictions executed in this development by NYC Marshals in 2019. ANHD and the Housing Data Coalition cleaned, geocoded, and validated the data, originally sourced from DOI.`
                      )}
                    >
                      <Trans render="label">2019 Evictions</Trans>
                      {nycha.dev_evictions}
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
                <div>
                  <div className="btn-group btn-group-block">
                    <a
                      href="https://www.hud.gov/sites/documents/958.PDF"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                    >
                      <Trans>HUD Complaint Form 958</Trans> &#8599;
                    </a>
                    <a
                      href="https://www1.nyc.gov/assets/nycha/downloads/pdf/Development-Guide-04-23-2020.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                    >
                      <Trans>NYCHA Directory</Trans> &#8599;
                    </a>
                  </div>
                  <div className="btn-group btn-group-block">
                    <a
                      href="https://www1.nyc.gov/site/nycha/mynycha/mynycha-landing.page"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                    >
                      <Trans>MyNYCHA App</Trans> &#8599;
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

              <div className="justfix-cta">
                <Trans render="p">Are you having issues in this development?</Trans>
                <a
                  onClick={() => {
                    window.gtag("event", "take-action-nycha-page");
                  }}
                  href={takeActionURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-justfix btn-block"
                >
                  <Trans>Take action on JustFix.nyc!</Trans>
                </a>
              </div>

              <SocialShareForNotRegisteredPage addr={usersInputAddress} />

              <br />
              {/* <div className="toast toast-error">
                <u>Note:</u> We're currently experiencing some difficulties due to an official NYC data service failing. We're working on it. If a search returns with "no results found", try it again in a minute or so!
              </div> */}
              <br />

              <Link className="btn btn-primary btn-block" to="/">
                &lt;-- <Trans>Search for a different address</Trans>
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
