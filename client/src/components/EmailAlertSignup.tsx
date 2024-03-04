import React, { Fragment, useContext, useState } from "react";

import { withI18n, withI18nProps, I18n } from "@lingui/react";
import { t } from "@lingui/macro";
import { Trans } from "@lingui/macro";
import Login from "./Login";
import { UserContext } from "./UserContext";
import { createWhoOwnsWhatRoutePaths } from "routes";
import { LocaleLink as Link } from "../i18n";

import "styles/EmailAlertSignup.css";
import { JustfixUser } from "state-machine";
import AuthClient from "./AuthClient";
import { AlertIconOutline, SubscribedIcon } from "./Icons";
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
        <div>
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
      </div>
    );
  };
  return (
    <I18n>
      {({ i18n }) => (
        <>
          <div className="table-content building-subscribe">
            {!(subscriptions && !!subscriptions?.find((s) => s.bbl === bbl)) ? (
              <button
                className="button is-primary"
                onClick={() =>
                  subscriptions.length <= SUBSCRIPTION_LIMIT
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
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  return (
    <>
      <div className="EmailAlertSignup card-body-table">
        <div className="table-row">
          <I18n>
            {({ i18n }) => (
              <div
                title={i18n._(t`Get data updates for this building`)}
                className="table-small-font"
              >
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
                  {!user ? (
                    <Fragment>
                      <div className="email-description">
                        <Trans>
                          Each weekly email includes HPD Complaints, HPD Violations, and Eviction
                          Filings.
                        </Trans>
                      </div>
                      <Login
                        onBuildingPage={true}
                        onSuccess={(user: JustfixUser) => {
                          userContext.subscribe(bbl, housenumber, streetname, zip, boro, user);
                          !user.verified && setShowVerifyModal(true);
                        }}
                      />
                    </Fragment>
                  ) : (
                    <BuildingSubscribe {...props} />
                  )}
                </div>
                <Modal
                  key={1}
                  showModal={showVerifyModal}
                  width={40}
                  onClose={() => setShowVerifyModal(false)}
                >
                  <Trans render="h4">Verify your email to start receiving updates</Trans>
                  {i18n._(
                    t`Click the link we sent to ${user?.email}. It may take a few minutes to arrive.`
                  )}
                  <br />
                  <br />
                  <Trans>
                    Once your email has been verified, you’ll be signed up for Data Updates.
                  </Trans>
                  <br />
                  <br />
                  <button
                    className="button is-secondary is-full-width"
                    onClick={() => AuthClient.resendVerifyEmail()}
                  >
                    <Trans>Resend email</Trans>
                  </button>
                </Modal>
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
