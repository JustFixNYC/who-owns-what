import React, { useContext } from "react";
import LegalFooter from "../components/LegalFooter";

import Page from "../components/Page";
import { withI18n, withI18nProps } from "@lingui/react";
import { Plural, t, Trans } from "@lingui/macro";

import "styles/AccountSettingsPage.css";
import "styles/UserSetting.css";
import { UserContext } from "components/UserContext";
import { EmailSettingField, PasswordSettingField } from "components/UserSettingField";
import { JustfixUser } from "state-machine";
import { createRouteForAddressPage, createWhoOwnsWhatRoutePaths } from "routes";
import { Borough } from "components/APIDataTypes";
import { LocaleNavLink } from "i18n";

type SubscriptionFieldProps = {
  bbl: string;
  housenumber: string;
  streetname: string;
  boro: string;
  onRemoveClick: (bbl: string) => void;
};

const SubscriptionFieldWithoutI18n = (props: SubscriptionFieldProps) => {
  const { bbl, housenumber, streetname, boro, onRemoveClick } = props;
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
      <button className="button is-secondary" onClick={() => onRemoveClick(bbl)}>
        <Trans>Remove</Trans>
      </button>
    </div>
  );
};

export const SubscriptionField = withI18n()(SubscriptionFieldWithoutI18n);

const AccountSettingsPage = withI18n()((props: withI18nProps) => {
  const { i18n } = props;
  const userContext = useContext(UserContext);
  if (!userContext.user) return <div />;

  const { email, subscriptions } = userContext.user as JustfixUser;
  const subscriptionsNumber = !!subscriptions ? subscriptions.length : 0;
  const { home } = createWhoOwnsWhatRoutePaths();

  return (
    <Page title={i18n._(t`Account`)}>
      <div className="AccountSettingsPage Page">
        <div className="page-container">
          <h4>
            <Trans>Account</Trans>
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
            <Trans>Building Updates</Trans>
          </h4>
          <Trans render="p" className="settings-section">
            There <Plural value={subscriptionsNumber} one="is" other="are" /> {subscriptionsNumber}{" "}
            <Plural value={subscriptionsNumber} one="building" other="buildings" /> in your weekly
            updates
          </Trans>
          <div className="subscriptions-container">
            {subscriptions?.length ? (
              <>
                {subscriptions.map((s) => (
                  <SubscriptionField key={s.bbl} {...s} onRemoveClick={userContext.unsubscribe} />
                ))}
              </>
            ) : (
              <Trans render="div" className="settings-no-subscriptions">
                <LocaleNavLink exact to={home}>
                  Search for an address
                </LocaleNavLink>{" "}
                to add to your Building Updates
              </Trans>
            )}
          </div>
          <Trans render="div" className="settings-contact">
            Contact support@justfix.org to delete your account or get help
          </Trans>
        </div>
        <LegalFooter />
      </div>
    </Page>
  );
});

export default AccountSettingsPage;
