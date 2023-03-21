import React from "react";

import { withI18n, I18n } from "@lingui/react";
import { t } from "@lingui/macro";
import { Trans } from "@lingui/macro";
import Login from "./Login";
import AuthClient from "./AuthClient";

import "styles/EmailAlertSignup.css";

const BuildingSubscribeWithoutI18n = () => {
  // TODO subscribe routes
  return (
    <div>
      <button className="button is-primary" onClick={() => {}}>
        <Trans>Get updates</Trans>
      </button>
    </div>
  );
};

const BuildingSubscribe = withI18n()(BuildingSubscribeWithoutI18n);

const EmailAlertSignupWithoutI18n = () => {
  const [userEmail, setUserEmail] = React.useState(AuthClient.getUserEmail());
  React.useEffect(() => {
    AuthClient.fetchUserEmail().then((email: string) => !!email && setUserEmail(email));
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
                {!userEmail ? <Login onSuccess={setUserEmail} /> : <BuildingSubscribe />}
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
