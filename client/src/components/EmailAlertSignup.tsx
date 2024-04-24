import React, { useContext, useEffect, useState } from "react";
import { withI18n, withI18nProps } from "@lingui/react";
import { Trans, t } from "@lingui/macro";
import { useHistory, useLocation } from "react-router-dom";
import { CSSTransition } from "react-transition-group";
import { Button, Alert as JFCLAlert } from "@justfixnyc/component-library";

import "styles/EmailAlertSignup.css";
import "styles/Card.css";

import { UserContext } from "./UserContext";
import { createWhoOwnsWhatRoutePaths } from "routes";
import { LocaleLink } from "../i18n";
import AuthClient from "./AuthClient";
import { AddIcon, SubscribedIcon } from "./Icons";
import { Alert } from "./Alert";
import Modal from "./Modal";
import helpers from "util/helpers";
import { AddressRecord } from "./APIDataTypes";
import SendNewLink from "./SendNewLink";

const SUBSCRIPTION_LIMIT = 15;

/**
 * edge case: adding building as a result of successful login shows a flicker
 * between states, likely from a lag in subscription obj iteration.
 * addViaLogin enforces a success state to be shown once
 */
type BuildingSubscribeProps = withI18nProps & {
  addr: AddressRecord;
};

const BuildingSubscribeWithoutI18n = (props: BuildingSubscribeProps) => {
  const { i18n, addr } = props;
  const { account } = createWhoOwnsWhatRoutePaths();
  const history = useHistory();

  const { state: locationState } = useLocation();
  const [justSubscribed, setJustSubscribed] = React.useState(false);
  // switch to regular state and clear location state since it othrwise persists after reloads
  useEffect(() => {
    setJustSubscribed(!!locationState?.justSubscribed);
    window.history.replaceState({ state: undefined }, "");
  }, [locationState]);

  const userContext = useContext(UserContext);
  const { user, subscribe, unsubscribe } = userContext;
  const isLoggedIn = !!user?.email;
  const atSubscriptionLimit = isLoggedIn && user.subscriptions.length >= SUBSCRIPTION_LIMIT;
  // avoid slower building lookup if possible to prevent flash of "add building" before "subscribed"
  const showSubscribed =
    (justSubscribed && !!user?.verified) || !!user?.subscriptions?.find((s) => s.bbl === addr.bbl);

  const eventUserParams = { user_id: user?.id, user_type: user?.type };

  const [isEmailResent, setIsEmailResent] = React.useState(false);
  const [showSubscriptionLimitModal, setShowSubscriptionLimitModal] = useState(false);

  const navigateToLogin = () => {
    // logAmplitudeEvent("registerLoginViaBuilding");
    window.gtag("event", "register-login-via-building");
    const loginRoute = `/${i18n.language}${account.login}`;
    history.push({ pathname: loginRoute, state: { addr } });
  };

  const renderSubscribed = () => (
    <>
      <div className="status-title">
        <SubscribedIcon />
        <Trans>
          You’re signed up for Building Updates for {addr.housenumber}
          {helpers.titleCase(addr.streetname)}, {helpers.titleCase(addr.boro)}.
        </Trans>
      </div>
      <Button
        variant="secondary"
        size="small"
        className="is-full-width"
        labelText={i18n._(t`Remove building`)}
        onClick={() => {
          unsubscribe(addr.bbl);
          setJustSubscribed(false);
        }}
      />
    </>
  );

  const renderEmailVerification = () => (
    <>
      <Alert type="info">
        <Trans>Verify your email to start receiving updates.</Trans>
      </Alert>
      <Trans render="div" className="card-description">
        Click the link we sent to {user?.email}. It may take a few minutes to arrive.
      </Trans>
      {!isEmailResent && <Trans render="div">Didn’t get the link?</Trans>}
      <SendNewLink
        setParentState={setIsEmailResent}
        className="is-full-width"
        onClick={() => {
          AuthClient.resendVerifyEmail();
          const eventParams = { ...eventUserParams, from: "building page" };
          // logAmplitudeEvent("emailVerifyResend", eventParams);
          window.gtag("event", "email-verify-resend", { ...eventParams });
        }}
      />
    </>
  );

  const subscribeToBuilding = (addr: AddressRecord) => {
    // logAmplitudeEvent("subscribeBuildingPage", gtagUserParams);
    window.gtag("event", "subscribe-building-page", eventUserParams);
    subscribe(addr.bbl, addr.housenumber, addr.streetname, addr.zip ?? "", addr.boro);
  };

  const handleSubscriptionLimitReached = () => {
    const eventParams = { ...eventUserParams, limit: SUBSCRIPTION_LIMIT };
    // logAmplitudeEvent("subscriptionLimitExceedAttempt", eventParams);
    window.gtag("event", "subscription-limit-exceed-attempt", eventParams);
    setShowSubscriptionLimitModal(true);
  };

  const renderAddBuilding = () => {
    return (
      <>
        {!isLoggedIn && (
          <Trans render="div" className="card-description">
            Get a weekly email update on complaints, violations, and eviction filings for this
            building.
          </Trans>
        )}
        <Button
          variant="primary"
          size="small"
          className="is-full-width"
          labelText={i18n._(t`Add building`)}
          labelIcon={AddIcon}
          onClick={() => {
            !isLoggedIn
              ? navigateToLogin()
              : atSubscriptionLimit
              ? handleSubscriptionLimitReached()
              : subscribeToBuilding(addr);
          }}
        />
      </>
    );
  };

  return (
    <>
      <div className="building-subscribe">
        {isLoggedIn && !user.verified
          ? renderEmailVerification()
          : showSubscribed
          ? renderSubscribed()
          : renderAddBuilding()}
      </div>
      <div className="login-subscribe-alert-container">
        <CSSTransition
          in={justSubscribed}
          timeout={5000}
          classNames="login-subscribe-alert"
          onEntered={() => setJustSubscribed(false)}
        >
          <JFCLAlert
            variant="primary"
            type="success"
            className="login-subscribe-alert"
            text={i18n._(t`You are now logged in and we’ve added this building to your updates`)}
          />
        </CSSTransition>
      </div>
      <Modal
        key={1}
        showModal={showSubscriptionLimitModal}
        width={40}
        onClose={() => setShowSubscriptionLimitModal(false)}
      >
        <Trans render="h4">You have reached the maximum number of Building Updates</Trans>
        <Trans>
          At this time we can only support {SUBSCRIPTION_LIMIT} buildings in each email. Please
          visit your <LocaleLink to={account.settings}>account</LocaleLink> to manage the buildings
          in your email. If you would like to track more buildings, please let us know by submiting
          a{" "}
          <a
            href={`https://form.typeform.com/to/ChJMCNYN#email=${user?.email}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              const eventParams = { ...eventUserParams, limit: SUBSCRIPTION_LIMIT };
              // logAmplitudeEvent("subscriptionLimitRequest", eventParams);
              window.gtag("event", "subscription-limit-request", eventParams);
            }}
          >
            request form
          </a>
          .
        </Trans>
      </Modal>
    </>
  );
};

export const BuildingSubscribe = withI18n()(BuildingSubscribeWithoutI18n);

type EmailAlertProps = BuildingSubscribeProps;

const EmailAlertSignupWithoutI18n = (props: EmailAlertProps) => (
  <div className="Card EmailAlertSignup card-body-table">
    <div className="table-row">
      <div className="table-small-font">
        <label className="card-label-container">
          <span className="pill-new">
            <Trans>NEW</Trans>
          </span>
          <Trans>Building Updates</Trans>
        </label>
        <div className="table-content">
          <BuildingSubscribe {...props} />
        </div>
      </div>
    </div>
  </div>
);

const EmailAlertSignup = withI18n()(EmailAlertSignupWithoutI18n);

export default EmailAlertSignup;
