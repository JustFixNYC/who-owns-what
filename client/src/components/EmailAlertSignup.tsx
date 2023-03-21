import React from "react";

import { withI18n, I18n } from "@lingui/react";
import { t } from "@lingui/macro";
import { Trans } from "@lingui/macro";
import Login from "./Login";
import AuthClient from "./AuthClient";

import "styles/EmailAlertSignup.css";

type EmailAlertProps = {
  bbl: string;
};

const BuildingSubscribeWithoutI18n = (props: { bbl: string }) => {
  const { bbl } = props;
  // TODO subscribe routes
  return (
    <div>
      <button className="button is-primary" onClick={() => AuthClient.buildingSubscribe(bbl)}>
        <Trans>Get updates</Trans>
      </button>
    </div>
  );
};

const BuildingSubscribe = withI18n()(BuildingSubscribeWithoutI18n);

const EmailAlertSignupWithoutI18n = (props: EmailAlertProps) => {
  const { bbl } = props;
  const [userEmail, setUserEmail] = React.useState(AuthClient.getUserEmail());
  React.useEffect(() => {
    const updateUserEmail = async () => {
      const email = await AuthClient.fetchUserEmail();
      if (email) setUserEmail(email);
    };
    updateUserEmail();
  }, []);

  return (
    <>
      <div className="EmailAlertSignup card-body-table">
        <div className="table-row">
          <I18n>
            {({ i18n }) => (
              <div title={i18n._(t`Get email updates for this building`)}>
                <Trans render="label">Get email updates for this building</Trans>
                <div className="table-content">
                  <Trans>
                    In each weekly email are updates for:
                    <ul>
                      <li>HPD Complaints</li>
                      <li>HPD Violations</li>
                      <li>Eviction filings</li>
                    </ul>
                  </Trans>
                </div>
                {!userEmail ? <Login onSuccess={setUserEmail} /> : <BuildingSubscribe bbl={bbl} />}
              </div>
            )}
          </I18n>
        </div>
      </div>
    </>
  );
};

const EmailAlertSignup = withI18n()(EmailAlertSignupWithoutI18n);

export default EmailAlertSignup;
