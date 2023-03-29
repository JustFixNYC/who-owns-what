import React, { useContext } from "react";
import LegalFooter from "../components/LegalFooter";

import Page from "../components/Page";
import { withI18n, withI18nProps } from "@lingui/react";
import { t, Trans } from "@lingui/macro";

import "styles/AccountSettingsPage.css";
import { UserContext } from "components/UserContext";
import UserSettingField from "components/UserSettingField";

const SubscriptionFieldWithoutI18n = (props: { bbl: string }) => {
  const { bbl } = props;
  const userContext = useContext(UserContext);
  return (
    <div className="subscription-field">
      <span>{bbl}</span>
      <button className="button is-secondary" onClick={() => userContext.unsubscribe(bbl)}>
        <Trans>Remove</Trans>
      </button>
    </div>
  );
};

const SubscriptionField = withI18n()(SubscriptionFieldWithoutI18n);

const AccountSettingsPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const userContext = useContext(UserContext);
  if (!userContext.user) return <div />;

  const { email, subscriptions } = userContext.user;

  return (
    <Page title={i18n._(t`Account settings`)}>
      <div className="AccountSettingsPage Page">
        <div className="settings-container">
          <h4>
            <Trans>Account settings</Trans>
          </h4>
          <h4 className="settings-section">
            <Trans>Login details</Trans>
          </h4>
          <UserSettingField
            label={i18n._(t`Email`)}
            currentValue={email}
            onSubmit={(newEmail: string) => userContext.updateEmail(newEmail)}
          />
          <h4 className="settings-section">
            <Trans>You’re signed up for email updates from these buildings:</Trans>
          </h4>
          <div>
            {subscriptions.map((bbl: string) => (
              <SubscriptionField bbl={bbl} key={bbl} />
            ))}
          </div>
          <div className="settings-contact">
            <Trans>If you’d like to delete your account, contact support@justfix.org</Trans>
          </div>
        </div>
        <LegalFooter />
      </div>
    </Page>
  );
});

export default AccountSettingsPage;
