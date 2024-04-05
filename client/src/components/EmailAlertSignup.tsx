import React, { useContext, useState } from "react";
import { withI18n, withI18nProps, I18n } from "@lingui/react";
import { Trans, t } from "@lingui/macro";
import { Button } from "@justfixnyc/component-library";

import "styles/EmailAlertSignup.css";
import "styles/Card.css";

import Login from "./Login";
import { UserContext } from "./UserContext";
import { createWhoOwnsWhatRoutePaths } from "routes";
import { LocaleLink as Link } from "../i18n";
import { JustfixUser } from "state-machine";
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
  addViaLogin?: boolean;
};

const BuildingSubscribeWithoutI18n = (props: BuildingSubscribeProps) => {
  const { i18n, addr, addViaLogin = false } = props;
  const userContext = useContext(UserContext);
  const { user, subscribe, unsubscribe } = userContext;
  const { email, subscriptions, verified } = user! as JustfixUser;
  const { account } = createWhoOwnsWhatRoutePaths();

  /**
   * edge case: if repeatedly adding and removing building on first login,
   * only the success case will show unless addViaLogin is made falsy.
   */
  const [showSuccess, setShowSuccess] = React.useState(true);
  const [isEmailResent, setIsEmailResent] = React.useState(false);
  const [showSubscriptionLimitModal, setShowSubscriptionLimitModal] = useState(false);

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
        Click the link we sent to {email}. It may take a few minutes to arrive.
      </Trans>
      {!isEmailResent && <Trans render="div">Didn’t get the link?</Trans>}
      <SendNewLink
        setParentState={setIsEmailResent}
        variant="secondary"
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
          onClick={() =>
            subscriptions.length < SUBSCRIPTION_LIMIT
              ? subscribe(addr.bbl, addr.housenumber, addr.streetname, addr.zip ?? "", addr.boro)
              : setShowSubscriptionLimitModal(true)
          }
        />
      </>
    );
  };

  return (
    <I18n>
      {({ i18n }) => (
        <>
          <div className="building-subscribe">
            {verified
              ? (addViaLogin && showSuccess) || !!subscriptions?.find((s) => s.bbl === addr.bbl)
                ? showSubscribed()
                : showAddBuilding()
              : showEmailVerification()}
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

export const BuildingSubscribe = withI18n()(BuildingSubscribeWithoutI18n);

type EmailAlertProps = BuildingSubscribeProps;

const EmailAlertSignupWithoutI18n = (props: EmailAlertProps) => {
  const { addr } = props;
  const userContext = useContext(UserContext);
  const { user } = userContext;
  const [addViaLogin, setAddViaLogin] = useState(false);

  return (
    <>
      <div className="Card EmailAlertSignup card-body-table">
        <div className="table-row">
          <I18n>
            {({ i18n }) => (
              <div className="table-small-font">
                <label className="card-label-container">
                  <span className="pill-new">
                    <Trans>NEW</Trans>
                  </span>
                  <Trans>Building Updates</Trans>
                </label>
                <div className="table-content">
                  {!!user?.email ? (
                    <BuildingSubscribe {...props} addViaLogin={addViaLogin} />
                  ) : (
                    <Login
                      addr={addr}
                      registerInModal
                      onBuildingPage
                      onSuccess={(user: JustfixUser) => {
                        setAddViaLogin(true);
                        userContext.subscribe(
                          addr.bbl,
                          addr.housenumber,
                          addr.streetname,
                          addr.zip ?? "",
                          addr.boro,
                          user
                        );
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
