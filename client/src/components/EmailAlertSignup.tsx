import React, { useContext, useEffect, useState } from "react";
import { withI18n, withI18nProps } from "@lingui/react";
import { Trans, t } from "@lingui/macro";
import { useHistory, useLocation } from "react-router-dom";
import { Button } from "@justfixnyc/component-library";

import "styles/EmailAlertSignup.css";
import "styles/Card.css";

import { UserContext } from "./UserContext";
import { createWhoOwnsWhatRoutePaths } from "routes";
import { LocaleLink } from "../i18n";
import AuthClient from "./AuthClient";
import { SubscribedIcon } from "./Icons";
import { Alert } from "./Alert";
import Modal from "./Modal";
import helpers from "util/helpers";
import { AddressRecord } from "./APIDataTypes";
import { ToastAlert } from "./ToastAlert";
import { Nobr } from "./Nobr";
import { reportUnexpectedAuthError } from "./auth-errors";

const DEFAULT_SUBSCRIPTION_LIMIT = 15;
const BRANCH_NAME = process.env.REACT_APP_BRANCH;

export const buildVerifyReloginUrl = (email: string | undefined, language: string): string => {
  const { account } = createWhoOwnsWhatRoutePaths();
  const query = email ? `?email=${encodeURIComponent(email)}` : "";
  return `/${language}${account.login}${query}`;
};

export const reloginToVerify = async (
  email: string | undefined,
  language: string
): Promise<void> => {
  await AuthClient.logout();
  window.location.assign(buildVerifyReloginUrl(email, language));
};

type EmailVerificationPromptProps = withI18nProps & {
  email?: string;
  analyticsFrom: string;
  eventUserParams?: { user_id?: number | string; user_type?: string };
};

const EmailVerificationPromptWithoutI18n = (props: EmailVerificationPromptProps) => {
  const { email, analyticsFrom, eventUserParams, i18n } = props;
  const userContext = useContext(UserContext);
  const [isEmailResent, setIsEmailResent] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [needsRelogin, setNeedsRelogin] = useState(false);

  const handleResend = async () => {
    if (!email || isResending) return;
    setIsResending(true);
    try {
      const resp = await userContext.sendLoginCode(email);
      window.gtag("event", "email-verify-resend", {
        ...eventUserParams,
        from: analyticsFrom,
        branch: BRANCH_NAME,
      });
      if (resp?.error) {
        reportUnexpectedAuthError(resp.error);
        setNeedsRelogin(true);
        return;
      }
      setIsEmailResent(true);
    } catch (err) {
      reportUnexpectedAuthError(err);
      setNeedsRelogin(true);
    } finally {
      setIsResending(false);
    }
  };

  const handleRelogin = () => {
    window.gtag("event", "email-verify-relogin", {
      ...eventUserParams,
      from: analyticsFrom,
      branch: BRANCH_NAME,
    });
    reloginToVerify(email, i18n.language);
  };

  return (
    <div className="email-verification-prompt">
      <Alert type="info">
        <Trans>Verify your email to receive updates and to add new buildings.</Trans>
      </Alert>
      <Trans render="div" className="card-description">
        Enter the code or click the sign-in link we send to {email}. It may take a few minutes to
        arrive.
      </Trans>
      {isEmailResent ? (
        <div role="status">
          <Trans>
            We sent a new code to <Nobr>{email}</Nobr>
          </Trans>
        </div>
      ) : (
        !needsRelogin && (
          <>
            <Trans render="div">Didn’t receive a code?</Trans>
            <Button
              variant="secondary"
              size="small"
              className="is-full-width"
              labelText={i18n._(t`Resend`)}
              loading={isResending}
              disabled={isResending}
              onClick={handleResend}
            />
          </>
        )
      )}
      <Button
        variant="tertiary"
        size="small"
        className="is-full-width"
        labelText={i18n._(t`Log in`)}
        onClick={handleRelogin}
      />
    </div>
  );
};

export const EmailVerificationPrompt = withI18n()(EmailVerificationPromptWithoutI18n);

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
  // switch to regular state and clear location state since it otherwise persists after reloads
  useEffect(() => {
    setJustSubscribed(!!locationState?.justSubscribed);
    window.history.replaceState({ state: undefined }, "");
  }, [locationState]);

  const userContext = useContext(UserContext);
  const { user, subscribeBuilding, unsubscribeBuilding } = userContext;
  const isLoggedIn = !!user?.email;
  const subscriptionLimit = user?.subscriptionLimit ?? DEFAULT_SUBSCRIPTION_LIMIT;
  const atSubscriptionLimit =
    isLoggedIn && user?.buildingSubscriptions?.length >= subscriptionLimit;
  // avoid slower building lookup if possible to prevent flash of "add building" before "subscribed"
  const showSubscribed =
    (justSubscribed && !!user?.verified) ||
    !!user?.buildingSubscriptions?.find((s) => s.bbl === addr.bbl);

  const eventUserParams = { user_id: user?.id, user_type: user?.type };

  const [showSubscriptionLimitModal, setShowSubscriptionLimitModal] = useState(false);

  const navigateToLogin = () => {
    window.gtag("event", "register-login-via-building", { branch: BRANCH_NAME });
    const loginRoute = `/${i18n.language}${account.login}`;
    history.push({ pathname: loginRoute, state: { addr } });
  };

  const renderSubscribed = () => (
    <>
      <div className="status-title">
        <SubscribedIcon />
        <Trans>
          You’re signed up for Building Alerts for {addr.housenumber}
          {helpers.titleCase(addr.streetname)}, {helpers.titleCase(addr.boro)}.
        </Trans>
      </div>
      <Button
        variant="secondary"
        size="small"
        className="is-full-width"
        labelText={i18n._(t`Remove building`)}
        onClick={() => {
          unsubscribeBuilding(addr.bbl);
          setJustSubscribed(false);
          const params = { ...eventUserParams, from: "building page", branch: BRANCH_NAME };
          window.gtag("event", "unsubscribe-building", { ...params });
        }}
      />
    </>
  );

  const subscribeToBuilding = (addr: AddressRecord) => {
    window.gtag("event", "subscribe-building-page", { ...eventUserParams, branch: BRANCH_NAME });
    subscribeBuilding(addr.bbl, addr.housenumber, addr.streetname, addr.zip ?? "", addr.boro);
  };

  const handleSubscriptionLimitReached = () => {
    const params = { ...eventUserParams, limit: subscriptionLimit };
    window.gtag("event", "subscription-limit-exceed-attempt", { ...params });
    setShowSubscriptionLimitModal(true);
  };

  const renderAddBuilding = () => {
    return (
      <>
        {!isLoggedIn ? (
          <Trans render="div" className="card-description">
            Get a weekly email alert on complaints, violations, and eviction filings for this
            building.
          </Trans>
        ) : (
          <Trans render="div" className="card-description">
            Follow this building to add it to your weekly email alert.
          </Trans>
        )}
        <Button
          variant="primary"
          size="small"
          className="is-full-width"
          labelText={i18n._(t`Follow building`)}
          labelIcon="circlePlus"
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
        {isLoggedIn && !user.verified ? (
          <EmailVerificationPrompt
            email={user?.email}
            analyticsFrom="building page"
            eventUserParams={eventUserParams}
          />
        ) : showSubscribed ? (
          renderSubscribed()
        ) : (
          renderAddBuilding()
        )}
      </div>
      <ToastAlert
        showToast={justSubscribed}
        setShowToast={setJustSubscribed}
        i18n={i18n}
        timeout={5000}
        variant="primary"
        type="success"
        className="login-subscribe-alert"
        text={i18n._(t`You are now logged in and we’ve added this building to your updates`)}
      />
      <Modal
        key={1}
        showModal={showSubscriptionLimitModal}
        width={40}
        onClose={() => setShowSubscriptionLimitModal(false)}
      >
        <Trans render="h4">You have reached the maximum number of Building Alerts</Trans>
        <Trans>
          At this time we can only support {subscriptionLimit} buildings in each email. Please visit
          your <LocaleLink to={account.settings}>account</LocaleLink> to manage the buildings in
          your email. If you would like to track more buildings, please let us know by submiting a{" "}
          <a
            href={`https://form.typeform.com/to/ChJMCNYN#email=${user?.email}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              const eventParams = {
                ...eventUserParams,
                limit: subscriptionLimit,
                branch: BRANCH_NAME,
              };
              window.gtag("event", "subscription-limit-request", {
                ...eventParams,
              });
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
          <Trans>Building Alerts</Trans>
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
