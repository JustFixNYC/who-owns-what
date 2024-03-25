import React, { Fragment, useContext, useState } from "react";

import { withI18n, withI18nProps, I18n } from "@lingui/react";
import { Trans } from "@lingui/macro";
import Login from "./Login";
import { UserContext } from "./UserContext";
import { createWhoOwnsWhatRoutePaths } from "routes";
import { LocaleLink as Link } from "../i18n";

import "styles/EmailAlertSignup.css";
import { JustfixUser } from "state-machine";
import AuthClient from "./AuthClient";
import { SubscribedIcon } from "./Icons";
import { Alert } from "./Alert";
import Modal from "./Modal";

const SUBSCRIPTION_LIMIT = 15;

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
  const [showSubscriptionLimitModal, setShowSubscriptionLimitModal] = useState(false);
  const { account } = createWhoOwnsWhatRoutePaths();

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
        <Alert type="info">
          <Trans>Verify your email to start receiving updates.</Trans>
        </Alert>
        <Trans render="div" className="status-description">
          Click the link we sent to {email}. It may take a few minutes to arrive.
        </Trans>
        <Trans render="div">Didn’t get the link?</Trans>
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
        <>
          <div className="building-subscribe">
            {!(subscriptions && !!subscriptions?.find((s) => s.bbl === bbl)) ? (
              <button
                className="button is-primary"
                onClick={() =>
                  subscriptions.length < SUBSCRIPTION_LIMIT
                    ? subscribe(bbl, housenumber, streetname, zip, boro)
                    : setShowSubscriptionLimitModal(true)
                }
              >
                <Trans>Get updates</Trans>
              </button>
            ) : verified ? (
              showSubscribed()
            ) : (
              showEmailVerification(i18n)
            )}
          </div>
          <Modal
            key={1}
            showModal={showSubscriptionLimitModal}
            width={40}
            onClose={() => setShowSubscriptionLimitModal(false)}
          >
            <Trans render="h4">You have reached the maximum number of building updates</Trans>
            <Trans>
              At this time we can only support {SUBSCRIPTION_LIMIT} buildings in each email. Please
              visit your <Link to={account.settings}>account</Link> to manage the buildings in your
              email. If you would like to track more buildings, please let us know by submiting a{" "}
              <a
                href={`https://form.typeform.com/to/ChJMCNYN#email=${email}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                request form
              </a>
              .
            </Trans>
          </Modal>
        </>
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
                  {!user?.email ? (
                    <Trans>Get Data Updates for this building</Trans>
                  ) : (
                    <Trans>Data Updates</Trans>
                  )}
                </label>
                <div className="table-content">
                  {!!user?.email && !loginRegisterInProgress ? (
                    <BuildingSubscribe {...props} />
                  ) : (
                    <Login
                      registerInModal
                      onBuildingPage
                      setLoginRegisterInProgress={setLoginRegisterInProgress}
                      onSuccess={(user: JustfixUser) => {
                        userContext.subscribe(bbl, housenumber, streetname, zip, boro, user);
                      }}
                    />
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
