import React, { Fragment, useContext, useState } from "react";

import { withI18n, withI18nProps, I18n } from "@lingui/react";
import { t } from "@lingui/macro";
import { Trans } from "@lingui/macro";
import Login from "./Login";
import { UserContext } from "./UserContext";

import "styles/EmailAlertSignup.css";
import { JustfixUser } from "state-machine";
import AuthClient from "./AuthClient";
import { AlertIconOutline, SubscribedIcon } from "./Icons";

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

  const showSubscribed = () => {
    return (
      <div className="building-subscribe-status">
        <div className="status-title">
          <SubscribedIcon />
          <Trans>You’re signed up for Data Updates for this building.</Trans>
        </div>
        <button className="button is-text unsubscribe-button" onClick={() => unsubscribe(bbl)}>
          <Trans>Unsubscribe</Trans>
        </button>
      </div>
    );
  };

  const showEmailVerification = (i18n: any) => {
    return (
      <div className="building-subscribe-status">
        <div className="status-title">
          <AlertIconOutline />
          <Trans>Email verification required</Trans>
        </div>
        <div className="status-description">
          {i18n._(t`Click the link we sent to ${email}. It may take a few minutes to arrive.`)}
        </div>
        <button
          className="button is-secondary is-full-width"
          onClick={() => AuthClient.resendVerifyEmail()}
        >
          <Trans>Resend email</Trans>
        </button>
      </div>
    );
  };
  return (
    <I18n>
      {({ i18n }) => (
        <div className="building-subscribe">
          {!(subscriptions && !!subscriptions?.find((s) => s.bbl === bbl)) ? (
            <button
              className="button is-primary"
              onClick={() => subscribe(bbl, housenumber, streetname, zip, boro)}
            >
              <Trans>Get updates</Trans>
            </button>
          ) : verified ? (
            showSubscribed()
          ) : (
            showEmailVerification(i18n)
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
  const [loginRegisterInProgress, setLoginRegisterInProgress] = useState(false);

  return (
    <>
      <div className="EmailAlertSignup card-body-table">
        <div className="table-row">
          <I18n>
            {({ i18n }) => (
              <div className="table-small-font">
                <label className="data-updates-label-container">
                  <span className="pill-new">
                    <Trans>NEW</Trans>
                  </span>
                  {!user ? (
                    <Trans>Get Data Updates for this building</Trans>
                  ) : (
                    <Trans>Data Updates</Trans>
                  )}
                </label>
                <div className="table-content">
                  {user && !loginRegisterInProgress ? (
                    <BuildingSubscribe {...props} />
                  ) : (
                    <>
                      <div className="email-description">
                        <Trans>
                          Each weekly email includes HPD Complaints, HPD Violations, and Eviction
                          Filings.
                        </Trans>
                      </div>
                      <Login
                        registerInModal
                        onBuildingPage
                        setLoginRegisterInProgress={setLoginRegisterInProgress}
                        onSuccess={(user: JustfixUser) => {
                          userContext.subscribe(bbl, housenumber, streetname, zip, boro, user);
                        }}
                      />
                    </>
                  )}
                </div>
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
