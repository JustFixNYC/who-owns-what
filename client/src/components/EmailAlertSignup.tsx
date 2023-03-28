import React, { useContext } from "react";

import { withI18n, withI18nProps, I18n } from "@lingui/react";
import { t } from "@lingui/macro";
import { Trans } from "@lingui/macro";
import Login from "./Login";
import { UserContext } from "./UserContext";

import "styles/EmailAlertSignup.css";

const BuildingSubscribeWithoutI18n = (props: { bbl: string }) => {
  const { bbl } = props;
  const userContext = useContext(UserContext);
  // TODO subscribe routes
  // add on success, pass in send function to update
  return (
    <div>
      <button className="button is-primary" onClick={() => userContext.subscribe(bbl)}>
        <Trans>Get updates</Trans>
      </button>
    </div>
  );
};

const BuildingSubscribe = withI18n()(BuildingSubscribeWithoutI18n);

type EmailAlertProps = withI18nProps & {
  bbl: string;
};

const EmailAlertSignupWithoutI18n = (props: EmailAlertProps) => {
  const { bbl } = props;
  const userContext = useContext(UserContext);

  let subscriptions = userContext.user?.subscriptions;
  let userEmail = userContext.user?.email;

  return (
    <>
      <div className="EmailAlertSignup card-body-table">
        <div className="table-row">
          <I18n>
            {({ i18n }) => (
              <div
                title={i18n._(t`Get email updates for this building`)}
                className="table-small-font"
              >
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
                {!(subscriptions && subscriptions?.indexOf(bbl) >= 0) ? (
                  !userEmail ? (
                    <Login />
                  ) : (
                    <BuildingSubscribe bbl={bbl} />
                  )
                ) : (
                  <div>
                    <Trans>Email updates will be sent to {userEmail}</Trans>
                    <button onClick={() => userContext.unsubscribe(bbl)}>
                      <Trans>Unsubscribe</Trans>
                    </button>
                  </div>
                )}
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
