import React from "react";

import { withI18n, withI18nProps, I18n } from "@lingui/react";
import { t } from "@lingui/macro";
import { Trans } from "@lingui/macro";
import { withMachineInStateProps } from "state-machine";
import Login from "./Login";
import AuthClient from "./AuthClient";

import "styles/EmailAlertSignup.css";

type EmailAlertProps = withI18nProps &
  withMachineInStateProps<"portfolioFound"> & {
    bbl: string;
  };

const BuildingSubscribeWithoutI18n = (props: { bbl: string }) => {
  const { bbl } = props;
  // TODO subscribe routes
  // add on success, pass in send function to update
  return (
    <div>
      <button className="button is-primary" onClick={() => AuthClient.buildingSubscribe(bbl)}>
        <Trans>Get updates</Trans>
      </button>
    </div>
  );
};

const BuildingSubscribe = withI18n()(BuildingSubscribeWithoutI18n);

const EmailAlertSignupWithoutI18n = (props: EmailAlertProps) => {
  const { state, send, bbl } = props;
  let subscriptions = state.context?.userData?.subscriptions;
  let userEmail = state.context?.userData?.email;

  const onLogin = (user) => {
    if (user && state.context?.userData?.email !== user.email) {
      send({ type: "USER_LOGIN", email: user.email, subscriptions: user.subscriptions });
    }
  };

  return (
    <>
      <div className="EmailAlertSignup card-body-table">
        <div className="table-row">
          <I18n>
            {({ i18n }) => (
              <div title={i18n._(t`Get email updates for this building`)}>
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
                    <Login onSuccess={onLogin} />
                  ) : (
                    <BuildingSubscribe bbl={bbl} />
                  )
                ) : (
                  <Trans>Email updates will be sent to {userEmail}</Trans>
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
