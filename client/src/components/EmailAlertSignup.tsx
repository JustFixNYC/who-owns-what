import React, { useContext } from "react";

import { withI18n, withI18nProps, I18n } from "@lingui/react";
import { t } from "@lingui/macro";
import { Trans } from "@lingui/macro";
import Login from "./Login";
import { UserContext } from "./UserContext";

import "styles/EmailAlertSignup.css";

type BuildingSubscribeProps = {
  bbl: string;
};

const BuildingSubscribeWithoutI18n = (props: BuildingSubscribeProps) => {
  const { bbl } = props;
  const userContext = useContext(UserContext);
  const { user, subscribe, unsubscribe } = userContext;
  const { email, subscriptions, verified } = user!;

  return (
    <div className="table-content building-subscribe">
      {!(subscriptions && subscriptions?.indexOf(bbl) >= 0) ? (
        <button className="button is-primary" onClick={() => subscribe(bbl)}>
          <Trans>Get updates</Trans>
        </button>
      ) : (
        <div className="building-subscribe-status">
          <div className={`building-subscribe-icon ${verified ? "verified" : ""}`}></div>
          {verified ? (
            <div>
              <Trans>Email updates will be sent to {email}.</Trans>{" "}
              <button onClick={() => unsubscribe(bbl)}>
                <Trans>Unsubscribe</Trans>
              </button>
            </div>
          ) : (
            <Trans render="div">
              Check your email inbox {email} to verify your email address. Once you’ve done that,
              you’ll start getting email updates.
            </Trans>
          )}
        </div>
      )}
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
  const { user } = userContext;

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
                <div className="table-content email-alert-content">
                  <Trans>
                    In each weekly email are updates for:
                    <ul>
                      <li>HPD Complaints</li>
                      <li>HPD Violations</li>
                      <li>Eviction filings</li>
                    </ul>
                  </Trans>
                </div>
                {!user ? <Login /> : <BuildingSubscribe bbl={bbl} />}
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
