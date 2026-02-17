import React from "react";
import { withI18n, I18n } from "@lingui/react";
import { Trans } from "@lingui/macro";
import { JFCLLocaleLink } from "../i18n";

import "styles/AreaAlertsPromo.css";
import "styles/Card.css";

const AreaAlertsPromoWithoutI18n = () => {
  return (
    <>
      <div className="Card AreaAlertsPromo card-body-table">
        <div className="table-row">
          <I18n>
            {({ i18n }) => (
              <div className="table-small-font">
                <label className="card-label-container">
                  <Trans>Area Alerts</Trans>
                </label>
                <div className="table-content">
                  <Trans render="div" className="card-description">
                    Get a weekly email highlighting emerging housing issues in buildings and
                    landlord portfolios in your area.
                  </Trans>
                  <JFCLLocaleLink to="/area-alerts" target="_blank" rel="noopener noreferrer">
                    <Trans>Select a neighborhood</Trans>
                  </JFCLLocaleLink>
                </div>
              </div>
            )}
          </I18n>
        </div>
      </div>
    </>
  );
};

const AreaAlertsPromo = withI18n()(AreaAlertsPromoWithoutI18n);

export default AreaAlertsPromo;
