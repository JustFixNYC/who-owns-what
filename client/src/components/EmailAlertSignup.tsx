import React, { useContext } from "react";

import { withI18n, withI18nProps, I18n } from "@lingui/react";
import { t } from "@lingui/macro";
import { Trans } from "@lingui/macro";
import Login from "./Login";
import { UserContext } from "./UserContext";

import "styles/EmailAlertSignup.css";
import { JustfixUser } from "state-machine";
import AuthClient from "./AuthClient";

type BuildingSubscribeProps = withI18nProps & {
  bbl: string;
  housenumber: string;
  streetname: string;
  boro: string;
  zip: string;
};

const BuildingSubscribeWithoutI18n = (props: BuildingSubscribeProps) => {
  const { bbl, housenumber, streetname, zip, boro } = props;
  const userContext = useContext(UserContext);
  const { user, subscribe, unsubscribe } = userContext;
  const { email, subscriptions, verified } = user! as JustfixUser;

  return (
    <I18n>
      {({ i18n }) => (
        <div className="table-content building-subscribe">
          {!(subscriptions && !!subscriptions?.find((s) => s.bbl === bbl)) ? (
            <button
              className="button is-primary"
              onClick={() => subscribe(bbl, housenumber, streetname, zip, boro)}
            >
              <Trans>Get updates</Trans>
            </button>
          ) : (
            <>
              <div className="building-subscribe-status">
                <div className={`building-subscribe-icon ${verified ? "verified" : ""}`}></div>
                {verified ? (
                  <div>
                    {i18n._(t`Email updates will be sent to ${email}`)}{" "}
                    <button onClick={() => unsubscribe(bbl)}>
                      <Trans>Unsubscribe</Trans>
                    </button>
                  </div>
                ) : (
                  <div>
                    <div>
                      {i18n._(
                        t`Check your email inbox ${email} to verify your email address. Once you’ve done that, you’ll start getting email updates.`
                      )}
                    </div>
                  </div>
                )}
              </div>
              {!verified && (
                <p>
                  <button
                    className="button is-primary"
                    onClick={() => AuthClient.resendVerifyEmail()}
                  >
                    Resend verification email
                  </button>
                </p>
              )}
            </>
          )}
        </div>
      )}
    </I18n>
  );
};

const BuildingSubscribe = withI18n()(BuildingSubscribeWithoutI18n);

type EmailAlertProps = BuildingSubscribeProps;

const EmailAlertSignupWithoutI18n = (props: EmailAlertProps) => {
  const { bbl, housenumber, streetname, zip, boro } = props;
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
                {!user ? (
                  <Login
                    onSuccess={(user: JustfixUser) =>
                      userContext.subscribe(bbl, housenumber, streetname, zip, boro, user)
                    }
                  />
                ) : (
                  <BuildingSubscribe {...props} />
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
