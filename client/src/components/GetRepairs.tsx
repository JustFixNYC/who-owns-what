import React from "react";
import { withI18n, I18n } from "@lingui/react";
import { Trans, t } from "@lingui/macro";
import { Button, Link as JFCLLink } from "@justfixnyc/component-library";

import "styles/GetRepairs.css";
import "styles/Card.css";

type GetRepairsProps = {
  url: string | undefined;
};
const GetRepairsWithoutI18n = (props: GetRepairsProps) => {
  const fallbackUrl = "https://app.justfix.org/en/loc/splash";

  return (
    <>
      <div className="Card GetRepairs card-body-table">
        <div className="table-row">
          <I18n>
            {({ i18n }) => (
              <div className="table-small-font">
                <label className="card-label-container">
                  <Trans>Need repairs in this building?</Trans>
                </label>
                <div className="table-content">
                  <Trans render="div" className="card-description">
                    Send a free, legally vetted letter to notify your landlord of repair issues
                  </Trans>

                  <JFCLLink
                    href={props.url ?? fallbackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="jfcl-link"
                    icon="external"
                  >
                    <Trans>Get Repairs</Trans>
                  </JFCLLink>
                </div>
              </div>
            )}
          </I18n>
        </div>
      </div>
    </>
  );
};

const GetRepairs = withI18n()(GetRepairsWithoutI18n);

export default GetRepairs;
