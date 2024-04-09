import React, { useContext, useState } from "react";
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
  const location = useLocation();

  const justSubscribed = location.state?.justSubscribed;

  const userContext = useContext(UserContext);
  const { user, subscribe, unsubscribe } = userContext;
  const isLoggedIn = !!user?.email;
  const atSubscriptionLimit = isLoggedIn && user.subscriptions.length >= SUBSCRIPTION_LIMIT;

  /**
   * edge case: if repeatedly adding and removing building on first login,
   * only the success case will show unless addViaLogin is made falsy.
   */
  const [showSuccess, setShowSuccess] = React.useState(true);
  const [isEmailResent, setIsEmailResent] = React.useState(false);
  const [showSubscriptionLimitModal, setShowSubscriptionLimitModal] = useState(false);

  const navigateToLogin = () => {
    const loginRoute = `/${i18n.language}${account.login}`;
    history.push({ pathname: loginRoute, state: { addr } });
  };

  const showSubscribed = () => (
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
          setShowSuccess(false);
        }}
      />
    </>
  );

  const showEmailVerification = () => (
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
        onClick={() => AuthClient.resendVerifyEmail()}
      />
    </>
  );

  const showAddBuilding = () => {
    return (
      <>
        <Button
          variant="primary"
          size="small"
          className="is-full-width"
          labelText={i18n._(t`Add to Building Updates`)}
          labelIcon={AddIcon}
          onClick={() => {
            !isLoggedIn
              ? navigateToLogin()
              : atSubscriptionLimit
              ? setShowSubscriptionLimitModal(true)
              : subscribe(addr.bbl, addr.housenumber, addr.streetname, addr.zip ?? "", addr.boro);
          }}
        />
      </>
    );
  };

  return (
    <>
      <div className="building-subscribe">
        {isLoggedIn && !user.verified
          ? showEmailVerification()
          : (justSubscribed && showSuccess) ||
            !!user?.subscriptions?.find((s) => s.bbl === addr.bbl)
          ? showSubscribed()
          : showAddBuilding()}
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
