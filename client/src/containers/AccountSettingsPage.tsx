import React, { useContext } from "react";
import LegalFooter from "../components/LegalFooter";

import Page from "../components/Page";
import { withI18n, withI18nProps } from "@lingui/react";
import { t, Trans } from "@lingui/macro";

import "styles/AccountSettingsPage.css";
import { UserContext } from "components/UserContext";
import { EmailSettingField, PasswordSettingField } from "components/UserSettingField";
import { JustfixUser } from "state-machine";
import { createRouteForAddressPage } from "routes";
import { Borough } from "components/APIDataTypes";

type SubscriptionFieldProps = {
  bbl: string;
  housenumber: string;
  streetname: string;
  boro: string;
};

const SubscriptionFieldWithoutI18n = (props: SubscriptionFieldProps) => {
  const { bbl, housenumber, streetname, boro } = props;
  const userContext = useContext(UserContext);
  return (
    <div className="subscription-field">
      <a
        className="subscription-address"
        href={createRouteForAddressPage({
          housenumber,
          streetname,
          boro: boro.toUpperCase() as Borough,
        })}
        target="_blank"
        rel="noreferrer noopener"
      >
        <span>{`${housenumber} ${streetname},`}</span>
        <span>{`${boro}, NY`}</span>
      </a>
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

  const { email, subscriptions } = userContext.user as JustfixUser;

  return (
    <Page title={i18n._(t`Account settings`)}>
      <div className="AccountSettingsPage Page">
        <div className="page-container">
          <h4>
            <Trans>Account settings</Trans>
          </h4>
          <h4 className="settings-section">
            <Trans>Login details</Trans>
          </h4>
          <EmailSettingField
            currentValue={email}
            onSubmit={(newEmail: string) => userContext.updateEmail(newEmail)}
          />
          <PasswordSettingField
            onSubmit={(currentPassword: string, newPassword: string) =>
              userContext.updatePassword(currentPassword, newPassword)
            }
          />
          <h4 className="settings-section">
            <Trans>You’re signed up for email updates from these buildings:</Trans>
          </h4>
          <div>
            {subscriptions.map((s) => (
              <SubscriptionField key={s.bbl} {...s} />
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